import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import crypto from 'node:crypto';

const fastify = Fastify({
  logger: true
});

// Enable CORS
await fastify.register(cors, {
  origin: ['https://wachaut.billytech.es', 'https://api-wachaut.billytech.es'],
  credentials: true
});

// Room storage (in-memory with TTL)
interface Room {
  id: string;
  pin: string;
  hostId: string;
  viewers: Set<string>;
  createdAt: Date;
  isSharing: boolean;
  chat: ChatMessage[];
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

const rooms = new Map<string, Room>();
const viewerToRoom = new Map<string, string>(); // socketId -> roomId

// Rate limiting
const connectionCounts = new Map<string, number>(); // IP -> count
const eventCounts = new Map<string, { count: number; resetAt: number }>(); // socketId -> rate info

const MAX_CONNECTIONS_PER_IP = 5;
const MAX_EVENTS_PER_MINUTE = 120;
const MAX_ROOMS_SIMULTANEOUS = 200;
const MAX_CHAT_LENGTH = 500;
const MAX_REACTIONS_PER_MINUTE = 30;

function getRateKey(socketId: string): string {
  return socketId;
}

function checkRateLimit(socketId: string, maxEvents: number = MAX_EVENTS_PER_MINUTE): boolean {
  const key = getRateKey(socketId);
  const now = Date.now();
  const entry = eventCounts.get(key);

  if (!entry || now > entry.resetAt) {
    eventCounts.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }

  entry.count++;
  if (entry.count > maxEvents) {
    return false;
  }
  return true;
}

// Cleanup expired rooms every 5 minutes
setInterval(() => {
  const now = new Date();
  const twoHours = 2 * 60 * 60 * 1000;
  
  for (const [roomId, room] of rooms) {
    if (now.getTime() - room.createdAt.getTime() > twoHours) {
      rooms.delete(roomId);
      for (const viewerId of room.viewers) {
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
}, 5 * 60 * 1000);

// Socket.IO setup
const io = new Server(fastify.server, {
  cors: {
    origin: ['https://wachaut.billytech.es', 'https://api-wachaut.billytech.es'],
    credentials: true
  },
  pingInterval: 25000,
  pingTimeout: 20000
});

io.use((socket, next) => {
  // Rate limit connections per IP
  const ip = socket.handshake.address;
  const count = connectionCounts.get(ip) || 0;
  if (count >= MAX_CONNECTIONS_PER_IP) {
    return next(new Error('Demasiadas conexiones. Intenta de nuevo en un momento.'));
  }
  connectionCounts.set(ip, count + 1);
  next();
});

io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  fastify.log.info(`Client connected: ${socket.id} from ${ip}`);

  socket.on('disconnect', () => {
    // Decrement connection count
    const count = connectionCounts.get(ip) || 0;
    if (count <= 1) connectionCounts.delete(ip);
    else connectionCounts.set(ip, count - 1);

    // Cleanup rate limit
    eventCounts.delete(getRateKey(socket.id));

    fastify.log.info(`Client disconnected: ${socket.id}`);

    // Check if host
    for (const [roomId, room] of rooms) {
      if (room.hostId === socket.id) {
        socket.to(roomId).emit('host:disconnected');
        setTimeout(() => {
          const currentRoom = rooms.get(roomId);
          if (currentRoom && currentRoom.hostId === socket.id) {
            socket.to(roomId).emit('room:closed');
            rooms.delete(roomId);
            for (const viewerId of currentRoom.viewers) {
              viewerToRoom.delete(viewerId);
            }
          }
        }, 60000);
        break;
      }
      
      // Check if viewer
      if (room.viewers.has(socket.id)) {
        room.viewers.delete(socket.id);
        viewerToRoom.delete(socket.id);
        socket.to(room.hostId).emit('viewer:left', { viewerId: socket.id });
        break;
      }
    }
  });

  // ─── HOST EVENTS ────────────────────────────────────────

  socket.on('host:create-room', ({ roomId, pin }: { roomId: string; pin: string }) => {
    if (!checkRateLimit(socket.id)) {
      socket.emit('room:error', { message: 'Demasiadas peticiones.' });
      return;
    }

    if (rooms.size >= MAX_ROOMS_SIMULTANEOUS) {
      socket.emit('room:error', { message: 'Servidor lleno. Intenta más tarde.' });
      return;
    }

    const room: Room = {
      id: roomId,
      pin,
      hostId: socket.id,
      viewers: new Set(),
      createdAt: new Date(),
      isSharing: false,
      chat: []
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    fastify.log.info(`Room created: ${roomId}`);
  });

  socket.on('host:signal', ({ viewerId, signal }: { viewerId: string; signal: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
    if (!checkRateLimit(socket.id)) return;
    socket.to(viewerId).emit('host:signal', { signal });
  });

  socket.on('host:stop-sharing', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.isSharing = false;
      socket.to(roomId).emit('host:stopped-sharing');
    }
  });

  socket.on('host:close-room', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.to(roomId).emit('room:closed');
      rooms.delete(roomId);
      for (const viewerId of room.viewers) {
        viewerToRoom.delete(viewerId);
      }
    }
  });

  // ─── VIEWER EVENTS ──────────────────────────────────────

  socket.on('viewer:join', ({ roomId, pin }: { roomId: string; pin: string }) => {
    if (!checkRateLimit(socket.id)) {
      socket.emit('room:error', { message: 'Demasiadas peticiones.' });
      return;
    }

    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('room:error', { message: 'No se ha encontrado la sala. Comprueba el enlace.' });
      return;
    }
    
    if (room.pin !== pin) {
      socket.emit('room:auth-failed', { message: 'PIN incorrecto. Comprueba que lo hayas escrito bien.' });
      return;
    }
    
    socket.emit('room:auth-success');
    
    if (room.viewers.size >= 5) {
      socket.emit('room:error', { message: 'La sala está llena. Espera a que alguien salga.' });
      return;
    }

    room.viewers.add(socket.id);
    viewerToRoom.set(socket.id, roomId);
    socket.join(roomId);
    
    socket.emit('room:joined', { roomId });
    socket.to(room.hostId).emit('viewer:joined', { viewerId: socket.id });
    
    // Send chat history to the joining viewer
    socket.emit('chat:history', { messages: room.chat.slice(-50) });
    
    fastify.log.info(`Viewer ${socket.id} joined room ${roomId}`);
  });

  socket.on('viewer:signal', ({ signal }: { signal: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
    if (!checkRateLimit(socket.id)) return;
    const roomId = viewerToRoom.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    socket.to(room.hostId).emit('viewer:signal', { viewerId: socket.id, signal });
  });

  // ─── CHAT EVENTS ────────────────────────────────────────

  socket.on('chat:message', ({ text }: { text: string }) => {
    if (!checkRateLimit(socket.id, MAX_REACTIONS_PER_MINUTE)) return;

    const roomId = viewerToRoom.get(socket.id);
    if (!roomId) {
      // Check if host
      for (const [rid, room] of rooms) {
        if (room.hostId === socket.id) {
          const msg: ChatMessage = {
            id: `${socket.id}-${Date.now()}`,
            sender: 'Anfitrión',
            text: text.slice(0, MAX_CHAT_LENGTH),
            timestamp: Date.now()
          };
          room.chat.push(msg);
          if (room.chat.length > 100) room.chat.shift();
          io.to(rid).emit('chat:message', msg);
          return;
        }
      }
      return;
    }

    const room = rooms.get(roomId);
    if (!room) return;

    const msg: ChatMessage = {
      id: `${socket.id}-${Date.now()}`,
      sender: `Espectador`,
      text: text.slice(0, MAX_CHAT_LENGTH),
      timestamp: Date.now()
    };
    room.chat.push(msg);
    if (room.chat.length > 100) room.chat.shift();
    io.to(roomId).emit('chat:message', msg);
  });

  // ─── REACTIONS EVENTS ───────────────────────────────────

  socket.on('reaction:send', ({ emoji }: { emoji: string }) => {
    if (!checkRateLimit(socket.id, MAX_REACTIONS_PER_MINUTE)) return;

    const roomId = viewerToRoom.get(socket.id);
    if (!roomId) {
      // Host can also react
      for (const [rid] of rooms) {
        if (rooms.get(rid)?.hostId === socket.id) {
          io.to(rid).emit('reaction:receive', { emoji, from: 'Anfitrión' });
          return;
        }
      }
      return;
    }

    const room = rooms.get(roomId);
    if (!room) return;

    io.to(room.hostId).emit('reaction:receive', { emoji, from: 'Espectador' });
  });
});

// TURN credentials endpoint
fastify.get('/turn-credentials', async (request, reply) => {
  const secret = process.env.TURN_SECRET;
  if (!secret) {
    reply.status(503);
    return { error: 'TURN not configured' };
  }

  const ttl = 3600; // 1 hour
  const identifier = (request.query as { id?: string })?.id || crypto.randomUUID();
  const expiry = Math.floor(Date.now() / 1000) + ttl;
  const username = `${expiry}:${identifier}`;
  const password = crypto
    .createHmac('sha1', secret)
    .update(username)
    .digest('base64');

  return {
    ttl,
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:wachaut.billytech.es:3478',
        username,
        credential: password
      }
    ]
  };
});

// Health check endpoint
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    rooms: rooms.size,
    connections: io.engine.clientsCount
  };
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
