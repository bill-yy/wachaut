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
const TURN_EXPIRY_SECONDS = parseInt(process.env.TURN_EXPIRY_SECONDS || '3600');

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
}

interface Room {
  id: string;
  pin: string;
  hostSocketId: string;
  router: mediasoup.types.Router;
  peers: Map<string, Peer>;
  createdAt: Date;
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

// ─── Mediasoup Setup ───────────────────────────────────────────────────
const mediaCodecs: mediasoup.types.RouterRtpCodecCapability[] = [
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
      'x-google-max-bitrate': 5000,
    },
    rtcpFeedback: [
      { type: 'nack' },
      { type: 'nack', parameter: 'pli' },
      { type: 'ccm', parameter: 'fir' },
      { type: 'goog-remb' },
      { type: 'transport-cc' },
    ],
  },
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
    parameters: {
      'profile-id': 2,
      'x-google-start-bitrate': 1000,
      'x-google-max-bitrate': 5000,
    },
    rtcpFeedback: [
      { type: 'nack' },
      { type: 'nack', parameter: 'pli' },
      { type: 'ccm', parameter: 'fir' },
      { type: 'goog-remb' },
      { type: 'transport-cc' },
    ],
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
    rtcpFeedback: [
      { type: 'nack' },
      { type: 'nack', parameter: 'pli' },
      { type: 'ccm', parameter: 'fir' },
      { type: 'goog-remb' },
      { type: 'transport-cc' },
    ],
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
 * (HMAC-SHA1 of "timestamp:userid", base64). Clients fetch this before creating
 * transports and pass iceServers to mediasoup-client.
 */
function generateTurnCredentials(): { username: string; credential: string } | null {
  if (!TURN_URL || !TURN_SECRET) return null;
  const expiry = Math.floor(Date.now() / 1000) + TURN_EXPIRY_SECONDS;
  const userid = crypto.randomUUID();
  const username = `${expiry}:${userid}`;
  const credential = crypto.createHmac('sha1', TURN_SECRET).update(username).digest('base64');
  return { username, credential };
}

fastify.get('/turn-credentials', async () => {
  const creds = generateTurnCredentials();
  if (!creds) return { iceServers: [] };
  // Parse the TURN_URL into iceServers format.
  const iceServers = [
    { urls: TURN_URL, username: creds.username, credential: creds.credential },
  ];
  return { iceServers };
});

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
      if (role === 'host') {
        if (room) {
          // Host reconnecting within the grace period: rebind to the new socket.
          if (room.hostDisconnectTimer) {
            clearTimeout(room.hostDisconnectTimer);
            room.hostDisconnectTimer = undefined;
            room.hostSocketId = socket.id;
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
          room = {
            id: roomId,
            pin,
            hostSocketId: socket.id,
            router,
            peers: new Map(),
            createdAt: new Date(),
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

      // Create peer
      const peer: Peer = {
        id: socket.id,
        socketId: socket.id,
        displayName,
        role,
        producers: [],
        consumers: new Map(),
      };

      room.peers.set(socket.id, peer);
      socketToRoom.set(socket.id, roomId);
      socketToPeer.set(socket.id, peer);

      socket.join(roomId);

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

      // Return router's RTP capabilities + existing producers
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
      });

      // Notify others
      socket.to(roomId).emit('peer-joined', {
        peerId: socket.id,
        displayName,
        role,
      });

      console.log(`[sfu] ${displayName} joined room ${roomId} (${room.peers.size} peers, ${existingProducers.length} existing producers)`);
    } catch (err: any) {
      console.error(`[sfu] join-room error:`, err?.message || err);
      callback?.({ error: err?.message || 'Failed to join room' });
    }
  });

  // ── Create WebRTC Transport ────────────────────────────────────────
  socket.on('create-transport', async ({ direction }, callback) => {
    try {
      const room = getRoom(socket);
      if (!room) { callback?.({ error: 'Not in a room' }); return; }

      const transport = await room.router.createWebRtcTransport({
        listenInfos: WEBRTC_LISTENIPS,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 1_000_000,
      });

      // Store transport on peer
      const peer = socketToPeer.get(socket.id);

      transport.on('dtlsstatechange', (state) => {
        console.log(`[sfu] Transport ${transport.id} DTLS state: ${state} (${peer?.displayName || 'unknown'})`);
        if (state === 'failed') {
          console.error(`[sfu] DTLS FAILED for ${peer?.displayName} — UDP ports unreachable!`);
        }
        if (state === 'closed') {
          transport.close();
        }
      });

      transport.on('icestatechange', (iceState) => {
        console.log(`[sfu] Transport ${transport.id} ICE state: ${iceState} (${peer?.displayName || 'unknown'})`);
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
                rtpCapabilities: room.router.rtpCapabilities,
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
            rtpCapabilities: room.router.rtpCapabilities,
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

    if (roomId && peer) {
      const room = rooms.get(roomId);
      if (room) {
        const isHost = room.hostSocketId === socket.id;

        // Close all peer's producers
        for (const producer of peer.producers) {
          // Close all consumers referencing this producer
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

        // Close peer's transports
        peer.sendTransport?.close();
        peer.recvTransport?.close();

        // Remove peer
        room.peers.delete(socket.id);

        // Notify others
        socket.to(roomId).emit('peer-left', {
          peerId: socket.id,
          displayName: peer.displayName,
        });

        if (isHost) {
          // R1: Don't destroy the room immediately — give the host a grace period
          // to reconnect after a transient network blip. If they rejoin within
          // HOST_RECONNECT_GRACE_MS, the timer is cancelled in the join handler.
          console.log(`[sfu] Host disconnected from ${roomId}, starting ${HOST_RECONNECT_GRACE_MS}ms grace timer`);
          room.hostDisconnectTimer = setTimeout(() => {
            const currentRoom = rooms.get(roomId);
            if (currentRoom) {
              closeRoom(currentRoom);
              console.log(`[sfu] Room ${roomId} closed (host did not reconnect)`);
            }
          }, HOST_RECONNECT_GRACE_MS);
        } else {
          console.log(`[sfu] ${peer.displayName} left room ${roomId} (${room.peers.size} peers)`);
        }
      }
    }

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
  if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities: room.router.rtpCapabilities })) {
    console.log(`[sfu] cannot consume producer ${producer.id} for ${viewer.displayName}`);
    return;
  }

  const consumer = await viewer.recvTransport.consume({
    producerId: producer.id,
    rtpCapabilities: room.router.rtpCapabilities,
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

main().catch((err) => {
  console.error('[sfu] Fatal:', err);
  process.exit(1);
});
