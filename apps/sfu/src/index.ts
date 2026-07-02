/**
 * Wachaut SFU Server — Mediasoup-based selective forwarding unit.
 * Handles WebRTC media routing for screen sharing rooms.
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import * as mediasoup from 'mediasoup';
import * as os from 'os';

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
}

// ─── Globals ───────────────────────────────────────────────────────────
const workers: mediasoup.types.Worker[] = [];
let workerIndex = 0;
const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();
const socketToPeer = new Map<string, Peer>();

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
      if (direction === 'prod') peer.sendTransport = transport;
      if (direction === 'cons') peer.recvTransport = transport;
    }

    callback?.({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
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

    // Auto-consume for all viewers that have recv transports
    for (const [viewerId, viewer] of room.peers) {
      if (viewerId !== socket.id && viewer.recvTransport) {
        console.log(`[sfu] Auto-consuming ${kind} for viewer ${viewer.displayName}`);
        const canConsume = room.router.canConsume({
          producerId: producer.id,
          rtpCapabilities: room.router.rtpCapabilities,
        });
        if (canConsume) {
          await createConsumer(room, producer, viewer);
        }
      }
    }

    callback?.({ id: producer.id });
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

        // If host left, close room
        if (room.hostSocketId === socket.id) {
          for (const [, p] of room.peers) {
            p.sendTransport?.close();
            p.recvTransport?.close();
            for (const prod of p.producers) prod.close();
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
  await createWorkers();

  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[sfu] Server listening on ${HOST}:${PORT}`);
  console.log(`[sfu] Workers: ${workers.length}, RTC ports: ${RTC_MIN_PORT}-${RTC_MAX_PORT}`);
}

main().catch((err) => {
  console.error('[sfu] Fatal:', err);
  process.exit(1);
});
