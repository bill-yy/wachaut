/**
 * Diagnostics export (GET /api/admin/export): one JSON bundle with the
 * panel's reliability data, complete where the panel truncates it.
 *
 * Covers: auth, the time window, the opt-in privacy columns, the data that
 * must never leave the server, ISO-8601 timestamps, the attachment headers,
 * the row cap, the audit trail and the querystring validation.
 */
import { fileURLToPath } from 'node:url';

process.env.WACHAUT_DB_PATH = fileURLToPath(new URL('./tmp-export-test.db', import.meta.url));
process.env.ADMIN_JWT_SECRET = 'test-secret-0123456789abcdef';
process.env.ERRORS_SECRET = 'errors-shared-secret';

const { registerErrorRoutes, captureError } = await import('../src/errors.ts');
const { registerAdminRoutes } = await import('../src/admin/routes.ts');
const { recordDisconnect } = await import('../src/connection-telemetry.ts');
const { db } = await import('../src/db.ts');
const { sqliteTsToIso, EXPORT_ROW_CAP } = await import('../src/admin/export.ts');
const Fastify = (await import('fastify')).default;

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { rmSync } = await import('node:fs');

const AJV = { ajv: { customOptions: { removeAdditional: false, allErrors: true } } };
const app = Fastify(AJV);
registerErrorRoutes(app);
registerAdminRoutes(app as any, {
  rooms: new Map(), viewerToRoom: new Map(), hostToRoom: new Map(),
  io: { engine: { clientsCount: 0 }, to: () => ({ emit: () => {} }) },
  connectionCounts: new Map(), sfuHealthUrl: '',
});

// Fixture passphrases (throwaway DB — not real credentials).
const PW_ROOT = 'root-fixture-passphrase';
db.prepare('DELETE FROM admin_users').run();
const rootMod = await import('../src/admin/auth.ts');
rootMod.createUser('root', PW_ROOT, 'superadmin');

async function authHeaders() {
  const res = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { username: 'root', password: PW_ROOT } });
  return { authorization: `Bearer ${res.json().token}` };
}
const call = (query: string, headers?: object) => app.inject({ method: 'GET', url: `/api/admin/export${query}`, headers });

// ── Fixtures ──────────────────────────────────────────────────────────

const ROOM = 'fixture-1111-2222';
const VISITOR = 'visitor-fixture-0001-abcd';
const VISITOR_2 = 'visitor-fixture-0002-abcd';
const VISITOR_OLD = 'visitor-old-fixture';
const VISITOR_FEEDBACK = 'visitor-feedback-fixture';
const COMMENT = 'feedback-comment-must-not-leak-9c1d';
const CONTACT = 'contact-message-must-not-leak-7f3a';
const IP_HASH_EVENT = 'ip-hash-event-must-not-leak-5b2e';
const IP_HASH_ROOM = 'ip-hash-room-must-not-leak-5b2f';
const IP_HASH_FEEDBACK = 'ip-hash-feedback-must-not-leak-5b30';
const IP_HASH_CONTACT = 'ip-hash-contact-must-not-leak-5b31';

// An error group with two events inside the window and one far outside it.
captureError(new Error('viewer could not join'), { source: 'web', component: 'viewer.connectSfu', page: `/room/${ROOM}`, roomId: ROOM, visitorId: VISITOR, ip: '203.0.113.7' });
captureError(new Error('viewer could not join'), { source: 'web', component: 'viewer.connectSfu', page: `/room/${ROOM}`, roomId: ROOM, visitorId: VISITOR_2, ip: '203.0.113.8' });
const groupId = (db.prepare("SELECT id FROM error_groups WHERE component = 'viewer.connectSfu'").get() as { id: number }).id;
// Backdated by hand, the way a purge would have left it; the group's counter
// is maintained by the tracker, so it is bumped here too.
db.prepare(
  `INSERT INTO error_events (group_id, ts, page, room_id, visitor_id, ip_hash, country, message)
   VALUES (?, '2020-01-01 00:00:00', '/old', 'old-room', ?, ?, 'XX', 'old event')`
).run(groupId, VISITOR_OLD, IP_HASH_EVENT);
db.prepare('UPDATE error_groups SET count = count + 1 WHERE id = ?').run(groupId);

recordDisconnect({ roomId: ROOM, role: 'host', reason: 'ping timeout', durationMs: 65_000, viewersAffected: 2 });
db.prepare(
  `INSERT INTO room_events (event_type, room_id, host_ip, country, viewer_count) VALUES ('created', ?, ?, 'ES', 0)`
).run(ROOM, IP_HASH_ROOM);
db.prepare(
  `INSERT INTO traffic_stats (date, total_rooms, peak_viewers, total_viewers, countries) VALUES ('2026-11-01', 3, 5, 9, '{"ES": 9}')`
).run();
db.prepare(
  `INSERT INTO feedback (ts, room_id, role, rating, answers, comment, visitor_id, ip_hash, country)
   VALUES (datetime('now'), ?, 'viewer', 2, '{"freeze":"often"}', ?, ?, ?, 'ES')`
).run(ROOM, COMMENT, VISITOR_FEEDBACK, IP_HASH_FEEDBACK);
db.prepare(
  `INSERT INTO contact_messages (ts, name, email, message, page, ip_hash, country)
   VALUES (datetime('now'), 'Someone', 'someone@example.com', ?, '/contacto', ?, 'ES')`
).run(CONTACT, IP_HASH_CONTACT);

// ── Tests ─────────────────────────────────────────────────────────────

test('export: requires authentication', async () => {
  assert.equal((await call('?days=30')).statusCode, 401);
});

test('export: is a JSON attachment with a named bundle', async () => {
  const res = await call('?days=30', await authHeaders());
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['content-type'] ?? '', /^application\/json/);
  assert.match(res.headers['content-disposition'] ?? '', /^attachment; filename="wachaut-diagnostico-\d{12}\.json"$/);
  const bundle = res.json();
  assert.equal(bundle.schema, 'wachaut-diagnostics/1');
  assert.equal(bundle.range.days, 30);
  assert.match(bundle.range.from, /^\d{4}-\d{2}-\d{2}T/);
});

test('export: the window keeps in-range events only; days=0 keeps everything', async () => {
  const headers = await authHeaders();
  const windowed = (await call('?days=30', headers)).json();
  const events = windowed.errors.events.filter((e: any) => e.group_id === groupId);
  assert.equal(events.length, 2, 'the 2020 event is outside a 30-day window');
  for (const e of windowed.errors.events) assert.match(e.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, 'timestamps carry an explicit Z');

  const group = windowed.errors.groups.find((g: any) => g.id === groupId);
  assert.equal(group.count, 3, 'the group total is untouched by the window');
  assert.equal(group.events_in_range, 2);
  assert.equal(group.visitors_in_range, 2);

  const all = (await call('?days=0', headers)).json();
  assert.equal(all.errors.events.filter((e: any) => e.group_id === groupId).length, 3);
  assert.equal(all.range.from, null, 'no lower bound when everything retained is wanted');
});

test('export: by default nothing personal, no IP hash and no credential leaves the server', async () => {
  const { password_hash } = db.prepare('SELECT password_hash FROM admin_users').get() as { password_hash: string };
  const raw = (await call('?days=0', await authHeaders())).body;
  for (const secret of [
    VISITOR, VISITOR_2, VISITOR_OLD, VISITOR_FEEDBACK, COMMENT, CONTACT, 'someone@example.com', 'Someone',
    IP_HASH_EVENT, IP_HASH_ROOM, IP_HASH_FEEDBACK, IP_HASH_CONTACT, password_hash, PW_ROOT, 'root-fixture',
  ]) {
    assert.ok(!raw.includes(secret), `must not leak: ${secret}`);
  }
  const bundle = JSON.parse(raw);
  assert.ok(bundle.errors.events.every((e: any) => !('visitor_id' in e)), 'no visitor ids');
  assert.ok(bundle.feedback.items.every((f: any) => !('comment' in f)), 'no comments');
  assert.ok(bundle.admin_actions.entries.every((e: any) => Object.keys(e).sort().join() === 'action,ts'), 'admin actions carry neither user nor IP');
  assert.deepEqual(Object.keys(bundle).sort(), [
    'admin_actions', 'connections', 'errors', 'feedback', 'generated_at', 'privacy', 'range',
    'retention', 'rooms', 'row_cap', 'schema', 'system', 'traffic',
  ]);
});

test('export: visitor ids and comments are opt-in, one without the other', async () => {
  const headers = await authHeaders();
  const withIds = (await call('?days=0&visitors=true', headers)).json();
  assert.equal(withIds.privacy.visitor_ids, true);
  assert.ok(withIds.errors.events.some((e: any) => e.visitor_id === VISITOR));
  assert.ok(withIds.feedback.items.every((f: any) => !('comment' in f)), 'comments stay out unless asked');

  const withComments = (await call('?days=0&comments=true', headers)).json();
  assert.equal(withComments.privacy.feedback_comments, true);
  assert.ok(withComments.feedback.items.some((f: any) => f.comment === COMMENT));
  assert.ok(withComments.errors.events.every((e: any) => !('visitor_id' in e)), 'visitor ids stay out unless asked');
});

test('export: carries every reliability section', async () => {
  const bundle = (await call('?days=0', await authHeaders())).json();
  assert.ok(bundle.connections.events.some((e: any) =>
    e.role === 'host' && e.cause === 'network' && e.detail === 'ping timeout' && e.viewers_affected === 2));
  assert.ok(bundle.rooms.events.some((e: any) => e.event_type === 'created' && e.room_id === ROOM));
  assert.deepEqual(
    bundle.traffic.daily.find((d: any) => d.date === '2026-11-01'),
    { date: '2026-11-01', total_rooms: 3, peak_viewers: 5, total_viewers: 9, countries: { ES: 9 } },
  );
  assert.deepEqual(bundle.feedback.items[0].answers, { freeze: 'often' });
  assert.equal(bundle.retention.error_events.rows, 3);
  assert.equal(bundle.retention.room_events.oldest, bundle.retention.room_events.newest, 'one room event');
  assert.equal(typeof bundle.system.uptime_seconds, 'number');
  assert.equal(bundle.system.node, process.version);
  assert.equal(bundle.row_cap, EXPORT_ROW_CAP);
});

test('export: long lists are cut at the row cap and say so', async () => {
  const insert = db.prepare(
    `INSERT INTO connection_events (ts, room_id, role, cause, duration_ms) VALUES (datetime('now'), ?, 'viewer', 'clean', 1000)`
  );
  db.transaction(() => { for (let i = 0; i < EXPORT_ROW_CAP + 25; i++) insert.run(ROOM); })();
  const bundle = (await call('?days=30', await authHeaders())).json();
  assert.equal(bundle.connections.events.length, EXPORT_ROW_CAP);
  assert.equal(bundle.connections.truncated, true);
  const events = bundle.connections.events;
  assert.ok(events.every((e, i) => i === 0 || e.ts >= events[i - 1].ts), 'chronological: oldest first');
});

test('export: leaves an audit trail of what was taken', async () => {
  await call('?days=7&visitors=true&comments=true', await authHeaders());
  const row = db.prepare(
    "SELECT action FROM admin_audit_log WHERE action LIKE 'diagnostics_export:%' ORDER BY id DESC LIMIT 1"
  ).get() as { action: string };
  assert.equal(row.action, 'diagnostics_export:7d+visitors+comments');
});

test('export: rejects an out-of-range window, malformed flags and unknown parameters', async () => {
  const headers = await authHeaders();
  assert.equal((await call('?days=91', headers)).statusCode, 400);
  assert.equal((await call('?days=-1', headers)).statusCode, 400);
  assert.equal((await call('?visitors=maybe', headers)).statusCode, 400);
  assert.equal((await call('?unexpected=1', headers)).statusCode, 400);
});

test('sqliteTsToIso: the UTC storage format becomes explicit ISO-8601', () => {
  assert.equal(sqliteTsToIso('2026-11-21 10:15:02'), '2026-11-21T10:15:02Z');
  assert.equal(sqliteTsToIso('2026-11-21T10:15:02Z'), '2026-11-21T10:15:02Z');
  assert.equal(sqliteTsToIso(null), null);
  assert.equal(sqliteTsToIso(undefined), null);
});

// ── Teardown ──────────────────────────────────────────────────────────

test('teardown: close app and remove temp db', async () => {
  await app.close();
  db.close();
  rmSync(process.env.WACHAUT_DB_PATH!, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-wal`, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-shm`, { force: true });
});
