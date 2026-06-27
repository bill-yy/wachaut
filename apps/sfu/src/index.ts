/**
 * Wachaut SFU Server — Mediasoup-based selective forwarding unit.
 * Handles WebRTC media routing for screen sharing rooms.
 *
 * Architecture:
 * - 1 Worker per CPU core (each runs its own libuv thread)
 * - 1 Router per room (each Router has its own SSRC space)
 * - WebRtcTransport for each participant (produces and/or consumes)
 * - Host produces screen/audio, viewers consume
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import * as mediasoup from 'mediasoup';
import os from 'node:os';

// ─── Config ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3002');
const HOST = process.env.HOST || '0.0.0.0';
const RTC_MIN_PORT = parseInt(process.env.RTC_MIN_PORT || '10000');
const RTC_MAX_PORT = parseInt(process.env.RTC_MAX_PORT || '10100');
const RTC_LISTEN_IP = process.env.RTC_LISTEN_IP || '0.0.0.0';
const RTC_ANNOUNCED_IP = process.env.RTC_ANNOUNCED_IP || undefined;
const NUM_WORKERS = parseInt(process.env.NUM_WORKERS || String(os.cpus().length));
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
  transport?: mediasoup.types.WebRtcTransport;
  producer?: mediasoup.types.Producer;
  consumers: Map<string, mediasoup.types.Consumer>;
}

interface Room {
  id: string;
  pin: string;
  hostSocketId: string;
  router: mediasoup.types.Router;
  peers: Map<string, Peer>;
  createdAt: Date;
}

// ─── Globals ───────────────────────────────────────────────────────────
let mediasoupRouter: mediasoup.types.Router | null = null;
let workerIndex = 0;

const workers: mediasoup.types.Worker[] = [];
const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();
const socketToPeer = new Map<string, Peer>();

// ─── Mediasoup Setup ───────────────────────────────────────────────────
const mediaCodecs: any[] = [
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
      'x-google-max-bitrate': 5000,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
    parameters: {
      'profile-id': 2,
      'x-google-start-bitrate': 1000,
      'x.google-max-bitrate': 5000,
    },
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
      console.error(`[sfu] Worker ${worker.pid} DIED!`);
      process.exit(1);
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
  origin: [
    'https://wachaut.billytech.es',
    'http://localhost:5173',
    'http://localhost:4173',
  ],
  credentials: true,
});

fastify.get('/health', async () => ({
  status: 'ok',
  workers: workers.length,
  rooms: rooms.size,
  totalPeers: Array.from(rooms.values()).reduce((acc, r) => acc + r.peers.size, 0),
}));

fastify.get('/rtp-capabilities', async (_req, reply) => {
  if (!mediasoupRouter) {
    reply.status(503);
    return { error: 'Router not ready' };
  }
  return { rtpCapabilities: mediasoupRouter.rtpCapabilities };
});

// ─── Socket.IO ─────────────────────────────────────────────────────────
const io = new Server(fastify.server, {
  cors: {
    origin: [
      'https://wachaut.billytech.es',
      'http://localhost:5173',
      'http://localhost:4173',
    ],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.on('connection', (socket) => {
  console.log(`[sfu] Client connected: ${socket.id}`);

  // ── Join Room ──────────────────────────────────────────────────────
  socket.on('join-room', async ({ roomId, pin, displayName, role }, callback) => {
    console.log(`[sfu] join-room: ${displayName} (${role}) → ${roomId}`);

    let room = rooms.get(roomId);

    // Host creates room
    if (role === 'host') {
      if (room) {
        callback?.({ error: 'Room already exists' });
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

    if (!room) {
      callback?.({ error: 'Room not found' });
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
      consumers: new Map(),
    };

    room.peers.set(socket.id, peer);
    socketToRoom.set(socket.id, roomId);
    socketToPeer.set(socket.id, peer);

    socket.join(roomId);

    // Return router's RTP capabilities
    callback?.({
      rtpCapabilities: room.router.rtpCapabilities,
      roomId,
      peers: Array.from(room.peers.values()).map((p) => ({
        id: p.id,
        displayName: p.displayName,
        role: p.role,
        hasProducer: !!p.producer,
      })),
    });

    // Notify others
    socket.to(roomId).emit('peer-joined', {
      peerId: socket.id,
      displayName,
      role,
    });

    console.log(`[sfu] ${displayName} joined room ${roomId} (${room.peers.size} peers)`);
  });

  // ── Create WebRTC Transport ────────────────────────────────────────
  socket.on('create-transport', async ({ direction }, callback) => {
    const room = getRoom(socket);
    if (!room) { callback?.({ error: 'Not in a room' }); return; }

    const transport = await room.router.createWebRtcTransport({
      listenInfos: WEBRTC_LISTENIPS,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1_000_000,
    });

    transport.on('dtlsstatechange', (state) => {
      if (state === 'closed') {
        transport.close();
      }
    });

    // Store transport on peer
    const peer = socketToPeer.get(socket.id);
    if (peer) {
      if (direction === 'prod') peer.transport = transport;
      // For consumers, we store them differently — but for simplicity,
      // we reuse the same transport pattern as mediasoup demo
    }

    callback?.({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });
  });

  // ── Connect Transport ──────────────────────────────────────────────
  socket.on('connect-transport', async ({ transportId, dtlsParameters }, callback) => {
    const peer = socketToPeer.get(socket.id);
    if (!peer?.transport) { callback?.({ error: 'No transport' }); return; }

    if (peer.transport.id === transportId) {
      await peer.transport.connect({ dtlsParameters });
    }

    callback?.({ ok: true });
  });

  // ── Produce (host sends screen/audio) ──────────────────────────────
  socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
    const peer = socketToPeer.get(socket.id);
    const room = getRoom(socket);
    if (!peer?.transport || !room) { callback?.({ error: 'No transport' }); return; }

    const producer = await peer.transport.produce({
      kind,
      rtpParameters,
      appData: { ...appData, peerId: socket.id },
    });

    peer.producer = producer;
    console.log(`[sfu] Producer ${producer.id} created by ${peer.displayName} (${kind})`);

    // Auto-consume for all viewers
    for (const [viewerId, viewer] of room.peers) {
      if (viewerId !== socket.id && viewer.transport) {
        console.log(`[sfu] Auto-consuming for viewer ${viewer.displayName} (${viewerId}), transport exists: true`);
        const canConsume = room.router.canConsume({ producerId: producer.id, rtpCapabilities: room.router.rtpCapabilities });
        console.log(`[sfu] canConsume: ${canConsume}`);
        if (canConsume) {
          await createConsumer(room, producer, viewer);
        }
      } else if (viewerId !== socket.id) {
        console.log(`[sfu] Skipping viewer ${viewer.displayName} — no transport`);
      }
    }

    callback?.({ id: producer.id });
  });

  // ── Close Producer ─────────────────────────────────────────────────
  socket.on('close-producer', async ({ producerId }, callback) => {
    const peer = socketToPeer.get(socket.id);
    if (peer?.producer?.id === producerId) {
      peer.producer.close();
      peer.producer = undefined;

      // Close all consumers that were consuming this producer
      for (const [, consumer] of peer.consumers) {
        if (consumer.producerId === producerId) {
          consumer.close();
        }
      }
    }
    callback?.({ ok: true });
  });

  // ── Consumer Resume ────────────────────────────────────────────────
  socket.on('resume-consumer', async ({ consumerId }, callback) => {
    const peer = socketToPeer.get(socket.id);
    const consumer = peer?.consumers.get(consumerId);
    if (consumer) {
      await consumer.resume();
    }
    callback?.({ ok: true });
  });

  // ── Get RTP Parameters for Consumer ────────────────────────────────
  socket.on('consume', async ({ producerId }, callback) => {
    const room = getRoom(socket);
    const peer = socketToPeer.get(socket.id);
    if (!room || !peer?.transport) { callback?.({ error: 'Not ready' }); return; }

    // Find the producer
    let producer: mediasoup.types.Producer | undefined;
    for (const [, p] of room.peers) {
      if (p.producer?.id === producerId) {
        producer = p.producer;
        break;
      }
    }

    if (!producer) { callback?.({ error: 'Producer not found' }); return; }

    await createConsumer(room, producer, peer);
    callback?.({ ok: true });
  });

  // ── Disconnect ─────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const roomId = socketToRoom.get(socket.id);
    const peer = socketToPeer.get(socket.id);

    if (roomId && peer) {
      const room = rooms.get(roomId);
      if (room) {
        // Close peer's producer
        peer.producer?.close();

        // Close all consumers referencing this peer's producer
        for (const [, p] of room.peers) {
          for (const [cId, consumer] of p.consumers) {
            if (consumer.producerId === peer.producer?.id) {
              consumer.close();
              p.consumers.delete(cId);
            }
          }
        }

        // Close peer's transport
        peer.transport?.close();

        // Remove peer
        room.peers.delete(socket.id);

        // Notify others
        socket.to(roomId).emit('peer-left', {
          peerId: socket.id,
          displayName: peer.displayName,
        });

        // If host left, close room
        if (room.hostSocketId === socket.id) {
          for (const [, p] of room.peers) {
            p.transport?.close();
            p.producer?.close();
            for (const [, c] of p.consumers) c.close();
          }
          room.router.close();
          rooms.delete(roomId);
          console.log(`[sfu] Room ${roomId} closed (host left)`);
        } else {
          console.log(`[sfu] ${peer.displayName} left room ${roomId} (${room.peers.size} peers)`);
        }
      }
    }

    socketToRoom.delete(socket.id);
    socketToPeer.delete(socket.id);
  });
});

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
  if (!viewer.transport) return;
  if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities: room.router.rtpCapabilities })) {
    return;
  }

  const consumer = await viewer.transport.consume({
    producerId: producer.id,
    rtpCapabilities: room.router.rtpCapabilities,
    paused: true,
  });

  viewer.consumers.set(consumer.id, consumer);

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
  await createWorkers();

  mediasoupRouter = await createRouter();

  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[sfu] Server listening on ${HOST}:${PORT}`);
  console.log(`[sfu] Workers: ${workers.length}, RTC ports: ${RTC_MIN_PORT}-${RTC_MAX_PORT}`);
}

main().catch((err) => {
  console.error('[sfu] Fatal:', err);
  process.exit(1);
});
