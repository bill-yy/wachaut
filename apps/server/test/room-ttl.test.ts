import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gcExpiredRooms,
  createRoom,
  touchRoom,
  removeViewer,
  type RoomMaps,
} from '../src/room-store.ts';

function makeMaps(): RoomMaps {
  return {
    rooms: new Map(),
    viewerToRoom: new Map(),
    hostToRoom: new Map(),
  };
}

test('gcExpiredRooms: active room (recent activity) is NOT reaped even after 2h+ wall clock', () => {
  const maps = makeMaps();
  // Room created 3 hours ago but with activity 5 minutes ago.
  const created = new Date('2025-01-01T00:00:00Z');
  const lastActivity = new Date('2025-01-01T02:55:00Z');
  const now = new Date('2025-01-01T03:00:00Z');
  const room = createRoom('room-1', 'hashed', 'host-1', created);
  room.lastActivityAt = lastActivity;
  // Add a viewer so the reverse map has something to clean up if reaped.
  room.viewers.set('viewer-A', { socketId: 'viewer-A', name: 'A', joinedAt: 0, connected: true });
  maps.rooms.set('room-1', room);
  maps.hostToRoom.set('host-1', 'room-1');
  maps.viewerToRoom.set('viewer-A', 'room-1');

  const reaped = gcExpiredRooms(maps, now, 4 * 60 * 60 * 1000);

  assert.deepEqual(reaped, []);
  assert.ok(maps.rooms.has('room-1'), 'active room must survive');
  assert.ok(maps.hostToRoom.has('host-1'));
  assert.ok(maps.viewerToRoom.has('viewer-A'));
});

test('gcExpiredRooms: abandoned room (no activity for > TTL) IS reaped and reverse maps cleaned', () => {
  const maps = makeMaps();
  const created = new Date('2025-01-01T00:00:00Z');
  const now = new Date('2025-01-01T05:00:00Z'); // 5h later
  const room = createRoom('room-abandoned', 'hashed', 'host-X', created);
  // lastActivityAt = createdAt (no activity at all)
  room.viewers.set('v1', { socketId: 'v1', name: 'v1', joinedAt: 0, connected: false });
  maps.rooms.set('room-abandoned', room);
  maps.hostToRoom.set('host-X', 'room-abandoned');
  maps.viewerToRoom.set('v1', 'room-abandoned');

  const reaped = gcExpiredRooms(maps, now, 4 * 60 * 60 * 1000);

  assert.deepEqual(reaped, ['room-abandoned']);
  assert.equal(maps.rooms.size, 0);
  assert.equal(maps.hostToRoom.size, 0);
  assert.equal(maps.viewerToRoom.size, 0);
});

test('gcExpiredRooms: only abandoned rooms are reaped, active ones survive in the same pass', () => {
  const maps = makeMaps();
  const now = new Date('2025-01-01T10:00:00Z');
  // Room A: created 5h ago, last activity 5h ago -> reap
  const a = createRoom('A', 'h', 'hostA', new Date('2025-01-01T05:00:00Z'));
  maps.rooms.set('A', a);
  maps.hostToRoom.set('hostA', 'A');
  // Room B: created 5h ago, but touch'd 1min ago -> keep
  const b = createRoom('B', 'h', 'hostB', new Date('2025-01-01T05:00:00Z'));
  touchRoom(b, new Date('2025-01-01T09:59:00Z'));
  maps.rooms.set('B', b);
  maps.hostToRoom.set('hostB', 'B');

  const reaped = gcExpiredRooms(maps, now, 4 * 60 * 60 * 1000);

  assert.deepEqual(reaped, ['A']);
  assert.ok(maps.rooms.has('B'));
  assert.ok(!maps.rooms.has('A'));
});

test('touchRoom updates lastActivityAt to "now" by default', () => {
  const old = new Date('2025-01-01T00:00:00Z');
  const room = createRoom('r', 'h', 'host', old);
  const before = Date.now();
  touchRoom(room);
  const after = Date.now();
  const ts = room.lastActivityAt.getTime();
  assert.ok(ts >= before && ts <= after, 'touchRoom should set lastActivityAt to current time');
});

test('Bug 1 regression: a long World Cup broadcast (~2h+) never gets reaped while active', () => {
  // This is the original bug: a hard-coded 2h TTL from createdAt killed
  // active rooms mid-broadcast. Verify the new logic doesn't.
  const maps = makeMaps();
  const kickoff = new Date('2025-01-01T20:00:00Z');
  const room = createRoom('world-cup', 'h', 'host', kickoff);

  // Simulate 130 minutes of activity (90 game + 15 half + 25 extra).
  const minute = 60 * 1000;
  const activityTimes = [
    kickoff,                          // 0' kickoff
    new Date(kickoff.getTime() + 45 * minute),  // half-time chat
    new Date(kickoff.getTime() + 60 * minute),  // 2nd half start
    new Date(kickoff.getTime() + 90 * minute),  // full time
    new Date(kickoff.getTime() + 105 * minute), // extra time start
    new Date(kickoff.getTime() + 120 * minute), // late goal reaction
  ];
  maps.rooms.set('world-cup', room);
  maps.hostToRoom.set('host', 'world-cup');

  for (const t of activityTimes) touchRoom(room, t);

  // 130 minutes in — game over. With the OLD logic (2h TTL from createdAt),
  // this room would be reaped at the 120-minute mark. The new logic measures
  // from lastActivityAt, so the room is alive 10 min after the last reaction.
  const tenMinutesAfterLastReaction = new Date(kickoff.getTime() + 130 * minute);
  const reaped = gcExpiredRooms(maps, tenMinutesAfterLastReaction, 4 * 60 * 60 * 1000);
  assert.deepEqual(reaped, []);
  assert.ok(maps.rooms.has('world-cup'));
});

test('hostDisconnectTimer is cleared when a room is reaped (no dangling timer)', () => {
  const maps = makeMaps();
  const created = new Date('2025-01-01T00:00:00Z');
  const now = new Date('2025-01-01T10:00:00Z');
  const room = createRoom('r', 'h', 'host', created);
  let fired = false;
  room.hostDisconnectTimer = setTimeout(() => { fired = true; }, 1000);
  maps.rooms.set('r', room);
  maps.hostToRoom.set('host', 'r');

  gcExpiredRooms(maps, now, 4 * 60 * 60 * 1000);

  // Give the cleared timer a chance to (not) fire.
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      assert.equal(fired, false, 'hostDisconnectTimer must have been cleared');
      resolve();
    }, 1500);
  });
});

// ─── removeViewer / zombie-entry regression ─────────────────────────────
// Bug: previously the disconnect handler only set `viewer.connected = false`,
// leaving the entry in room.viewers and viewerToRoom. That inflated
// room.viewers.size, blocked MAX_VIEWERS_PER_ROOM with ghosts, and filled
// the host's viewers panel with disconnected entries.

test('removeViewer: hard-deletes the viewer from room.viewers and viewerToRoom', () => {
  const maps = makeMaps();
  const room = createRoom('r', 'h', 'host');
  room.viewers.set('sock-1', { socketId: 'sock-1', name: 'alice', joinedAt: 0, connected: true });
  maps.rooms.set('r', room);
  maps.viewerToRoom.set('sock-1', 'r');

  const removed = removeViewer(maps, 'r', 'sock-1');

  assert.ok(removed, 'must return the removed ViewerInfo so caller can emit viewer:left');
  assert.equal(removed!.name, 'alice');
  assert.equal(room.viewers.size, 0, 'room.viewers must be empty after removal');
  assert.ok(!maps.viewerToRoom.has('sock-1'), 'viewerToRoom reverse map must be cleaned');
});

test('removeViewer: returns undefined for unknown viewer (no-op)', () => {
  const maps = makeMaps();
  const room = createRoom('r', 'h', 'host');
  maps.rooms.set('r', room);

  const removed = removeViewer(maps, 'r', 'not-there');

  assert.equal(removed, undefined);
  assert.equal(room.viewers.size, 0);
});

test('removeViewer: returns undefined for unknown room (no-op)', () => {
  const maps = makeMaps();
  const removed = removeViewer(maps, 'no-such-room', 'sock-1');
  assert.equal(removed, undefined);
});

test('Bug viewer-zombies regression: N joins + N disconnects leaves size = 0', () => {
  // This is the original bug: each reconnect left a zombie entry, so a
  // viewer with 5 reconnects inflated room.viewers.size from 1 to 5+.
  // Verify the new hard-delete keeps size in sync with reality.
  const maps = makeMaps();
  const room = createRoom('r', 'h', 'host');
  maps.rooms.set('r', room);

  // Simulate 5 reconnect cycles of the same viewer: each cycle is a new
  // socket.id (join) followed by the old socket.id being disconnected.
  for (let i = 0; i < 5; i++) {
    const sockId = `sock-${i}`;
    room.viewers.set(sockId, { socketId: sockId, name: `alice`, joinedAt: i, connected: true });
    maps.viewerToRoom.set(sockId, 'r');
    // Previous cycle's socket disconnects before the new one joins — but
    // even if they overlap, removeViewer must keep size accurate.
    if (i > 0) {
      const prev = `sock-${i - 1}`;
      removeViewer(maps, 'r', prev);
    }
  }
  // Final cleanup of the last socket.
  removeViewer(maps, 'r', 'sock-4');

  assert.equal(room.viewers.size, 0, 'no zombie entries should remain after all disconnects');
  assert.equal(maps.viewerToRoom.size, 0, 'reverse map must be empty too');
});

test('Bug MAX_VIEWERS_PER_ROOM: with zombie entries gone, capacity is accurate', () => {
  const maps = makeMaps();
  const room = createRoom('r', 'h', 'host');
  maps.rooms.set('r', room);
  const MAX = 20;

  // Fill the room with 20 viewers, then have 18 of them leave. The room
  // must NOT report "full" because zombies are gone.
  for (let i = 0; i < MAX; i++) {
    const sockId = `sock-${i}`;
    room.viewers.set(sockId, { socketId: sockId, name: `v${i}`, joinedAt: 0, connected: true });
    maps.viewerToRoom.set(sockId, 'r');
  }
  for (let i = 0; i < 18; i++) {
    removeViewer(maps, 'r', `sock-${i}`);
  }

  // Now only 2 viewers are actually connected.
  assert.equal(room.viewers.size, 2);
  // A new viewer should be allowed in (size < MAX), which the old code
  // would have rejected because size was still 20.
  assert.ok(room.viewers.size < MAX, 'must have headroom for new viewers');
});
