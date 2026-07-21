/**
 * Wachaut SFU Server — Mediasoup-based selective forwarding unit.
 * Handles WebRTC media routing for screen sharing rooms.
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Server } from 'socket.io';
import * as mediasoup from 'mediasoup';
import * as os from 'os';
import crypto from 'node:crypto';

// ─── Config ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3002');
const HOST = process.env.HOST || '0.0.0.0';
const RTC_MIN_PORT = parseInt(process.env.RTC_MIN_PORT || '40000');
const RTC_MAX_PORT = parseInt(process.env.RTC_MAX_PORT || '49999');
const RTC_LISTEN_IP = process.env.RTC_LISTEN_IP || '0.0.0.0';
const RTC_ANNOUNCED_IP = process.env.RTC_ANNOUNCED_IP || undefined;
const NUM_WORKERS = parseInt(process.env.NUM_WORKERS || String(os.cpus().length));

// TURN server (coturn with use-auth-secret). When configured, the SFU issues
// short-lived TURN credentials to clients so viewers behind symmetric NAT /
// strict firewalls can get a relay path.
const TURN_URL = process.env.TURN_URL || '';            // e.g. turn:wachaut.billytech.es:3478?transport=udp
const TURN_SECRET = process.env.TURN_SECRET || '';
// Short-lived credentials (30 min default). Clients must call `refresh-ice-servers`
// before they expire — see SfuClient. Shorter window = safer; long broadcasts
// (a 2h football match) rotate creds multiple times.
const TURN_EXPIRY_SECONDS = parseInt(process.env.TURN_EXPIRY_SECONDS || '1800');

// Allowed CORS origins (single source, env-configurable).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://wachaut.billytech.es,http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Hard limits to prevent resource exhaustion / DoS.
const MAX_ROOMS = parseInt(process.env.MAX_ROOMS || '200');
const MAX_PEERS_PER_ROOM = parseInt(process.env.MAX_PEERS_PER_ROOM || '21');
const MAX_TOTAL_PEERS = parseInt(process.env.MAX_TOTAL_PEERS || '1200');
// Grace period (ms) before destroying a room when the host disconnects,
// giving them a chance to reconnect after a transient network blip.
const HOST_RECONNECT_GRACE_MS = parseInt(process.env.HOST_RECONNECT_GRACE_MS || '30000');

// Idle TTL for orphan SFU rooms. Mirrors the signaling server's ROOM_IDLE_TTL_MS
// so that when the signaling layer reaps an abandoned room, the SFU doesn't
// leak the corresponding router + transports indefinitely. A room is only
// reaped here if it has had no peers at all for this long.
const ROOM_IDLE_TTL_MS = parseInt(process.env.ROOM_IDLE_TTL_MS || String(4 * 60 * 60 * 1000));
const WEBRTC_LISTENIPS = [
  {
    protocol: 'udp' as const,
    ip: RTC_LISTEN_IP,
    announcedIp: RTC_ANNOUNCED_IP || undefined,
  },
];

// ─── Types ─────────────────────────────────────────────────────────────
interface Peer {
  id: string;
  socketId: string;
  displayName: string;
  role: 'host' | 'viewer';
  sendTransport?: mediasoup.types.WebRtcTransport;
  recvTransport?: mediasoup.types.WebRtcTransport;
  producers: mediasoup.types.Producer[];
  consumers: Map<string, mediasoup.types.Consumer>;
  rtpCapabilities?: any;
}

interface Room {
  id: string;
  pin: string;
  hostSocketId: string;
  router: mediasoup.types.Router;
  peers: Map<string, Peer>;
  createdAt: Date;
  /** Last time any peer was present or activity happened. Drives idle TTL. */
  lastActivityAt: Date;
  /** Timer that fires if the host doesn't reconnect within the grace period. */
  hostDisconnectTimer?: ReturnType<typeof setTimeout>;
}

// ─── Globals ───────────────────────────────────────────────────────────
const workers: mediasoup.types.Worker[] = [];
let workerIndex = 0;
const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();
const socketToPeer = new Map<string, Peer>();

/** Total peers across all rooms. */
function totalPeerCount(): number {
  let total = 0;
  for (const room of rooms.values()) total += room.peers.size;
  return total;
}

/**
 * Pure garbage-collector for orphan SFU rooms. A room is reaped only if it
 * has zero peers AND has been idle for longer than ROOM_IDLE_TTL_MS. Exported
 * for unit testing.
 */
export function gcExpiredSfuRooms(
  roomsMap: Map<string, Room>,
  now: Date,
  idleTtlMs: number = ROOM_IDLE_TTL_MS
): string[] {
  const reaped: string[] = [];
  const nowMs = now.getTime();
  for (const [roomId, room] of roomsMap) {
    if (room.peers.size === 0 && nowMs - room.lastActivityAt.getTime() > idleTtlMs) {
      reaped.push(roomId);
      if (room.hostDisconnectTimer) clearTimeout(room.hostDisconnectTimer);
      try { room.router.close(); } catch { /* already closed */ }
      roomsMap.delete(roomId);
    }
  }
  return reaped;
}

// ─── Mediasoup Setup ───────────────────────────────────────────────────
// rtcpFeedback: transport-cc only (modern), no goog-remb (deprecated, causes double BWE)
const videoRtcpFeedback = [
  { type: 'nack' },
  { type: 'nack', parameter: 'pli' },
  { type: 'ccm', parameter: 'fir' },
  { type: 'transport-cc' },
];

const mediaCodecs: mediasoup.types.RouterRtpCodecCapability[] = [
  // AV1 — best quality/bitrate for screen sharing on modern Chrome
  {
    kind: 'video',
    mimeType: 'video/AV1',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
      'x-google-max-bitrate': 8000,
    },
    rtcpFeedback: videoRtcpFeedback,
  },
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
    parameters: {
      'profile-id': 0, // profile 0 (4:2:0 8-bit) — what Chrome's SVC encoder produces
      'x-google-start-bitrate': 1000,
      'x-google-max-bitrate': 5000,
    },
    rtcpFeedback: videoRtcpFeedback,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
      'x-google-max-bitrate': 5000,
    },
    rtcpFeedback: videoRtcpFeedback,
  },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1,
      'x-google-start-bitrate': 1000,
      'x-google-max-bitrate': 5000,
    },
    rtcpFeedback: videoRtcpFeedback,
  },
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
];

async function createWorkers(): Promise<void> {
  console.log(`[sfu] Creating ${NUM_WORKERS} mediasoup Worker(s)...`);

  for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = await mediasoup.createWorker({
      rtcMinPort: RTC_MIN_PORT,
      rtcMaxPort: RTC_MAX_PORT,
    });

    worker.on('died', () => {
      console.error(`[sfu] Worker ${worker.pid} DIED! Attempting recovery...`);
      // Replace the dead worker in the array. Routers on the dead worker are
      // lost — affected rooms will experience dropped media and must re-negotiate.
      // This keeps the instance alive instead of a full process crash.
      const idx = workers.indexOf(worker);
      if (idx !== -1) {
        mediasoup.createWorker({ rtcMinPort: RTC_MIN_PORT, rtcMaxPort: RTC_MAX_PORT })
          .then((newWorker) => {
            newWorker.on('died', () => {
              console.error(`[sfu] Replacement worker ${newWorker.pid} DIED! Exiting.`);
              process.exit(1);
            });
            workers[idx] = newWorker;
            console.log(`[sfu] Worker recovered: ${newWorker.pid} replaced dead worker at index ${idx}`);
          })
          .catch((err) => {
            console.error(`[sfu] Worker recovery failed, exiting:`, err);
            process.exit(1);
          });
      }
    });

    workers.push(worker);
    console.log(`[sfu] Worker ${worker.pid} created`);
  }
}

function getNextWorker(): mediasoup.types.Worker {
  const worker = workers[workerIndex % workers.length];
  workerIndex++;
  return worker;
}

async function createRouter(): Promise<mediasoup.types.Router> {
  const worker = getNextWorker();
  const router = await worker.createRouter({ mediaCodecs });
  console.log(`[sfu] Router ${router.id} created on worker ${worker.pid}`);
  return router;
}

// ─── Fastify ───────────────────────────────────────────────────────────
const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: ALLOWED_ORIGINS,
  credentials: true,
});

// Security headers (HSTS, X-Frame-Options, etc.). CSP disabled for Socket.IO.
await fastify.register(helmet, { contentSecurityPolicy: false });

fastify.get('/health', { logLevel: 'error' }, async () => ({
  status: 'ok',
  workers: workers.length,
  rooms: rooms.size,
  totalPeers: Array.from(rooms.values()).reduce((acc, r) => acc + r.peers.size, 0),
}));

/**
 * Issue short-lived TURN credentials using the coturn shared-secret mechanism
 * (HMAC-SHA1 of "timestamp:userid", base64). Included in the join-room
 * response so clients get them via Socket.IO (no separate HTTP endpoint).
 *
 * Exported for unit testing.
 */
export function generateTurnCredentials(
  nowMs: number = Date.now(),
  expirySeconds: number = TURN_EXPIRY_SECONDS
): { username: string; credential: string } | null {
  if (!TURN_URL || !TURN_SECRET) return null;
  const expiry = Math.floor(nowMs / 1000) + expirySeconds;
  const userid = crypto.randomUUID();
  const username = `${expiry}:${userid}`;
  const credential = crypto.createHmac('sha1', TURN_SECRET).update(username).digest('base64');
  return { username, credential };
}

/** Build the iceServers array for clients (TURN + STUN). */
function buildIceServers(): any[] {
  const servers: any[] = [];
  const turnCreds = generateTurnCredentials();
  if (turnCreds) {
    servers.push({ urls: TURN_URL, username: turnCreds.username, credential: turnCreds.credential });
  }
  return servers;
}

// ─── Socket.IO ─────────────────────────────────────────────────────────
const io = new Server(fastify.server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.on('connection', (socket) => {
  console.log(`[sfu] Client connected: ${socket.id}`);

  // ── Join Room ──────────────────────────────────────────────────────
  socket.on('join-room', async ({ roomId, pin, displayName, role }, callback) => {
    try {
      console.log(`[sfu] join-room: ${displayName} (${role}) → ${roomId}`);

      let room = rooms.get(roomId);

      // Host creates room (or reclaims after a reconnect within the grace window)
      let hostReclaiming = false;
      if (role === 'host') {
        if (room) {
          // Host reconnecting within the grace period: rebind to the new socket.
          if (room.hostDisconnectTimer) {
            clearTimeout(room.hostDisconnectTimer);
            room.hostDisconnectTimer = undefined;
            room.hostSocketId = socket.id;
            hostReclaiming = true;
            console.log(`[sfu] Host reconnected to room ${roomId}, grace timer cancelled`);
          } else {
            callback?.({ error: 'Room already exists' });
            return;
          }
        } else {
          // Enforce hard limits before creating a new room.
          if (rooms.size >= MAX_ROOMS) {
            callback?.({ error: 'Maximum number of rooms reached' });
            return;
          }
          if (totalPeerCount() >= MAX_TOTAL_PEERS) {
            callback?.({ error: 'Server is at capacity' });
            return;
          }

          const router = await createRouter();
          const now = new Date();
          room = {
            id: roomId,
            pin,
            hostSocketId: socket.id,
            router,
            peers: new Map(),
            createdAt: now,
            lastActivityAt: now,
          };
          rooms.set(roomId, room);
          console.log(`[sfu] Room ${roomId} created`);
        }
      }

      if (!room) {
        callback?.({ error: 'Room not found' });
        return;
      }

      // Enforce per-room peer limit.
      if (room.peers.size >= MAX_PEERS_PER_ROOM) {
        callback?.({ error: 'Room is full' });
        return;
      }

      // Viewers check PIN
      if (role === 'viewer' && room.pin !== pin) {
        callback?.({ error: 'Invalid PIN' });
        return;
      }

      // On host reclaim, rebind the existing peer (with its live producers and
      // transports) to the new socket instead of creating an empty one. This
      // is what makes the reclaim seamless: the producers never died, so
      // viewers' consumers keep flowing.
      if (hostReclaiming) {
        // Find the existing host peer (keyed by the OLD socket.id, which no
        // longer has a socket lookup entry — see the disconnect handler).
        let existingHostPeer: Peer | undefined;
        for (const [, p] of room.peers) {
          if (p.role === 'host') { existingHostPeer = p; break; }
        }
        if (existingHostPeer) {
          // Re-key the peer in room.peers under the new socket.id and update
          // its id/socketId so subsequent handler lookups work.
          for (const [key, p] of room.peers) {
            if (p === existingHostPeer) room.peers.delete(key);
          }
          existingHostPeer.id = socket.id;
          existingHostPeer.socketId = socket.id;
          room.peers.set(socket.id, existingHostPeer);
          socketToRoom.set(socket.id, roomId);
          socketToPeer.set(socket.id, existingHostPeer);
          socket.join(roomId);
          room.lastActivityAt = new Date();
          console.log(`[sfu] Host peer rebound to new socket ${socket.id}, producers preserved: ${existingHostPeer.producers.length}`);
        } else {
          // No existing peer to rebind (e.g. server restarted) — fall through
          // to the create-peer branch so the host can re-produce.
          hostReclaiming = false;
        }
      }

      if (!hostReclaiming) {
        // Create peer (normal first-join path for host or viewer)
        const peer: Peer = {
          id: socket.id,
          socketId: socket.id,
          displayName,
          role,
          producers: [],
          consumers: new Map(),
        };

        room.peers.set(socket.id, peer);
        room.lastActivityAt = new Date();
        socketToRoom.set(socket.id, roomId);
        socketToPeer.set(socket.id, peer);

        socket.join(roomId);
      }

      // Collect ALL existing producers for the new peer
      const existingProducers: Array<{ producerId: string; kind: string; peerId: string }> = [];
      for (const [peerId, p] of room.peers) {
        if (peerId !== socket.id) {
          for (const prod of p.producers) {
            existingProducers.push({
              producerId: prod.id,
              kind: prod.kind,
              peerId,
            });
          }
        }
      }

      // Return router's RTP capabilities + existing producers + TURN creds
      callback?.({
        rtpCapabilities: room.router.rtpCapabilities,
        roomId,
        peers: Array.from(room.peers.values()).map((p) => ({
          id: p.id,
          displayName: p.displayName,
          role: p.role,
          producerCount: p.producers.length,
        })),
        existingProducers,
        iceServers: buildIceServers(),
      });

      // Notify others of a fresh peer join — but skip this on host reclaim
      // (the host is already in the room from the viewers' perspective; we
      // already emitted peer-left on drop and they'll get the host back via
      // their existing consumers resuming).
      if (!hostReclaiming) {
        socket.to(roomId).emit('peer-joined', {
          peerId: socket.id,
          displayName,
          role,
        });
      }

      console.log(`[sfu] ${displayName} joined room ${roomId} (${room.peers.size} peers, ${existingProducers.length} existing producers)${hostReclaiming ? ' [RECLAIM]' : ''}`);
    } catch (err: any) {
      console.error(`[sfu] join-room error:`, err?.message || err);
      callback?.({ error: err?.message || 'Failed to join room' });
    }
  });

  // ── RTP Capabilities (viewer sends its caps for proper codec negotiation) ──
  socket.on('rtp-capabilities', ({ rtpCapabilities }: { rtpCapabilities: any }) => {
    const peer = socketToPeer.get(socket.id);
    if (peer && rtpCapabilities) {
      peer.rtpCapabilities = rtpCapabilities;
      console.log(`[sfu] RTP capabilities stored for ${peer.displayName}`);
    }
  });

  // ── Refresh TURN credentials ───────────────────────────────────────
  // Clients call this periodically (every ~25 min) before their current TURN
  // credentials expire (TURN_EXPIRY_SECONDS = 30 min). Without this, viewers
  // behind symmetric NAT/firewalls lose their relay path mid-broadcast and
  // the transport dies irrevocably at the ~30-60 min mark.
  socket.on('refresh-ice-servers', (_payload, callback) => {
    callback?.({ iceServers: buildIceServers() });
  });

  // ── Create WebRTC Transport ────────────────────────────────────────
  socket.on('create-transport', async ({ direction }, callback) => {
    try {
      const room = getRoom(socket);
      if (!room) { callback?.({ error: 'Not in a room' }); return; }

      // Higher initial bitrate for recv (viewers need quality fast); lower for send (host uplink ramps)
      const initialBitrate = direction === 'cons' ? 3_000_000 : 1_000_000;

      const transport = await room.router.createWebRtcTransport({
        listenInfos: WEBRTC_LISTENIPS,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: initialBitrate,
      });

      // Store transport on peer
      const peer = socketToPeer.get(socket.id);

      transport.on('dtlsstatechange', (state) => {
        console.log(`[sfu] Transport ${transport.id} DTLS state: ${state} (${peer?.displayName || 'unknown'})`);
        if (state === 'failed') {
          // DTLS FAILED = sustained connectivity loss (UDP ports unreachable).
          // Force an ICE restart so mediasoup regenerates candidates and the
          // client can re-gather. This is the server-side half of recovering
          // from a transient network failure during long broadcasts.
          console.error(`[sfu] DTLS FAILED for ${peer?.displayName} — restarting ICE`);
          try { transport.restartIce(); } catch (err: any) {
            console.error(`[sfu] restartIce failed for transport ${transport.id}:`, err?.message || err);
          }
        }
        if (state === 'closed') {
          transport.close();
        }
      });

      transport.on('icestatechange', (iceState) => {
        console.log(`[sfu] Transport ${transport.id} ICE state: ${iceState} (${peer?.displayName || 'unknown'})`);
        // mediasoup's IceState has no 'failed' (that surfaces via DTLS above).
        // On 'disconnected' we arm a watchdog — if it stays disconnected too
        // long, restart ICE preemptively before DTLS gives up.
        if (iceState === 'disconnected') {
          setTimeout(() => {
            try {
              // transport.iceState is still the live value at fire time.
              if ((transport as any).iceState === 'disconnected') {
                console.warn(`[sfu] Transport ${transport.id} ICE disconnected >10s — restarting ICE`);
                transport.restartIce();
              }
            } catch (err: any) {
              console.error(`[sfu] preemptive restartIce failed:`, err?.message || err);
            }
          }, 10_000);
        }
      });

      console.log(`[sfu] Transport ${transport.id} for ${peer?.displayName} (${direction}), iceCandidates:`, JSON.stringify(transport.iceCandidates));

      if (peer) {
        if (direction === 'prod') {
          peer.sendTransport = transport;
          // Cap the host's uplink so the SFU has a congestion-control lever.
          try { await transport.setMaxIncomingBitrate(5_000_000); } catch { /* ignore */ }
        }
        if (direction === 'cons') peer.recvTransport = transport;
      }

      // Include TURN/STUN servers so viewers behind symmetric NAT can relay.
      const turnCreds = generateTurnCredentials();
      callback?.({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        iceServers: turnCreds ? [{ urls: TURN_URL, username: turnCreds.username, credential: turnCreds.credential }] : undefined,
      });

      // AUTO-CONSUME: when a viewer creates a recv transport, consume ALL existing producers
      if (direction === 'cons' && peer && peer.role === 'viewer') {
        console.log(`[sfu] Viewer ${peer.displayName} created recv transport, checking for existing producers...`);
        for (const [, otherPeer] of room.peers) {
          if (otherPeer.id !== socket.id) {
            for (const producer of otherPeer.producers) {
              console.log(`[sfu] Auto-consume for ${peer.displayName}: producer ${producer.id} (${producer.kind}) from ${otherPeer.displayName}`);
              const canConsume = room.router.canConsume({
                producerId: producer.id,
                rtpCapabilities: peer.rtpCapabilities || room.router.rtpCapabilities,
              });
              if (canConsume) {
                await createConsumer(room, producer, peer);
              } else {
                console.log(`[sfu] canConsume=false for ${producer.id}`);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`[sfu] create-transport error:`, err?.message || err);
      callback?.({ error: err?.message || 'Failed to create transport' });
    }
  });

  // ── Connect Transport ──────────────────────────────────────────────
  socket.on('connect-transport', async ({ transportId, dtlsParameters }, callback) => {
    const peer = socketToPeer.get(socket.id);
    if (!peer) { callback?.({ error: 'No peer' }); return; }

    const transport = peer.sendTransport?.id === transportId
      ? peer.sendTransport
      : peer.recvTransport?.id === transportId
        ? peer.recvTransport
        : null;

    if (!transport) { callback?.({ error: 'Transport not found' }); return; }

    try {
      await transport.connect({ dtlsParameters });
      console.log(`[sfu] Transport ${transportId} connected for ${peer.displayName}`);
      callback?.({ ok: true });
    } catch (err: any) {
      console.error(`[sfu] Transport connect error for ${peer.displayName}:`, err.message);
      callback?.({ error: err.message });
    }
  });

  // ── Produce (host sends screen/audio) ──────────────────────────────
  socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
    try {
      const peer = socketToPeer.get(socket.id);
      const room = getRoom(socket);
      if (!peer?.sendTransport || !room) { callback?.({ error: 'No transport' }); return; }

      const producer = await peer.sendTransport.produce({
        kind,
        rtpParameters,
        appData: { ...appData, peerId: socket.id },
      });

      // Store producer in array (host creates video + audio)
      peer.producers.push(producer);
      console.log(`[sfu] Producer ${producer.id} (${kind}) created by ${peer.displayName}, total producers: ${peer.producers.length}`);

      // Auto-consume for all viewers that have recv transports — in parallel.
      const consumePromises: Promise<void>[] = [];
      for (const [viewerId, viewer] of room.peers) {
        if (viewerId !== socket.id && viewer.recvTransport) {
          const canConsume = room.router.canConsume({
            producerId: producer.id,
            rtpCapabilities: viewer.rtpCapabilities || room.router.rtpCapabilities,
          });
          if (canConsume) {
            console.log(`[sfu] Auto-consuming ${kind} for viewer ${viewer.displayName}`);
            consumePromises.push(createConsumer(room, producer, viewer));
          }
        }
      }
      await Promise.allSettled(consumePromises);

      callback?.({ id: producer.id });
    } catch (err: any) {
      console.error(`[sfu] produce error:`, err?.message || err);
      callback?.({ error: err?.message || 'Failed to produce' });
    }
  });

  // ── Close Producer ─────────────────────────────────────────────────
  socket.on('close-producer', async ({ producerId }, callback) => {
    const peer = socketToPeer.get(socket.id);
    const idx = peer?.producers.findIndex((p) => p.id === producerId) ?? -1;
    if (idx >= 0) {
      peer!.producers[idx].close();
      peer!.producers.splice(idx, 1);
    }
    callback?.({ ok: true });
  });

  // ── Set Spatial Layer (host-driven auto-adapt) ─────────────────────
  // When the host's connection degrades, they emit this to drop the top
  // spatial layer. Viewers then receive mid-quality (layer 1) instead of
  // freezing. When the connection recovers, layer 2 (top) is restored.
  socket.on('host:set-spatial-layer', ({ spatialLayer }: { spatialLayer: number }) => {
    const peer = socketToPeer.get(socket.id);
    if (!peer) return;
    for (const producer of peer.producers) {
      if (producer.kind === 'video') {
        try {
          (producer as any).setMaxSpatialLayer(spatialLayer);
          console.log(`[sfu] Producer ${producer.id} spatial layer set to ${spatialLayer} by host`);
        } catch (err) {
          console.error(`[sfu] Failed to set spatial layer:`, err);
        }
      }
    }
  });

  // ── Consumer Resume ────────────────────────────────────────────────
  socket.on('resume-consumer', async ({ consumerId }, callback) => {
    const peer = socketToPeer.get(socket.id);
    const consumer = peer?.consumers.get(consumerId);
    if (consumer) {
      await consumer.resume();
      console.log(`[sfu] Consumer ${consumerId} resumed for ${peer?.displayName}`);
    }
    callback?.({ ok: true });
  });

  // ── Disconnect ─────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const roomId = socketToRoom.get(socket.id);
    const peer = socketToPeer.get(socket.id);

    if (!roomId || !peer) {
      socketToRoom.delete(socket.id);
      socketToPeer.delete(socket.id);
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      socketToRoom.delete(socket.id);
      socketToPeer.delete(socket.id);
      return;
    }

    const isHost = room.hostSocketId === socket.id;

    if (isHost) {
      // ── Host disconnect ──────────────────────────────────────────────
      // Do NOT close the host's producers/transports immediately. We keep
      // them alive for HOST_RECONNECT_GRACE_MS so that if the host reconnects
      // within that window, viewers' consumers keep working and no media is
      // lost. The socket→peer/socket→room maps are cleared (the old socket.id
      // is dead) but the Peer entry stays in room.peers so closeRoom() can
      // still clean it up if the grace timer fires.
      console.log(`[sfu] Host disconnected from ${roomId}, starting ${HOST_RECONNECT_GRACE_MS}ms grace timer`);
      socketToRoom.delete(socket.id);
      socketToPeer.delete(socket.id);
      // Notify viewers so they enter the "reconnecting" state. (Their consumer
      // tracks may freeze but will resume when the host reclaims.)
      socket.to(roomId).emit('peer-left', { peerId: socket.id, displayName: peer.displayName });
      if (room.hostDisconnectTimer) clearTimeout(room.hostDisconnectTimer);
      room.hostDisconnectTimer = setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (currentRoom) {
          closeRoom(currentRoom);
          console.log(`[sfu] Room ${roomId} closed (host did not reconnect)`);
        }
      }, HOST_RECONNECT_GRACE_MS);
      return;
    }

    // ── Viewer disconnect: full teardown as before ──────────────────────
    for (const producer of peer.producers) {
      for (const [, p] of room.peers) {
        for (const [cId, consumer] of p.consumers) {
          if (consumer.producerId === producer.id) {
            consumer.close();
            p.consumers.delete(cId);
          }
        }
      }
      producer.close();
    }
    peer.sendTransport?.close();
    peer.recvTransport?.close();
    room.peers.delete(socket.id);
    socket.to(roomId).emit('peer-left', { peerId: socket.id, displayName: peer.displayName });
    room.lastActivityAt = new Date();

    socketToRoom.delete(socket.id);
    socketToPeer.delete(socket.id);
  });
});

/** Tear down a room completely: close all peers' resources + router, delete it. */
function closeRoom(room: Room): void {
  for (const [, p] of room.peers) {
    p.sendTransport?.close();
    p.recvTransport?.close();
    for (const prod of p.producers) prod.close();
    for (const [, c] of p.consumers) c.close();
  }
  if (room.hostDisconnectTimer) clearTimeout(room.hostDisconnectTimer);
  room.router.close();
  rooms.delete(room.id);
}

// ─── Helpers ───────────────────────────────────────────────────────────
function getRoom(socket: any): Room | undefined {
  const roomId = socketToRoom.get(socket.id);
  return roomId ? rooms.get(roomId) : undefined;
}

async function createConsumer(
  room: Room,
  producer: mediasoup.types.Producer,
  viewer: Peer
): Promise<void> {
  if (!viewer.recvTransport) return;
  // Use the viewer's own RTP capabilities (proper codec negotiation), with
  // fallback to router caps if the viewer hasn't sent them yet.
  const peerCaps = viewer.rtpCapabilities || room.router.rtpCapabilities;
  if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities: peerCaps })) {
    console.log(`[sfu] cannot consume producer ${producer.id} for ${viewer.displayName}`);
    return;
  }

  const consumer = await viewer.recvTransport.consume({
    producerId: producer.id,
    rtpCapabilities: peerCaps,
    paused: true,
  });

  // If the producer has SVC layers, start the viewer on the middle spatial
  // layer for a balance of quality and bandwidth. Use the correct mediasoup
  // API: setPreferredLayers (not setCurrentSpatialLayer which doesn't exist).
  if (consumer.kind === 'video') {
    try {
      await consumer.setPreferredLayers({ spatialLayer: 1, temporalLayer: 2 });
      console.log(`[sfu] Consumer ${consumer.id} preferred layers set: spatial=1, temporal=2`);
    } catch {
      /* consumer may not support layer preferences (non-SVC producer) — ignore */
    }
  }

  viewer.consumers.set(consumer.id, consumer);

  console.log(`[sfu] Created consumer ${consumer.id} (${consumer.kind}) for ${viewer.displayName}`);

  // Tell viewer to consume
  const viewerSocket = io.sockets.sockets.get(viewer.socketId);
  viewerSocket?.emit('new-consumer', {
    consumerId: consumer.id,
    producerId: producer.id,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
    appData: producer.appData,
  });
}

// ─── Start ─────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  // Fail fast in production if the announced IP isn't set — without it ICE
  // candidates advertise 0.0.0.0 and nobody can connect.
  if (process.env.NODE_ENV === 'production' && !RTC_ANNOUNCED_IP) {
    throw new Error('RTC_ANNOUNCED_IP must be set in production');
  }

  await createWorkers();

  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[sfu] Server listening on ${HOST}:${PORT}`);
  console.log(`[sfu] Workers: ${workers.length}, RTC ports: ${RTC_MIN_PORT}-${RTC_MAX_PORT}`);

  // Reap orphan rooms every 5 minutes. A room is only reaped if it has had
  // zero peers for ROOM_IDLE_TTL_MS — this catches the case where the
  // signaling server closed a room (TTL, host drop) but the SFU never got
  // the corresponding peer disconnects, leaking the router + transports.
  setInterval(() => {
    const reaped = gcExpiredSfuRooms(rooms, new Date());
    for (const id of reaped) console.log(`[sfu] Reaped orphan room ${id} (idle TTL)`);
  }, 5 * 60 * 1000);

  // Graceful shutdown — close routers/workers so clients aren't hard-disconnected.
  let shuttingDown = false;
  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[sfu] ${signal} received, shutting down...`);
    io.close();
    for (const room of rooms.values()) closeRoom(room);
    for (const worker of workers) worker.close();
    await fastify.close();
    console.log('[sfu] Shutdown complete');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Only boot the full server when invoked directly (not when imported by tests).
// Tests import generateTurnCredentials / gcExpiredSfuRooms without wanting
// Fastify + mediasoup workers to spin up.
if (process.env.NODE_ENV !== 'test') {
  main().catch((err) => {
    console.error('[sfu] Fatal:', err);
    process.exit(1);
  });
}
