/**
 * Load orchestrator — spawns rooms × viewers, samples client decode health
 * and platform status, writes CSVs into results/.
 *
 *   node run.mjs --base-url https://wachaut.billytech.es --rooms 1 --viewers 10 --minutes 5
 */
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { launchHost, launchViewer, sampleViewer, sampleStatus } from './lib.mjs';

const args = process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc[a.slice(2)] = arr[i + 1];
  return acc;
}, {});

const BASE_URL = args['base-url'] || 'https://wachaut.billytech.es';
const ROOMS = parseInt(args.rooms || '1', 10);
const VIEWERS = parseInt(args.viewers || '5', 10);
const MINUTES = parseFloat(args.minutes || '5', 10);
const SAMPLE_MS = 10_000;

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 17);
const outDir = new URL(`./results/r${ROOMS}x${VIEWERS}-${stamp}/`, import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const viewersCsv = `${outDir}viewers.csv`;
const statusCsv = `${outDir}status.csv`;
writeFileSync(viewersCsv, 'ts,viewer,total_frames,dropped_frames,width,height,ready_state\n');
writeFileSync(statusCsv, 'ts,rooms,maintenance\n');

console.log(`[load] ${ROOMS} room(s) × ${VIEWERS} viewer(s) for ${MINUTES} min against ${BASE_URL}`);
console.log('[load] remember: run sample-server.sh on the VPS in parallel!');

const hosts = [];
const viewers = [];

try {
  // 1. Hosts (real screen capture, one per room).
  for (let r = 0; r < ROOMS; r++) {
    const host = await launchHost(BASE_URL);
    console.log(`[load] room ${r + 1}: ${host.shareUrl}`);
    hosts.push(host);
    await sleep(3_000);
  }

  // 2. Viewers, spread across the rooms round-robin.
  for (let i = 0; i < VIEWERS; i++) {
    const host = hosts[i % hosts.length];
    const viewer = await launchViewer(host.shareUrl, i);
    viewers.push(viewer);
    console.log(`[load] viewer ${i + 1}/${VIEWERS} up`);
    // Small stagger so joins don't arrive in the same tick.
    await sleep(500);
  }

  // 3. Sample until the clock runs out.
  const deadline = Date.now() + MINUTES * 60_000;
  let tick = 0;
  while (Date.now() < deadline) {
    await sleep(SAMPLE_MS);
    tick++;
    const ts = new Date().toISOString();
    for (let i = 0; i < viewers.length; i++) {
      const s = await sampleViewer(viewers[i].page).catch(() => null);
      if (s) {
        appendFileSync(viewersCsv, `${ts},${i},${s.total},${s.dropped},${s.w},${s.h},${s.readyState}\n`);
      }
    }
    const status = await sampleStatus(BASE_URL);
    if (status) appendFileSync(statusCsv, `${ts},${status.rooms ?? '?'}?,${status.maintenance}\n`);
    if (tick % 6 === 0) console.log(`[load] ${Math.round((deadline - Date.now()) / 1000)}s left… rooms=${status?.rooms}`);
  }
} finally {
  console.log('[load] closing browsers…');
  await Promise.allSettled([...viewers, ...hosts].map((c) => c.browser.close()));
  console.log(`[load] done → ${outDir}`);
  console.log('[load] next: node report.mjs tests/load/results/');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
