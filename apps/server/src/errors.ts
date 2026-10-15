/**
 * Error tracking: capture → fingerprint → group → admin panel.
 *
 * Sources: 'web' (browser beacon, public endpoint), 'server' (this process,
 * direct DB writes) and 'sfu' (HTTP report authenticated by a shared
 * secret). Repeated errors increment the group counter; a resolved group
 * that reappears is automatically reopened.
 *
 * Connection telemetry (host/viewer drops during broadcasts) lives in
 * connection_events and is written by index.ts — see recordDisconnect /
 * recordHostRecovery there.
 */

import { createHash } from 'node:crypto';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import geoip from 'geoip-country';
import { db } from './db.js';

const ERRORS_SECRET = process.env.ERRORS_SECRET || '';
const IP_HASH_SALT = process.env.ADMIN_JWT_SECRET || 'errors-salt';

/**
 * Pull the SFU's in-memory error ring into the central store. The SFU never
 * calls out — the signaling server collects (same pattern as the SFU health
 * probe). Unreachable SFU keeps its buffer for the next pass.
 */
export async function drainSfuErrors(baseUrl: string, secret: string): Promise<void> {
  if (!baseUrl || !secret) return;
  try {
    const res = await fetch(`${baseUrl}/internal/errors`, {
      headers: { 'x-errors-secret': secret },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return;
    const data = await res.json() as { errors?: { component: string; message: string; stack?: string; roomId?: string }[] };
    for (const e of data.errors || []) {
      const err = new Error(e.message);
      if (e.stack) err.stack = e.stack;
      captureError(err, { source: 'sfu', component: e.component, roomId: e.roomId });
    }
  } catch { /* non-critical */ }
}

// ── Rate limiting for the public beacon (in-memory, per IP) ──────────
const errorBeacons = new Map<string, { count: number; resetAt: number }>();
const MAX_ERROR_BEACONS_PER_MINUTE = 20;

function checkErrorRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = errorBeacons.get(ip);
  if (!entry || now > entry.resetAt) {
    errorBeacons.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= MAX_ERROR_BEACONS_PER_MINUTE) return false;
  entry.count++;
  return true;
}

/** Drop expired entries — called from the 5-minute sweeper in index.ts. */
export function cleanupErrorRateLimits(nowMs: number = Date.now()): void {
  for (const [ip, entry] of errorBeacons) {
    if (nowMs > entry.resetAt) errorBeacons.delete(ip);
  }
}

// ── Fingerprinting ───────────────────────────────────────────────────

/** Normalize a message so the same bug with different data shares a group. */
export function normalizeMessage(message: string): string {
  return message
    // UUIDs (full or truncated) and long hex runs first, so their digits
    // don't survive as separate numbers.
    .replace(/\b[0-9a-f]{4,}(?:-[0-9a-f]{3,})*\b/gi, '<id>')
    .replace(/\d+/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 200);
}

/** Keep the first stack frames, stripping volatile parts (query strings, columns). */
function normalizeStack(stack: string | undefined | null): string | null {
  if (!stack) return null;
  return stack
    .split('\n')
    .slice(0, 6)
    .map((line) => line.replace(/\?.*$/, '').replace(/:\d+:\d+/, ':line'))
    .join('\n')
    .slice(0, 4000) || null;
}

function fingerprintOf(source: string, component: string, message: string, stack: string | null): string {
  const firstFrame = stack ? stack.split('\n').find((l) => l.trim().startsWith('at ')) || '' : '';
  return createHash('sha256').update(`${source}|${component}|${message}|${firstFrame.trim()}`).digest('hex');
}

function hashIp(ip: string): string {
  return createHash('sha256').update(`${IP_HASH_SALT}:${ip}`).digest('hex').slice(0, 16);
}

// ── Server-side capture ──────────────────────────────────────────────

export interface CaptureContext {
  source?: 'web' | 'server' | 'sfu';
  component?: string;
  severity?: 'error' | 'warning';
  page?: string;
  roomId?: string;
  visitorId?: string;
  ip?: string;
  meta?: Record<string, unknown>;
}

/**
 * Fire-and-forget capture (pattern of logRoomEvent): group upsert + event
 * row. Never throws — error tracking must not take the app down with it.
 */
export function captureError(err: unknown, ctx: CaptureContext = {}): void {
  try {
    const source = ctx.source || 'server';
    const rawMessage = err instanceof Error ? err.message : String(err);
    const stack = (err instanceof Error ? err.stack : null) ?? null;
    internalRecord({
      source,
      component: (ctx.component || 'unknown').slice(0, 64),
      severity: ctx.severity || 'error',
      message: rawMessage,
      stack,
      page: ctx.page?.slice(0, 128),
      roomId: ctx.roomId?.slice(0, 64),
      visitorId: ctx.visitorId,
      ip: ctx.ip,
      meta: ctx.meta,
    });
  } catch { /* never break the app from the tracker itself */ }
}

function internalRecord(input: {
  source: string; component: string; severity: string; message: string;
  stack: string | null; page?: string; roomId?: string; visitorId?: string;
  ip?: string; meta?: Record<string, unknown>;
}): void {
  const normalized = normalizeMessage(input.message);
  const stack = normalizeStack(input.stack);
  const fingerprint = fingerprintOf(input.source, input.component, normalized, stack);

  const tx = db.transaction(() => {
    const existing = db.prepare('SELECT id, status FROM error_groups WHERE fingerprint = ?').get(fingerprint) as { id: number; status: string } | undefined;
    let groupId: number;
    if (existing) {
      groupId = existing.id;
      db.prepare(`
        UPDATE error_groups
        SET count = count + 1, last_seen = datetime('now'),
            status = CASE WHEN status = 'resolved' THEN 'open' ELSE status END,
            meta = ?
        WHERE id = ?
      `).run(JSON.stringify({ page: input.page, roomId: input.roomId, ...(input.meta || {}) }), groupId);
    } else {
      const info = db.prepare(`
        INSERT INTO error_groups (fingerprint, source, component, title, severity, count, sample_stack, meta)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).run(fingerprint, input.source, input.component, input.message.slice(0, 500), input.severity, stack, JSON.stringify({ page: input.page, roomId: input.roomId, ...(input.meta || {}) }));
      groupId = Number(info.lastInsertRowid);
    }
    const country = input.ip ? (() => { try { return geoip.lookup(input.ip)?.country || null; } catch { return null; } })() : null;
    db.prepare('INSERT INTO error_events (group_id, page, room_id, visitor_id, ip_hash, country, message) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(groupId, input.page || null, input.roomId || null, input.visitorId || null, input.ip ? hashIp(input.ip) : null, country, input.message.slice(0, 500));
  });
  tx();
}

// ── Retention (sweeper) ──────────────────────────────────────────────

export function purgeOldErrors(): void {
  db.prepare("DELETE FROM error_events WHERE ts < datetime('now', '-60 days')").run();
  db.prepare("DELETE FROM error_groups WHERE status = 'resolved' AND last_seen < datetime('now', '-30 days')").run();
  db.prepare('DELETE FROM error_groups WHERE id NOT IN (SELECT DISTINCT group_id FROM error_events)').run();
  db.prepare("DELETE FROM connection_events WHERE ts < datetime('now', '-90 days')").run();
}

// ── Public beacon route ──────────────────────────────────────────────

export function registerErrorRoutes(app: FastifyInstance): void {
  app.post('/api/errors', {
    schema: {
      body: {
        type: 'object',
        required: ['source', 'message'],
        properties: {
          source: { type: 'string', enum: ['web', 'server', 'sfu'] },
          message: { type: 'string', minLength: 1, maxLength: 500 },
          stack: { type: 'string', maxLength: 4000 },
          component: { type: 'string', maxLength: 64 },
          severity: { type: 'string', enum: ['error', 'warning'] },
          page: { type: 'string', maxLength: 128 },
          roomId: { type: 'string', maxLength: 64 },
          vid: { type: 'string', pattern: '^[a-zA-Z0-9-]{8,64}$' },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as {
      source: 'web' | 'server' | 'sfu'; message: string; stack?: string;
      component?: string; severity?: 'error' | 'warning'; page?: string;
      roomId?: string; vid?: string;
    };

    // Only browsers may report anonymously; server/sfu sources share a secret.
    if (body.source !== 'web') {
      if (!ERRORS_SECRET || req.headers['x-errors-secret'] !== ERRORS_SECRET) {
        return reply.code(403).send({ ok: false, error: 'Invalid secret' });
      }
    } else if (!checkErrorRateLimit(req.ip)) {
      return reply.code(429).send({ ok: false });
    }

    captureError(new ErrorWithStack(body.message, body.stack), {
      source: body.source,
      component: body.component,
      severity: body.severity,
      page: body.page,
      roomId: body.roomId,
      visitorId: body.vid,
      ip: req.ip,
    });
    return { ok: true };
  });
}

/** Small helper so the beacon path reuses the Error normalization above. */
class ErrorWithStack extends Error {
  constructor(message: string, stack?: string) {
    super(message);
    if (stack) this.stack = stack;
  }
}

// ── Process-level safety net (registered from index.ts) ──────────────

export function registerProcessErrorHandlers(): void {
  process.on('uncaughtException', (err) => {
    captureError(err, { source: 'server', component: 'process.uncaughtException' });
    // The process state is unknown after an uncaught exception — let the
    // container restart cleanly (the capture above is synchronous).
    console.error('[server] uncaughtException — exiting:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    captureError(reason, { source: 'server', component: 'process.unhandledRejection' });
    console.error('[server] unhandledRejection:', reason);
  });
}
