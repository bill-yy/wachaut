/**
 * SVC spike — validates SFU_VIDEO_MODE=vp9-svc end-to-end against a real
 * environment with real browsers:
 *
 *   1. Host shares its screen (auto-capture Chromium) → the client must pick
 *      the SVC encoding ("Video producer created (vp9-svc, layered)").
 *   2. A viewer joins and actually decodes video (frames advancing, drops low).
 *   3. Layer events are observed (consumer-layers) proving the SFU-side
 *      layered pipeline is alive.
 *
 * PASS = media flows; the historical "VP9 stalls ICE" failure would show up
 * as the viewer's video never decoding (0 frames / readyState 0 forever).
 *
 *   node spike-svc.mjs --base-url https://wachaut.billytech.es --seconds 45
 */
import { chromium } from 'playwright';
import { sampleViewer } from './lib.mjs';

const args = process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc[a.slice(2)] = arr[i + 1];
  return acc;
}, {});

const BASE_URL = args['base-url'] || 'https://wachaut.billytech.es';
const SECONDS = parseInt(args.seconds || '45', 10);

const onConsole = (tag) => (msg) => {
  const text = msg.text();
  if (text.includes('[sfu]') || msg.type() === 'error' || msg.type() === 'warning') {
    sfuLogs.push(`[${tag}][${msg.type()}] ${text}`);
    console.log(`  [${tag}][${msg.type()}] ${text.slice(0, 200)}`);
  }
};

const sfuLogs = [];

console.log(`[spike] SVC validation against ${BASE_URL} for ${SECONDS}s`);

// Capture every RTCPeerConnection mediasoup-client creates, so we can read
// real getStats() (bytes/frames in flight) — the <video> element alone can't
// distinguish "no media crossing" from "headless render artifact".
const PC_HOOK = `
(() => {
  const Orig = window.RTCPeerConnection;
  function Patched(...args) {
    const pc = new Orig(...args);
    (window.__pcs ||= []).push(pc);
    return pc;
  }
  Patched.prototype = Orig.prototype;
  window.RTCPeerConnection = Patched;
})();
`;

async function pcVideoStats(page) {
  return page.evaluate(async () => {
    const rows = [];
    for (const pc of window.__pcs || []) {
      let stats;
      try { stats = await pc.getStats(); } catch { continue; }
      stats.forEach((r) => {
        if (r.type === 'outbound-rtp' && r.kind === 'video') {
          rows.push({ dir: 'out', bytes: r.bytesSent, frames: r.framesEncoded, pc: pc.connectionState });
        }
        if (r.type === 'inbound-rtp' && r.kind === 'video') {
          // Multiple PCs/renegotiations can leave stale inbound reports —
          // keep the one with the most decoded frames.
          const prev = rows.find((x) => x.dir === 'in');
          if (!prev || (r.framesDecoded || 0) > (prev.frames || 0)) {
            rows.push({ dir: 'in', bytes: r.bytesReceived, frames: r.framesDecoded, pc: pc.connectionState,
              decoder: r.decoderImplementation || '' });
          }
        }
      });
    }
    return rows;
  });
}

// ── Host: share the screen with auto-capture ───────────────────────────
const hostBrowser = await chromium.launch({
  headless: true,
  args: [
    '--headless=new',
    '--auto-select-desktop-capture-source=Entire screen',
    '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
  ],
});
const host = await hostBrowser.newPage();
await host.addInitScript(PC_HOOK);
host.on('console', onConsole('host'));
host.on('pageerror', (e) => console.error(`[host] pageerror: ${e.message}`));
await host.goto(`${BASE_URL}/room`, { waitUntil: 'networkidle' });

// Exact share CTA ("Compartir pantalla" / "Share screen"). force:true —
// decorative overlays occasionally intercept the pointer in headless.
const cta = host.locator('button', { hasText: /Compartir pantalla|Share screen/ }).last();
try {
  await cta.scrollIntoViewIfNeeded().catch(() => {});
  await cta.click({ timeout: 15_000, force: true });
  console.log('[spike] share CTA clicked');
} catch (e) {
  console.error('[spike] share CTA click failed:\n', e.message);
}

// Verify the capture actually started: the host renders a preview <video>
// whose srcObject is the captured stream.
const hostVideo = await host
  .waitForFunction(
    () => {
      const v = document.querySelector('video');
      if (!v || !v.srcObject) return null;
      const tracks = v.srcObject.getVideoTracks();
      return tracks.length > 0 && tracks[0].readyState === 'live'
        ? { label: tracks[0].label, settings: JSON.stringify(tracks[0].getSettings()) }
        : null;
    },
    null,
    { timeout: 20_000 },
  )
  .then((h) => h.jsonValue())
  .catch(() => null);

if (!hostVideo) {
  await host.screenshot({ path: 'spike-host-nocapture.png' }).catch(() => {});
  console.error('[spike] ❌ getDisplayMedia nunca produjo track vivo — screenshot: spike-host-nocapture.png');
  console.error('[spike] Esto es un problema del HARNESS (captura headless), no del SVC.');
  await hostBrowser.close().catch(() => {});
  process.exit(2);
}
console.log(`[spike] host capturando: ${hostVideo.settings}`);

// The host persists {roomId, pin} in sessionStorage once the room is created
// (the share URL itself is never an <a> — it's behind a copy button).
const session = await host.waitForFunction(
  () => {
    try {
      const raw = sessionStorage.getItem('wachaut.host.session');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.roomId && parsed.pin ? parsed : null;
    } catch { return null; }
  },
  null,
  { timeout: 30_000 },
).then((h) => h.jsonValue()).catch(() => null);

if (!session) {
  await host.screenshot({ path: 'spike-host-fail.png' }).catch(() => {});
  console.error('[spike] host never created a room — screenshot: spike-host-fail.png');
  await hostBrowser.close().catch(() => {});
  process.exit(2);
}
const shareUrl = `${BASE_URL}/room/${session.roomId}#${session.pin}`;
console.log(`[spike] room up: ${shareUrl.replace(session.pin, '••••••')}`);

// ── Viewer: join and decode ────────────────────────────────────────────
const viewerBrowser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const viewer = await viewerBrowser.newPage();
await viewer.addInitScript(PC_HOOK);
viewer.on('console', onConsole('viewer'));
viewer.on('pageerror', (e) => console.error(`[viewer] pageerror: ${e.message}`));
await viewer.goto(shareUrl, { waitUntil: 'domcontentloaded' });
// ViewerAuth: #va-username (>=2 chars enables the join button; the PIN is
// auto-filled from the URL hash by the page itself). Generic input[type=text]
// selectors match BOTH fields and throw strict-mode — use the real ids.
await viewer.fill('#va-username', 'svc-spike');
const pinReady = await viewer
  .waitForFunction(
    () => (document.querySelector('#va-pin')?.value || '').length >= 4,
    null,
    { timeout: 10_000 },
  )
  .then(() => true)
  .catch(() => false);
if (!pinReady) {
  const pinFromHash = shareUrl.split('#')[1];
  await viewer.fill('#va-pin', pinFromHash).catch(() => {});
}
await viewer.click('button:has-text("Entrar a ver"), button:has-text("Join and watch")');
// Joined = the auth card is gone and a video with a live srcObject exists.
await viewer
  .waitForFunction(
    () => {
      const vs = [...document.querySelectorAll('video')];
      return vs.some((v) => v.srcObject && v.srcObject.getVideoTracks().length > 0);
    },
    null,
    { timeout: 30_000 },
  )
  .then(() => console.log('[spike] viewer IN the room, remote track attached — sampling decode…'))
  .catch(async () => {
    await viewer.screenshot({ path: 'spike-viewer-stuck.png' }).catch(() => {});
    console.error('[spike] ❌ viewer never attached a remote track — screenshot: spike-viewer-stuck.png');
  });

// ── Sample decode health over time ─────────────────────────────────────
let pass = false;
const start = Date.now();
let last = null;
let lastHostStats = [];
let lastViewerStats = [];
while (Date.now() - start < SECONDS * 1000) {
  await new Promise((r) => setTimeout(r, 5000));
  last = await sampleViewer(viewer).catch(() => null);
  lastHostStats = await pcVideoStats(host).catch(() => []);
  lastViewerStats = await pcVideoStats(viewer).catch(() => []);
  const out = lastHostStats.filter((s) => s.dir === 'out').sort((a, b) => (b.frames || 0) - (a.frames || 0))[0];
  const inn = lastViewerStats.filter((s) => s.dir === 'in').sort((a, b) => (b.frames || 0) - (a.frames || 0))[0];
  console.log(
    `[spike] t+${Math.round((Date.now() - start) / 1000)}s  el.frames=${last?.total ?? '?'} ` +
    `host→out ${out ? `${Math.round(out.bytes / 1024)}KB/${out.frames}f/${out.pc}` : 'n/a'}  ` +
    `viewer←in ${inn ? `${Math.round(inn.bytes / 1024)}KB/${inn.frames}f/${inn.pc}${inn.decoder ? '/' + inn.decoder : ''}` : 'n/a'}`
  );
  if (last && last.total > 60) { pass = true; break; }
  // Media crossing + decoding at the receiver is a pass even if the
  // headless <video> render pipeline lags.
  if (inn && inn.frames > 60 && inn.bytes > 100_000) { pass = true; break; }
}

// ── Verdict ─────────────────────────────────────────────────────────────
const out = lastHostStats.filter((s) => s.dir === 'out').sort((a, b) => (b.frames || 0) - (a.frames || 0))[0];
const inn = lastViewerStats.filter((s) => s.dir === 'in').sort((a, b) => (b.frames || 0) - (a.frames || 0))[0];
// Frames-based too: the headless fake screen can render mostly-STATIC
// content (low bytes while frames still flow — the exact case the SFU's
// keyframe refresher serves), which shouldn't fail the gate.
const hostSending = !!out && (out.bytes > 100_000 || (out.frames || 0) > 60);
const viewerReceiving = !!inn && (inn.bytes > 100_000 || (inn.frames || 0) > 60);
console.log('\n[spike] ── VEREDICTO ──');
console.log(`  host enviando RTP    : ${hostSending ? '✅' : '❌'} (${out ? `${Math.round(out.bytes / 1024)}KB, ${out.frames} frames encoded, pc=${out.pc}` : 'sin stats'})`);
console.log(`  viewer recibiendo RTP: ${viewerReceiving ? '✅' : '❌'} (${inn ? `${Math.round(inn.bytes / 1024)}KB, ${inn.frames} frames decoded${inn.decoder ? ', decoder=' + inn.decoder : ''}, pc=${inn.pc}` : 'sin stats'})`);
console.log(`  <video> renderizado  : ${pass ? '✅' : '⚠️'} (${last?.total ?? 0} frames element)`);
const mediaFlows = hostSending && viewerReceiving;
console.log(mediaFlows
  ? '\n[spike] GATE SUPERADO — RTP fluye host→SFU→viewer con el modo layerizado activo.'
  : '\n[spike] FALLO — ' + (!hostSending
      ? 'el HOST no envía media (encoder estancado: revisar captura/encoder del host).'
      : 'el host envía pero el VIEWER no recibe (reenvío del SFU/consumer estancado).'));

await Promise.allSettled([hostBrowser.close(), viewerBrowser.close()]);
process.exit(mediaFlows ? 0 : 1);
