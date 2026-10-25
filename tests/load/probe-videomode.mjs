/**
 * Direct SFU probe: connect to the SFU's socket.io, join a throwaway room
 * and print the videoMode the join-room ack announces. No browser needed —
 * this isolates "what mode does the SFU advertise" from all client logic.
 *
 * Usage: node tests/load/probe-videomode.mjs wss://sfu.wachaut.com [more urls...]
 */
// socket.io-client lives in apps/web's node_modules; resolve it from there
// (this file sits in tests/load/, whose ancestors have no node_modules).
import { createRequire } from 'node:module';
const requireFromWeb = createRequire(new URL('../../apps/web/package.json', import.meta.url));
const { io } = requireFromWeb('socket.io-client');

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error('usage: node probe-videomode.mjs wss://host [wss://host2 ...]');
  process.exit(1);
}

for (const url of urls) {
  // Optional per-URL room creds: "wss://host roomId pin" (rooms must exist —
  // the SFU validates against its signaling server).
  const parts = url.split(' ');
  const sfuUrl = parts[0];
  const roomId = parts[1] || `probe-${Date.now()}`;
  const pin = parts[2] || '000000';
  const mode = await new Promise((resolve) => {
    const socket = io(sfuUrl, { transports: ['websocket'], timeout: 10_000, reconnection: false });
    const done = (label, value) => {
      try { socket.disconnect(); } catch {}
      resolve(`${label}: ${value}`);
    };
    const timer = setTimeout(() => done(sfuUrl, 'TIMEOUT: no ack in 10s'), 11_000);
    socket.on('connect', () => {
      socket.emit(
        'join-room',
        {
          roomId,
          pin,
          username: `probe-${Math.random().toString(36).slice(2, 8)}`,
          role: 'viewer',
        },
        (ack) => {
          clearTimeout(timer);
          done(sfuUrl, JSON.stringify(ack?.videoMode ?? ack?.error ?? ack ?? 'no videoMode in ack'));
        },
      );
    });
    socket.on('connect_error', (e) => {
      clearTimeout(timer);
      done(sfuUrl, `connect_error: ${e.message}`);
    });
  });
  console.log(mode);
}
process.exit(0);
