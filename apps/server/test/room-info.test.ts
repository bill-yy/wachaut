/**
 * Tests for the public /api/room-info endpoint + title sanitization +
 * push subscription validation. Boots a real Fastify app with the room
 * map (same pattern as room-ttl.test.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createRoom, sanitizeTitle } from '../src/room-store.js';
import { pinHash } from '../src/security.js';
import { initPush, registerPushRoutes, pushEnabled } from '../src/push.js';
import { registerFeedbackRoutes } from '../src/feedback.js';

function buildApp(rooms: Map<string, any>) {
  const app = Fastify();
  app.get('/api/room-info/:roomId', { logLevel: 'error' }, async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(roomId)) return reply.code(400).send({ error: 'invalid room id' });
    const room = rooms.get(roomId);
    if (!room) return reply.code(404).send({ exists: false });
    return {
      exists: true,
      live: room.isSharing,
      viewers: Array.from(room.viewers.values()).filter((v: any) => v.connected).length,
      title: room.title ?? null,
    };
  });
  registerPushRoutes(app, (id) => rooms.has(id));
  return app;
}

test('sanitizeTitle: trims, collapses whitespace, caps at 80, rejects control chars and mojibake', () => {
  assert.equal(sanitizeTitle('  Partido   Barça–Madrid '), 'Partido Barça–Madrid');
  assert.equal(sanitizeTitle(undefined), undefined);
  assert.equal(sanitizeTitle('   '), undefined);
  assert.equal(sanitizeTitle('x'.repeat(120))?.length, 80);
  assert.equal(sanitizeTitle('bad\u0000ctrl'), 'bad ctrl');
  assert.equal(sanitizeTitle('moji\ufffdfd'), undefined);
});

test('createRoom stores the sanitized title', () => {
  const room = createRoom('r1', pinHash('123456'), 'host1', new Date(), 'sec', 'Mi título');
  assert.equal(room.title, 'Mi título');
  const room2 = createRoom('r2', pinHash('123456'), 'host1', new Date(), 'sec');
  assert.equal(room2.title, undefined);
});

test('room-info: 404 for unknown rooms, no secrets leaked for live ones', async () => {
  const rooms = new Map();
  const room = createRoom('live1', pinHash('123456'), 'host1', new Date(), 'topsecret', 'Partido');
  room.isSharing = true;
  room.viewers.set('v1', { socketId: 'v1', name: 'ana', joinedAt: Date.now(), connected: true });
  room.viewers.set('v2', { socketId: 'v2', name: 'bob', joinedAt: Date.now(), connected: false });
  rooms.set('live1', room);
  const app = buildApp(rooms);

  const missing = await app.inject({ method: 'GET', url: '/api/room-info/nope' });
  assert.equal(missing.statusCode, 404);
  assert.deepEqual(missing.json(), { exists: false });

  const bad = await app.inject({ method: 'GET', url: '/api/room-info/bad%20id%21' });
  assert.equal(bad.statusCode, 400);

  const live = await app.inject({ method: 'GET', url: '/api/room-info/live1' });
  assert.equal(live.statusCode, 200);
  const body = live.json();
  assert.equal(body.exists, true);
  assert.equal(body.live, true);
  assert.equal(body.viewers, 1); // only the connected one
  assert.equal(body.title, 'Partido');
  // No secret material may ever appear.
  assert.ok(!JSON.stringify(body).includes('topsecret'));
  assert.ok(!JSON.stringify(body).includes('123456'));

  await app.close();
});

test('push: key endpoint works after init; subscribe validates strictly', async () => {
  // Use a temp data dir so keys are generated on the fly (never in source).
  initPush('./test/tmp-push-data');
  assert.ok(pushEnabled());

  const rooms = new Map([['r9', createRoom('r9', pinHash('123456'), 'h', new Date(), 's')]]);
  const app = buildApp(rooms);

  const key = await app.inject({ method: 'GET', url: '/api/push/key' });
  assert.equal(key.statusCode, 200);
  assert.match(key.json().publicKey, /^[A-Za-z0-9_-]{80,}$/);

  // Unknown room → 404
  const badRoom = await app.inject({ method: 'POST', url: '/api/push/subscribe', payload: { roomId: 'nope', subscription: { endpoint: 'https://fcm.example/x', keys: { p256dh: 'k', auth: 'a' } } } });
  assert.equal(badRoom.statusCode, 404);

  // Malformed subscription → 400 (non-https endpoint, missing keys)
  const bad1 = await app.inject({ method: 'POST', url: '/api/push/subscribe', payload: { roomId: 'r9', subscription: { endpoint: 'http://insecure', keys: { p256dh: 'k', auth: 'a' } } } });
  assert.equal(bad1.statusCode, 400);
  const bad2 = await app.inject({ method: 'POST', url: '/api/push/subscribe', payload: { roomId: 'r9', subscription: { endpoint: 'https://fcm.example/x' } } });
  assert.equal(bad2.statusCode, 400);

  // Valid → 204
  const ok = await app.inject({ method: 'POST', url: '/api/push/subscribe', payload: { roomId: 'r9', subscription: { endpoint: 'https://fcm.example/x', keys: { p256dh: 'k', auth: 'a' } } } });
  assert.equal(ok.statusCode, 204);

  await app.close();
});
