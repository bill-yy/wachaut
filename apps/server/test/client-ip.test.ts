/**
 * Real-client-IP resolution: CF-Connecting-IP wins (Cloudflare strips
 * spoofed inbound values), XFF leftmost covers direct→Traefik traffic,
 * socket address is the last resort. Also proves the Fastify onRequest
 * override feeds req.ip to routes (rate limits, audit, alerts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { clientIpFromHeaders } = await import('../src/security.ts');
const Fastify = (await import('fastify')).default;

test('clientIpFromHeaders: CF-Connecting-IP beats XFF and socket', () => {
  const headers = {
    'cf-connecting-ip': '186.84.12.9',
    'x-forwarded-for': '162.158.123.160, 10.0.0.5',
  };
  assert.equal(clientIpFromHeaders(headers, '127.0.0.1'), '186.84.12.9');
});

test('clientIpFromHeaders: XFF leftmost when no CF header (direct→Traefik)', () => {
  assert.equal(clientIpFromHeaders({ 'x-forwarded-for': '176.227.150.246, 172.18.0.2' }, '172.18.0.2'), '176.227.150.246');
});

test('clientIpFromHeaders: garbage headers fall back to the socket address', () => {
  assert.equal(clientIpFromHeaders({ 'cf-connecting-ip': 'not an ip!!' }, '10.1.2.3'), '10.1.2.3');
  assert.equal(clientIpFromHeaders({ 'x-forwarded-for': ', ,' }, '10.1.2.3'), '10.1.2.3');
  assert.equal(clientIpFromHeaders({}, '10.1.2.3'), '10.1.2.3');
});

test('clientIpFromHeaders: handles IPv6', () => {
  assert.equal(clientIpFromHeaders({ 'cf-connecting-ip': '2001:db8::1' }, 'fe80::1'), '2001:db8::1');
});

test('fastify hook: routes see the CF client IP as req.ip', async () => {
  const { clientIpFromHeaders: fromHeaders } = await import('../src/security.ts');
  const app = Fastify();
  app.addHook('onRequest', async (req) => {
    const ip = fromHeaders(req.headers, req.ip);
    if (ip !== req.ip) {
      Object.defineProperty(req, 'ip', { value: ip, configurable: true });
    }
  });
  app.get('/whoami', async (req) => ({ ip: req.ip }));

  const a = await app.inject({ method: 'GET', url: '/whoami', headers: { 'cf-connecting-ip': '186.84.12.9' } });
  assert.equal(JSON.parse(a.body).ip, '186.84.12.9');

  const b = await app.inject({ method: 'GET', url: '/whoami' });
  assert.ok(JSON.parse(b.body).ip.length > 0, 'no header → still an IP');

  await app.close();
});
