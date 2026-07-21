import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VIEWER_RECONNECT_DELAYS_MS,
  MAX_VIEWER_RECONNECT_ATTEMPTS,
  reconnectDelayForAttempt,
  shouldGiveUpReconnect,
  shouldForceIceRestart,
  shouldArmDisconnectWatchdog,
  clearsDisconnectWatchdog,
  DISCONNECT_RESTART_MS,
} from '../src/lib/reconnect-strategy.ts';

// ─── Backoff schedule ─────────────────────────────────────────────────

test('reconnectDelayForAttempt: 8-step exponential backoff matching the documented schedule', () => {
  // 1s, 2s, 4s, 8s, 15s, 30s, 60s, 120s — covers ~4 min of retries.
  assert.equal(reconnectDelayForAttempt(0), 1000);
  assert.equal(reconnectDelayForAttempt(1), 2000);
  assert.equal(reconnectDelayForAttempt(2), 4000);
  assert.equal(reconnectDelayForAttempt(3), 8000);
  assert.equal(reconnectDelayForAttempt(4), 15000);
  assert.equal(reconnectDelayForAttempt(5), 30000);
  assert.equal(reconnectDelayForAttempt(6), 60000);
  assert.equal(reconnectDelayForAttempt(7), 120000);
});

test('reconnectDelayForAttempt: clamps to last value for out-of-range indices', () => {
  assert.equal(reconnectDelayForAttempt(8), 120000);
  assert.equal(reconnectDelayForAttempt(99), 120000);
});

test('reconnectDelayForAttempt: negative index returns first delay (defensive)', () => {
  assert.equal(reconnectDelayForAttempt(-1), 1000);
});

test('shouldGiveUpReconnect: false until attempt 8, true afterwards', () => {
  for (let i = 0; i < 8; i++) {
    assert.equal(shouldGiveUpReconnect(i), false, `attempt ${i} should not give up`);
  }
  assert.equal(shouldGiveUpReconnect(8), true);
  assert.equal(shouldGiveUpReconnect(20), true);
});

test('Bug 2C regression: viewer must retry more than 3 times (was the original limit)', () => {
  // The original bug had a hard cap of 3 attempts. Verify we now allow 8.
  assert.ok(MAX_VIEWER_RECONNECT_ATTEMPTS >= 8, 'must allow at least 8 attempts');
  assert.equal(VIEWER_RECONNECT_DELAYS_MS.length, MAX_VIEWER_RECONNECT_ATTEMPTS);
});

// ─── ICE restart decisions ────────────────────────────────────────────

test('shouldForceIceRestart: true only for "failed"', () => {
  assert.equal(shouldForceIceRestart('failed'), true);
  assert.equal(shouldForceIceRestart('disconnected'), false);
  assert.equal(shouldForceIceRestart('connected'), false);
  assert.equal(shouldForceIceRestart('new'), false);
  assert.equal(shouldForceIceRestart('completed'), false);
  assert.equal(shouldForceIceRestart('closed'), false);
});

test('shouldArmDisconnectWatchdog: true only for "disconnected"', () => {
  assert.equal(shouldArmDisconnectWatchdog('disconnected'), true);
  assert.equal(shouldArmDisconnectWatchdog('failed'), false); // failed = immediate restart, not watchdog
  assert.equal(shouldArmDisconnectWatchdog('connected'), false);
});

test('clearsDisconnectWatchdog: clears on terminal/recovered states', () => {
  assert.equal(clearsDisconnectWatchdog('connected'), true);
  assert.equal(clearsDisconnectWatchdog('completed'), true);
  assert.equal(clearsDisconnectWatchdog('closed'), true);
  assert.equal(clearsDisconnectWatchdog('failed'), true);
  assert.equal(clearsDisconnectWatchdog('disconnected'), false); // still disconnected — keep watchdog
  assert.equal(clearsDisconnectWatchdog('new'), false);
});

test('DISCONNECT_RESTART_MS is between 5s and 30s (sweet spot for transient blips)', () => {
  // Too short = restartIce on every micro-blip. Too long = viewers frozen
  // for ages before recovery. 10s is the chosen balance.
  assert.ok(DISCONNECT_RESTART_MS >= 5000, 'must be >= 5s');
  assert.ok(DISCONNECT_RESTART_MS <= 30000, 'must be <= 30s');
});
