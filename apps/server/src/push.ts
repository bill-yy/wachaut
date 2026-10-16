/**
 * Web Push to the host ("👀 alguien se ha unido") when the tab is closed.
 *
 * VAPID keys come from the VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars when
 * present; otherwise a keypair is generated ONCE at first boot and persisted
 * under the data volume (data/push-keys.json) — never in source. Subscriptions
 * are per-room and in-memory: a room's subscriptions die with the room.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import webpush from 'web-push';

interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** roomId → subscriptions registered by the host's browsers. */
const roomSubs = new Map<string, PushSubscription[]>();
const MAX_SUBS_PER_ROOM = 5;

// Per-IP rate limit for the public routes (same pattern as feedback.ts).
const calls = new Map<string, { count: number; resetAt: number }>();
function rateOk(ip: string, max: number): boolean {
  const now = Date.now();
  const entry = calls.get(ip);
  if (!entry || now > entry.resetAt) {
    calls.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}
export function cleanupPushRateLimits(nowMs: number = Date.now()): void {
  for (const [ip, entry] of calls) {
    if (nowMs > entry.resetAt) calls.delete(ip);
  }
}

let vapid: { publicKey: string; privateKey: string } | null = null;
let vapidDetailsSet = false;

/** Env override first; otherwise generate once and persist under the data dir. */
export function initPush(dataDir: string): void {
  const envPub = process.env.VAPID_PUBLIC_KEY;
  const envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) {
    vapid = { publicKey: envPub, privateKey: envPriv };
    return;
  }
  const keyPath = join(dataDir, 'push-keys.json');
  try {
    if (existsSync(keyPath)) {
      const stored = JSON.parse(readFileSync(keyPath, 'utf-8'));
      if (stored.publicKey && stored.privateKey) {
        vapid = stored;
        return;
      }
    }
  } catch { /* regenerate below */ }
  const generated = webpush.generateVAPIDKeys();
  vapid = { publicKey: generated.publicKey, privateKey: generated.privateKey };
  try {
    mkdirSync(dirname(keyPath), { recursive: true });
    writeFileSync(keyPath, JSON.stringify(vapid), { mode: 0o600 });
  } catch { /* ephemeral keys still work until restart */ }
}

function ensureConfigured(): boolean {
  if (!vapid) return false;
  if (!vapidDetailsSet) {
    webpush.setVapidDetails('mailto:contacto@wachaut.com', vapid.publicKey, vapid.privateKey);
    vapidDetailsSet = true;
  }
  return true;
}

export function pushEnabled(): boolean {
  return vapid !== null;
}

export function dropRoomSubscriptions(roomId: string): void {
  roomSubs.delete(roomId);
}

/** Fire-and-forget notification to the room's host subscriptions. */
export async function notifyHostViewersJoined(roomId: string, viewerName: string): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = roomSubs.get(roomId);
  if (!subs || subs.length === 0) return;
  const payload = JSON.stringify({
    title: '👀 Wachaut',
    body: `${viewerName} · ${'se ha unido a tu sala'}`,
    url: `/room/${roomId}`,
  });
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload, { TTL: 30 });
      } catch (err: any) {
        // 404/410 = subscription expired or revoked → drop it silently.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          const list = roomSubs.get(roomId);
          if (list) roomSubs.set(roomId, list.filter((s) => s.endpoint !== sub.endpoint));
        }
      }
    })
  );
}

const ENDPOINT_RE = /^https:\/\/[^\s]+$/;

export function registerPushRoutes(app: FastifyInstance, roomExists: (roomId: string) => boolean): void {
  // The browser needs the public key to subscribe.
  app.get('/api/push/key', { logLevel: 'error' }, async (_req, reply) => {
    if (!pushEnabled()) return reply.code(503).send({ error: 'push disabled' });
    return { publicKey: vapid!.publicKey };
  });

  app.post('/api/push/subscribe', { logLevel: 'error' }, async (req, reply) => {
    if (!rateOk(req.ip, 20)) return reply.code(429).send({ error: 'too many requests' });
    if (!pushEnabled()) return reply.code(503).send({ error: 'push disabled' });
    const { roomId, subscription } = (req.body ?? {}) as { roomId?: string; subscription?: PushSubscription };
    if (typeof roomId !== 'string' || !roomExists(roomId)) {
      return reply.code(404).send({ error: 'room not found' });
    }
    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !ENDPOINT_RE.test(subscription.endpoint) ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return reply.code(400).send({ error: 'invalid subscription' });
    }
    const subs = roomSubs.get(roomId) ?? [];
    if (!subs.some((s) => s.endpoint === subscription.endpoint)) {
      subs.push(subscription);
      roomSubs.set(roomId, subs.slice(-MAX_SUBS_PER_ROOM));
    }
    return reply.code(204).send();
  });

  app.post('/api/push/unsubscribe', { logLevel: 'error' }, async (req, reply) => {
    if (!rateOk(req.ip, 20)) return reply.code(429).send({ error: 'too many requests' });
    const { roomId, endpoint } = (req.body ?? {}) as { roomId?: string; endpoint?: string };
    if (typeof roomId !== 'string' || typeof endpoint !== 'string') {
      return reply.code(400).send({ error: 'invalid request' });
    }
    const subs = roomSubs.get(roomId);
    if (subs) {
      roomSubs.set(roomId, subs.filter((s) => s.endpoint !== endpoint));
    }
    return reply.code(204).send();
  });
}
