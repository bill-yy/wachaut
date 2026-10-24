/**
 * Viewer-only diagnostic for a LIVE room: joins with the real ViewerAuth
 * flow and samples what the viewer actually receives — resolution, decode
 * bitrate, frame rate, decoder — plus the outbound stats of the host's
 * producer as seen from our inbound. Usage:
 *
 *   node viewer-probe.mjs https://wachaut.com/room/<id>#<pin>
 */
import { chromium } from 'playwright';

const url = process.argv[2];
if (!url || !url.includes('#')) {
  console.error('uso: node viewer-probe.mjs https://host/room/<id>#<pin>');
  process.exit(2);
}
const SECONDS = parseInt(process.env.SECONDS || '30', 10);

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

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.addInitScript(PC_HOOK);
page.on('pageerror', (e) => console.error('[pageerror]', e.message));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.fill('#va-username', 'diag-probe');
const pinReady = await page
  .waitForFunction(() => (document.querySelector('#va-pin')?.value || '').length >= 4, null, { timeout: 10_000 })
  .then(() => true)
  .catch(() => false);
if (!pinReady) await page.fill('#va-pin', url.split('#')[1]).catch(() => {});
await page.click('button:has-text("Entrar a ver"), button:has-text("Join and watch")');
await page.waitForFunction(
  () => [...document.querySelectorAll('video')].some((v) => v.srcObject && v.srcObject.getVideoTracks().length > 0),
  null,
  { timeout: 30_000 },
);
console.log('[probe] joined, track attached — sampling…');

// Read the quality selector's "active layer" footer (what the SFU is
// actually serving THIS viewer) — same info the user sees in the gear.
async function readActiveLayer() {
  try {
    const btn = page.locator('button[aria-label="Calidad"], button[aria-label="Quality"]');
    if (!(await btn.count())) return '(no gear)';
    await btn.first().click({ timeout: 3000 });
    const txt = await page
      .locator('div[role="menu"]')
      .last()
      .innerText({ timeout: 3000 });
    await btn.first().click().catch(() => {});
    return txt.split('\n').filter((l) => !/^(Auto|Alta|Media|Baja|High|Medium|Low|Auto)$/.test(l.trim())).join(' | ');
  } catch (e) {
    return `(gear read failed: ${e.message.split('\n')[0]})`;
  }
}

let lastBytes = 0;
let lastTs = 0;
let lastFrames = 0;
for (let i = 0; i < SECONDS / 5; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const s = await page.evaluate(async () => {
    const v = [...document.querySelectorAll('video')].find((x) => x.srcObject?.getVideoTracks().length);
    if (!v) return null;
    const q = v.getVideoPlaybackQuality();
    let inbound = null;
    for (const pc of window.__pcs || []) {
      const stats = await pc.getStats().catch(() => null);
      if (!stats) continue;
      stats.forEach((r) => {
        if (r.type === 'inbound-rtp' && r.kind === 'video' && (r.framesDecoded || 0) > (inbound?.frames || 0)) {
          inbound = {
            bytes: r.bytesReceived,
            frames: r.framesDecoded,
            decoder: r.decoderImplementation || '',
            bitrateKbps_target: r.bitrateMean ?? null,
            frameWidth: r.frameWidth,
            frameHeight: r.frameHeight,
          };
        }
      });
    }
    return {
      videoW: v.videoWidth,
      videoH: v.videoHeight,
      elFrames: q.totalVideoFrames,
      dropped: q.droppedVideoFrames,
      inbound,
    };
  });
  if (!s) { console.log('[probe] no video'); continue; }
  const layerTxt = await readActiveLayer();
  const now = Date.now();
  let line = `[probe] t+${(i + 1) * 5}s res=${s.videoW}x${s.videoH} elFrames=${s.elFrames}`;
  if (s.inbound) {
    if (lastTs) {
      const kbps = Math.round(((s.inbound.bytes - lastBytes) * 8) / (now - lastTs));
      const fps = ((s.inbound.frames - lastFrames) * 1000) / (now - lastTs);
      line += ` | in ${kbps}kbps ${fps.toFixed(1)}fps dec=${s.inbound.frames} decoder=${s.inbound.decoder}`;
    }
    lastBytes = s.inbound.bytes;
    lastFrames = s.inbound.frames;
    lastTs = now;
  }
  line += ` | gear: ${layerTxt}`;
  console.log(line);
}
// Visual evidence: screenshot the video element as the viewer sees it.
await page.screenshot({ path: 'probe-view.png' });
console.log('[probe] screenshot → probe-view.png');
await browser.close();
