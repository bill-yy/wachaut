import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';

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
}

const rooms = new Map<string, Room>(); // roomId -> Room
const pinToRoom = new Map<string, string>(); // pin -> roomId
const viewerToRoom = new Map<string, string>(); // socketId -> roomId

// Cleanup expired rooms every 5 minutes
setInterval(() => {
  const now = new Date();
  const twoHours = 2 * 60 * 60 * 1000;
  
  for (const [roomId, room] of rooms) {
    if (now.getTime() - room.createdAt.getTime() > twoHours) {
      // Notify and cleanup
      rooms.delete(roomId);
      pinToRoom.delete(room.pin);
      for (const viewerId of room.viewers) {
        viewerToRoom.delete(viewerId);
      }
    }
  }
}, 5 * 60 * 1000);

// Socket.IO setup
const io = new Server(fastify.server, {
  cors: {
    origin: ['https://wachaut.billytech.es', 'https://api-wachaut.billytech.es'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  fastify.log.info(`Client connected: ${socket.id}`);

  // Host creates a room
  socket.on('host:create-room', ({ roomId, pin }: { roomId: string; pin: string }) => {
    const room: Room = {
      id: roomId,
      pin,
      hostId: socket.id,
      viewers: new Set(),
      createdAt: new Date(),
      isSharing: false
    };
    
    rooms.set(roomId, room);
    pinToRoom.set(pin, roomId);
    socket.join(roomId);
    
    fastify.log.info(`Room created: ${roomId} with PIN ${pin}`);
  });

  // Viewer joins a room (with roomId and PIN authentication)
  socket.on('viewer:join', ({ roomId, pin }: { roomId: string; pin: string }) => {
    // First, validate the room exists
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('room:error', { message: 'No se ha encontrado la sala. Comprueba el enlace.' });
      return;
    }
    
    // Then validate the PIN
    if (room.pin !== pin) {
      socket.emit('room:auth-failed', { message: 'PIN incorrecto. Comprueba que lo hayas escrito bien.' });
      return;
    }
    
    // PIN is correct, authenticate
    socket.emit('room:auth-success');
    
    // Limit viewers to 5
    if (room.viewers.size >= 5) {
      socket.emit('room:error', { message: 'La sala está llena. Espera a que alguien salga.' });
      return;
    }

    room.viewers.add(socket.id);
    viewerToRoom.set(socket.id, roomId);
    socket.join(roomId);
    
    socket.emit('room:joined', { roomId });
    
    // Notify host
    socket.to(room.hostId).emit('viewer:joined', { viewerId: socket.id });
    
    fastify.log.info(`Viewer ${socket.id} joined room ${roomId}`);
  });

  // Host signals to viewer
  socket.on('host:signal', ({ viewerId, signal }: { viewerId: string; signal: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
    socket.to(viewerId).emit('host:signal', { signal });
  });

  // Viewer signals to host
  socket.on('viewer:signal', ({ signal }: { signal: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
    const roomId = viewerToRoom.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    socket.to(room.hostId).emit('viewer:signal', { viewerId: socket.id, signal });
  });

  // Host stops sharing
  socket.on('host:stop-sharing', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.isSharing = false;
      socket.to(roomId).emit('host:stopped-sharing');
    }
  });

  // Host closes room
  socket.on('host:close-room', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.to(roomId).emit('room:closed');
      
      // Cleanup
      rooms.delete(roomId);
      pinToRoom.delete(room.pin);
      for (const viewerId of room.viewers) {
        viewerToRoom.delete(viewerId);
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    fastify.log.info(`Client disconnected: ${socket.id}`);
    
    // Check if host
    for (const [roomId, room] of rooms) {
      if (room.hostId === socket.id) {
        socket.to(roomId).emit('host:disconnected');
        // Don't delete room immediately, allow reconnection
        setTimeout(() => {
          const currentRoom = rooms.get(roomId);
          if (currentRoom && currentRoom.hostId === socket.id) {
            // Host didn't reconnect, close room
            socket.to(roomId).emit('room:closed');
            rooms.delete(roomId);
            pinToRoom.delete(room.pin);
            for (const viewerId of currentRoom.viewers) {
              viewerToRoom.delete(viewerId);
            }
          }
        }, 60000); // 1 minute grace period
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
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', rooms: rooms.size };
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
