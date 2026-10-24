/**
 * Smoke: preset change on a LIVE share actually reaches the encoder.
 *
 * Verifies the three fixes from 2026-10-24 in one pass, against the REAL
 * test SFU (dev bundle points there via apps/web/.env.local):
 *   1. vp9-single produce carries encodings[{maxBitrate}] (no more Chrome
 *      default ~2-2.5M ceiling).
 *   2. The quality panel is reachable while sharing (it used to vanish).
 *   3. Clicking another preset live-applies: sender encodings.maxBitrate
 *      moves (Normal 4.5M → Alta 8M) without re-picking the source.
 *
 * Usage: node tests/load/smoke-live-preset.mjs [baseUrl]
 * (dev server must be running; defaults to http://localhost:5173)
 */
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://localhost:5173';

async function readSenderState(page) {
  return page.evaluate(() => {
    for (const pc of window.__pcs || []) {
      for (const sender of pc.getSenders()) {
        if (sender.track?.kind === 'video') {
          const params = sender.getParameters();
          return {
            codecs: (params.codecs || []).map((c) => c.mimeType),
            encodings: (params.encodings || []).map((e) => ({
              maxBitrate: e.maxBitrate ?? null,
              scale: e.scaleResolutionDownBy ?? null,
              svc: e.scalabilityMode ?? null,
            })),
            trackSettings: sender.track.getSettings(),
          };
        }
      }
    }
    return null;
  });
}

const browser = await chromium.launch({
  headless: true,
  args: [
    '--headless=new',
    '--auto-select-desktop-capture-source=Entire screen',
    '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
  ],
});
const page = await browser.newPage();
page.on('pageerror', (err) => console.error(`[host] pageerror: ${err.message}`));
await page.addInitScript(() => {
  window.__pcs = [];
  const Orig = window.RTCPeerConnection;
  window.RTCPeerConnection = function (...args) {
    const pc = new Orig(...args);
    window.__pcs.push(pc);
    return pc;
  };
  window.RTCPeerConnection.prototype = Orig.prototype;
});
await page.goto(`${baseUrl}/room`, { waitUntil: 'networkidle' });

const cta = page.locator('button', { hasText: /Compartir pantalla|Share screen/ }).last();
await cta.scrollIntoViewIfNeeded().catch(() => {});
await cta.click({ timeout: 15_000, force: true });

// Room creation + transport + produce. Ready when a sender has a video track.
await page.waitForFunction(
  () => {
    for (const pc of window.__pcs || []) {
      for (const s of pc.getSenders()) {
        if (s.track?.kind === 'video') return true;
      }
    }
    return false;
  },
  null,
  { timeout: 30_000 },
);

const before = await readSenderState(page);
console.log('[1] producer up (default preset "Normal"):');
console.log('    codec:', JSON.stringify(before.codecs));
console.log('    encodings:', JSON.stringify(before.encodings));
console.log('    track:', JSON.stringify({ w: before.trackSettings.width, h: before.trackSettings.height, fps: before.trackSettings.frameRate }));

// Open the quality panel WHILE SHARING (impossible before the sidebar fix).
const toggle = page.locator('button[aria-expanded]', { hasText: /Calidad|Quality/ }).first();
await toggle.click({ timeout: 5_000 });
const alta = page.locator('button', { hasText: /Alta calidad|High quality/ }).first();
await alta.waitFor({ state: 'visible', timeout: 5_000 });
await alta.click();

// Give the async live-apply (applyConstraints + setParameters) a beat.
await page.waitForTimeout(2_000);

const after = await readSenderState(page);
console.log('[2] after clicking "Alta calidad" mid-share:');
console.log('    encodings:', JSON.stringify(after.encodings));
console.log('    track:', JSON.stringify({ w: after.trackSettings.width, h: after.trackSettings.height, fps: after.trackSettings.frameRate }));

const beforeMax = before.encodings.at(-1)?.maxBitrate;
const afterMax = after.encodings.at(-1)?.maxBitrate;
console.log(`[3] maxBitrate: ${beforeMax} → ${afterMax}`);

let verdict = 'FALLO';
if (beforeMax === 4_500_000 && afterMax === 8_000_000) {
  verdict = 'GATE SUPERADO — vp9-single nace con techo del preset y el cambio aplica en vivo';
} else if (afterMax === 8_000_000) {
  verdict = 'GATE SUPERADO — live-apply OK (techo inicial inesperado: ' + beforeMax + ')';
} else if (beforeMax && afterMax && afterMax !== beforeMax) {
  verdict = `PARCIAL — cambió (${beforeMax} → ${afterMax}) pero no a 8M`;
}
console.log(`VEREDICTO: ${verdict}`);

await browser.close();
process.exit(verdict.startsWith('GATE') ? 0 : 1);
