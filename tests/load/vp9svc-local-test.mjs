/**
 * Forced-codec loopback: does headless Chromium encode VP9 (SVC L3T3 and
 * plain) when VP9 is ACTUALLY negotiated? setCodecPreferences pins VP9 on
 * both sides; we verify the answer's PT and count framesEncoded.
 */
import { chromium } from 'playwright';

const mode = process.argv[2] || 'svc'; // svc | plain | vp8
const headed = !!process.env.HEADED;
const channel = process.env.CHANNEL || undefined; // 'chrome' | 'msedge' → system browser
const browser = await chromium.launch({
  headless: !headed,
  ...(channel ? { channel } : {}),
  ...(process.env.NOHW ? { args: ['--disable-accelerated-video-encode', '--disable-accelerated-video-decode'] } : {}),
  args: [
    '--headless=new',
    '--auto-select-desktop-capture-source=Entire screen',
    '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
  ],
});
const page = await browser.newPage();
await page.goto('https://wachaut.billytech.es', { waitUntil: 'domcontentloaded' });

const result = await page.evaluate(async (mode) => {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 } });
  const track = stream.getVideoTracks()[0];
  const out = { mode, settings: { w: track.getSettings().width, h: track.getSettings().height } };

  const pcSend = new RTCPeerConnection();
  const pcRecv = new RTCPeerConnection();
  pcSend.onicecandidate = (e) => e.candidate && pcRecv.addIceCandidate(e.candidate).catch(() => {});
  pcRecv.onicecandidate = (e) => e.candidate && pcSend.addIceCandidate(e.candidate).catch(() => {});

  const sendEncodings =
    mode === 'svc' ? [{ scalabilityMode: 'L3T3', maxBitrate: 4_500_000 }] : [{ maxBitrate: 4_500_000 }];
  const tx = pcSend.addTransceiver(track, {
    direction: 'sendonly',
    sendEncodings,
    streams: [stream],
  });
  // Pin the codec on both sides so the answer cannot fall back to VP8.
  const target = mode === 'vp8' ? 'video/VP8' : 'video/VP9';
  for (const pc of [pcSend, pcRecv]) {
    const caps = RTCRtpSender.getCapabilities('video');
    const wanted = caps.codecs.filter((c) => c.mimeType === target);
    pc.getTransceivers().at(-1)?.setCodecPreferences?.([...wanted]);
    if (pc === pcRecv) pc.getTransceivers().at(-1)?.direction && (pc.getTransceivers().at(-1).direction = 'recvonly');
  }

  const offer = await pcSend.createOffer();
  await pcSend.setLocalDescription(offer);
  await pcRecv.setRemoteDescription(offer);
  const answer = await pcRecv.createAnswer();
  await pcRecv.setLocalDescription(answer);
  await pcSend.setRemoteDescription(answer);

  // Which PT did the answer pick?
  const mLine = answer.sdp.split('m=video')[1].split('\r\n')[0];
  const pt = mLine.split(' ')[3];
  const rtpmap = answer.sdp.split('\r\n').find((l) => l.includes(`a=rtpmap:${pt} `)) || '';
  out.negotiated = rtpmap.replace('a=rtpmap:', '');

  out.samples = [];
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const stats = await pcSend.getStats();
    stats.forEach((r) => {
      if (r.type === 'outbound-rtp' && r.kind === 'video') {
        out.samples.push({ t: i * 3, bytes: r.bytesSent, frames: r.framesEncoded });
      }
    });
    out.ice = pcSend.connectionState;
  }
  return out;
}, mode);

console.log(JSON.stringify(result, null, 2));
const last = result.samples.at(-1) || {};
console.log(`\nnegotiated=${result.negotiated}  frames=${last.frames}  bytes=${last.bytes}`);
await browser.close();
