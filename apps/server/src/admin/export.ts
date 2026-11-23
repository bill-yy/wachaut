/**
 * Diagnostics export — one JSON bundle with everything the admin panel shows
 * about reliability, complete where the panel's views are truncated (the
 * error detail returns the last 20 events of a group, the connections panel
 * the last 50). Meant to be handed to a developer or an assistant.
 *
 * What it never carries: credentials, admin accounts, contact messages, IP
 * addresses or IP hashes. Visitor identifiers and the free text of feedback
 * comments are opt-in — both can be personal data, and neither is needed to
 * prioritise errors (per-group visitor counts are included either way).
 *
 * The database handle is injected (anything with better-sqlite3's
 * prepare/get/all), so the builder runs against a throwaway DB in tests.
 * Every statement below is a literal: the options only ever arrive as bound
 * parameters.
 */

/** The better-sqlite3 surface the builder reads through. */
export interface ExportDatabase {
  prepare(sql: string): {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface DiagnosticsOptions {
  /** Days back from now; 0 = everything still retained. */
  days: number;
  includeVisitorIds: boolean;
  includeComments: boolean;
}

/** Bump when the shape changes in a way a consumer must know about. */
export const DIAGNOSTICS_SCHEMA = 'wachaut-diagnostics/1';

/** Upper bound per event list, so a runaway table cannot make the file unusable. */
export const EXPORT_ROW_CAP = 5000;

const DAY_MS = 24 * 60 * 60 * 1000;

type Row = Record<string, unknown>;

/**
 * SQLite's datetime('now') — 'YYYY-MM-DD HH:MM:SS', always UTC — as ISO-8601
 * with an explicit Z, so a consumer cannot mistake it for local time.
 * Anything else (null, an already-ISO string) passes through untouched.
 * Exported for unit tests.
 */
export function sqliteTsToIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value;
}

/** A JS time in the format the ts columns compare against. */
function sqliteUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

function parseJson(text: unknown): unknown {
  if (typeof text !== 'string') return null;
  try { return JSON.parse(text); } catch { return null; }
}

/** Keep at most EXPORT_ROW_CAP rows and say whether anything was left out. */
function capRows(rows: Row[]): { rows: Row[]; truncated: boolean } {
  return rows.length > EXPORT_ROW_CAP ? { rows: rows.slice(0, EXPORT_ROW_CAP), truncated: true } : { rows, truncated: false };
}

/** Drop an opt-in column unless the export asked for it. */
function optIn(row: Row, key: 'visitor_id' | 'comment', include: boolean): Row {
  if (include || !(key in row)) return row;
  const copy = { ...row };
  delete copy[key];
  return copy;
}

export function buildDiagnosticsExport(
  db: ExportDatabase,
  opts: DiagnosticsOptions,
  system: unknown = null,
  nowMs: number = Date.now(),
) {
  const now = new Date(nowMs);
  const sinceMs = opts.days > 0 ? nowMs - opts.days * DAY_MS : null;
  // One bound cutoff for every list: the window's start, or '' when
  // everything retained is wanted (it sorts before any date, so nothing is
  // excluded and the statements stay literal).
  const since = sinceMs ? sqliteUtc(sinceMs) : '';
  const windowed = [since, EXPORT_ROW_CAP + 1];

  const query = (sql: string, params: unknown[] = []): Row[] => db.prepare(sql).all(...params) as Row[];
  const one = (sql: string, params: unknown[] = []): Row => db.prepare(sql).get(...params) as Row;
  /** Timestamps to ISO-8601. */
  const iso = (rows: Row[]): Row[] => rows.map((row) => ({ ...row, ts: sqliteTsToIso(row.ts) }));

  // ── Errors: groups with every event in the window ───────────────────
  const groups = query(
    `SELECT id, source, component, title, severity, status, count, first_seen, last_seen, sample_stack, meta
     FROM error_groups WHERE last_seen >= ? ORDER BY last_seen DESC, id DESC`,
    [since],
  ).map((g) => ({
    id: g.id,
    source: g.source,
    component: g.component,
    title: g.title,
    severity: g.severity,
    status: g.status,
    count: g.count,
    first_seen: sqliteTsToIso(g.first_seen),
    last_seen: sqliteTsToIso(g.last_seen),
    sample_stack: g.sample_stack ?? null,
    meta: parseJson(g.meta),
  }));

  const events = capRows(query(
    `SELECT group_id, ts, page, room_id, country, message, visitor_id
     FROM error_events WHERE ts >= ? ORDER BY ts ASC, id ASC LIMIT ?`,
    windowed,
  ));
  const perGroup = query(
    `SELECT group_id, COUNT(*) AS n, COUNT(DISTINCT visitor_id) AS visitors
     FROM error_events WHERE ts >= ? GROUP BY group_id`,
    [since],
  );
  const statsByGroup = new Map(perGroup.map((r) => [Number(r.group_id), Number(r.n)] as const));
  const visitorsByGroup = new Map(perGroup.map((r) => [Number(r.group_id), Number(r.visitors)] as const));

  // ── Connections: every host/viewer drop in the window ───────────────
  const connections = capRows(query(
    `SELECT ts, room_id, role, cause, detail, duration_ms, recovered, recovery_ms, viewers_affected
     FROM connection_events WHERE ts >= ? ORDER BY ts ASC, id ASC LIMIT ?`,
    windowed,
  ));

  // ── Rooms: created / closed / viewer joins and leaves ───────────────
  const rooms = capRows(query(
    `SELECT timestamp AS ts, event_type, room_id, country, viewer_count
     FROM room_events WHERE timestamp >= ? ORDER BY timestamp ASC, id ASC LIMIT ?`,
    windowed,
  ));

  // ── Traffic: one row per day, all that is kept (small and slow-growing) ──
  const daily = query(
    'SELECT date, total_rooms, peak_viewers, total_viewers, countries FROM traffic_stats ORDER BY date ASC',
  ).map((d) => ({ ...d, countries: parseJson(d.countries) }));

  // ── Feedback: ratings and answers; the comment only when asked for ──
  const feedback = capRows(query(
    `SELECT ts, room_id, role, rating, answers, country, comment
     FROM feedback WHERE ts >= ? ORDER BY ts ASC, id ASC LIMIT ?`,
    windowed,
  ));

  // ── Admin actions: what moderators did and login failures (no user, no IP) ──
  const adminActions = capRows(query(
    `SELECT timestamp AS ts, action FROM admin_audit_log WHERE timestamp >= ? ORDER BY timestamp ASC, id ASC LIMIT ?`,
    windowed,
  ));

  // ── How far back each table goes — what the window could have contained ──
  const span = (sql: string) => {
    const r = one(sql);
    return { rows: Number(r.n), oldest: sqliteTsToIso(r.oldest), newest: sqliteTsToIso(r.newest) };
  };

  return {
    schema: DIAGNOSTICS_SCHEMA,
    generated_at: now.toISOString(),
    range: { days: opts.days, from: sinceMs ? new Date(sinceMs).toISOString() : null, to: now.toISOString() },
    privacy: {
      visitor_ids: opts.includeVisitorIds,
      feedback_comments: opts.includeComments,
      never_included: ['credentials and secrets', 'admin accounts', 'contact messages', 'IP addresses and IP hashes'],
    },
    system,
    errors: {
      groups: groups.map((g) => ({
        ...g,
        events_in_range: statsByGroup.get(Number(g.id)) ?? 0,
        visitors_in_range: visitorsByGroup.get(Number(g.id)) ?? 0,
      })),
      events: iso(events.rows).map((e) => optIn(e, 'visitor_id', opts.includeVisitorIds)),
      events_truncated: events.truncated,
    },
    connections: { events: iso(connections.rows), truncated: connections.truncated },
    rooms: { events: iso(rooms.rows), truncated: rooms.truncated },
    traffic: { daily },
    feedback: {
      items: iso(feedback.rows).map((f) => optIn({ ...f, answers: parseJson(f.answers) }, 'comment', opts.includeComments)),
      truncated: feedback.truncated,
    },
    admin_actions: { entries: iso(adminActions.rows), truncated: adminActions.truncated },
    retention: {
      error_events: span('SELECT COUNT(*) AS n, MIN(ts) AS oldest, MAX(ts) AS newest FROM error_events'),
      connection_events: span('SELECT COUNT(*) AS n, MIN(ts) AS oldest, MAX(ts) AS newest FROM connection_events'),
      room_events: span('SELECT COUNT(*) AS n, MIN(timestamp) AS oldest, MAX(timestamp) AS newest FROM room_events'),
      pageviews: span('SELECT COUNT(*) AS n, MIN(ts) AS oldest, MAX(ts) AS newest FROM pageviews'),
      feedback: span('SELECT COUNT(*) AS n, MIN(ts) AS oldest, MAX(ts) AS newest FROM feedback'),
    },
    row_cap: EXPORT_ROW_CAP,
  };
}
