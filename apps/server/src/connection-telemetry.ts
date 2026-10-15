/**
 * Connection telemetry: every host/viewer disconnect during a broadcast is
 * recorded with its cause. Host drops are marked recovered when the host
 * reclaims the room within the grace window. Written by index.ts from the
 * Socket.IO disconnect events — extracted here so it is unit-testable.
 */

import { db } from './db.js';

/** Map a Socket.IO disconnect reason to a human-meaningful cause. */
export function mapDisconnectReason(reason: string): 'network' | 'clean' | 'server' {
  if (reason === 'ping timeout' || reason === 'transport error' || reason === 'transport close') return 'network';
  if (reason === 'client namespace disconnect' || reason === 'client disconnect') return 'clean';
  if (reason === 'server namespace disconnect' || reason === 'server shutting down') return 'server';
  return 'network';
}

/** Pending host drops: roomId → {eventId, ts} — resolved when the host reclaims. */
const pendingHostDrops = new Map<string, { eventId: number; ts: number }>();

export function recordDisconnect(opts: {
  roomId: string; role: 'host' | 'viewer'; reason: string;
  durationMs: number; viewersAffected?: number;
}): void {
  try {
    const info = db.prepare(`
      INSERT INTO connection_events (room_id, role, cause, detail, duration_ms, recovered, viewers_affected)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(opts.roomId, opts.role, mapDisconnectReason(opts.reason), opts.reason, Math.round(opts.durationMs), opts.viewersAffected ?? null);
    if (opts.role === 'host') {
      pendingHostDrops.set(opts.roomId, { eventId: Number(info.lastInsertRowid), ts: Date.now() });
    }
  } catch { /* telemetry must never break signaling */ }
}

/** Host came back (reclaim) — mark their recent drop as recovered. */
export function recordHostRecovery(roomId: string): void {
  const drop = pendingHostDrops.get(roomId);
  if (!drop) return;
  pendingHostDrops.delete(roomId);
  try {
    db.prepare('UPDATE connection_events SET recovered = 1, recovery_ms = ? WHERE id = ?')
      .run(Date.now() - drop.ts, drop.eventId);
  } catch { /* non-critical */ }
}

/** Forget a pending host drop (room closed/reaped intentionally — nothing to recover). */
export function clearPendingHostDrop(roomId: string): void {
  pendingHostDrops.delete(roomId);
}
