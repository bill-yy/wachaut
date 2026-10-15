/**
 * Anonymous traffic analytics: public tracking endpoint + status endpoint +
 * the aggregation query used by the admin panel.
 *
 * Privacy model: no accounts, no third-party cookies, no fingerprints — the
 * client generates a random visitor id (localStorage) and session id
 * (sessionStorage). The raw IP is never stored: we keep the geoip country
 * and a salted, truncated SHA-256 hash for abuse debugging. Raw pageviews
 * are pruned after PAGEVIEW_RETENTION_DAYS.
 */

import { createHash } from 'node:crypto';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import geoip from 'geoip-country';
import { db } from './db.js';

const IP_HASH_SALT = process.env.ADMIN_JWT_SECRET || 'analytics-salt';
export const PAGEVIEW_RETENTION_DAYS = 120;

// ── Rate limiting for /api/track (in-memory, per IP) ─────────────────
const trackCalls = new Map<string, { count: number; resetAt: number }>();
const MAX_TRACK_PER_MINUTE = 60;

function checkTrackRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = trackCalls.get(ip);
  if (!entry || now > entry.resetAt) {
    trackCalls.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= MAX_TRACK_PER_MINUTE) return false;
  entry.count++;
  return true;
}

/** Drop expired entries — called from the 5-minute sweeper in index.ts. */
export function cleanupTrackRateLimits(nowMs: number = Date.now()): void {
  for (const [ip, entry] of trackCalls) {
    if (nowMs > entry.resetAt) trackCalls.delete(ip);
  }
}

/** Prune raw pageviews older than the retention window (sweeper). */
export function purgeOldPageviews(): void {
  db.prepare(
    "DELETE FROM pageviews WHERE ts < datetime('now', ?)"
  ).run(`-${PAGEVIEW_RETENTION_DAYS} days`);
}

// ── Helpers ──────────────────────────────────────────────────────────

function lookupCountry(ip: string): string {
  try {
    return geoip.lookup(ip)?.country || '??';
  } catch {
    return '??';
  }
}

function hashIp(ip: string): string {
  return createHash('sha256').update(`${IP_HASH_SALT}:${ip}`).digest('hex').slice(0, 16);
}

/** Normalize a path: strip query/hash, cap length, default to '/'. */
export function normalizePath(raw: string): string {
  let p = String(raw).split(/[?#]/, 1)[0] || '/';
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 128) p = p.slice(0, 128);
  return p;
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').slice(0, 64) || null;
  } catch {
    return null;
  }
}

// Same-page referrer heuristic: internal navigations keep no referrer.
function isInternalReferrer(referrer: string | undefined): boolean {
  if (!referrer) return false;
  const host = safeHost(referrer);
  return !!host && (host === 'wachaut.com' || host.endsWith('.wachaut.com') || host === 'wachaut.billytech.es' || host.endsWith('.billytech.es'));
}

// ── Public routes ────────────────────────────────────────────────────

export interface TrackBody {
  path?: string;
  referrer?: string;
  vid?: string;
  sid?: string;
  lang?: string;
  device?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

/**
 * Called from index.ts. `isMaintenance` is injected so the module stays
 * decoupled from the admin routes.
 */
export function registerAnalyticsRoutes(app: FastifyInstance, isMaintenance: () => boolean, roomsCount: () => number): void {
  app.post('/api/track', {
    schema: {
      body: {
        type: 'object',
        required: ['path', 'vid', 'sid'],
        properties: {
          path: { type: 'string', minLength: 1, maxLength: 256 },
          referrer: { type: 'string', maxLength: 512 },
          vid: { type: 'string', pattern: '^[a-zA-Z0-9-]{8,64}$' },
          sid: { type: 'string', pattern: '^[a-zA-Z0-9-]{8,64}$' },
          lang: { type: 'string', maxLength: 12 },
          device: { type: 'string', enum: ['mobile', 'tablet', 'desktop'] },
          utm: {
            type: 'object',
            properties: {
              source: { type: 'string', maxLength: 64 },
              medium: { type: 'string', maxLength: 64 },
              campaign: { type: 'string', maxLength: 128 },
              term: { type: 'string', maxLength: 128 },
              content: { type: 'string', maxLength: 128 },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const ip = req.ip;
    if (!checkTrackRateLimit(ip)) {
      return reply.code(429).send({ ok: false });
    }

    const body = req.body as TrackBody;
    const utm = body.utm || {};
    // External referrers only — internal SPA navigations are not "traffic source".
    const externalReferrer = body.referrer && !isInternalReferrer(body.referrer) ? body.referrer.slice(0, 256) : null;

    try {
      db.prepare(`
        INSERT INTO pageviews
          (visitor_id, session_id, path, referrer, referrer_host,
           utm_source, utm_medium, utm_campaign, utm_term, utm_content,
           country, device, lang, ip_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.vid, body.sid, normalizePath(body.path || '/'), externalReferrer, externalReferrer ? safeHost(externalReferrer) : null,
        utm.source || null, utm.medium || null, utm.campaign || null, utm.term || null, utm.content || null,
        lookupCountry(ip), body.device || null, (body.lang || '').slice(0, 12) || null, hashIp(ip)
      );
    } catch { /* analytics must never break the site */ }

    // The response rides along so the client learns about maintenance with
    // zero extra requests (the pageview fires on every page load).
    return { ok: true, maintenance: isMaintenance() };
  });

  app.get('/api/status', { logLevel: 'error' }, async () => {
    return { status: 'ok', maintenance: isMaintenance(), rooms: roomsCount() };
  });
}

// ── Aggregation for the admin panel ──────────────────────────────────

function utcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  return utcDate(new Date(Date.now() - n * 86_400_000));
}

function pctDelta(today: number, yesterday: number): number | null {
  if (yesterday === 0) return today > 0 ? 100 : null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

/**
 * Full analytics payload for the admin panel. Aggregates pageviews and
 * room_events live (indexed, ≤120 days of raw data — cheap at this scale).
 */
export function queryAnalytics(days: number): any {
  const since = daysAgo(days - 1);
  const today = utcDate(new Date());
  const yesterday = daysAgo(1);

  // Per-day series (oldest → newest, gaps filled with zeros).
  const pvRows = db.prepare(`
    SELECT date(ts) as d,
           COUNT(DISTINCT visitor_id) as visitors,
           COUNT(DISTINCT session_id) as sessions,
           COUNT(*) as pageviews
    FROM pageviews WHERE date(ts) >= ? GROUP BY d
  `).all(since) as { d: string; visitors: number; sessions: number; pageviews: number }[];

  const roomRows = db.prepare(`
    SELECT date(timestamp) as d,
           SUM(CASE WHEN event_type = 'created' THEN 1 ELSE 0 END) as rooms,
           SUM(CASE WHEN event_type = 'viewer_joined' THEN 1 ELSE 0 END) as viewers
    FROM room_events WHERE date(timestamp) >= ? GROUP BY d
  `).all(since) as { d: string; rooms: number; viewers: number }[];

  const byDay = new Map<string, any>();
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    byDay.set(d, { date: d, visitors: 0, sessions: 0, pageviews: 0, rooms: 0, viewers: 0 });
  }
  for (const r of pvRows) {
    const row = byDay.get(r.d);
    if (row) { row.visitors = r.visitors; row.sessions = r.sessions; row.pageviews = r.pageviews; }
  }
  for (const r of roomRows) {
    const row = byDay.get(r.d);
    if (row) { row.rooms = r.rooms || 0; row.viewers = r.viewers || 0; }
  }
  const series = Array.from(byDay.values());

  // Today vs yesterday KPIs.
  const dayStats = (d: string) => {
    const pv = db.prepare(`
      SELECT COUNT(DISTINCT visitor_id) as v, COUNT(DISTINCT session_id) as s, COUNT(*) as p
      FROM pageviews WHERE date(ts) = ?
    `).get(d) as { v: number; s: number; p: number };
    const re = db.prepare(`
      SELECT
        SUM(CASE WHEN event_type = 'created' THEN 1 ELSE 0 END) as r,
        SUM(CASE WHEN event_type = 'viewer_joined' THEN 1 ELSE 0 END) as w
      FROM room_events WHERE date(timestamp) = ?
    `).get(d) as { r: number | null; w: number | null };
    return { visitors: pv.v, sessions: pv.s, pageviews: pv.p, rooms: re.r || 0, viewers: re.w || 0 };
  };
  const t = dayStats(today);
  const y = dayStats(yesterday);

  const referrers = db.prepare(`
    SELECT COALESCE(referrer_host, 'directo') as host,
           COUNT(DISTINCT session_id) as sessions, COUNT(DISTINCT visitor_id) as visitors
    FROM pageviews WHERE date(ts) >= ? AND referrer_host IS NOT NULL
    GROUP BY referrer_host ORDER BY sessions DESC LIMIT 10
  `).all(since);

  const directo = db.prepare(`
    SELECT COUNT(DISTINCT session_id) as s FROM pageviews
    WHERE date(ts) >= ? AND referrer_host IS NULL
  `).get(since) as { s: number };
  if (directo.s > 0) {
    referrers.push({ host: 'directo', sessions: directo.s, visitors: directo.s });
  }

  const pages = db.prepare(`
    SELECT path, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors
    FROM pageviews WHERE date(ts) >= ? GROUP BY path ORDER BY views DESC LIMIT 10
  `).all(since);

  const campaigns = db.prepare(`
    SELECT utm_source as source, utm_medium as medium, utm_campaign as campaign,
           COUNT(DISTINCT session_id) as sessions, COUNT(DISTINCT visitor_id) as visitors
    FROM pageviews WHERE date(ts) >= ? AND utm_source IS NOT NULL
    GROUP BY utm_source, utm_medium, utm_campaign ORDER BY sessions DESC LIMIT 10
  `).all(since);

  const countries = db.prepare(`
    SELECT country, COUNT(DISTINCT visitor_id) as visitors
    FROM pageviews WHERE date(ts) >= ? AND country IS NOT NULL AND country != '??'
    GROUP BY country ORDER BY visitors DESC LIMIT 10
  `).all(since);

  const devices = db.prepare(`
    SELECT COALESCE(device, 'desconocido') as device, COUNT(DISTINCT session_id) as sessions
    FROM pageviews WHERE date(ts) >= ? GROUP BY device ORDER BY sessions DESC
  `).all(since);

  return {
    today: {
      visitors: t.visitors, sessions: t.sessions, pageviews: t.pageviews, rooms: t.rooms, viewers: t.viewers,
      delta: {
        visitors: pctDelta(t.visitors, y.visitors),
        sessions: pctDelta(t.sessions, y.sessions),
        pageviews: pctDelta(t.pageviews, y.pageviews),
        rooms: pctDelta(t.rooms, y.rooms),
        viewers: pctDelta(t.viewers, y.viewers),
      },
    },
    series,
    referrers,
    pages,
    campaigns,
    countries,
    devices,
  };
}
