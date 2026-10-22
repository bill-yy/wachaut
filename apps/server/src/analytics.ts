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

/** Salted, truncated IP hash — shared by every table that stores IP-derived ids. */
export function hashIp(ip: string): string {
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

export interface AnalyticsFilters {
  path?: string;
  lang?: string;
  device?: string;
  country?: string;
  /** referrer_host, or the special value 'directo' for no-referrer traffic. */
  referrer?: string;
  campaign?: string;
}

export interface AnalyticsQuery {
  /** Inclusive YYYY-MM-DD. */
  from: string;
  /** Inclusive YYYY-MM-DD (≤ today). */
  to: string;
  /** Hourly buckets for ranges ≤ 48h, daily otherwise. */
  granularity: 'hour' | 'day';
  /** Ranking rows returned per dimension. */
  limit: number;
  filters: AnalyticsFilters;
}

export class AnalyticsQueryError extends Error {}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 90;

/**
 * Validate and normalize raw query params into an AnalyticsQuery. Accepts
 * either `days` (1..90) or an explicit `from`/`to` pair. Throws
 * AnalyticsQueryError on anything malformed (route maps it to a 400).
 */
export function parseAnalyticsQuery(raw: Record<string, unknown>): AnalyticsQuery {
  const num = (v: unknown, min: number, max: number, fallback: number): number => {
    const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : NaN;
    if (Number.isNaN(n)) return fallback;
    if (n < min || n > max) throw new AnalyticsQueryError(`out of range: ${n}`);
    return Math.floor(n);
  };
  const str = (v: unknown, maxLen = 128): string => {
    if (typeof v !== 'string' || v.length === 0 || v.length > maxLen) {
      throw new AnalyticsQueryError('invalid filter value');
    }
    return v;
  };

  let from: string;
  let to = utcDate(new Date());
  if (raw.from !== undefined || raw.to !== undefined) {
    from = str(raw.from, 10);
    const requestedTo = raw.to !== undefined ? str(raw.to, 10) : to;
    if (!DATE_RE.test(from) || !DATE_RE.test(requestedTo) || from > requestedTo) {
      throw new AnalyticsQueryError('invalid from/to');
    }
    to = requestedTo > to ? to : requestedTo;
    const spanDays = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
    if (spanDays + 1 > MAX_RANGE_DAYS) throw new AnalyticsQueryError('range too wide');
  } else {
    const days = num(raw.days, 1, MAX_RANGE_DAYS, 7);
    from = daysAgo(days - 1);
  }

  const filters: AnalyticsFilters = {};
  if (raw.path !== undefined) filters.path = str(raw.path);
  if (raw.lang !== undefined) filters.lang = str(raw.lang, 12);
  if (raw.device !== undefined) filters.device = str(raw.device, 16);
  if (raw.country !== undefined) filters.country = str(raw.country, 8);
  if (raw.referrer !== undefined) filters.referrer = str(raw.referrer);
  if (raw.campaign !== undefined) filters.campaign = str(raw.campaign);

  const spanHours = (Date.parse(`${to}T23:59`) - Date.parse(`${from}T00:00`)) / 3_600_000;
  return {
    from,
    to,
    granularity: spanHours <= 48 ? 'hour' : 'day',
    limit: num(raw.limit, 1, 100, 10),
    filters,
  };
}

/** Shared WHERE fragment (bound params only) for pageview aggregations. */
function pageviewWhere(q: AnalyticsQuery, params: unknown[]): string {
  const f = q.filters;
  const parts = ['ts >= ?', "ts < date(?, '+1 day')"];
  params.push(q.from, q.to);
  if (f.path !== undefined) { parts.push('path = ?'); params.push(f.path); }
  if (f.lang !== undefined) { parts.push('lang = ?'); params.push(f.lang); }
  if (f.device !== undefined) { parts.push('device = ?'); params.push(f.device); }
  if (f.country !== undefined) { parts.push('country = ?'); params.push(f.country); }
  if (f.referrer !== undefined) {
    if (f.referrer === 'directo') parts.push('referrer_host IS NULL');
    else { parts.push('referrer_host = ?'); params.push(f.referrer); }
  }
  if (f.campaign !== undefined) { parts.push('utm_campaign = ?'); params.push(f.campaign); }
  return parts.join(' AND ');
}

/** room_events range fragment (timestamp column). */
function roomEventWhere(q: AnalyticsQuery, params: unknown[], extra?: string): string {
  const parts = ["timestamp >= ?", "timestamp < date(?, '+1 day')"];
  params.push(q.from, q.to);
  if (extra) parts.push(extra);
  return parts.join(' AND ');
}

/** Generate every bucket between from/to (zero-filled later). */
function bucketsFor(q: AnalyticsQuery): string[] {
  const out: string[] = [];
  const start = Date.parse(`${q.from}T00:00:00Z`);
  const end = Date.parse(`${q.to}T00:00:00Z`);
  if (q.granularity === 'day') {
    for (let t = start; t <= end; t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10));
  } else {
    for (let t = start; t <= end + 86_400_000 - 3_600_000; t += 3_600_000) {
      out.push(new Date(t).toISOString().slice(0, 13) + ':00');
    }
  }
  return out;
}

/**
 * Full analytics payload for the admin panel. Aggregates pageviews, room
 * events and connection telemetry live (indexed, ≤120 days of raw data —
 * cheap at this scale). `today` KPIs are always global (unfiltered) so the
 * header cards stay stable; everything else honors the query filters.
 * Backwards compatible: passing a number of days builds the equivalent query.
 */
export function queryAnalytics(daysOrQuery: number | AnalyticsQuery): any {
  const q: AnalyticsQuery = typeof daysOrQuery === 'number'
    ? parseAnalyticsQuery({ days: daysOrQuery })
    : daysOrQuery;

  const pvBucket = q.granularity === 'hour'
    ? "strftime('%Y-%m-%dT%H:00', ts)"
    : 'date(ts)';
  const reBucket = q.granularity === 'hour'
    ? "strftime('%Y-%m-%dT%H:00', timestamp)"
    : 'date(timestamp)';

  // Per-bucket series (oldest → newest, gaps filled with zeros).
  const pvParams: unknown[] = [];
  const pvRows = db.prepare(`
    SELECT ${pvBucket} as b,
           COUNT(DISTINCT visitor_id) as visitors,
           COUNT(DISTINCT session_id) as sessions,
           COUNT(*) as pageviews
    FROM pageviews WHERE ${pageviewWhere(q, pvParams)} GROUP BY b
  `).all(...pvParams) as { b: string; visitors: number; sessions: number; pageviews: number }[];

  const reParams: unknown[] = [];
  const roomRows = db.prepare(`
    SELECT ${reBucket} as b,
           SUM(CASE WHEN event_type = 'created' THEN 1 ELSE 0 END) as rooms,
           SUM(CASE WHEN event_type = 'viewer_joined' THEN 1 ELSE 0 END) as viewers
    FROM room_events WHERE ${roomEventWhere(q, reParams)} GROUP BY b
  `).all(...reParams) as { b: string; rooms: number; viewers: number }[];

  const byBucket = new Map<string, any>();
  for (const b of bucketsFor(q)) {
    byBucket.set(b, { bucket: b, visitors: 0, sessions: 0, pageviews: 0, rooms: 0, viewers: 0 });
  }
  for (const r of pvRows) {
    const row = byBucket.get(r.b);
    if (row) { row.visitors = r.visitors; row.sessions = r.sessions; row.pageviews = r.pageviews; }
  }
  for (const r of roomRows) {
    const row = byBucket.get(r.b);
    if (row) { row.rooms = r.rooms || 0; row.viewers = r.viewers || 0; }
  }
  const series = Array.from(byBucket.values());

  // Today vs yesterday KPIs (global — never filtered).
  const today = utcDate(new Date());
  const yesterday = daysAgo(1);
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

  // Rankings (filtered).
  const rank = (sql: string, params: unknown[]) =>
    db.prepare(sql).all(...params.slice(0, params.length)) as any[];

  const refParams: unknown[] = [];
  const where = pageviewWhere(q, refParams);
  const referrers = rank(`
    SELECT COALESCE(referrer_host, 'directo') as host,
           COUNT(DISTINCT session_id) as sessions, COUNT(DISTINCT visitor_id) as visitors
    FROM pageviews WHERE ${where} AND referrer_host IS NOT NULL
    GROUP BY referrer_host ORDER BY sessions DESC LIMIT ?
  `, [...refParams, q.limit]);

  const directo = db.prepare(`
    SELECT COUNT(DISTINCT session_id) as s FROM pageviews
    WHERE ${where} AND referrer_host IS NULL LIMIT 1
  `).get(...refParams) as { s: number } | undefined;
  if ((directo?.s || 0) > 0) {
    referrers.push({ host: 'directo', sessions: directo!.s, visitors: directo!.s });
  }

  const pages = rank(`
    SELECT path, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors
    FROM pageviews WHERE ${where} GROUP BY path ORDER BY views DESC LIMIT ?
  `, [...refParams, q.limit]);

  const campaigns = rank(`
    SELECT utm_source as source, utm_medium as medium, utm_campaign as campaign,
           COUNT(DISTINCT session_id) as sessions, COUNT(DISTINCT visitor_id) as visitors
    FROM pageviews WHERE ${where} AND utm_source IS NOT NULL
    GROUP BY utm_source, utm_medium, utm_campaign ORDER BY sessions DESC LIMIT ?
  `, [...refParams, q.limit]);

  const countries = rank(`
    SELECT country, COUNT(DISTINCT visitor_id) as visitors
    FROM pageviews WHERE ${where} AND country IS NOT NULL AND country != '??'
    GROUP BY country ORDER BY visitors DESC LIMIT ?
  `, [...refParams, q.limit]);

  const devices = rank(`
    SELECT COALESCE(device, 'desconocido') as device, COUNT(DISTINCT session_id) as sessions
    FROM pageviews WHERE ${where} GROUP BY device ORDER BY sessions DESC LIMIT ?
  `, [...refParams, q.limit]);

  const langs = rank(`
    SELECT COALESCE(lang, 'desconocido') as lang, COUNT(DISTINCT session_id) as sessions
    FROM pageviews WHERE ${where} GROUP BY lang ORDER BY sessions DESC LIMIT ?
  `, [...refParams, q.limit]);

  // Product funnel: landing sessions → rooms created → rooms that got a viewer.
  const landing = db.prepare(`
    SELECT COUNT(DISTINCT session_id) as s FROM pageviews
    WHERE ${where} AND path IN ('/', '/en/') LIMIT 1
  `).get(...refParams) as { s: number } | undefined;

  const roomsCreatedParams: unknown[] = [];
  const roomsCreated = db.prepare(`
    SELECT COUNT(DISTINCT room_id) as c FROM room_events
    WHERE ${roomEventWhere(q, roomsCreatedParams, "event_type = 'created'")} LIMIT 1
  `).get(...roomsCreatedParams) as { c: number } | undefined;

  const joinsParams: unknown[] = [];
  const joinStats = db.prepare(`
    SELECT COUNT(*) as joins, COUNT(DISTINCT room_id) as roomsWithViewers FROM room_events
    WHERE ${roomEventWhere(q, joinsParams, "event_type = 'viewer_joined'")} LIMIT 1
  `).get(...joinsParams) as { joins: number; roomsWithViewers: number } | undefined;

  // Connection reliability in range (from disconnect telemetry).
  const relParams: unknown[] = [];
  const rel = db.prepare(`
    SELECT
      SUM(CASE WHEN role = 'host' THEN 1 ELSE 0 END) as hostDrops,
      SUM(CASE WHEN role = 'host' AND recovered = 1 THEN 1 ELSE 0 END) as hostRecovered,
      AVG(CASE WHEN role = 'host' AND recovered = 1 THEN recovery_ms END) as avgRecoveryMs,
      SUM(CASE WHEN role = 'viewer' THEN 1 ELSE 0 END) as viewerDrops,
      SUM(CASE WHEN role = 'viewer' AND cause = 'network' THEN 1 ELSE 0 END) as viewerNetworkDrops,
      AVG(CASE WHEN role = 'viewer' THEN duration_ms END) as avgWatchMs
    FROM connection_events
    WHERE ts >= ? AND ts < date(?, '+1 day') LIMIT 1
  `).get(q.from, q.to) as {
    hostDrops: number | null; hostRecovered: number | null; avgRecoveryMs: number | null;
    viewerDrops: number | null; viewerNetworkDrops: number | null; avgWatchMs: number | null;
  } | undefined;

  const hostDrops = rel?.hostDrops || 0;
  const hostRecovered = rel?.hostRecovered || 0;

  return {
    range: { from: q.from, to: q.to, granularity: q.granularity },
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
    langs,
    funnel: {
      landingSessions: landing?.s || 0,
      roomsCreated: roomsCreated?.c || 0,
      roomsWithViewers: joinStats?.roomsWithViewers || 0,
      viewerJoins: joinStats?.joins || 0,
    },
    reliability: {
      hostDrops,
      hostRecovered,
      recoveryRatePct: hostDrops > 0 ? Math.round((hostRecovered / hostDrops) * 100) : null,
      avgRecoveryMs: rel?.avgRecoveryMs != null ? Math.round(Number(rel.avgRecoveryMs)) : null,
      viewerDrops: rel?.viewerDrops || 0,
      viewerNetworkDrops: rel?.viewerNetworkDrops || 0,
      avgWatchMs: rel?.avgWatchMs != null ? Math.round(Number(rel.avgWatchMs)) : null,
    },
  };
}

// ── CSV export (same filters as queryAnalytics) ───────────────────────

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowsToCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(','), ...rows.map((r) => r.map(csvEscape).join(','))];
  return `${lines.join('\n')}\n`;
}

/**
 * Export one analytics section as CSV. Sections mirror queryAnalytics keys
 * so the UI's "export" button per widget maps 1:1.
 */
export function exportAnalyticsCsv(section: string, daysOrQuery: number | AnalyticsQuery): { filename: string; csv: string } {
  const q: AnalyticsQuery = typeof daysOrQuery === 'number'
    ? parseAnalyticsQuery({ days: daysOrQuery })
    : daysOrQuery;
  const suffix = `${q.from}_${q.to}`;
  const data = queryAnalytics(q);

  switch (section) {
    case 'series':
      return {
        filename: `wachaut_series_${suffix}.csv`,
        csv: rowsToCsv(
          ['bucket', 'visitors', 'sessions', 'pageviews', 'rooms', 'viewers'],
          data.series.map((r: any) => [r.bucket, r.visitors, r.sessions, r.pageviews, r.rooms, r.viewers])
        ),
      };
    case 'pages':
      return {
        filename: `wachaut_pages_${suffix}.csv`,
        csv: rowsToCsv(['path', 'views', 'visitors'], data.pages.map((r: any) => [r.path, r.views, r.visitors])),
      };
    case 'referrers':
      return {
        filename: `wachaut_referrers_${suffix}.csv`,
        csv: rowsToCsv(['host', 'sessions', 'visitors'], data.referrers.map((r: any) => [r.host, r.sessions, r.visitors])),
      };
    case 'campaigns':
      return {
        filename: `wachaut_campaigns_${suffix}.csv`,
        csv: rowsToCsv(['source', 'medium', 'campaign', 'sessions', 'visitors'], data.campaigns.map((r: any) => [r.source, r.medium, r.campaign, r.sessions, r.visitors])),
      };
    case 'countries':
      return {
        filename: `wachaut_countries_${suffix}.csv`,
        csv: rowsToCsv(['country', 'visitors'], data.countries.map((r: any) => [r.country, r.visitors])),
      };
    case 'devices':
      return {
        filename: `wachaut_devices_${suffix}.csv`,
        csv: rowsToCsv(['device', 'sessions'], data.devices.map((r: any) => [r.device, r.sessions])),
      };
    case 'langs':
      return {
        filename: `wachaut_langs_${suffix}.csv`,
        csv: rowsToCsv(['lang', 'sessions'], data.langs.map((r: any) => [r.lang, r.sessions])),
      };
    default:
      throw new AnalyticsQueryError(`unknown section: ${section}`);
  }
}
