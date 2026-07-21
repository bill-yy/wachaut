/**
 * Room store types and pure helpers for the signaling server.
 *
 * Extracted from index.ts so the GC / TTL logic can be unit-tested without
 * booting Fastify + Socket.IO + SQLite. The in-memory state (rooms, reverse
 * maps) still lives in index.ts; this module only exports the pure operations
 * on that state.
 */

export interface ViewerInfo {
  socketId: string;
  name: string;
  joinedAt: number;
  connected: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface Room {
  id: string;
  pin: string;
  hostId: string;
  viewers: Map<string, ViewerInfo>;
  createdAt: Date;
  /** Timestamp of the last meaningful activity in the room. Drives the idle TTL. */
  lastActivityAt: Date;
  isSharing: boolean;
  chat: ChatMessage[];
  isMuted: boolean;
  /** Grace timer started when the host disconnects; cleared if they reclaim. */
  hostDisconnectTimer?: ReturnType<typeof setTimeout>;
}

/** Reverse maps that the GC must keep in sync when reaping a room. */
export interface RoomMaps {
  rooms: Map<string, Room>;
  viewerToRoom: Map<string, string>;
  hostToRoom: Map<string, string>;
}

/**
 * Pure garbage-collector for expired rooms. A room is reaped only if it has
 * had NO activity (no joins, no chat, no reactions) for longer than
 * `idleTtlMs`. Active rooms (host sharing, viewers chatting) never expire
 * because their lastActivityAt keeps moving forward.
 *
 * Keeps the reverse maps in sync. Returns the list of reaped roomIds.
 *
 * Default idleTtlMs mirrors ROOM_IDLE_TTL_MS in index.ts (4h).
 */
export function gcExpiredRooms(
  maps: RoomMaps,
  now: Date,
  idleTtlMs: number = 4 * 60 * 60 * 1000
): string[] {
  const reaped: string[] = [];
  const nowMs = now.getTime();
  for (const [roomId, room] of maps.rooms) {
    if (nowMs - room.lastActivityAt.getTime() > idleTtlMs) {
      reaped.push(roomId);
      maps.rooms.delete(roomId);
      maps.hostToRoom.delete(room.hostId);
      for (const [viewerId] of room.viewers) {
        maps.viewerToRoom.delete(viewerId);
      }
      if (room.hostDisconnectTimer) {
        clearTimeout(room.hostDisconnectTimer);
        room.hostDisconnectTimer = undefined;
      }
    }
  }
  return reaped;
}

/** Factory: build an empty Room with consistent createdAt/lastActivityAt. */
export function createRoom(
  id: string,
  pinHashed: string,
  hostId: string,
  now: Date = new Date()
): Room {
  return {
    id,
    pin: pinHashed,
    hostId,
    viewers: new Map(),
    createdAt: now,
    lastActivityAt: now,
    isSharing: false,
    chat: [],
    isMuted: false,
  };
}

/** Mark a room as having had activity right now (or at `when`). */
export function touchRoom(room: Room, when: Date = new Date()): void {
  room.lastActivityAt = when;
}

/**
 * Remove a viewer from a room and the reverse map. Returns the ViewerInfo
 * that was removed (or undefined if the viewer wasn't in the room), so the
 * caller can still emit `viewer:left` with the username.
 *
 * This is the hard-delete counterpart to the old "set connected=false"
 * behaviour. Hard-deleting on disconnect keeps room.viewers.size accurate,
 * prevents zombie entries from blocking MAX_VIEWERS_PER_ROOM, and stops the
 * host's viewer panel from filling with disconnected ghosts.
 */
export function removeViewer(
  maps: RoomMaps,
  roomId: string,
  viewerSocketId: string
): ViewerInfo | undefined {
  const room = maps.rooms.get(roomId);
  if (!room) return undefined;
  const viewer = room.viewers.get(viewerSocketId);
  if (!viewer) return undefined;
  room.viewers.delete(viewerSocketId);
  maps.viewerToRoom.delete(viewerSocketId);
  return viewer;
}
