/**
 * Reconnection probe — a real host and real viewers against a deployed
 * environment, for the host-reconnect paths of the "host reclaim race" fix.
 *
 *   node reconnect-probe.mjs --base-url https://wachaut.billytech.es
 *
 * Scenarios (each prints PASS/FAIL and how long things took):
 *   base     host shares, a viewer decodes: the pipeline still works.
 *   leave    the host leaves: viewers are told at once, not after 30s.
 *   refresh  the host reloads mid-share: the same link can be shared on.
 *   cut      the host's sockets die on its side only — what a network
 *            change looks like to it — and the broadcast must come back.
 *
 * "Media is flowing" is read from the viewer's own RTCPeerConnection
 * (inbound video bytes), not from the <video> element: the captured screen
 * is static, so frames are sparse. No credentials are involved: the room
 * PIN is read from the host's session at run time.
 */
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
  return acc;
}, []));
const BASE_URL = (args['base-url'] || 'https://wachaut.billytech.es').replace(/\/$/, '');
const LABEL = (es, en) => `${es}|${en}`;

// Keeps every RTCPeerConnection the page creates, so the probe can read
// getStats() itself (the app's own polling only runs in some states).
const PC_HOOK = () => {
  window.__pcs = [];
  const Orig = window.RTCPeerConnection;
  window.RTCPeerConnection = function (...ctorArgs) {
    const pc = new Orig(...ctorArgs);
    window.__pcs.push(pc);
    return pc;
  };
  window.RTCPeerConnection.prototype = Orig.prototype;
};

const HOST_ARGS = [
  '--headless=new',
  // Auto-answer getDisplayMedia with the entire screen in headless mode.
  '--auto-select-desktop-capture-source=Entire screen',
  '--use-fake-ui-for-media-stream',
  '--autoplay-policy=no-user-gesture-required',
];

const results = [];
function report(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(8)} ${detail}`);
}

async function newPage(browser) {
  const context = await browser.newContext();
  await context.addInitScript(PC_HOOK);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  return { context, page, consoleErrors };
}

/** Viewer-side facts: inbound video bytes per stream (ssrc), tracks on the stream, what the page says. */
async function viewerMedia(page) {
  return page.evaluate(async () => {
    const streams = {};
    let decoded = 0;
    let state = null;
    for (const pc of window.__pcs || []) {
      if (pc.connectionState === 'closed') continue;
      state = pc.connectionState;
      const stats = await pc.getStats();
      for (const r of stats.values()) {
        if (r.type === 'inbound-rtp' && r.kind === 'video') {
          streams[r.ssrc] = (streams[r.ssrc] || 0) + r.bytesReceived;
          decoded += r.framesDecoded;
        }
      }
    }
    const video = document.querySelector('video');
    const text = document.body.innerText;
    return {
      streams,
      bytes: Object.values(streams).reduce((a, b) => a + b, 0),
      decoded,
      state,
      tracks: video?.srcObject ? video.srcObject.getVideoTracks().length : 0,
      ended: /La retransmisión ha terminado|The broadcast has ended/.test(text),
      reconnecting: /anfitrión se está reconectando|host is reconnecting/.test(text),
    };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * True once inbound video bytes keep growing: two samples `windowMs` apart.
 * The SFU refreshes a static screen with a keyframe about every 15s, so the
 * window has to be longer than that.
 */
async function flowing(page, windowMs = 22_000) {
  const before = await viewerMedia(page);
  await sleep(windowMs);
  const after = await viewerMedia(page);
  return { before, after, grew: after.bytes > before.bytes };
}

/**
 * After a host reconnect the host re-produces, so the viewer receives a NEW
 * stream (a new ssrc). Waits for one that was not there at `baseline` and
 * whose bytes are growing — the old one can keep flowing meanwhile, so
 * "bytes went up" alone proves nothing.
 */
async function untilNewStream(page, baseline, maxMs, stepMs = 3_000) {
  const t0 = Date.now();
  const known = new Set(Object.keys(baseline.streams));
  let prev = null;
  while (Date.now() - t0 < maxMs) {
    await sleep(stepMs);
    const now = await viewerMedia(page);
    const fresh = Object.entries(now.streams).filter(([ssrc, bytes]) => !known.has(ssrc) && bytes > 0);
    if (fresh.length && prev && fresh.every(([ssrc, bytes]) => bytes > (prev.streams[ssrc] ?? 0))) {
      return { ms: Date.now() - t0, media: now, ssrcs: fresh.map(([s]) => s) };
    }
    prev = now;
  }
  return { ms: null, media: prev ?? baseline, ssrcs: [] };
}

const shareCta = (page) => page.locator('button', { hasText: /Compartir pantalla|Share screen/ }).last();

/** Opens the host page, creates the room and (re)starts sharing. */
async function startSharing(page) {
  const cta = shareCta(page);
  await cta.scrollIntoViewIfNeeded().catch(() => {});
  await cta.click({ timeout: 15_000, force: true });
  await page.waitForFunction(
    () => (document.querySelector('video')?.srcObject?.getVideoTracks().length || 0) > 0,
    null,
    { timeout: 30_000 },
  );
}

async function openHost(browser, { routeSockets = false } = {}) {
  const { context, page, consoleErrors } = await newPage(browser);
  const sockets = { sfu: [], signaling: [] };
  if (routeSockets) {
    await context.routeWebSocket(/socket\.io/, (ws) => {
      const isSfu = /sfu/i.test(new URL(ws.url()).host);
      (isSfu ? sockets.sfu : sockets.signaling).push(ws);
      // The outage is on the host's side: when the page loses a socket, the
      // server side is left open, so the server only notices at its ping
      // timeout — seconds after the host has already reconnected.
      ws.onClose(() => {});
      ws.connectToServer();
    });
  }
  await page.goto(`${BASE_URL}/room`, { waitUntil: 'networkidle' });
  const session = await page.evaluate(() => JSON.parse(sessionStorage.getItem('wachaut.host.session') || 'null'));
  if (!session?.roomId || !session?.pin) throw new Error('host: no room session in sessionStorage');
  await startSharing(page);
  return { context, page, consoleErrors, sockets, session, shareUrl: `${BASE_URL}/room/${session.roomId}#${session.pin}` };
}

async function openViewer(browser, shareUrl, index) {
  const { context, page, consoleErrors } = await newPage(browser);
  await page.goto(shareUrl, { waitUntil: 'domcontentloaded' });
  // ViewerAuth: real element ids (generic selectors match both fields).
  await page.fill('#va-username', `probe-${index}`.slice(0, 24));
  const pinReady = await page
    .waitForFunction(() => (document.querySelector('#va-pin')?.value || '').length >= 4, null, { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  if (!pinReady) await page.fill('#va-pin', shareUrl.split('#')[1]).catch(() => {});
  await page.click('button:has-text("Entrar a ver"), button:has-text("Join and watch")');
  await page.waitForFunction(
    () => [...document.querySelectorAll('video')].some((v) => v.srcObject && v.srcObject.getVideoTracks().length > 0),
    null,
    { timeout: 30_000 },
  );
  return { context, page, consoleErrors };
}

async function close(...handles) {
  for (const h of handles.flat()) await h.context.close().catch(() => {});
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: HOST_ARGS });
  console.log(`reconnect probe → ${BASE_URL}\n`);

  // ── base + leave ────────────────────────────────────────────────────
  {
    const host = await openHost(browser);
    const viewer = await openViewer(browser, host.shareUrl, 1);
    const flow = await flowing(viewer.page);
    report('base', flow.grew && flow.after.tracks === 1 && flow.after.state === 'connected',
      `viewer inbound video ${flow.before.bytes} → ${flow.after.bytes} bytes in 22s · ${flow.after.tracks} video track(s) · pc ${flow.after.state}`);

    const t0 = Date.now();
    await host.page.locator('header button').first().click();
    await host.page.locator('[role="dialog"] button.btn-danger').click();
    let endedMs = null;
    while (Date.now() - t0 < 40_000) {
      if ((await viewerMedia(viewer.page)).ended) { endedMs = Date.now() - t0; break; }
      await sleep(500);
    }
    report('leave', endedMs !== null && endedMs < 10_000,
      `viewer told the broadcast ended after ${endedMs === null ? '>40s (never)' : `${(endedMs / 1000).toFixed(1)}s`}`);
    await close(host, viewer);
  }

  // ── refresh ─────────────────────────────────────────────────────────
  {
    const host = await openHost(browser);
    const viewerBefore = await openViewer(browser, host.shareUrl, 2);
    const flow = await flowing(viewerBefore.page);
    if (!flow.grew) report('refresh', false, 'setup: the viewer never received video before the reload');

    await host.page.reload({ waitUntil: 'networkidle' });
    // The refreshed page recreates the room from its stored session; the
    // SFU secret travels with it, so the SFU accepts the host back.
    const stored = await host.page.evaluate(() => JSON.parse(sessionStorage.getItem('wachaut.host.session') || 'null'));
    let shareError = null;
    try { await startSharing(host.page); } catch (err) { shareError = err.message; }
    await sleep(3_000);
    const hostErrors = host.consoleErrors.filter((m) => /\[sfu\]/.test(m));

    let viewerAfter = null;
    let after = { grew: false };
    if (!shareError) {
      viewerAfter = await openViewer(browser, host.shareUrl, 3);
      after = await flowing(viewerAfter.page);
    }
    report('refresh', !!stored?.sfuHostSecret && !shareError && after.grew && after.after.tracks === 1 && hostErrors.length === 0,
      `SFU secret kept across reload: ${stored?.sfuHostSecret ? 'yes' : 'NO'} · share again: ${shareError ? `FAILED (${shareError})` : 'ok'} · new viewer on the same link: ${after.grew ? `video ${after.after.bytes} bytes / ${after.after.tracks} track(s)` : 'NO VIDEO'} · SFU errors on the host: ${hostErrors.length}`);
    await close(host, viewerBefore, viewerAfter);
  }

  // ── cut (the host's network path changes) ───────────────────────────
  {
    const host = await openHost(browser, { routeSockets: true });
    const viewer = await openViewer(browser, host.shareUrl, 4);
    const flow = await flowing(viewer.page);
    if (!flow.grew) report('cut', false, 'setup: the viewer never received video before the cut');

    const baseline = await viewerMedia(viewer.page);
    const cutAt = Date.now();
    const current = [...host.sockets.sfu, ...host.sockets.signaling];
    for (const ws of current) await ws.close({ code: 1001, reason: 'probe: network path changed' }).catch(() => {});
    console.log(`       cut ${current.length} socket(s) on the host side (${host.sockets.sfu.length} SFU, ${host.sockets.signaling.length} signaling)`);

    // The server only notices the dead sockets at its ping timeout (up to
    // 45s), and only then can the host's re-join be accepted: the wait is
    // expected to be in the tens of seconds.
    const recovered = await untilNewStream(viewer.page, baseline, 170_000);
    await sleep(8_000);
    const media = await viewerMedia(viewer.page);
    const newBytes = recovered.ssrcs.reduce((sum, s) => sum + (media.streams[s] ?? 0), 0);
    const sfuErrors = host.consoleErrors.filter((m) => /\[sfu\]|retransmisión/i.test(m));
    const reconnected = host.sockets.sfu.length >= 2 && host.sockets.signaling.length >= 2;
    report('cut', recovered.ms !== null && media.tracks === 1 && !media.ended && newBytes > 0 && sfuErrors.length === 0,
      `host reconnected ${reconnected ? 'both sockets' : `sfu=${host.sockets.sfu.length} signaling=${host.sockets.signaling.length} (expected ≥2 each)`} · new video stream after ${recovered.ms === null ? 'NEVER (170s)' : `${(recovered.ms / 1000).toFixed(0)}s`} (${recovered.ssrcs.length} new ssrc, ${newBytes} bytes) · ${media.tracks} video track(s) at the end · room closed: ${media.ended} · host errors: ${sfuErrors.length}${sfuErrors.length ? ` (${sfuErrors[0].slice(0, 120)})` : ''}`);
    await close(host, viewer);
  }

  await browser.close();
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${failed === 0 ? 'PROBE: ALL SCENARIOS PASSED' : `PROBE: ${failed} SCENARIO(S) FAILED`}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('probe crashed:', err?.stack || err);
  process.exit(2);
});
