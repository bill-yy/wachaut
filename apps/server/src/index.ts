import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Server } from 'socket.io';
import crypto from 'node:crypto';
import {
  pinHash,
  pinEquals,
  sanitizeChatText,
  sanitizeUsername,
  VALID_EMOJIS,
  MAX_CHAT_LENGTH as SECURITY_MAX_CHAT,
  MAX_USERNAME_LENGTH as SECURITY_MAX_USERNAME,
} from './security.js';

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

// Room storage (in-memory with TTL)
interface ViewerInfo {
  socketId: string;
  name: string;
  joinedAt: number;
  connected: boolean;
}

interface Room {
  id: string;
  pin: string;
  hostId: string;
  viewers: Map<string, ViewerInfo>;
  createdAt: Date;
  isSharing: boolean;
  chat: ChatMessage[];
  isMuted: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

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
const MAX_VIEWERS_PER_ROOM = 5;
const MAX_PIN_ATTEMPTS = 5;        // per IP, per 5-min window
const PIN_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

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
  const directMatch = room.viewers.get(viewerRef);
  if (directMatch) return directMatch;

  const cleanedRef = viewerRef.replace(/^@/, '').toLowerCase();
  return Array.from(room.viewers.values()).find(
    (viewer) => usernameKey(viewer.name) === cleanedRef
  );
}

// Cleanup expired rooms every 5 minutes
setInterval(() => {
const now = new Date();
const twoHours = 2 * 60 * 60 * 1000;

for (const [roomId, room] of rooms) {
  if (now.getTime() - room.createdAt.getTime() > twoHours) {
    // Notify occupants so they don't become silent orphans
    io.to(roomId).emit('room:closed');
    rooms.delete(roomId);
    for (const [viewerId] of room.viewers) {
      viewerToRoom.delete(viewerId);
    }
  }
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

io.on('connection', (socket) => {
  const ip = realIp(socket);
  fastify.log.info(`Client connected: ${socket.id} from ${ip}`);

  socket.on('disconnect', () => {
    // Connection-count decrement is handled by the once('disconnect') in io.use.

    // Cleanup rate limit
    eventCounts.delete(socket.id);

    fastify.log.info(`Client disconnected: ${socket.id}`);

    // O(1) host lookup via reverse map.
    const hostRoomId = hostToRoom.get(socket.id);
    if (hostRoomId) {
      const room = rooms.get(hostRoomId);
      if (room) {
        socket.to(hostRoomId).emit('host:disconnected');
        setTimeout(() => {
          const currentRoom = rooms.get(hostRoomId);
          if (currentRoom && currentRoom.hostId === socket.id) {
            io.to(hostRoomId).emit('room:closed');
            rooms.delete(hostRoomId);
            hostToRoom.delete(socket.id);
            for (const [viewerId] of currentRoom.viewers) {
              viewerToRoom.delete(viewerId);
            }
          }
        }, 30000); // aligned with SFU grace period (30s)
      }
      return;
    }

    // O(1) viewer lookup via reverse map.
    const viewerRoomId = viewerToRoom.get(socket.id);
    if (viewerRoomId) {
      const room = rooms.get(viewerRoomId);
      if (room) {
        const viewer = room.viewers.get(socket.id);
        if (viewer) {
          viewer.connected = false;
          io.to(room.hostId).emit('viewer:left', { viewerId: socket.id, username: viewer.name });
        }
      }
    }
  });

  // ─── HOST EVENTS ────────────────────────────────────────

  socket.on('host:create-room', ({ pin }: { pin: string }) => {
    if (!checkRateLimit(socket.id)) {
      socket.emit('room:error', { message: 'Demasiadas peticiones.' });
      return;
    }

    if (rooms.size >= MAX_ROOMS_SIMULTANEOUS) {
      socket.emit('room:error', { message: 'Servidor lleno. Intenta más tarde.' });
      return;
    }

    // Limit one active room per host to prevent resource abuse
    const existingRoom = Array.from(rooms.values()).find((r) => r.hostId === socket.id);
    if (existingRoom) {
      socket.emit('room:error', { message: 'Ya tienes una sala activa. Ciérrala antes de crear otra.' });
      return;
    }

    const roomId = crypto.randomUUID();
    const room: Room = {
      id: roomId,
      pin: pinHash(pin),  // store hashed, never plaintext
      hostId: socket.id,
      viewers: new Map(),
      createdAt: new Date(),
      isSharing: false,
      chat: [],
      isMuted: false
    };
    
    rooms.set(roomId, room);
    hostToRoom.set(socket.id, roomId);
    socket.join(roomId);
    socket.emit('room:created', { roomId });
    fastify.log.info(`Room created: ${roomId}`);
  });

  socket.on('host:stop-sharing', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.isSharing = false;
      socket.to(roomId).emit('host:stopped-sharing');
    }
  });

  socket.on('host:close-room', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      socket.to(roomId).emit('room:closed');
      rooms.delete(roomId);
      hostToRoom.delete(socket.id);
      for (const [viewerId] of room.viewers) {
        viewerToRoom.delete(viewerId);
      }
    }
  });

  socket.on('host:mute', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.isMuted = true;
      socket.to(roomId).emit('host:muted');
    }
  });

  socket.on('host:unmute', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.isMuted = false;
      socket.to(roomId).emit('host:unmuted');
    }
  });

  socket.on('host:kick', ({ roomId, viewerId }: { roomId: string; viewerId: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    const viewer = findViewer(room, viewerId);
    if (!viewer) {
      socket.emit('host:kick-failed', { viewerId, message: `No se encontro a ${viewerId}` });
      return;
    }

    room.viewers.delete(viewer.socketId);
    viewerToRoom.delete(viewer.socketId);
    io.to(viewer.socketId).emit('viewer:kicked', { reason: 'Expulsado por el anfitrion' });
    socket.emit('viewer:left', { viewerId: viewer.socketId, username: viewer.name });
  });

  socket.on('host:request-viewers', ({ roomId }: { roomId: string }) => {
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

  socket.on('viewer:join', ({ roomId, pin, username }: { roomId: string; pin: string; username?: string }) => {
    if (!checkRateLimit(socket.id)) {
      socket.emit('room:error', { message: 'Demasiadas peticiones.' });
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
    
    socket.emit('room:joined', { roomId, username: reservedUsername });
    socket.to(room.hostId).emit('viewer:joined', { viewerId: socket.id, username: reservedUsername });
    
    // Send chat history to the joining viewer (last 100 messages)
    socket.emit('chat:history', { messages: room.chat.slice(-100) });

    // Send current mute state
    if (room.isMuted) {
      socket.emit('host:muted');
    }
    
    fastify.log.info(`Viewer ${socket.id} (${reservedUsername}) joined room ${roomId}`);
  });

  // ─── CHAT EVENTS ────────────────────────────────────────

  socket.on('chat:message', ({ text }: { text: unknown }) => {
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
    io.to(roomId).emit('chat:message', msg);
  });

  // ─── REACTIONS EVENTS ───────────────────────────────────

  socket.on('reaction:send', ({ emoji }: { emoji: unknown }) => {
    if (!checkRateLimit(socket.id, MAX_REACTIONS_PER_MINUTE)) return;

    // Validate emoji against the allowlist before broadcasting.
    if (typeof emoji !== 'string' || !VALID_EMOJIS.has(emoji)) return;

    const roomId = viewerToRoom.get(socket.id);
    if (!roomId) {
      // Host reacting — O(1) lookup via reverse map.
      const hostRoomId = hostToRoom.get(socket.id);
      if (hostRoomId) {
        io.to(hostRoomId).emit('reaction:receive', { emoji, from: 'Anfitrión' });
      }
      return;
    }

    const room = rooms.get(roomId);
    if (!room) return;

    const viewer = room.viewers.get(socket.id);
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
fastify.get('/ready', async () => {
  const sfuUrl = process.env.VITE_SFU_URL || process.env.SFU_HEALTH_URL || '';
  let sfuReachable = true;
  if (sfuUrl) {
    try {
      const httpUrl = sfuUrl.replace(/^ws/, 'http').replace(/\?.*$/, '');
      const res = await fetch(`${httpUrl}/health`, { signal: AbortSignal.timeout(2000) });
      sfuReachable = res.ok;
    } catch {
      sfuReachable = false;
    }
  }
  return { ready: sfuReachable, sfu: sfuReachable ? 'reachable' : 'unreachable' };
});

// Start server
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

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
  for (const [roomId] of rooms) {
    io.to(roomId).emit('room:closed');
  }

  io.close();
  await fastify.close();
  fastify.log.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
