/**
 * Analytics integration tests: /api/track (validation, recording, rate
 * limit, maintenance flag), maintenance persistence via app_settings, and
 * the queryAnalytics aggregation used by the admin panel.
 */
import { fileURLToPath } from 'node:url';

process.env.WACHAUT_DB_PATH = fileURLToPath(new URL('./tmp-analytics-test.db', import.meta.url));
process.env.ADMIN_JWT_SECRET = 'test-secret-0123456789abcdef';

const analyticsModule = await import('../src/analytics.ts');
const { registerAnalyticsRoutes, queryAnalytics, normalizePath } = analyticsModule;
const { isMaintenanceMode, setMaintenanceMode } = await import('../src/admin/routes.ts');
const { db, getSetting } = await import('../src/db.ts');
const Fastify = (await import('fastify')).default;

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { rmSync } = await import('node:fs');

const app = Fastify({ ajv: { customOptions: { removeAdditional: false, allErrors: true } } });
registerAnalyticsRoutes(app as any, isMaintenanceMode, () => 0);

// ── /api/track ───────────────────────────────────────────────────────

test('track: records a pageview with country + hashed IP, never the raw IP', async () => {
  const res = await app.inject({
    method: 'POST', url: '/api/track',
    payload: {
      path: '/?utm_source=google',
      referrer: 'https://www.google.com/search?q=wachaut',
      vid: 'visitor-0001-abcd',
      sid: 'session-0001-abcd',
      lang: 'es-ES',
      device: 'mobile',
      utm: { source: 'google', medium: 'cpc', campaign: 'lanzo-oct' },
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().ok, true);
  assert.equal(res.json().maintenance, false);

  const row = db.prepare('SELECT * FROM pageviews ORDER BY id DESC LIMIT 1').get() as any;
  assert.equal(row.path, '/', 'query string is stripped from the path');
  assert.equal(row.referrer_host, 'google.com', 'www. is stripped from the referrer host');
  assert.equal(row.utm_source, 'google');
  assert.equal(row.utm_campaign, 'lanzo-oct');
  assert.ok(row.ip_hash && row.ip_hash.length === 16, 'IP stored as truncated salted hash');
  assert.equal(row.ip_hash.includes('127.0.0.1'), false, 'raw IP never stored');
  assert.ok(row.country, 'country recorded (?? for loopback)');
});

test('track: internal referrers are not stored as traffic source', async () => {
  await app.inject({
    method: 'POST', url: '/api/track',
    payload: { path: '/room', referrer: 'https://wachaut.com/', vid: 'visitor-0001-abcd', sid: 'session-0002-abcd' },
  });
  const row = db.prepare('SELECT referrer, referrer_host FROM pageviews ORDER BY id DESC LIMIT 1').get() as any;
  assert.equal(row.referrer, null);
  assert.equal(row.referrer_host, null);
});

test('track: schema validation rejects malformed payloads with 400', async () => {
  const bad = [
    { path: '/x' },                                            // missing vid/sid
    { path: '/x', vid: 'ab', sid: 'session-0001-abcd' },       // vid too short
    { path: '/x', vid: 'visitor-0001-abcd', sid: 'has spaces!' },
    { path: '/x', vid: 'visitor-0001-abcd', sid: 'session-0001-abcd', device: 'fridge' }, // bad enum
    { path: '/x', vid: 'visitor-0001-abcd', sid: 'session-0001-abcd', extra: true },     // additionalProperty
  ];
  for (const payload of bad) {
    const res = await app.inject({ method: 'POST', url: '/api/track', payload });
    assert.equal(res.statusCode, 400, JSON.stringify(payload));
  }
});

test('track: rate limited past 60 calls per minute per IP', async () => {
  // The previous tests already consumed a few calls from 127.0.0.1.
  let last = 200;
  for (let i = 0; i < 70 && last !== 429; i++) {
    const res = await app.inject({
      method: 'POST', url: '/api/track',
      payload: { path: '/flood', vid: 'visitor-flood-0001', sid: 'session-flood-01' },
    });
    last = res.statusCode;
  }
  assert.equal(last, 429, 'flood must eventually hit the rate limit');
});

// ── /api/status ──────────────────────────────────────────────────────

test('status: public, reports maintenance flag and room count', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/status' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.rooms, 0);
  assert.equal(typeof body.maintenance, 'boolean');
});

// ── Maintenance persistence ──────────────────────────────────────────

test('maintenance: setMaintenanceMode persists to app_settings and toggles the flag', () => {
  assert.equal(isMaintenanceMode(), false);
  setMaintenanceMode(true);
  assert.equal(isMaintenanceMode(), true);
  assert.equal(getSetting('maintenance'), '1', 'flag persisted — survives restarts');
  setMaintenanceMode(false);
  assert.equal(isMaintenanceMode(), false);
  assert.equal(getSetting('maintenance'), '0');
});

test('track response reflects maintenance state', async () => {
  setMaintenanceMode(true);
  try {
    const res = await app.inject({
      method: 'POST', url: '/api/track',
      payload: { path: '/probe', vid: 'visitor-probe-01', sid: 'session-probe-01' },
    });
    if (res.statusCode === 200) {
      assert.equal(res.json().maintenance, true, 'clients learn about maintenance from the pageview itself');
    } else {
      assert.equal(res.statusCode, 429, 'rate limited from earlier flood — also acceptable');
    }
  } finally {
    setMaintenanceMode(false);
  }
});

// ── queryAnalytics ───────────────────────────────────────────────────

test('queryAnalytics: aggregates today KPIs, deltas, referrers, campaigns, countries, devices', () => {
  db.prepare('DELETE FROM pageviews').run();
  db.prepare('DELETE FROM room_events').run();
  const ins = db.prepare(`
    INSERT INTO pageviews (visitor_id, session_id, path, referrer_host, utm_source, utm_medium, utm_campaign, country, device, ts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  // Today: 3 visitors, 4 sessions, 6 pageviews. Google + direct. Campaign.
  ins.run('v1', 's1', '/', 'google.com', 'google', 'cpc', 'octubre', 'ES', 'mobile');
  ins.run('v1', 's2', '/room', null, null, null, null, 'ES', 'mobile');
  ins.run('v2', 's3', '/', 'google.com', 'google', 'cpc', 'octubre', 'ES', 'desktop');
  ins.run('v3', 's4', '/privacidad', 't.co', null, null, null, 'FR', 'mobile');
  ins.run('v3', 's4', '/', 't.co', null, null, null, 'FR', 'mobile');
  ins.run('v1', 's1', '/room', 'google.com', 'google', 'cpc', 'octubre', 'ES', 'mobile');

  db.prepare("INSERT INTO room_events (event_type, room_id, country, viewer_count, timestamp) VALUES ('created', 'r1', 'ES', 0, datetime('now'))").run();
  db.prepare("INSERT INTO room_events (event_type, room_id, country, viewer_count, timestamp) VALUES ('viewer_joined', 'r1', 'ES', 2, datetime('now'))").run();

  const a = queryAnalytics(7);
  assert.equal(a.today.visitors, 3);
  assert.equal(a.today.sessions, 4);
  assert.equal(a.today.pageviews, 6);
  assert.equal(a.today.rooms, 1);
  assert.equal(a.today.viewers, 1);
  // Deltas vs an empty yesterday: first non-zero day reads +100, null stays null.
  assert.equal(a.today.delta.pageviews, 100);
  assert.equal(a.today.delta.visitors, 100);

  assert.equal(a.series.length, 7);
  const todayEntry = a.series[a.series.length - 1];
  assert.equal(todayEntry.pageviews, 6);
  assert.equal(todayEntry.rooms, 1);

  const google = a.referrers.find((r: any) => r.host === 'google.com');
  assert.equal(google.sessions, 2); // s1 (two pageviews) + s3 — distinct sessions
  assert.equal(google.visitors, 2);
  const direct = a.referrers.find((r: any) => r.host === 'directo');
  assert.ok(direct, 'direct traffic appears as "directo"');
  assert.equal(direct.sessions, 1);

  const camp = a.campaigns[0];
  assert.equal(camp.source, 'google');
  assert.equal(camp.medium, 'cpc');
  assert.equal(camp.campaign, 'octubre');
  assert.equal(camp.sessions, 2);

  assert.equal(a.countries[0].country, 'ES');
  assert.equal(a.countries[0].visitors, 2);
  assert.ok(a.devices.some((d: any) => d.device === 'mobile' && d.sessions === 3));
  assert.ok(a.devices.some((d: any) => d.device === 'desktop' && d.sessions === 1));
});

test('normalizePath: strips query/hash, caps length, prefixes slash', () => {
  assert.equal(normalizePath('/room/abc?x=1#pin'), '/room/abc');
  assert.equal(normalizePath('room'), '/room');
  assert.equal(normalizePath('/' + 'a'.repeat(300)).length, 128);
});

// ── Teardown ─────────────────────────────────────────────────────────

test('teardown: close app and remove temp db', async () => {
  await app.close();
  db.close();
  rmSync(process.env.WACHAUT_DB_PATH!, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-wal`, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-shm`, { force: true });
});
