/**
 * Shared helpers for the load suite: host with real screen capture, viewers,
 * and client-side frame-quality sampling.
 */
import { chromium } from 'playwright';

/**
 * Launch the HOST page with automatic screen-capture selection so
 * getDisplayMedia resolves without a picker dialog. Returns the share URL
 * (with PIN in the hash) once the room is created and sharing starts.
 *
 * Harness notes (all learned the hard way — see spike-svc.mjs history):
 *  - The share CTA must be force-clicked: decorative overlays intercept the
 *    pointer in headless Chromium.
 *  - The share URL is NEVER an <a> — it's behind a copy button. The host
 *    persists {roomId, pin} in sessionStorage once the room is created.
 */
export async function launchHost(baseUrl) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--headless=new',
      // Auto-answer getDisplayMedia with the entire screen in headless mode.
      '--auto-select-desktop-capture-source=Entire screen',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  const page = await browser.newPage();
  page.on('pageerror', (err) => console.error(`[host] pageerror: ${err.message}`));

  await page.goto(`${baseUrl}/room`, { waitUntil: 'networkidle' });

  const cta = page.locator('button', { hasText: /Compartir pantalla|Share screen/ }).last();
  await cta.scrollIntoViewIfNeeded().catch(() => {});
  await cta.click({ timeout: 15_000, force: true });

  const session = await page
    .waitForFunction(
      () => {
        try {
          const raw = sessionStorage.getItem('wachaut.host.session');
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return parsed.roomId && parsed.pin ? parsed : null;
        } catch {
          return null;
        }
      },
      null,
      { timeout: 30_000 },
    )
    .then((h) => h.jsonValue());
  if (!session?.roomId) throw new Error('host: room session never appeared');
  const shareUrl = `${baseUrl}/room/${session.roomId}#${session.pin}`;

  return { browser, page, shareUrl, roomId: session.roomId };
}

/**
 * Launch one viewer against a share URL. Resolves when the remote track is
 * actually attached (the real "joined" signal — a bare <video> in the DOM
 * also exists behind the auth screen).
 */
export async function launchViewer(shareUrl, index) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (err) => console.error(`[viewer ${index}] pageerror: ${err.message}`));

  await page.goto(shareUrl, { waitUntil: 'domcontentloaded' });
  // ViewerAuth: real element ids. Generic input[type=text] selectors match
  // BOTH the username and PIN fields and throw strict-mode, which a .catch()
  // would silently swallow — the viewer never leaves the auth screen.
  await page.fill('#va-username', `load-${index}`.slice(0, 24));
  const pinReady = await page
    .waitForFunction(() => (document.querySelector('#va-pin')?.value || '').length >= 4, null, { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  if (!pinReady) await page.fill('#va-pin', shareUrl.split('#')[1]).catch(() => {});
  await page.click('button:has-text("Entrar a ver"), button:has-text("Join and watch")');
  await page.waitForFunction(
    () => {
      const vs = [...document.querySelectorAll('video')];
      return vs.some((v) => v.srcObject && v.srcObject.getVideoTracks().length > 0);
    },
    null,
    { timeout: 30_000 },
  );

  return { browser, page };
}

/**
 * Sample decode health from a viewer's <video> element.
 * getVideoPlaybackQuality() is standard and cheap to evaluate.
 */
export async function sampleViewer(page) {
  return page.evaluate(() => {
    const video = document.querySelector('video');
    if (!video || typeof video.getVideoPlaybackQuality !== 'function') return null;
    const q = video.getVideoPlaybackQuality();
    return {
      total: q.totalVideoFrames,
      dropped: q.droppedVideoFrames,
      w: video.videoWidth,
      h: video.videoHeight,
      readyState: video.readyState,
    };
  });
}

/** Sample the platform status endpoint (rooms counter). */
export async function sampleStatus(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/status`);
    return await res.json();
  } catch {
    return null;
  }
}

/** Sample the SFU /health (capacity-aware: status/utilization/peers). */
export async function sampleSfuHealth(sfuBaseUrl) {
  try {
    const res = await fetch(`${sfuBaseUrl}/health`);
    return await res.json();
  } catch {
    return null;
  }
}
