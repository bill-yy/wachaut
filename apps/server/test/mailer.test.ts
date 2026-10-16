/**
 * Mailer quota-logic tests: disabled no-op, immediate-first + batched
 * repeats, per-type and global caps, suppressed-digest, retry on failure.
 * The HTTP layer is stubbed (globalThis.fetch) — no real API key is used;
 * the synthetic key below is generated at runtime and sends nowhere.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const m = await import('../src/mailer.ts');

const T0 = 1_700_000_000_000; // fixed epoch for deterministic clock math

// Synthetic, obviously-fake credentials (never a real secret).
const FAKE_KEY = `re_test_${'x'.repeat(24)}`;
const FAKE_TO = 'alerts@example.invalid';

let calls: { url: string; auth: string; body: any }[] = [];
const realFetch = globalThis.fetch;

function installFetch(ok: boolean, status = 200) {
  calls = [];
  globalThis.fetch = (async (url: any, init: any) => {
    calls.push({ url: String(url), auth: init?.headers?.Authorization || '', body: JSON.parse(init.body) });
    return new Response(ok ? '{"id":"test"}' : '{"error":"fail"}', { status });
  }) as any;
}

async function drainMicrotasks() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

test('mailer: silent no-op without RESEND_API_KEY', async () => {
  m.__resetMailerForTests();
  delete process.env.RESEND_API_KEY;
  delete process.env.ADMIN_NOTIFY_EMAIL;
  m.initMailer();
  installFetch(true);
  m.notifyAdmin('security', 'Intento de login fallido (ES)', ['linea 1'], { nowMs: T0 });
  await drainMicrotasks();
  assert.equal(calls.length, 0);
  assert.equal(m.mailerStatus().enabled, false);
});

test('mailer: first event sends immediately, repeats inside cooldown batch', async () => {
  m.__resetMailerForTests();
  process.env.RESEND_API_KEY = FAKE_KEY;
  process.env.ADMIN_NOTIFY_EMAIL = FAKE_TO;
  m.initMailer();
  installFetch(true);

  m.notifyAdmin('security', 'Intento de login fallido (ES)', ['intento 1'], { nowMs: T0 });
  await drainMicrotasks();
  assert.equal(calls.length, 1);
  assert.match(calls[0].body.subject, /login fallido/);
  assert.equal(calls[0].body.to[0], FAKE_TO);
  assert.match(calls[0].body.from, /@wachaut\.com/);

  // Two repeats within the 10-min cooldown → queued, not sent.
  m.notifyAdmin('security', 'Intento de login fallido (ES)', ['intento 2'], { nowMs: T0 + 60_000 });
  m.notifyAdmin('security', 'Intento de login fallido (ES)', ['intento 3'], { nowMs: T0 + 90_000 });
  await drainMicrotasks();
  assert.equal(calls.length, 1);
  assert.equal(m.mailerStatus().queuedBatches, 1);

  // Flush 5 minutes later → one aggregated "(×2)" email.
  m.flushMailer(T0 + 5 * 60_000);
  await drainMicrotasks();
  assert.equal(calls.length, 2);
  assert.match(calls[1].body.subject, /×2/);
  assert.match(calls[1].body.text, /intento 3/); // last occurrence included
  assert.equal(m.mailerStatus().queuedBatches, 0);
});

test('mailer: per-type daily cap suppresses and the digest reports it', async () => {
  m.__resetMailerForTests();
  process.env.RESEND_API_KEY = FAKE_KEY;
  process.env.ADMIN_NOTIFY_EMAIL = FAKE_TO;
  m.initMailer();
  installFetch(true);

  // errors cap = 20. Send 20 new distinct error groups (distinct subjects
  // each get their own immediate send), then one more → suppressed.
  for (let i = 0; i < 20; i++) {
    m.notifyAdmin('errors', `Nuevo error (web): comp-${i}`, ['e'], { nowMs: T0 + i * 1000 });
  }
  await drainMicrotasks();
  assert.equal(calls.length, 20);
  assert.equal(m.mailerStatus().byType.errors, 20);

  m.notifyAdmin('errors', 'Nuevo error (web): overflow', ['e'], { nowMs: T0 + 30_000 });
  await drainMicrotasks();
  assert.equal(calls.length, 20, 'capped — no extra send');
  assert.equal(m.mailerStatus().suppressed.errors, 1);

  // First flush inside the digest window does nothing digest-wise…
  m.flushMailer(T0 + 60_000);
  await drainMicrotasks();
  assert.equal(calls.length, 20);

  // …but 20h later the digest goes out and clears the suppressed count.
  m.flushMailer(T0 + 21 * 60 * 60 * 1000);
  await drainMicrotasks();
  assert.equal(calls.length, 21);
  assert.match(calls[20].body.subject, /Resumen diario/);
  assert.match(calls[20].body.text, /errors: 1/);
});

test('mailer: failed send is retried once on the next flush', async () => {
  m.__resetMailerForTests();
  process.env.RESEND_API_KEY = FAKE_KEY;
  process.env.ADMIN_NOTIFY_EMAIL = FAKE_TO;
  m.initMailer();
  installFetch(false, 500);

  m.notifyAdmin('contact', 'Contacto de Ana', ['hola'], { nowMs: T0 });
  await drainMicrotasks();
  assert.equal(calls.length, 1, 'attempt made, failed');

  installFetch(true);
  m.flushMailer(T0 + 5 * 60_000);
  await drainMicrotasks();
  assert.equal(calls.length, 1, 'retry used the reinstalled fetch');
  assert.match(calls[0].body.subject, /Contacto de Ana/);
});

test('mailer: day rollover resets counters', async () => {
  m.__resetMailerForTests();
  process.env.RESEND_API_KEY = FAKE_KEY;
  process.env.ADMIN_NOTIFY_EMAIL = FAKE_TO;
  m.initMailer();
  installFetch(true);

  m.notifyAdmin('security', 'Intento de login fallido (ES)', ['a'], { nowMs: T0 });
  await drainMicrotasks();
  assert.equal(m.mailerStatus().sentToday, 1);

  // 25h later = different UTC day → counters reset, immediate again.
  m.notifyAdmin('security', 'Intento de login fallido (ES)', ['b'], { nowMs: T0 + 25 * 60 * 60 * 1000 });
  await drainMicrotasks();
  assert.equal(m.mailerStatus().sentToday, 1);
  assert.equal(calls.length, 2);
});

// Restore the real fetch for any later suite in this process.
test('mailer: restore fetch', () => {
  globalThis.fetch = realFetch;
  m.__resetMailerForTests();
  delete process.env.RESEND_API_KEY;
  delete process.env.ADMIN_NOTIFY_EMAIL;
});
