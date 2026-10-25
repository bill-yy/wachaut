/**
 * Create a REAL room on each environment (host harness), then ask THAT env's
 * SFU directly what videoMode its join-room ack announces.
 *
 * Usage: node tests/load/probe-env-videomode.mjs
 */
import { launchHost } from './lib.mjs';

const envs = [
  { label: 'PROD', base: 'https://wachaut.com', sfu: 'wss://sfu.wachaut.com' },
  { label: 'TEST', base: 'https://wachaut.billytech.es', sfu: 'wss://sfu-wachaut.billytech.es' },
];

const { execFileSync } = await import('node:child_process');

for (const env of envs) {
  const { browser, page, shareUrl, roomId } = await launchHost(env.base);
  const pin = shareUrl.split('#')[1];
  console.log(`[${env.label}] room ${roomId} created, probing ${env.sfu} ...`);
  await browser.close();
  try {
    const out = execFileSync(
      process.execPath,
      ['tests/load/probe-videomode.mjs', `${env.sfu} ${roomId} ${pin}`],
      { cwd: process.cwd(), encoding: 'utf8', timeout: 30_000 },
    );
    console.log(`[${env.label}] ${out.trim()}`);
  } catch (e) {
    console.log(`[${env.label}] probe failed: ${e.message}`);
  }
  void page;
}
process.exit(0);
