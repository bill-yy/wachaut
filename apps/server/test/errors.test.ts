/**
 * Error tracking + connection telemetry integration tests.
 *
 * Covers: the public /api/errors beacon (validation, secret enforcement for
 * server/sfu sources, rate limit), fingerprint grouping/dedup, automatic
 * reopening of resolved groups, the admin error endpoints, and the
 * connection telemetry module (reason mapping, host drop → recovery).
 */
import { fileURLToPath } from 'node:url';

process.env.WACHAUT_DB_PATH = fileURLToPath(new URL('./tmp-errors-test.db', import.meta.url));
process.env.ADMIN_JWT_SECRET = 'test-secret-0123456789abcdef';
process.env.ERRORS_SECRET = 'errors-shared-secret';

const { registerErrorRoutes, captureError } = await import('../src/errors.ts');
const routesModule = await import('../src/admin/routes.ts');
const { registerAdminRoutes } = routesModule;
const { mapDisconnectReason, recordDisconnect, recordHostRecovery } = await import('../src/connection-telemetry.ts');
const { db } = await import('../src/db.ts');
const { normalizeMessage, foldBundleHash } = await import('../src/errors.ts');
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

async function login() {
  const res = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { username: 'root', password: PW_ROOT } });
  return res.json().token as string;
}
db.prepare('DELETE FROM admin_users').run();
const rootMod = await import('../src/admin/auth.ts');
rootMod.createUser('root', PW_ROOT, 'superadmin');

function beacon(payload: object, headers: Record<string, string> = {}) {
  return app.inject({ method: 'POST', url: '/api/errors', payload, headers });
}

// ── Beacon: validation + auth ────────────────────────────────────────

test('beacon: web source is public and records the group + event', async () => {
  const res = await beacon({
    source: 'web', message: 'Cannot read properties of undefined (reading id)',
    component: 'viewer.connectSfu', severity: 'error', page: '/room/abc12345',
    roomId: 'abc12345-1111', vid: 'visitor-0001-abcd',
  });
  assert.equal(res.statusCode, 200);
  const group = db.prepare('SELECT * FROM error_groups').get() as any;
  assert.equal(group.source, 'web');
  assert.equal(group.component, 'viewer.connectSfu');
  assert.equal(group.count, 1);
  const event = db.prepare('SELECT * FROM error_events').get() as any;
  assert.equal(event.page, '/room/abc12345');
  assert.equal(event.room_id, 'abc12345-1111');
});

test('beacon: server/sfu sources require the shared secret', async () => {
  const no = await beacon({ source: 'sfu', message: 'DTLS failed' });
  assert.equal(no.statusCode, 403);

  const yes = await beacon({ source: 'sfu', message: 'DTLS failed' }, { 'x-errors-secret': 'errors-shared-secret' });
  assert.equal(yes.statusCode, 200);
  const sfuGroup = db.prepare("SELECT * FROM error_groups WHERE source = 'sfu'").get() as any;
  assert.ok(sfuGroup, 'sfu group recorded');
});

test('beacon: schema rejects malformed payloads with 400', async () => {
  const bad = [
    { source: 'web' },                                              // no message
    { source: 'web', message: '' },                                 // empty message
    { source: 'web', message: 'x'.repeat(501) },                    // too long
    { source: 'web', message: 'ok', severity: 'fatal' },            // bad enum
    { source: 'web', message: 'ok', component: 'x'.repeat(65) },    // too long component
    { source: 'web', message: 'ok', extra: 1 },                      // unknown property
  ];
  for (const payload of bad) {
    const res = await beacon(payload);
    assert.equal(res.statusCode, 400, JSON.stringify(payload));
  }
});

test('grouping: same bug with different data shares a group and increments the count', async () => {
  db.prepare('DELETE FROM error_groups').run();
  db.prepare('DELETE FROM error_events').run();
  for (const id of ['11111111', '22222222']) {
    const res = await beacon({ source: 'web', message: `Failed to join room ${id}-aaaa-bbbb`, component: 'sfu.socket-connect' });
    assert.equal(res.statusCode, 200);
  }
  const groups = db.prepare('SELECT * FROM error_groups').all() as any[];
  assert.equal(groups.length, 1, 'UUID variance must not split the group');
  assert.equal(groups[0].count, 2);
  assert.equal((db.prepare('SELECT COUNT(*) as n FROM error_events').get() as any).n, 2);
});

test('normalizeMessage strips volatile data', () => {
  const a = normalizeMessage('User 47 not found in room 51f2a2bd-1a4b-434e');
  const b = normalizeMessage('User 993 not found in room 0f9e8d7c-6b5a-4321');
  assert.equal(a, b);
});

test('normalizeMessage folds the per-deploy chunk hash, and nothing else', () => {
  const chunk = (hash: string) => `Failed to fetch dynamically imported module: https://wachaut.com/_app/immutable/nodes/1.${hash}.js`;
  assert.equal(normalizeMessage(chunk('CxZpTux8')), normalizeMessage(chunk('DENzJYvz')));
  // Anonymous chunks, named chunks, Svelte chunks.
  const frame = (file: string) => `at d (https://wachaut.com/_app/immutable/${file}:1:2)`;
  assert.equal(foldBundleHash(frame('chunks/BX0W-0dz.js')), 'at d (https://wachaut.com/_app/immutable/chunks/.<chunk>.js:1:2)');
  assert.equal(foldBundleHash(frame('chunks/index.BxX9r7h0.js')), 'at d (https://wachaut.com/_app/immutable/chunks/index.<chunk>.js:1:2)');
  assert.equal(foldBundleHash(frame('chunks/PushOptIn.DF4R2TVy.svelte.js')), 'at d (https://wachaut.com/_app/immutable/chunks/PushOptIn.<chunk>.svelte.js:1:2)');
  // Server paths, query strings and names without a hash are left alone.
  const plain = 'cannot read /app/apps/server/src/worker.js?x=1 in _app/immutable.js';
  assert.equal(foldBundleHash(plain), plain);
});

test('grouping: a deploy does not split one bug into one group per build', () => {
  db.prepare('DELETE FROM error_groups').run();
  db.prepare('DELETE FROM error_events').run();
  // The same line of the same component after two deploys: Vite renamed the
  // chunk and the minifier the function (first diagnostics export: 10 groups
  // for one push failure).
  const report = (frame: string) => {
    const err = new Error('push opt-in failed: Registration failed - push service error');
    err.stack = `Error: push opt-in failed: Registration failed - push service error\n${frame}\n    at async t (https://wachaut.com/_app/immutable/chunks/BX0W-0dz.js:1:5)`;
    captureError(err, { source: 'web', component: 'push.optIn', severity: 'warning' });
  };
  report('    at d (https://wachaut.com/_app/immutable/nodes/26.CP_Os8Gb.js:1:234)');
  report('    at xQ.<anonymous> (https://wachaut.com/_app/immutable/nodes/27.aB3-dEfG.js:1:98)');

  const groups = db.prepare("SELECT * FROM error_groups WHERE component = 'push.optIn'").all() as any[];
  assert.equal(groups.length, 1);
  assert.equal(groups[0].count, 2);
  assert.equal(groups[0].severity, 'warning');
  assert.equal(
    groups[0].sample_stack,
    'Error: push opt-in failed: Registration failed - push service error\n' +
      '    at (https://wachaut.com/_app/immutable/nodes/<n>.<chunk>.js:line)\n' +
      '    at (https://wachaut.com/_app/immutable/chunks/.<chunk>.js:line)',
  );

  // Frames that are not bundled code keep their function name: it is stable.
  const native = new Error('worker died');
  native.stack = 'Error: worker died\n    at recordRoomEvent (/app/apps/server/src/index.ts:120:15)';
  captureError(native, { source: 'server', component: 'worker.native' });
  const kept = db.prepare("SELECT sample_stack FROM error_groups WHERE component = 'worker.native'").get() as any;
  assert.equal(kept.sample_stack, 'Error: worker died\n    at recordRoomEvent (/app/apps/server/src/index.ts:line)');
});

test('server-side captureError dedups into the same store and reopens resolved groups', () => {
  db.prepare('DELETE FROM error_groups').run();
  db.prepare('DELETE FROM error_events').run();
  captureError(new Error('worker 12 died'), { source: 'server', component: 'worker' });
  captureError(new Error('worker 99 died'), { source: 'server', component: 'worker' });
  let group = db.prepare('SELECT * FROM error_groups').get() as any;
  assert.equal(group.count, 2);

  db.prepare('UPDATE error_groups SET status = ?').run('resolved');
  captureError(new Error('worker 104 died'), { source: 'server', component: 'worker' });
  group = db.prepare('SELECT * FROM error_groups').get() as any;
  assert.equal(group.status, 'open', 'a resolved group that reappears must reopen');
  assert.equal(group.count, 3);
});

// ── Admin endpoints ─────────────────────────────────────────────────

let token = '';

test('admin: login for the following tests', async () => {
  token = await login();
  assert.ok(token);
});

test('admin: list, filter, detail, status flow (audited), delete', async () => {
  db.prepare('DELETE FROM error_groups').run();
  db.prepare('DELETE FROM error_events').run();
  db.prepare('DELETE FROM admin_audit_log').run();
  await beacon({ source: 'web', message: 'Alpha failure', component: 'a' });
  await beacon({ source: 'sfu', message: 'Beta failure', component: 'b' }, { 'x-errors-secret': 'errors-shared-secret' });

  const auth = { authorization: `Bearer ${token}` };

  const all = await app.inject({ method: 'GET', url: '/api/admin/errors?limit=10', headers: auth });
  assert.equal(all.statusCode, 200);
  assert.equal(all.json().total, 2);

  const filtered = await app.inject({ method: 'GET', url: '/api/admin/errors?source=sfu', headers: auth });
  assert.equal(filtered.json().total, 1);
  assert.equal(filtered.json().groups[0].source, 'sfu');

  const firstId = all.json().groups[0].id;
  const detail = await app.inject({ method: 'GET', url: `/api/admin/errors/${firstId}`, headers: auth });
  assert.equal(detail.statusCode, 200);
  assert.ok(Array.isArray(detail.json().events));
  assert.ok(detail.json().events.length >= 1);

  const ack = await app.inject({
    method: 'POST', url: `/api/admin/errors/${firstId}/status`, headers: auth,
    payload: { status: 'acknowledged' },
  });
  assert.equal(ack.statusCode, 200);
  const audit = db.prepare("SELECT COUNT(*) as n FROM admin_audit_log WHERE action LIKE 'error_status:%'").get() as any;
  assert.ok(audit.n >= 1, 'status change is audited');

  const del = await app.inject({ method: 'DELETE', url: `/api/admin/errors/${firstId}`, headers: auth });
  assert.equal(del.statusCode, 200);
  assert.equal((db.prepare('SELECT COUNT(*) as n FROM error_groups').get() as any).n, 1);
  assert.equal((db.prepare('SELECT COUNT(*) as n FROM error_events WHERE group_id = ?').get(firstId) as any).n, 0);

  const missing = await app.inject({ method: 'GET', url: '/api/admin/errors/99999', headers: auth });
  assert.equal(missing.statusCode, 404);
});

// ── Connection telemetry ─────────────────────────────────────────────

test('mapDisconnectReason: ping timeout → network, client disconnect → clean, server → server', () => {
  assert.equal(mapDisconnectReason('ping timeout'), 'network');
  assert.equal(mapDisconnectReason('transport error'), 'network');
  assert.equal(mapDisconnectReason('client namespace disconnect'), 'clean');
  assert.equal(mapDisconnectReason('server namespace disconnect'), 'server');
  assert.equal(mapDisconnectReason('whatever-else'), 'network');
});

test('host drop is recorded with viewers affected; reclaim marks it recovered with latency', async () => {
  db.prepare('DELETE FROM connection_events').run();
  recordDisconnect({ roomId: 'room-host-1', role: 'host', reason: 'ping timeout', durationMs: 90_000, viewersAffected: 3 });
  let row = db.prepare('SELECT * FROM connection_events').get() as any;
  assert.equal(row.cause, 'network');
  assert.equal(row.recovered, 0);
  assert.equal(row.viewers_affected, 3);
  assert.equal(row.duration_ms, 90_000);

  await new Promise((r) => setTimeout(r, 30));
  recordHostRecovery('room-host-1');
  row = db.prepare('SELECT * FROM connection_events').get() as any;
  assert.equal(row.recovered, 1);
  assert.ok(row.recovery_ms >= 25, `recovery latency recorded (${row.recovery_ms}ms)`);

  // A second recovery call for the same room must be a no-op.
  recordHostRecovery('room-host-1');
  row = db.prepare('SELECT * FROM connection_events').get() as any;
  assert.equal(row.recovery_ms < 5000, true, 'recovery_ms not corrupted by double recovery');
});

test('viewer drops record cause + duration and do not enter the pending-host map', async () => {
  db.prepare('DELETE FROM connection_events').run();
  recordDisconnect({ roomId: 'room-v-1', role: 'viewer', reason: 'client namespace disconnect', durationMs: 42_000 });
  const row = db.prepare('SELECT * FROM connection_events').get() as any;
  assert.equal(row.cause, 'clean');
  assert.equal(row.role, 'viewer');
  // Recovering a room with no pending host drop must not crash or write.
  recordHostRecovery('room-v-1');
  assert.equal((db.prepare('SELECT COUNT(*) as n FROM connection_events').get() as any).n, 1);
});

test('admin: connections endpoint returns KPIs and events', async () => {
  db.prepare('DELETE FROM connection_events').run();
  recordDisconnect({ roomId: 'kpi-room', role: 'host', reason: 'ping timeout', durationMs: 60_000, viewersAffected: 2 });
  recordHostRecovery('kpi-room');
  recordDisconnect({ roomId: 'kpi-room', role: 'viewer', reason: 'transport error', durationMs: 10_000 });
  // Not drops: the host leaving on purpose, a server restart, and a network
  // blip nobody was watching (prod, first five weeks: 140 of the 159 host
  // disconnects had no viewers at all).
  recordDisconnect({ roomId: 'kpi-room', role: 'host', reason: 'client namespace disconnect', durationMs: 70_000, viewersAffected: 2 });
  recordDisconnect({ roomId: 'kpi-room', role: 'host', reason: 'server shutting down', durationMs: 80_000, viewersAffected: 2 });
  recordDisconnect({ roomId: 'kpi-alone', role: 'host', reason: 'transport close', durationMs: 5_000 });

  const auth = { authorization: `Bearer ${token}` };
  const res = await app.inject({ method: 'GET', url: '/api/admin/connections?days=7', headers: auth });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.kpis.hostDrops, 1, 'only the network drop with viewers counts as a host drop');
  assert.equal(body.kpis.hostRecoveredPct, 100);
  assert.ok(body.kpis.hostCleanLeaves >= 1, 'clean leaves are reported on their own');
  assert.ok(body.kpis.hostServerRestarts >= 1, 'server restarts are reported on their own');
  assert.ok(body.kpis.viewerNetworkDrops >= 1);
  assert.ok(Array.isArray(body.events) && body.events.length >= 5, 'every event is still listed');
});

// ── Rate limiting (LAST — locks the shared test IP) ─────────────────

test('beacon: rate limited past 20 web reports per minute', async () => {
  let last = 200;
  for (let i = 0; i < 25 && last !== 429; i++) {
    const res = await beacon({ source: 'web', message: `flood ${i}`, component: 'flood' });
    last = res.statusCode;
  }
  assert.equal(last, 429, 'web flood must hit the rate limit');
});

// ── Teardown ─────────────────────────────────────────────────────────

test('teardown: close app and remove temp db', async () => {
  await app.close();
  db.close();
  rmSync(process.env.WACHAUT_DB_PATH!, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-wal`, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-shm`, { force: true });
});
