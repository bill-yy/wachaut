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
            // The constraints APPLIED to the capture track: any width/height
            // here means Chrome is resampling the screen before encoding
            // (the 2K-crushed-to-1080p disease). Native presets must leave
            // them empty.
            constraints: sender.track.getConstraints(),
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
console.log('    track constraints:', JSON.stringify(before.constraints), '← must NOT contain width/height (native capture)');
console.log('    track:', JSON.stringify({ w: before.trackSettings.width, h: before.trackSettings.height, fps: before.trackSettings.frameRate }));

// Poll until the video sender's top-rung maxBitrate reaches `bps` (encodings
// updates are async and can lag the click by a beat). Returns false on timeout
// so the verdict can tell a missed click from a failed apply.
async function waitForMaxBitrate(page, bps, ms = 10_000) {
  return page
    .waitForFunction(
      (target) => {
        for (const pc of window.__pcs || []) {
          for (const s of pc.getSenders()) {
            if (s.track?.kind === 'video') {
              const enc = (s.getParameters().encodings || []);
              return enc.at(-1)?.maxBitrate === target;
            }
          }
        }
        return false;
      },
      bps,
      { timeout: ms, polling: 500 },
    )
    .then(() => true)
    .catch(() => false);
}

// Open the quality panel WHILE SHARING (impossible before the sidebar fix).
const toggle = page.locator('button[aria-expanded]', { hasText: /Calidad|Quality/ }).first();
await toggle.click({ timeout: 5_000, force: true });
const alta = page.locator('button', { hasText: /Alta calidad|High quality/ }).first();
await alta.waitFor({ state: 'visible', timeout: 5_000 });
await alta.scrollIntoViewIfNeeded().catch(() => {});
await alta.click();
const altaApplied = await waitForMaxBitrate(page, 8_000_000);

const after = await readSenderState(page);
console.log('[2] after clicking "Alta calidad" mid-share:');
console.log('    encodings:', JSON.stringify(after.encodings));
console.log('    track:', JSON.stringify({ w: after.trackSettings.width, h: after.trackSettings.height, fps: after.trackSettings.frameRate }));

const beforeMax = before.encodings.at(-1)?.maxBitrate;
const afterMax = after.encodings.at(-1)?.maxBitrate;
console.log(`[3] maxBitrate: ${beforeMax} → ${afterMax}`);

// [4] Capped preset still constrains: "Liviano" must apply a 720p cap live.
const baja = page.locator('button', { hasText: /Liviano|Light/ }).first();
await baja.waitFor({ state: 'visible', timeout: 5_000 });
await baja.scrollIntoViewIfNeeded().catch(() => {});
await baja.click();
const bajaApplied = await waitForMaxBitrate(page, 1_500_000);
const bajaState = await readSenderState(page);
console.log('[4] after clicking "Liviano" mid-share:');
console.log('    applied:', bajaApplied);
console.log('    encodings:', JSON.stringify(bajaState.encodings));
console.log('    track constraints:', JSON.stringify(bajaState.constraints), '← must contain width/height (720p cap)');

const noSizeConstraints =
  !before.constraints.width && !before.constraints.height;
const cappedConstraints =
  !!bajaState.constraints.width && !!bajaState.constraints.height;

let verdict = 'FALLO';
if (altaApplied && bajaApplied && noSizeConstraints && cappedConstraints) {
  verdict = 'GATE SUPERADO — captura nativa en Normal/Alta, cap 720p en Liviano, preset aplica en vivo';
} else if (altaApplied && noSizeConstraints) {
  verdict = `GATE SUPERADO — nativo + live-apply OK (revisar Liviano: applied=${bajaApplied} cap=${cappedConstraints})`;
} else if (afterMax !== beforeMax) {
  verdict = `PARCIAL — nativo=${noSizeConstraints} alta=${altaApplied} liviano=${bajaApplied}`;
}
console.log(`VEREDICTO: ${verdict}`);

await browser.close();
process.exit(verdict.startsWith('GATE') ? 0 : 1);
