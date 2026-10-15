import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server } from 'socket.io';
import crypto from 'node:crypto';
import geoip from 'geoip-country';
import { db } from './db.js';
import { bootstrapAdmin } from './admin/auth.js';
import { registerAdminRoutes, isMaintenanceMode, cleanupLoginAttempts, type ServerState } from './admin/routes.js';
import { rollupTrafficStats } from './stats.js';
import { recordDisconnect, recordHostRecovery, clearPendingHostDrop } from './connection-telemetry.js';
import { registerAnalyticsRoutes, cleanupTrackRateLimits, purgeOldPageviews } from './analytics.js';
import {
  registerErrorRoutes, registerProcessErrorHandlers, captureError, drainSfuErrors,
  cleanupErrorRateLimits, purgeOldErrors,
} from './errors.js';
import {
  pinHash,
  pinEquals,
  sanitizeChatText,
  sanitizeUsername,
  VALID_EMOJIS,
  MAX_CHAT_LENGTH as SECURITY_MAX_CHAT,
  MAX_USERNAME_LENGTH as SECURITY_MAX_USERNAME,
} from './security.js';
import {
  gcExpiredRooms,
  createRoom,
  touchRoom,
  removeViewer,
  findViewerInRoom,
  type Room,
  type ViewerInfo,
  type ChatMessage,
} from './room-store.js';

// Re-export for tests / external consumers.
export { gcExpiredRooms, createRoom, touchRoom, removeViewer, findViewerInRoom };
export type { Room, ViewerInfo, ChatMessage };

/** Fire-and-forget room event write for admin stats (never breaks signaling). */
function logRoomEvent(eventType: string, roomId: string, viewerCount = 0, ip?: string): void {
  try {
    db.prepare('INSERT INTO room_events (event_type, room_id, host_ip, country, viewer_count) VALUES (?, ?, ?, ?, ?)').run(
      eventType, roomId, ip ?? null, ip ? (geoip.lookup(ip)?.country || null) : null, viewerCount
    );
  } catch (err) {
    captureError(err, { source: 'server', component: 'db.roomEvent', severity: 'warning' });
  }
}

// ── Connection telemetry (drops during broadcasts) ────────────────────
// Implementation in connection-telemetry.ts (unit-testable).

// Single source of truth for allowed origins (env-configurable).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://wachaut.billytech.es')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const fastify = Fastify({
  logger: true,
  // Trust the proxy (Traefik) so req.ip and socket.handshake.address reflect
  // the real client IP from X-Forwarded-For, not the proxy's IP.
  trustProxy: true,
  // Strict schema validation: unknown body properties must be a 400, not
  // silently stripped (Ajv's removeAdditional default would drop them).
  ajv: { customOptions: { removeAdditional: false, allErrors: true } },
});

// Capture every unhandled route error (real 500s — validation 4xx excluded).
fastify.setErrorHandler((err: Error & { statusCode?: number }, req, reply) => {
  req.log.error(err);
  const status = err.statusCode ?? 500;
  if (status >= 500) {
    captureError(err, { source: 'server', component: 'http', page: req.url.split('?')[0] });
  }
  return reply.code(status).send({ error: status < 500 ? err.message : 'Internal server error' });
});

// Enable CORS
await fastify.register(cors, {
  origin: ALLOWED_ORIGINS,
  credentials: true,
});

// Security headers (HSTS, CSP, X-Frame-Options, etc.)
// contentSecurityPolicy must be false for Socket.IO to work; the rest still applies.
await fastify.register(helmet, {
  contentSecurityPolicy: false,
});

// Room storage (in-memory with activity-based TTL).
// The TTL is measured from `lastActivityAt` (not `createdAt`), so a room that
// is actively used (host sharing, viewers chatting/reacting) never expires.
// Only truly abandoned rooms (no activity for ROOM_IDLE_TTL_MS) get reaped.
// Types and pure helpers (gcExpiredRooms, touchRoom, createRoom) live in
// ./room-store.ts so they can be unit-tested without booting the server.

const rooms = new Map<string, Room>();
const viewerToRoom = new Map<string, string>(); // socketId -> roomId
const hostToRoom = new Map<string, string>();   // hostSocketId -> roomId (O(1) lookup)

// Per-room join attempt rate limiting
const joinAttempts = new Map<string, { count: number; resetAt: number }>(); // `${ip}:${roomId}` -> rate info

// Rate limiting
const connectionCounts = new Map<string, number>(); // IP -> count
const eventCounts = new Map<string, { count: number; resetAt: number }>(); // socketId -> rate info

const MAX_CONNECTIONS_PER_IP = 5;
const MAX_EVENTS_PER_MINUTE = 120;
const MAX_ROOMS_SIMULTANEOUS = 200;
const MAX_CHAT_LENGTH = SECURITY_MAX_CHAT;
const MAX_REACTIONS_PER_MINUTE = 30;
const MAX_USERNAME_LENGTH = SECURITY_MAX_USERNAME;
const MAX_VIEWERS_PER_ROOM = 20;
const MAX_PIN_ATTEMPTS = 5;        // per IP, per 5-min window
const PIN_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

// Idle TTL for abandoned rooms. A room is only reaped if it has had no activity
// (no joins, no chat, no reactions) for this long. Active rooms (e.g. a long
// World Cup broadcast) never expire. Env-configurable, default 4h.
const ROOM_IDLE_TTL_MS = parseInt(process.env.ROOM_IDLE_TTL_MS || String(4 * 60 * 60 * 1000));

// Grace period before a room is destroyed when the host disconnects, giving the
// host a chance to reclaim after a transient network blip. Aligned with the SFU.
const HOST_RECONNECT_GRACE_MS = parseInt(process.env.HOST_RECONNECT_GRACE_MS || '30000');

// ── Security helpers (imported from security.ts) ────────────────────

/** Resolve the real client IP behind Traefik (X-Forwarded-For). */
function realIp(socket: { handshake: { address: string; headers: Record<string, unknown> } }): string {
  const xff = socket.handshake.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return socket.handshake.address;
}

function checkRateLimit(socketId: string, maxEvents: number = MAX_EVENTS_PER_MINUTE): boolean {
  const now = Date.now();
  const entry = eventCounts.get(socketId);

  if (!entry || now > entry.resetAt) {
    eventCounts.set(socketId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  entry.count++;
  if (entry.count > maxEvents) {
    return false;
  }
  return true;
}

function usernameKey(username: string): string {
  return username.toLowerCase();
}

function reserveUsername(room: Room, requestedUsername: string): string {
  const base = requestedUsername || `viewer-${room.viewers.size + 1}`;
  const usedNames = new Set(
    Array.from(room.viewers.values()).map((viewer) => usernameKey(viewer.name))
  );

  let candidate = base;
  let suffix = 2;

  while (usedNames.has(usernameKey(candidate))) {
    const tail = `-${suffix}`;
    candidate = `${base.slice(0, Math.max(1, MAX_USERNAME_LENGTH - tail.length))}${tail}`;
    suffix++;
  }

  return candidate;
}

function findViewer(room: Room, viewerRef: string): ViewerInfo | undefined {
  return findViewerInRoom(room, viewerRef);
}

// Reap abandoned rooms every 5 minutes. Active rooms (host still sharing,
// viewers chatting/reacting) never expire because touchRoom() keeps
// lastActivityAt fresh.
setInterval(() => {
  try {
    // Snapshot viewer counts first — gcExpiredRooms deletes the rooms, so the
    // count would read 0 if we looked it up after the reap.
    const viewerCounts = new Map<string, number>();
    for (const [roomId, room] of rooms) viewerCounts.set(roomId, room.viewers.size);

    const now = new Date();
    const reaped = gcExpiredRooms({ rooms, viewerToRoom, hostToRoom }, now, ROOM_IDLE_TTL_MS);
    for (const roomId of reaped) {
      io.to(roomId).emit('room:closed');
      clearPendingHostDrop(roomId);
      logRoomEvent('closed', roomId, viewerCounts.get(roomId) ?? 0);
    }

    // Cleanup rate limit entries
    const nowMs = Date.now();
    for (const [key, entry] of eventCounts) {
      if (nowMs > entry.resetAt) {
        eventCounts.delete(key);
      }
    }
    // Cleanup join attempt rate limits
    for (const [key, entry] of joinAttempts) {
      if (nowMs > entry.resetAt) {
        joinAttempts.delete(key);
      }
    }
    // Cleanup admin login rate limit entries (slow memory leak otherwise —
    // entries keyed by attacker-controlled IPs were never deleted).
    cleanupLoginAttempts(nowMs);
    // Cleanup analytics + error-beacon rate limits, prune pageviews/errors
    // past their retention windows.
    cleanupTrackRateLimits(nowMs);
    cleanupErrorRateLimits(nowMs);
    purgeOldPageviews();
    purgeOldErrors();
    // Refresh today's traffic_stats row from room_events (idempotent upsert).
    rollupTrafficStats(now);
    // Pull captured SFU errors into the central error store.
    drainSfuErrorsNow();

    // Cleanup stale connection counts (defensive — the disconnect handler
    // already decrements, but if a socket leaked we'd otherwise hold the IP
    // forever and block that IP/CGNAT from reconnecting after a mass drop).
    for (const [ip, count] of connectionCounts) {
      if (count <= 0) connectionCounts.delete(ip);
    }
  } catch (err) {
    captureError(err, { source: 'server', component: 'sweeper' });
  }
}, 5 * 60 * 1000);

// Socket.IO setup
const io = new Server(fastify.server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.use((socket, next) => {
  // Rate limit connections per real client IP (behind Traefik).
  const ip = realIp(socket);
  const count = connectionCounts.get(ip) || 0;
  if (count >= MAX_CONNECTIONS_PER_IP) {
    return next(new Error('Demasiadas conexiones. Intenta de nuevo en un momento.'));
  }
  connectionCounts.set(ip, count + 1);

  // Ensure the count is decremented even if the socket disconnects before
  // reaching the 'connection' handler (e.g. handshake error).
  socket.once('disconnect', () => {
    const c = connectionCounts.get(ip) || 0;
    if (c <= 1) connectionCounts.delete(ip);
    else connectionCounts.set(ip, c - 1);
  });

  next();
});

/**
 * Crash-proof socket handler registration: a throw inside a synchronous
 * EventEmitter listener is an uncaughtException (process death). Capture it,
 * tell the client, keep serving.
 */
function onSafe(socket: any, event: string, handler: (...args: any[]) => void): void {
  socket.on(event, (...args: any[]) => {
    try {
      handler(...args);
    } catch (err) {
      captureError(err, { source: 'server', component: `socket.${event}` });
      try { socket.emit('room:error', { message: 'Error interno. Inténtalo de nuevo en unos segundos.' }); } catch { /* socket may be gone */ }
    }
  });
}

io.on('connection', (socket) => {
  const ip = realIp(socket);
  fastify.log.info(`Client connected: ${socket.id} from ${ip}`);

  onSafe(socket, 'disconnect', (reason: string) => {
    // Connection-count decrement is handled by the once('disconnect') in io.use.

    // Cleanup rate limit
    eventCounts.delete(socket.id);

    fastify.log.info(`Client disconnected: ${socket.id} (${reason})`);

    // O(1) host lookup via reverse map.
    const hostRoomId = hostToRoom.get(socket.id);
    if (hostRoomId) {
      const room = rooms.get(hostRoomId);
      if (room) {
        // Reliability telemetry: record the host drop (broadcast length +
        // viewers affected). Marked recovered if the host reclaims in time.
        recordDisconnect({
          roomId: hostRoomId,
          role: 'host',
          reason,
          durationMs: Date.now() - room.createdAt.getTime(),
          viewersAffected: room.viewers.size,
        });
        // Notify viewers that the host dropped — they enter a "reconnecting"
        // state instead of being kicked immediately. If the host reclaims
        // within HOST_RECONNECT_GRACE_MS we emit host:reconnected.
        socket.to(hostRoomId).emit('host:disconnected');
        if (room.hostDisconnectTimer) clearTimeout(room.hostDisconnectTimer);
        room.hostDisconnectTimer = setTimeout(() => {
          const currentRoom = rooms.get(hostRoomId);
          if (currentRoom && currentRoom.hostId === socket.id) {
            io.to(hostRoomId).emit('room:closed');
            rooms.delete(hostRoomId);
            hostToRoom.delete(socket.id);
            clearPendingHostDrop(hostRoomId); // grace expired — drop stays unrecovered
            logRoomEvent('closed', hostRoomId, currentRoom.viewers.size);
            for (const [viewerId] of currentRoom.viewers) {
              viewerToRoom.delete(viewerId);
            }
          }
        }, HOST_RECONNECT_GRACE_MS); // aligned with SFU grace period
      }
      return;
    }

    // O(1) viewer lookup via reverse map.
    const viewerRoomId = viewerToRoom.get(socket.id);
    if (viewerRoomId) {
      // Hard-delete the viewer entry so the room's viewers map and the
      // reverse map stay in sync with reality. Previously this only set
      // `connected = false`, which left zombie entries that inflated
      // room.viewers.size (breaking MAX_VIEWERS_PER_ROOM, admin metrics,
      // and the host's viewers panel).
      const viewer = removeViewer({ rooms, viewerToRoom, hostToRoom }, viewerRoomId, socket.id);
      if (viewer) {
        const room = rooms.get(viewerRoomId);
        if (room) {
          io.to(room.hostId).emit('viewer:left', { viewerId: socket.id, username: viewer.name });
          // Reliability telemetry: how long this viewer was in the room.
          recordDisconnect({
            roomId: viewerRoomId,
            role: 'viewer',
            reason,
            durationMs: Date.now() - viewer.joinedAt,
          });
          logRoomEvent('viewer_left', viewerRoomId, room.viewers.size, ip);
        }
      }
    }
  });

  // ─── HOST EVENTS ────────────────────────────────────────

  onSafe(socket, 'host:create-room', ({ pin, roomId: requestedRoomId }: { pin: string; roomId?: string }) => {
    if (!checkRateLimit(socket.id)) {
      socket.emit('room:error', { message: 'Demasiadas peticiones.' });
      return;
    }

    // Maintenance mode: no new rooms (existing rooms keep draining until
    // they close on their own — nobody is cut off mid-broadcast).
    if (isMaintenanceMode()) {
      socket.emit('room:error', { message: 'Servidor en mantenimiento. Vuelve a intentarlo en unos minutos.' });
      return;
    }

    // ── Reclaim path: host reconnecting after a transient drop ──────────
    // If the client supplies a roomId and that room still exists in memory
    // (within the idle TTL), we rebind it to the new socket instead of
    // creating a fresh one. This keeps the existing viewers connected and
    // preserves the roomId they're joined to. Without this, any reconnect
    // (Socket.IO auto-reconnect after a blip) would silently generate a new
    // roomId and orphan all viewers — the original Bug 2.
    if (requestedRoomId) {
      const existingRoom = rooms.get(requestedRoomId);
      if (existingRoom) {
        // PIN must match the room's stored hash to authorize the reclaim.
        if (!pinEquals(existingRoom.pin, pin)) {
          socket.emit('room:error', { message: 'PIN incorrecto para reclaim.' });
          return;
        }
        // Free the old host mapping (the previous socket.id is gone).
        if (existingRoom.hostId && existingRoom.hostId !== socket.id) {
          hostToRoom.delete(existingRoom.hostId);
        }
        existingRoom.hostId = socket.id;
        hostToRoom.set(socket.id, requestedRoomId);
        socket.join(requestedRoomId);
        // Cancel the pending destruction timer if one was armed.
        if (existingRoom.hostDisconnectTimer) {
          clearTimeout(existingRoom.hostDisconnectTimer);
          existingRoom.hostDisconnectTimer = undefined;
        }
        touchRoom(existingRoom);
        socket.emit('room:created', { roomId: requestedRoomId, reclaimed: true });
        // Reliability telemetry: the host drop ended in a successful reclaim.
        recordHostRecovery(requestedRoomId);
        // Tell viewers the host is back so they can exit the "reconnecting" state.
        socket.to(requestedRoomId).emit('host:reconnected');
        fastify.log.info(`Room reclaimed by host: ${requestedRoomId} (socket ${socket.id})`);
        return;
      }
      // Room doesn't exist anymore — fall through to create a new one with
      // the requested roomId so the host's shareable link stays valid.
    }

    if (rooms.size >= MAX_ROOMS_SIMULTANEOUS) {
      socket.emit('room:error', { message: 'Servidor lleno. Intenta más tarde.' });
      return;
    }

    // Limit one active room per host to prevent resource abuse.
    const existingByHost = Array.from(rooms.values()).find((r) => r.hostId === socket.id);
    if (existingByHost) {
      socket.emit('room:error', { message: 'Ya tienes una sala activa. Ciérrala antes de crear otra.' });
      return;
    }

    // Use the client-provided roomId if supplied (stable shareable link),
    // otherwise mint a fresh one.
    const roomId = requestedRoomId && requestedRoomId.length > 0 ? requestedRoomId : crypto.randomUUID();
    const room = createRoom(roomId, pinHash(pin), socket.id);

    rooms.set(roomId, room);
    hostToRoom.set(socket.id, roomId);
    socket.join(roomId);
    socket.emit('room:created', { roomId, reclaimed: false });
    fastify.log.info(`Room created: ${roomId}`);

    // Record room creation for admin stats.
    logRoomEvent('created', roomId, 0, realIp(socket));
  });

  onSafe(socket, 'host:stop-sharing', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.isSharing = false;
      touchRoom(room);
      socket.to(roomId).emit('host:stopped-sharing');
    }
  });

  onSafe(socket, 'host:close-room', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      if (room.hostDisconnectTimer) {
        clearTimeout(room.hostDisconnectTimer);
        room.hostDisconnectTimer = undefined;
      }
      socket.to(roomId).emit('room:closed');
      rooms.delete(roomId);
      hostToRoom.delete(socket.id);
      clearPendingHostDrop(roomId); // intentional close — nothing to recover
      logRoomEvent('closed', roomId, room.viewers.size);
      for (const [viewerId] of room.viewers) {
        viewerToRoom.delete(viewerId);
      }
    }
  });

  onSafe(socket, 'host:mute', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.isMuted = true;
      socket.to(roomId).emit('host:muted');
    }
  });

  onSafe(socket, 'host:unmute', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.isMuted = false;
      socket.to(roomId).emit('host:unmuted');
    }
  });

  onSafe(socket, 'host:kick', ({ roomId, viewerId }: { roomId: string; viewerId: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    const viewer = findViewerInRoom(room, viewerId);
    if (!viewer) {
      socket.emit('host:kick-failed', { viewerId, message: `No se encontro a ${viewerId}` });
      return;
    }

    room.viewers.delete(viewer.socketId);
    viewerToRoom.delete(viewer.socketId);
    io.to(viewer.socketId).emit('viewer:kicked', { reason: 'Expulsado por el anfitrion' });
    socket.emit('viewer:left', { viewerId: viewer.socketId, username: viewer.name });
    logRoomEvent('viewer_left', roomId, room.viewers.size);
  });

  onSafe(socket, 'host:request-viewers', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;

    const viewersList = Array.from(room.viewers.values()).map(v => ({
      viewerId: v.socketId,
      name: v.name,
      joinedAt: v.joinedAt,
      connected: v.connected
    }));
    socket.emit('host:viewers-list', { viewers: viewersList });
  });

  // ─── VIEWER EVENTS ──────────────────────────────────────

  onSafe(socket, 'viewer:join', ({ roomId, pin, username }: { roomId: string; pin: string; username?: string }) => {
    if (!checkRateLimit(socket.id)) {
      socket.emit('room:error', { message: 'Demasiadas peticiones.' });
      return;
    }

    // Maintenance mode: no new viewers either (hosts already in a room stay).
    if (isMaintenanceMode()) {
      socket.emit('room:error', { message: 'Servidor en mantenimiento. Vuelve a intentarlo en unos minutos.' });
      return;
    }

    // Per-IP PIN-attempt rate limiting (uses real client IP behind proxy).
    const clientIp = realIp(socket);
    const joinKey = `${clientIp}:${roomId}`;
    const joinAttempt = joinAttempts.get(joinKey);
    const now = Date.now();
    if (joinAttempt && now < joinAttempt.resetAt && joinAttempt.count >= MAX_PIN_ATTEMPTS) {
      socket.emit('room:error', { message: 'Demasiados intentos. Espera un momento.' });
      return;
    }
    if (!joinAttempt || now > joinAttempt.resetAt) {
      joinAttempts.set(joinKey, { count: 1, resetAt: now + PIN_ATTEMPT_WINDOW_MS });
    } else {
      joinAttempt.count++;
    }

    const requestedUsername = sanitizeUsername(username);
    if (requestedUsername.length < 2) {
      socket.emit('room:auth-failed', { message: 'Elige un username de al menos 2 caracteres.' });
      return;
    }

    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('room:error', { message: 'No se ha encontrado la sala. Comprueba el enlace.' });
      return;
    }

    // Constant-time PIN comparison against the stored hash.
    if (!pinEquals(room.pin, pin)) {
      socket.emit('room:auth-failed', { message: 'PIN incorrecto. Comprueba que lo hayas escrito bien.' });
      return;
    }

    // PIN correct - reset join attempts
    joinAttempts.delete(joinKey);
    socket.emit('room:auth-success');

    if (room.viewers.size >= MAX_VIEWERS_PER_ROOM) {
      socket.emit('room:error', { message: 'La sala está llena. Espera a que alguien salga.' });
      return;
    }

    const reservedUsername = reserveUsername(room, requestedUsername);

    room.viewers.set(socket.id, {
      socketId: socket.id,
      name: reservedUsername,
      joinedAt: Date.now(),
      connected: true
    });
    viewerToRoom.set(socket.id, roomId);
    socket.join(roomId);
    touchRoom(room);
    
    socket.emit('room:joined', { roomId, username: reservedUsername });
    socket.to(room.hostId).emit('viewer:joined', { viewerId: socket.id, username: reservedUsername });

    // Record viewer join for admin stats.
    logRoomEvent('viewer_joined', roomId, room.viewers.size, realIp(socket));

    // Send chat history to the joining viewer (last 100 messages)
    socket.emit('chat:history', { messages: room.chat.slice(-100) });

    // Send current mute state
    if (room.isMuted) {
      socket.emit('host:muted');
    }
    
    fastify.log.info(`Viewer ${socket.id} (${reservedUsername}) joined room ${roomId}`);
  });

  // ─── CHAT EVENTS ────────────────────────────────────────

  onSafe(socket, 'chat:message', ({ text }: { text: unknown }) => {
    if (!checkRateLimit(socket.id, MAX_REACTIONS_PER_MINUTE)) return;

    // Validate and sanitize the payload before broadcasting.
    const cleanText = sanitizeChatText(text);
    if (!cleanText) return;

    const roomId = viewerToRoom.get(socket.id);
    if (!roomId) {
      // Host sending chat — O(1) lookup via reverse map.
      const hostRoomId = hostToRoom.get(socket.id);
      if (!hostRoomId) return;
      const room = rooms.get(hostRoomId);
      if (!room) return;

      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'Anfitrión',
        text: cleanText,
        timestamp: Date.now()
      };
      room.chat.push(msg);
      if (room.chat.length > 100) room.chat.shift();
      touchRoom(room);
      io.to(hostRoomId).emit('chat:message', msg);
      return;
    }

    const room = rooms.get(roomId);
    if (!room) return;

    const viewer = room.viewers.get(socket.id);
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: viewer?.name || 'Espectador',
      text: cleanText,
      timestamp: Date.now()
    };
    room.chat.push(msg);
    if (room.chat.length > 100) room.chat.shift();
    touchRoom(room);
    io.to(roomId).emit('chat:message', msg);
  });

  // ─── REACTIONS EVENTS ───────────────────────────────────

  onSafe(socket, 'reaction:send', ({ emoji }: { emoji: unknown }) => {
    if (!checkRateLimit(socket.id, MAX_REACTIONS_PER_MINUTE)) return;

    // Validate emoji against the allowlist before broadcasting.
    if (typeof emoji !== 'string' || !VALID_EMOJIS.has(emoji)) return;

    const roomId = viewerToRoom.get(socket.id);
    if (!roomId) {
      // Host reacting — O(1) lookup via reverse map.
      const hostRoomId = hostToRoom.get(socket.id);
      if (hostRoomId) {
        const hostRoom = rooms.get(hostRoomId);
        if (hostRoom) touchRoom(hostRoom);
        io.to(hostRoomId).emit('reaction:receive', { emoji, from: 'Anfitrión' });
      }
      return;
    }

    const room = rooms.get(roomId);
    if (!room) return;

    const viewer = room.viewers.get(socket.id);
    touchRoom(room);
    // Broadcast reaction to host and all other viewers in the room
    io.to(roomId).emit('reaction:receive', { emoji, from: viewer?.name || 'Espectador' });
  });
});

// Health check endpoint
fastify.get('/health', { logLevel: 'error' }, async () => {
  return {
    status: 'ok',
    rooms: rooms.size,
    connections: io.engine.clientsCount
  };
});

// Readiness probe: checks that Socket.IO is accepting connections.
// Use this for Traefik/Docker load-balancer routing decisions.
fastify.get('/ready', async (req, reply) => {
  // Maintenance mode: return 503 so Traefik shows the maintenance page.
  if (isMaintenanceMode()) {
    return reply.code(503).send({ ready: false, maintenance: true });
  }
  const sfuUrl = process.env.VITE_SFU_URL || process.env.SFU_HEALTH_URL || '';
  let sfuReachable = false;
  if (sfuUrl) {
    try {
      const httpUrl = sfuUrl.replace(/^ws/, 'http').replace(/\?.*$/, '');
      const res = await fetch(`${httpUrl}/health`, { signal: AbortSignal.timeout(2000) });
      sfuReachable = res.ok;
    } catch (err) {
      sfuReachable = false;
      captureError(err, { source: 'server', component: 'sfuHealth', severity: 'warning' });
    }
  }
  // Return 503 when the SFU is unreachable so Traefik can failover.
  const code = sfuReachable ? 200 : 503;
  return reply.code(code).send({ ready: sfuReachable, sfu: sfuReachable ? 'reachable' : 'unreachable' });
});

// ── Admin API ────────────────────────────────────────────────────────
// Register admin routes with access to live server state.
const sfuHealthUrl = (process.env.VITE_SFU_URL || process.env.SFU_HEALTH_URL || '')
  .replace(/^ws/, 'http').replace(/\?.*$/, '');
const adminState: ServerState = { rooms, viewerToRoom, hostToRoom, io, connectionCounts, sfuHealthUrl };
// Encapsulated scope so the rate limiter applies ONLY to the admin API —
// signaling rides Socket.IO (not HTTP routes) and must not be throttled.
// Generous ceiling to absorb dashboard polling; login keeps its own
// stricter per-IP limiter inside the admin routes.
await fastify.register(async (adminScope) => {
  await adminScope.register(rateLimit, { global: true, max: 120, timeWindow: '1 minute' });
  registerAdminRoutes(adminScope, adminState);
});

// Public analytics routes (own rate limit, outside the admin scope).
registerAnalyticsRoutes(fastify, isMaintenanceMode, () => rooms.size);

// Public error beacon (web) + secret-authenticated server/sfu reports.
registerErrorRoutes(fastify);

// Drain the SFU's in-memory error ring into the central store. Called from
// the 5-min sweeper — if the SFU is unreachable the buffer simply waits.
const sfuInternalUrl = (process.env.VITE_SFU_URL || process.env.SFU_HEALTH_URL || '')
  .replace(/^ws/, 'http').replace(/\?.*$/, '');
const sfuDrainSecret = process.env.ERRORS_SECRET || '';
function drainSfuErrorsNow(): void {
  void drainSfuErrors(sfuInternalUrl, sfuDrainSecret);
}

// Process-level safety net: an uncaught exception is captured (sync write)
// and the container restarts clean instead of dying in an unknown state.
registerProcessErrorHandlers();

// Start server
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

// Bootstrap the first admin user if the DB is empty.
bootstrapAdmin();

// Prime today's traffic row immediately instead of waiting for the sweeper.
rollupTrafficStats();

try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`Server listening on ${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

// Graceful shutdown — drain connections on SIGTERM/SIGINT (e.g. Docker stop, deploy)
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  fastify.log.info(`${signal} received, shutting down...`);

  // Give connected clients a chance to see the room close
  for (const [roomId, room] of rooms) {
    io.to(roomId).emit('room:closed');
    logRoomEvent('closed', roomId, room.viewers.size);
  }

  io.close();
  await fastify.close();
  fastify.log.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
