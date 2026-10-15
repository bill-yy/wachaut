/**
 * Contact + feedback integration tests: public endpoints (validation,
 * rate limits, per-role question enums, dedupe) and the admin workflow
 * (list/read/delete audited; feedback aggregation).
 */
import { fileURLToPath } from 'node:url';

process.env.WACHAUT_DB_PATH = fileURLToPath(new URL('./tmp-feedback-test.db', import.meta.url));
process.env.ADMIN_JWT_SECRET = 'test-secret-0123456789abcdef';

const { registerFeedbackRoutes } = await import('../src/feedback.ts');
const { registerAdminRoutes } = await import('../src/admin/routes.ts');
const { db } = await import('../src/db.ts');
const authMod = await import('../src/admin/auth.ts');
const Fastify = (await import('fastify')).default;

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { rmSync } = await import('node:fs');

const app = Fastify({ ajv: { customOptions: { removeAdditional: false, allErrors: true } } });
registerFeedbackRoutes(app);
registerAdminRoutes(app as any, {
  rooms: new Map(), viewerToRoom: new Map(), hostToRoom: new Map(),
  io: { engine: { clientsCount: 0 }, to: () => ({ emit: () => {} }) },
  connectionCounts: new Map(), sfuHealthUrl: '',
});

// Fixture passphrase (throwaway DB — not a real credential).
const PW_ROOT = 'root-fixture-passphrase';
authMod.createUser('root', PW_ROOT, 'superadmin');
let token = '';

async function login() {
  const res = await app.inject({ method: 'POST', url: '/api/admin/login', payload: { username: 'root', password: PW_ROOT } });
  return res.json().token as string;
}

// ── Contact ──────────────────────────────────────────────────────────

test('contact: records with country + hash, never the raw IP', async () => {
  const res = await app.inject({
    method: 'POST', url: '/api/contact',
    payload: { name: 'Guille', email: 'Guille@Example.com', message: 'Hola, me encanta la app' },
  });
  assert.equal(res.statusCode, 200);
  const row = db.prepare('SELECT * FROM contact_messages').get() as any;
  assert.equal(row.name, 'Guille');
  assert.equal(row.email, 'guille@example.com', 'email normalized to lowercase');
  assert.ok(row.ip_hash.length === 16);
  assert.ok(!JSON.stringify(row).includes('127.0.0.1'), 'raw IP never stored');
});

test('contact: validation rejects bad payloads', async () => {
  const bad = [
    {},                                        // no message
    { message: 'hola' },                       // < 5 chars
    { message: 'x'.repeat(2001) },             // too long
    { message: 'valid message', email: 'nope' }, // bad email format
    { message: 'valid message', extra: 1 },    // unknown property
  ];
  for (const payload of bad) {
    const res = await app.inject({ method: 'POST', url: '/api/contact', payload });
    assert.equal(res.statusCode, 400, JSON.stringify(payload));
  }
});

test('contact + feedback: reject mojibake (U+FFFD) text instead of storing garbage', async () => {
  // A client that sent non-UTF-8 bytes produces the replacement char at
  // parse time (information already lost) — reject with a clear 400.
  const contact = await app.inject({
    method: 'POST', url: '/api/contact',
    payload: { message: 'Mensaje de verificaci\uFFFDn del formulario' },
  });
  assert.equal(contact.statusCode, 400);

  const feedback = await app.inject({
    method: 'POST', url: '/api/feedback',
    payload: { roomId: 'room-moji-0001', role: 'viewer', rating: 5, comment: 'Todo perfect\uFFFD' },
  });
  assert.equal(feedback.statusCode, 400);
});

test('contact: rate limited past 5 per minute per IP', async () => {
  let last = 200;
  for (let i = 0; i < 8 && last !== 429; i++) {
    const res = await app.inject({
      method: 'POST', url: '/api/contact',
      payload: { message: `mensaje de prueba número ${i} para el limitador` },
    });
    last = res.statusCode;
  }
  assert.equal(last, 429);
});

test('contact: admin list, mark read (audited) and delete', async () => {
  db.prepare('DELETE FROM admin_audit_log').run();
  token = await login();
  const auth = { authorization: `Bearer ${token}` };

  const list = await app.inject({ method: 'GET', url: '/api/admin/contact?limit=100', headers: auth });
  assert.equal(list.statusCode, 200);
  const body = list.json();
  assert.ok(body.total >= 2);
  assert.ok(body.unread >= 1);
  const first = body.messages[0];

  const read = await app.inject({
    method: 'POST', url: `/api/admin/contact/${first.id}/read`, headers: auth, payload: { read: true },
  });
  assert.equal(read.statusCode, 200);
  const audited = db.prepare("SELECT COUNT(*) as n FROM admin_audit_log WHERE action LIKE 'contact_read:%'").get() as any;
  assert.ok(audited.n >= 1);

  const unreadAfter = await app.inject({ method: 'GET', url: '/api/admin/contact', headers: auth });
  assert.equal(unreadAfter.json().unread, body.unread - 1);

  const del = await app.inject({ method: 'DELETE', url: `/api/admin/contact/${first.id}`, headers: auth });
  assert.equal(del.statusCode, 200);
  const missing = await app.inject({ method: 'GET', url: '/api/admin/contact', headers: auth });
  assert.ok(!missing.json().messages.some((m: any) => m.id === first.id));
});

// ── Feedback ─────────────────────────────────────────────────────────

test('feedback: accepts viewer answers with valid enums', async () => {
  const res = await app.inject({
    method: 'POST', url: '/api/feedback',
    payload: {
      roomId: 'room-fb-0001', role: 'viewer', rating: 4,
      answers: { video: 'cortes', entrada: 'sin_problemas', recomendaria: 'si' },
      comment: 'Iba genial salvo algún corte', vid: 'verify-fb-0001',
    },
  });
  assert.equal(res.statusCode, 200);
  const row = db.prepare('SELECT * FROM feedback ORDER BY id DESC LIMIT 1').get() as any;
  assert.equal(row.role, 'viewer');
  assert.equal(row.rating, 4);
  assert.deepEqual(JSON.parse(row.answers), { video: 'cortes', entrada: 'sin_problemas', recomendaria: 'si' });
});

test('feedback: rejects host-question keys for viewers and invalid enum values', async () => {
  const wrongKey = await app.inject({
    method: 'POST', url: '/api/feedback',
    payload: { roomId: 'room-fb-0002', role: 'viewer', rating: 5, answers: { emision: 'facil' } },
  });
  assert.equal(wrongKey.statusCode, 400, "viewer can't answer host questions");

  const wrongValue = await app.inject({
    method: 'POST', url: '/api/feedback',
    payload: { roomId: 'room-fb-0002', role: 'host', rating: 5, answers: { emision: 'genial' } },
  });
  assert.equal(wrongValue.statusCode, 400, 'invalid enum value rejected');

  const badRating = await app.inject({
    method: 'POST', url: '/api/feedback',
    payload: { roomId: 'room-fb-0002', role: 'host', rating: 9 },
  });
  assert.equal(badRating.statusCode, 400);
});

test('feedback: host role accepts its own questions', async () => {
  const res = await app.inject({
    method: 'POST', url: '/api/feedback',
    payload: { roomId: 'room-fb-0003', role: 'host', rating: 5, answers: { emision: 'facil', estabilidad: 'estable', volveria: 'si' } },
  });
  assert.equal(res.statusCode, 200);
});

test('feedback: dedupe — same IP+room+role within 24h returns 409', async () => {
  const again = await app.inject({
    method: 'POST', url: '/api/feedback',
    payload: { roomId: 'room-fb-0001', role: 'viewer', rating: 1 },
  });
  assert.equal(again.statusCode, 409);
  // Same room but the other role is a different voice — allowed.
  const host = await app.inject({
    method: 'POST', url: '/api/feedback',
    payload: { roomId: 'room-fb-0001', role: 'host', rating: 5 },
  });
  assert.equal(host.statusCode, 200);
});

test('feedback: admin aggregation (average, distribution, per-question counts)', async () => {
  const auth = { authorization: `Bearer ${token}` };
  const res = await app.inject({ method: 'GET', url: '/api/admin/feedback?days=7', headers: auth });
  assert.equal(res.statusCode, 200);
  const body = res.json();

  assert.equal(body.count, 3);
  assert.equal(body.average, 4.7); // (4 + 5 + 5) / 3
  assert.deepEqual(body.distribution, [0, 0, 0, 1, 2]);
  assert.equal(body.roles.viewer, 1);
  assert.equal(body.roles.host, 2);

  const viewerVideo = body.questions.viewer.find((q: any) => q.question.includes('vídeo'));
  assert.ok(viewerVideo, 'viewer question present with zero counts');
  const cortes = viewerVideo.options.find((o: any) => o.value === 'cortes');
  assert.equal(cortes.count, 1);
  const fluida = viewerVideo.options.find((o: any) => o.value === 'fluida');
  assert.equal(fluida.count, 0, 'zero-count options included for a stable UI shape');

  const hostEmision = body.questions.host.find((q: any) => q.question.includes('emitiendo'));
  assert.equal(hostEmision.options.find((o: any) => o.value === 'facil').count, 1);
  assert.ok(body.recent.length === 3);
  assert.ok(body.recent.every((r: any) => typeof r.id === 'number'), 'recent rows carry their id for deletion');
});

test('feedback: admin can delete an individual rating (audited)', async () => {
  const auth = { authorization: `Bearer ${token}` };
  db.prepare('DELETE FROM admin_audit_log').run();

  const before = await app.inject({ method: 'GET', url: '/api/admin/feedback?days=7', headers: auth });
  const firstId = before.json().recent[0].id;
  const countBefore = before.json().count;

  const del = await app.inject({ method: 'DELETE', url: `/api/admin/feedback/${firstId}`, headers: auth });
  assert.equal(del.statusCode, 200);

  const after = await app.inject({ method: 'GET', url: '/api/admin/feedback?days=7', headers: auth });
  assert.equal(after.json().count, countBefore - 1, 'aggregates reflect the deletion');
  assert.ok(!after.json().recent.some((r: any) => r.id === firstId));

  const audited = db.prepare("SELECT COUNT(*) as n FROM admin_audit_log WHERE action LIKE 'feedback_delete:%'").get() as any;
  assert.ok(audited.n >= 1, 'feedback deletion is audited');

  const missing = await app.inject({ method: 'DELETE', url: '/api/admin/feedback/99999', headers: auth });
  assert.equal(missing.statusCode, 404);
});

// ── Teardown ─────────────────────────────────────────────────────────

test('teardown: close app and remove temp db', async () => {
  await app.close();
  db.close();
  rmSync(process.env.WACHAUT_DB_PATH!, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-wal`, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-shm`, { force: true });
});
