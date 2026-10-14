/**
 * Admin API integration tests: real Fastify instance + admin routes +
 * throwaway SQLite DB, exercised through app.inject() — no network needed.
 *
 * Covers: login (rate limit, TOTP, forced rotation), auth middleware
 * (revocation, stale token versions, fresh roles), role gates, user CRUD,
 * room moderation (kick/close), audit pagination and the traffic rollup.
 */
import { fileURLToPath } from 'node:url';

process.env.WACHAUT_DB_PATH = fileURLToPath(new URL('./tmp-admin-routes-test.db', import.meta.url));
process.env.ADMIN_JWT_SECRET = 'test-secret-0123456789abcdef';

const routesModule = await import('../src/admin/routes.ts');
const { registerAdminRoutes } = routesModule;
type ServerState = routesModule.ServerState;
const { createUser, findUserById } = await import('../src/admin/auth.ts');
const { db } = await import('../src/db.ts');
const { totpCode } = await import('../src/admin/totp.ts');
const { createRoom } = await import('../src/room-store.ts');
const { rollupTrafficStats } = await import('../src/stats.ts');
const Fastify = (await import('fastify')).default;

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { rmSync } = await import('node:fs');

// Fixture passphrases for the throwaway test DB — not real credentials.
const PW_ROOT = 'root-fixture-passphrase';
const PW_PEPE = 'pepe-fixture-passphrase';
const PW_ROT_OLD = 'rotator-old-passphrase';
const PW_ROT_NEW = 'rotator-new-passphrase';
const PW_TEMP = 'tempadmin-fixture-pass';
const PW_FORCED_OLD = 'forced-old-passphrase';
const PW_FORCED_NEW = 'forced-new-passphrase';
const PW_VALID = 'validuser-fixture-pass';
const PW_TOTP = 'twofa-fixture-passphrase';
const PW_TOTP_WRONG = 'twofa-wrong-passphrase';
const PW_INVALID_LOGIN = 'definitely-not-the-fixture';

// ── Fake live state ──────────────────────────────────────────────────

const rooms = new Map<string, any>();
const viewerToRoom = new Map<string, string>();
const hostToRoom = new Map<string, string>();
const ioEmits: { target: string; ev: string; payload?: any }[] = [];
const io = {
  engine: { clientsCount: 3 },
  to(target: string) {
    return {
      emit: (ev: string, payload?: any) => ioEmits.push({ target, ev, payload }),
    };
  },
};
const connectionCounts = new Map<string, number>([['203.0.113.9', 2], ['198.51.100.4', 1]]);

const state: ServerState = {
  rooms, viewerToRoom, hostToRoom, io, connectionCounts,
  sfuHealthUrl: '', // fetch fails → sfu: null in metrics
};

// ── App bootstrap + fixtures ─────────────────────────────────────────

const app = Fastify();
registerAdminRoutes(app as any, state);

const ROOT = { username: 'root', password: PW_ROOT, role: 'superadmin' };
const PEPE = { username: 'pepe', password: PW_PEPE, role: 'admin' };
createUser(ROOT.username, ROOT.password, ROOT.role);
createUser(PEPE.username, PEPE.password, PEPE.role);

/** Login helper → { statusCode, body, token } */
async function login(username: string, password: string, code?: string) {
  const res = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { username, password, ...(code ? { code } : {}) } });
  return { statusCode: res.statusCode, body: res.json(), token: res.json().token as string | undefined };
}

function authed(token: string) {
  return { authorization: `Bearer ${token}` };
}

// ── Login ────────────────────────────────────────────────────────────

test('login: valid credentials return a token; invalid return 401', async () => {
  const ok = await login(ROOT.username, ROOT.password);
  assert.equal(ok.statusCode, 200);
  assert.ok(ok.token);
  assert.equal(ok.body.user.role, 'superadmin');

  const bad = await login(ROOT.username, PW_INVALID_LOGIN);
  assert.equal(bad.statusCode, 401);
  assert.equal(bad.body.error, 'Invalid credentials');

  // Malformed body → 400 from the JSON schema, never a 500.
  const noBody = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { username: 'x' } });
  assert.equal(noBody.statusCode, 400);
});

test('login: revoked account is rejected', async () => {
  const u = createUser('ghost', PW_VALID, 'admin');
  db.prepare('UPDATE admin_users SET active = 0 WHERE id = ?').run(u.id);
  const res = await login('ghost', PW_VALID);
  assert.equal(res.statusCode, 401);
});

// ── Auth middleware ──────────────────────────────────────────────────

test('protected routes require a valid token', async () => {
  const none = await app.inject({ method: 'GET', url: '/api/admin/metrics' });
  assert.equal(none.statusCode, 401);

  const garbage = await app.inject({ method: 'GET', url: '/api/admin/metrics', headers: authed('not-a-token') });
  assert.equal(garbage.statusCode, 401);
});

test('password change invalidates previously issued tokens (token_version)', async () => {
  const u = createUser('rotator', PW_ROT_OLD, 'admin');
  const s1 = await login('rotator', PW_ROT_OLD);
  const before = await app.inject({ method: 'GET', url: '/api/admin/metrics', headers: authed(s1.token!) });
  assert.equal(before.statusCode, 200);

  const change = await app.inject({
    method: 'POST', url: `/api/admin/users/${u.id}/password`,
    headers: authed(s1.token!), payload: { password: PW_ROT_NEW },
  });
  assert.equal(change.statusCode, 200);

  // Old token now carries a stale ver → 401.
  const after = await app.inject({ method: 'GET', url: '/api/admin/metrics', headers: authed(s1.token!) });
  assert.equal(after.statusCode, 401);

  // New password logs in fine.
  const s2 = await login('rotator', PW_ROT_NEW);
  assert.equal(s2.statusCode, 200);
});

test('role changes apply to live tokens (role re-read from DB)', async () => {
  const u = createUser('tempadmin', PW_TEMP, 'superadmin');
  const s = await login('tempadmin', PW_TEMP);
  assert.equal(s.body.user.role, 'superadmin');

  // superadmin CAN toggle maintenance before demotion.
  const before = await app.inject({ method: 'POST', url: '/api/admin/maintenance', headers: authed(s.token!), payload: { enabled: false } });
  assert.equal(before.statusCode, 200);

  // root demotes tempadmin while their token is live.
  const root = await login(ROOT.username, ROOT.password);
  const demote = await app.inject({
    method: 'POST', url: `/api/admin/users/${u.id}/role`,
    headers: authed(root.token!), payload: { role: 'admin' },
  });
  assert.equal(demote.statusCode, 200);

  // Same token is now rejected for the superadmin-only action.
  const after = await app.inject({ method: 'POST', url: '/api/admin/maintenance', headers: authed(s.token!), payload: { enabled: false } });
  assert.equal(after.statusCode, 403);
});

test('must_change_password accounts can only rotate their password', async () => {
  const u = createUser('forced', PW_FORCED_OLD, 'admin');
  db.prepare('UPDATE admin_users SET must_change_password = 1 WHERE id = ?').run(u.id);

  const s = await login('forced', PW_FORCED_OLD);
  assert.equal(s.body.user.mustChangePassword, true);

  const blocked = await app.inject({ method: 'GET', url: '/api/admin/metrics', headers: authed(s.token!) });
  assert.equal(blocked.statusCode, 403);
  assert.equal(blocked.json().mustChangePassword, true);

  const rotate = await app.inject({
    method: 'POST', url: `/api/admin/users/${u.id}/password`,
    headers: authed(s.token!), payload: { password: PW_FORCED_NEW },
  });
  assert.equal(rotate.statusCode, 200);

  // Rotation bumped token_version: old token is dead, fresh login works.
  const oldToken = await app.inject({ method: 'GET', url: '/api/admin/metrics', headers: authed(s.token!) });
  assert.equal(oldToken.statusCode, 401);
  const s2 = await login('forced', PW_FORCED_NEW);
  const now = await app.inject({ method: 'GET', url: '/api/admin/metrics', headers: authed(s2.token!) });
  assert.equal(now.statusCode, 200);
});

// ── Role gates + user management ─────────────────────────────────────

test('user creation: validation, role gate, duplicate 409', async () => {
  const root = await login(ROOT.username, ROOT.password);
  const pepe = await login(PEPE.username, PEPE.password);

  // Plain admin cannot create users (and the denial is audited).
  const denied = await app.inject({
    method: 'POST', url: '/api/admin/users',
    headers: authed(pepe.token!), payload: { username: 'nope', password: PW_VALID, role: 'admin' },
  });
  assert.equal(denied.statusCode, 403);

  // Invalid username format → 400.
  const badName = await app.inject({
    method: 'POST', url: '/api/admin/users',
    headers: authed(root.token!), payload: { username: 'bad name!', password: PW_VALID },
  });
  assert.equal(badName.statusCode, 400);

  // Too-short password → 400.
  const badPass = await app.inject({
    method: 'POST', url: '/api/admin/users',
    headers: authed(root.token!), payload: { username: 'validname', password: 'short' },
  });
  assert.equal(badPass.statusCode, 400);

  // Valid creation + duplicate → 409.
  const created = await app.inject({
    method: 'POST', url: '/api/admin/users',
    headers: authed(root.token!), payload: { username: 'validname', password: PW_VALID, role: 'admin' },
  });
  assert.equal(created.statusCode, 200);
  const dup = await app.inject({
    method: 'POST', url: '/api/admin/users',
    headers: authed(root.token!), payload: { username: 'validname', password: PW_VALID },
  });
  assert.equal(dup.statusCode, 409);
});

test('maintenance toggle is superadmin-only', async () => {
  const pepe = await login(PEPE.username, PEPE.password);
  const res = await app.inject({ method: 'POST', url: '/api/admin/maintenance', headers: authed(pepe.token!), payload: { enabled: true } });
  assert.equal(res.statusCode, 403);

  const root = await login(ROOT.username, ROOT.password);
  const on = await app.inject({ method: 'POST', url: '/api/admin/maintenance', headers: authed(root.token!), payload: { enabled: true } });
  assert.equal(on.statusCode, 200);
  assert.equal(on.json().maintenance, true);
  const off = await app.inject({ method: 'POST', url: '/api/admin/maintenance', headers: authed(root.token!), payload: { enabled: false } });
  assert.equal(off.json().maintenance, false);
});

test('self-revoke and last-superadmin protections', async () => {
  const root = await login(ROOT.username, ROOT.password);
  const self = await app.inject({ method: 'DELETE', url: `/api/admin/users/${root.body.user.id}`, headers: authed(root.token!) });
  assert.equal(self.statusCode, 400);

  // root is the only ACTIVE superadmin at this point.
  const u = findUserById(root.body.user.id)!;
  assert.equal(u.role, 'superadmin');
  const demoteSelf = await app.inject({
    method: 'POST', url: `/api/admin/users/${root.body.user.id}/role`,
    headers: authed(root.token!), payload: { role: 'admin' },
  });
  assert.equal(demoteSelf.statusCode, 400, 'cannot demote the last active superadmin');
});

test('users listing includes 2FA/rotation flags and no password hashes', async () => {
  const root = await login(ROOT.username, ROOT.password);
  const res = await app.inject({ method: 'GET', url: '/api/admin/users', headers: authed(root.token!) });
  assert.equal(res.statusCode, 200);
  const users = res.json().users;
  assert.ok(users.length >= 4);
  const sample = users[0];
  assert.ok('totp_enabled' in sample);
  assert.ok('must_change_password' in sample);
  assert.ok(!('password_hash' in sample));
  assert.ok(!('totp_secret' in sample));
});

// ── Room moderation ──────────────────────────────────────────────────

test('admin kick removes the viewer (by name), notifies and writes viewer_left', async () => {
  const root = await login(ROOT.username, ROOT.password);
  const room = createRoom('room-kick', 'pinhash', 'host-socket');
  room.viewers.set('vs1', { socketId: 'vs1', name: 'Alice', joinedAt: 1, connected: true });
  room.viewers.set('vs2', { socketId: 'vs2', name: 'Bob', joinedAt: 2, connected: true });
  rooms.set('room-kick', room);
  hostToRoom.set('host-socket', 'room-kick');
  viewerToRoom.set('vs1', 'room-kick');
  viewerToRoom.set('vs2', 'room-kick');
  ioEmits.length = 0;

  const res = await app.inject({
    method: 'POST', url: '/api/admin/rooms/room-kick/kick',
    headers: authed(root.token!), payload: { viewer: 'alice' }, // case-insensitive name
  });
  assert.equal(res.statusCode, 200);
  assert.equal(room.viewers.size, 1, 'Alice removed, Bob stays');
  assert.ok(!viewerToRoom.has('vs1'));

  const kicked = ioEmits.find((e) => e.ev === 'viewer:kicked');
  assert.ok(kicked, 'viewer:kicked emitted');
  assert.equal(kicked!.target, 'vs1');
  const hostNotified = ioEmits.find((e) => e.ev === 'viewer:left');
  assert.ok(hostNotified);
  assert.equal(hostNotified!.target, 'host-socket');

  const evt = db.prepare("SELECT viewer_count FROM room_events WHERE event_type = 'viewer_left' AND room_id = ?").get('room-kick');
  assert.ok(evt, 'viewer_left event written');

  // Unknown viewer → 404.
  const miss = await app.inject({
    method: 'POST', url: '/api/admin/rooms/room-kick/kick',
    headers: authed(root.token!), payload: { viewer: 'nobody' },
  });
  assert.equal(miss.statusCode, 404);
});

test('admin close destroys the room, notifies and writes closed', async () => {
  const root = await login(ROOT.username, ROOT.password);
  assert.ok(rooms.has('room-kick'));

  const res = await app.inject({ method: 'POST', url: '/api/admin/rooms/room-kick/close', headers: authed(root.token!) });
  assert.equal(res.statusCode, 200);
  assert.ok(!rooms.has('room-kick'), 'room deleted');
  assert.ok(!hostToRoom.has('host-socket'));
  assert.ok(ioEmits.some((e) => e.ev === 'room:closed' && e.target === 'room-kick'));

  const evt = db.prepare("SELECT viewer_count FROM room_events WHERE event_type = 'closed' AND room_id = ?").get('room-kick');
  assert.ok(evt, 'closed event written');

  // Closing a missing room → 404.
  const miss = await app.inject({ method: 'POST', url: '/api/admin/rooms/nope/close', headers: authed(root.token!) });
  assert.equal(miss.statusCode, 404);
});

// ── TOTP flow ────────────────────────────────────────────────────────

test('full 2FA lifecycle: setup → enable → code required at login → recovery code → disable', async () => {
  createUser('twofa', PW_TOTP, 'admin');
  const s = await login('twofa', PW_TOTP);
  assert.equal(s.body.user.totpEnabled, false);

  // Setup returns a secret + otpauth URI, not yet enabled.
  const setup = await app.inject({ method: 'POST', url: '/api/admin/totp/setup', headers: authed(s.token!) });
  assert.equal(setup.statusCode, 200);
  const { secret, uri } = setup.json();
  assert.ok(secret.length >= 32);
  assert.ok(uri.startsWith('otpauth://totp/'));

  // Enable with a live code; recovery codes shown exactly once.
  const enable = await app.inject({
    method: 'POST', url: '/api/admin/totp/enable',
    headers: authed(s.token!), payload: { code: totpCode(secret) },
  });
  assert.equal(enable.statusCode, 200);
  const recoveryCodes: string[] = enable.json().recoveryCodes;
  assert.equal(recoveryCodes.length, 8);

  // Cannot re-setup while enabled.
  const again = await app.inject({ method: 'POST', url: '/api/admin/totp/setup', headers: authed(s.token!) });
  assert.equal(again.statusCode, 400);

  // Login now requires the second factor.
  const noCode = await login('twofa', PW_TOTP);
  assert.equal(noCode.statusCode, 401);
  assert.equal(noCode.body.totpRequired, true);

  const withCode = await login('twofa', PW_TOTP, totpCode(secret));
  assert.equal(withCode.statusCode, 200);

  // A recovery code works exactly once.
  const withRecovery = await login('twofa', PW_TOTP, recoveryCodes[3]);
  assert.equal(withRecovery.statusCode, 200, 'recovery code grants login');
  const reuseRecovery = await login('twofa', PW_TOTP, recoveryCodes[3]);
  assert.equal(reuseRecovery.statusCode, 401, 'recovery codes are single-use');

  // Disable requires the account password (+ code when it is your own account).
  const wrongPass = await app.inject({
    method: 'POST', url: '/api/admin/totp/disable',
    headers: authed(withRecovery.token!), payload: { password: PW_TOTP_WRONG, code: totpCode(secret) },
  });
  assert.equal(wrongPass.statusCode, 401);

  const disable = await app.inject({
    method: 'POST', url: '/api/admin/totp/disable',
    headers: authed(withRecovery.token!), payload: { password: PW_TOTP, code: totpCode(secret) },
  });
  assert.equal(disable.statusCode, 200);

  const plain = await login('twofa', PW_TOTP);
  assert.equal(plain.statusCode, 200, 'login works without a code after disabling');
});

// ── Audit + stats ────────────────────────────────────────────────────

test('audit endpoint paginates and filters by action', async () => {
  const root = await login(ROOT.username, ROOT.password);
  const res = await app.inject({ method: 'GET', url: '/api/admin/audit?limit=3&offset=0', headers: authed(root.token!) });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.entries.length, 3);
  assert.ok(body.total >= 3);

  const filtered = await app.inject({ method: 'GET', url: '/api/admin/audit?limit=200&action=login', headers: authed(root.token!) });
  const fb = filtered.json();
  assert.ok(fb.entries.length > 0);
  assert.ok(fb.entries.every((e: any) => e.action.startsWith('login')));

  // Invalid query → 400.
  const bad = await app.inject({ method: 'GET', url: '/api/admin/audit?limit=9999', headers: authed(root.token!) });
  assert.equal(bad.statusCode, 400);
});

test('rollupTrafficStats aggregates today and is idempotent', () => {
  db.prepare('DELETE FROM room_events').run();
  db.prepare('DELETE FROM traffic_stats').run();
  const insert = db.prepare('INSERT INTO room_events (event_type, room_id, host_ip, country, viewer_count) VALUES (?, ?, ?, ?, ?)');
  insert.run('created', 'r1', '1.1.1.1', 'ES', 0);
  insert.run('created', 'r2', '2.2.2.2', 'FR', 0);
  insert.run('viewer_joined', 'r1', '3.3.3.3', 'ES', 1);
  insert.run('viewer_joined', 'r1', '4.4.4.4', 'PT', 5);
  insert.run('viewer_left', 'r1', '4.4.4.4', 'PT', 4);

  rollupTrafficStats();
  const row = db.prepare('SELECT * FROM traffic_stats').get() as any;
  assert.equal(row.total_rooms, 2);
  assert.equal(row.total_viewers, 2, 'only viewer_joined counts as viewer');
  assert.equal(row.peak_viewers, 5, 'peak = max viewer_count across joins');
  const countries = JSON.parse(row.countries);
  assert.equal(countries.ES, 2);
  assert.equal(countries.FR, 1);
  assert.equal(countries.PT, 1);

  // Idempotent: running again yields identical numbers.
  rollupTrafficStats();
  const row2 = db.prepare('SELECT * FROM traffic_stats').get() as any;
  assert.equal(row2.total_rooms, 2);
  assert.equal(row2.peak_viewers, 5);
});

test('stats endpoint returns the rolled-up traffic', async () => {
  const root = await login(ROOT.username, ROOT.password);
  const res = await app.inject({ method: 'GET', url: '/api/admin/stats', headers: authed(root.token!) });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.ok(Array.isArray(body.traffic));
  assert.equal(body.traffic.length, 1);
  assert.equal(body.traffic[0].total_rooms, 2);
  assert.equal(body.totalRoomsCreated, 2);
});

// ── Login rate limiting (LAST — locks the shared test IP for 10 min) ─

test('login rate limit: 5 failures then 429 (with audit)', async () => {
  for (let i = 0; i < 5; i++) {
    const res = await login('bruteforce', PW_INVALID_LOGIN);
    assert.equal(res.statusCode, 401);
  }
  const blocked = await login('bruteforce', PW_INVALID_LOGIN);
  assert.equal(blocked.statusCode, 429);
  // Even valid credentials are blocked while the window is hot.
  const lockedOut = await login(ROOT.username, ROOT.password);
  assert.equal(lockedOut.statusCode, 429);

  const audited = db.prepare("SELECT COUNT(*) as n FROM admin_audit_log WHERE action = 'login_rate_limited'").get() as { n: number };
  assert.ok(audited.n >= 1, 'rate-limited attempts are audited');
});

// ── Teardown ─────────────────────────────────────────────────────────

test('teardown: close app and remove temp db', async () => {
  await app.close();
  db.close();
  rmSync(process.env.WACHAUT_DB_PATH!, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-wal`, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-shm`, { force: true });
});
