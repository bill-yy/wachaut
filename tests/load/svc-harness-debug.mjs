/**
 * Debug the stalled VP9-SVC sender: after sharing, dump the REAL state of
 * every RTCPeerConnection on the host page — sender parameters (encodings,
 * active, codec), track state, and the negotiated SDP video m-line.
 */
import { chromium } from 'playwright';

const BASE_URL = process.argv[2] || 'http://127.0.0.1:5173';

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
  args: [
    '--headless=new',
    '--auto-select-desktop-capture-source=Entire screen',
    '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
  ],
});
const page = await browser.newPage();
await page.addInitScript(PC_HOOK);
page.on('console', (m) => {
  const t = m.text();
  if (t.includes('[sfu]') || m.type() === 'error') console.log(' [host]', t.slice(0, 300));
});

await page.goto(`${BASE_URL}/room`, { waitUntil: 'networkidle' });
const cta = page.locator('button', { hasText: /Compartir pantalla|Share screen/ }).last();
await cta.scrollIntoViewIfNeeded().catch(() => {});
await cta.click({ timeout: 15_000, force: true });
console.log('--- share clicked, waiting 12s for producer + ICE ---');
await new Promise((r) => setTimeout(r, 12_000));

const dump = await page.evaluate(async () => {
  const out = { pcs: [] };
  for (const pc of window.__pcs || []) {
    const entry = { state: pc.connectionState, transceivers: [] };
    for (const t of pc.getTransceivers()) {
      if (t.sender && t.sender.track?.kind !== 'audio' && t.sender.track) {
        const p = t.sender.getParameters();
        entry.transceivers.push({
          track: {
            label: t.sender.track.label.slice(0, 40),
            readyState: t.sender.track.readyState,
            muted: t.sender.track.muted,
            enabled: t.sender.track.enabled,
          },
          encodings: p.encodings,
          degradationPreference: p.degradationPreference ?? null,
          codecs: (p.codecs || []).filter((c) => c.mimeType?.includes('VP') || c.mimeType?.includes('vp')).map((c) => c.mimeType + ' ' + (c.sdpFmtpLine || '')),
          active: t.currentDirection,
        });
      }
    }
    const sdp = pc.localDescription?.sdp || '';
    const m = sdp.split('m=video')[1];
    if (m) {
      entry.sdpVideo = ('m=video' + m)
        .split('\r\n')
        .filter((l) => /^(m=video|a=rtpmap|a=fmtp|a=rid|a=simulcast|a=extmap|a=sendrecv|a=sendonly|a=mid)/.test(l))
        .slice(0, 25);
    }
    out.pcs.push(entry);
  }
  // outbound stats snapshot
  out.stats = [];
  for (const pc of window.__pcs || []) {
    const s = await pc.getStats();
    s.forEach((r) => {
      if (r.type === 'outbound-rtp' && r.kind === 'video') out.stats.push({ bytes: r.bytesSent, frames: r.framesEncoded, qp: r.qpSum });
    });
  }
  return out;
});

console.log(JSON.stringify(dump, null, 2));
await browser.close();
