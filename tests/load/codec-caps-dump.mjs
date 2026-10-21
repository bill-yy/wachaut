/** Dump RTCRtpSender.getCapabilities('video') codec entries incl. scalabilityModes. */
import { chromium } from 'playwright';

const channel = process.env.CHANNEL || undefined;
const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
const page = await browser.newPage();
await page.goto('https://wachaut.billytech.es', { waitUntil: 'domcontentloaded' });
const caps = await page.evaluate(() => {
  const c = RTCRtpSender.getCapabilities('video');
  return {
    ua: navigator.userAgent,
    codecs: c.codecs.map((x) => ({
      mime: x.mimeType,
      fmtp: x.sdpFmtpLine || '',
      modes: x.scalabilityModes || [],
    })),
  };
});
console.log(JSON.stringify(caps, null, 2));
await browser.close();
