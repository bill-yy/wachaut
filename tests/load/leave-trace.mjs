/**
 * Leave trace — why "Salir" does not tell viewers at once.
 *
 *   node leave-trace.mjs --base-url https://wachaut.billytech.es [--runs 1]
 *
 * Host shares, a viewer joins, the host leaves. Both pages log their
 * WebSocket frames (engine.io ping/pong filtered out): which socket, what,
 * and the sending call site. Both logs use the wall clock, so they line up.
 * No credentials: the PIN comes from the host's session at run time.
 */
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const BASE_URL = (opt('base-url', 'https://wachaut.billytech.es')).replace(/\/$/, '');
const RUNS = Number(opt('runs', '1'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WS_TRACE = () => {
  Error.stackTraceLimit = 100; // the app frames sit ~30 deep, below the libraries
  const log = (window.__wsLog = []);
  const noise = (d) => typeof d !== 'string' || /^[23]/.test(d); // engine.io ping/pong
  const tag = (url) => (/sfu/i.test(new URL(url).host) ? 'sfu' : 'sig');
  // Who called send(): the app-level frames below engine.io / socket.io and
  // this script. Names are only meaningful against an unminified build (dev
  // server); in production bundles they collapse to "<anonymous>".
  const origin = () => {
    const frames = (new Error().stack || '').split('\n').slice(2, 80);
    // App source frames only (dev server): everything else is library internals.
    const app = frames.filter((f) => /\/src\//.test(f));
    return app.slice(0, 5).map((f) => f.trim().replace(/^at /, '').replace(/https?:\/\/[^/]+/, '').replace(/\?t=\d+/, '').slice(0, 110)).join(' ← ') || '(library internals)';
  };
  const Orig = window.WebSocket;
  const send = Orig.prototype.send;
  const close = Orig.prototype.close;
  Orig.prototype.send = function (data) {
    if (!noise(data)) log.push({ t: Date.now(), sock: tag(this.url), dir: '>', data: data.slice(0, 84), via: origin() });
    return send.call(this, data);
  };
  Orig.prototype.close = function (code, reason) {
    log.push({ t: Date.now(), sock: tag(this.url), dir: 'X', data: `close() bufferedAmount=${this.bufferedAmount}`, via: origin() });
    return close.call(this, code, reason);
  };
  const Wrapped = function (...args) {
    const ws = new Orig(...args);
    ws.addEventListener('message', (ev) => { if (!noise(ev.data)) log.push({ t: Date.now(), sock: tag(ws.url), dir: '<', data: String(ev.data).slice(0, 84) }); });
    ws.addEventListener('close', (ev) => log.push({ t: Date.now(), sock: tag(ws.url), dir: 'X', data: `onclose code=${ev.code} clean=${ev.wasClean}` }));
    return ws;
  };
  Wrapped.prototype = Orig.prototype;
  Object.assign(Wrapped, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  window.WebSocket = Wrapped;
};

async function newTracedPage(browser) {
  const context = await browser.newContext();
  await context.addInitScript(WS_TRACE);
  return context.newPage();
}
const dump = (entries, t0) => entries.map((e) => `  ${String(e.t - t0).padStart(7)}  ${e.sock}  ${e.dir}  ${e.data}${e.via ? `   ← ${e.via}` : ''}`).join('\n');

const browser = await chromium.launch({
  headless: true,
  args: [
    '--headless=new',
    '--auto-select-desktop-capture-source=Entire screen',
    '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
  ],
});

for (let run = 1; run <= RUNS; run++) {
  const host = await newTracedPage(browser);
  const viewer = await newTracedPage(browser);
  await host.goto(`${BASE_URL}/room`, { waitUntil: 'networkidle' });
  const session = await host.evaluate(() => JSON.parse(sessionStorage.getItem('wachaut.host.session') || 'null'));
  const shareUrl = `${BASE_URL}/room/${session.roomId}#${session.pin}`;
  const cta = host.locator('button', { hasText: /Compartir pantalla|Share screen/ }).last();
  await cta.scrollIntoViewIfNeeded().catch(() => {});
  await cta.click({ timeout: 15_000, force: true });
  await host.waitForFunction(() => (document.querySelector('video')?.srcObject?.getVideoTracks().length || 0) > 0, null, { timeout: 30_000 });

  await viewer.goto(shareUrl, { waitUntil: 'domcontentloaded' });
  await viewer.fill('#va-username', `trace-${run}`);
  const pinReady = await viewer.waitForFunction(() => (document.querySelector('#va-pin')?.value || '').length >= 4, null, { timeout: 10_000 }).then(() => true).catch(() => false);
  if (!pinReady) await viewer.fill('#va-pin', session.pin).catch(() => {});
  await viewer.click('button:has-text("Entrar a ver"), button:has-text("Join and watch")');
  await viewer.waitForFunction(() => [...document.querySelectorAll('video')].some((v) => v.srcObject && v.srcObject.getVideoTracks().length > 0), null, { timeout: 30_000 });
  await sleep(6_000);

  const clickAt = Date.now();
  await host.locator('header button').first().click();
  const dialogAt = Date.now();
  await host.locator('[role="dialog"] button.btn-danger').click();

  const endedAt = await (async () => {
    const start = Date.now();
    while (Date.now() - start < 45_000) {
      if (await viewer.evaluate(() => /La retransmisión ha terminado|The broadcast has ended/.test(document.body.innerText))) return Date.now();
      await sleep(250);
    }
    return null;
  })();

  const hostLog = await host.evaluate((t) => window.__wsLog.filter((e) => e.t >= t), clickAt);
  const viewerLog = await viewer.evaluate((t) => window.__wsLog.filter((e) => e.t >= t), clickAt);
  console.log(`\n=== run ${run}: viewer told after ${endedAt === null ? 'NEVER (45s)' : `${((endedAt - clickAt) / 1000).toFixed(1)}s`} (dialog confirmed at +${dialogAt - clickAt}ms)`);
  console.log('host, ms since the "Volver" click:');
  console.log(dump(hostLog, clickAt));
  console.log('viewer, same clock:');
  console.log(dump(viewerLog.slice(0, 14), clickAt));

  await host.context().close();
  await viewer.context().close();
  await sleep(2_000);
}
await browser.close();
