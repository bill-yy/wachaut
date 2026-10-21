/**
 * Shared helpers for the load suite: host with real screen capture, viewers,
 * and client-side frame-quality sampling.
 */
import { chromium } from 'playwright';

/**
 * Launch the HOST page with automatic screen-capture selection so
 * getDisplayMedia resolves without a picker dialog. Returns the share URL
 * (with PIN in the hash) once the room is created and sharing starts.
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

  // The host UI exposes the share link once sharing starts. Wait for it.
  const link = await page.waitForSelector('a[href*="/room/"]', { timeout: 30_000 });
  const href = await link.getAttribute('href');
  if (!href) throw new Error('host: share link not found');
  const shareUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;

  return { browser, page, shareUrl };
}

/**
 * Launch one viewer against a share URL. Resolves when the video element
 * starts decoding (playback quality counter moving).
 */
export async function launchViewer(shareUrl, index) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (err) => console.error(`[viewer ${index}] pageerror: ${err.message}`));

  await page.goto(shareUrl, { waitUntil: 'domcontentloaded' });
  // ViewerAuth form: username input + join. The PIN arrives via the URL hash.
  await page.fill('input[name="username"], input[placeholder*="nombre"], input[type="text"]', `load-${index}`.slice(0, 24)).catch(() => {});
  await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Join")').catch(() => {});
  await page.waitForSelector('video', { timeout: 30_000 });

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
