import { test } from 'node:test';
import assert from 'node:assert/strict';

// Set env BEFORE importing the SFU module so main() doesn't boot Fastify +
// mediasoup workers under the test runner.
process.env.NODE_ENV = 'test';

const mod = await import('../src/index.ts');
const safeEqual = mod.safeEqual;
const isJoinBlocked = mod.isJoinBlocked;
const recordJoinFail = mod.recordJoinFail;

test('safeEqual: matching strings are equal', () => {
  assert.equal(safeEqual('1234', '1234'), true);
});

test('safeEqual: different strings are not equal', () => {
  assert.equal(safeEqual('1234', '1235'), false);
});

test('safeEqual: different lengths are not equal (no throw)', () => {
  assert.equal(safeEqual('a', 'ab'), false);
  assert.equal(safeEqual('', 'x'), false);
});

test('isJoinBlocked: empty history never blocks', () => {
  assert.equal(isJoinBlocked([], Date.now()), false);
});

test('isJoinBlocked: blocks at 5 failures inside the window', () => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const fourFails = [now - 1000, now - 2000, now - 3000, now - 4000];
  assert.equal(isJoinBlocked(fourFails, now, windowMs), false, '4 fails must not block');
  assert.equal(isJoinBlocked([...fourFails, now - 500], now, windowMs), true, '5 fails must block');
});

test('isJoinBlocked: old failures outside the window do not count', () => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const stale = Array.from({ length: 5 }, (_, i) => now - windowMs - 1000 - i);
  assert.equal(isJoinBlocked(stale, now, windowMs), false, 'stale failures must not block');
});

test('recordJoinFail: appends and prunes stale entries', () => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const map = new Map<string, number[]>();
  recordJoinFail(map, '1.2.3.4', now - windowMs - 5000, windowMs); // stale
  recordJoinFail(map, '1.2.3.4', now - 1000, windowMs);
  const list = map.get('1.2.3.4');
  assert.equal(list?.length, 1, 'stale entry must be pruned on record');
  assert.ok(list && list[0] > now - windowMs);
});

test('recordJoinFail: tracks IPs independently', () => {
  const now = Date.now();
  const map = new Map<string, number[]>();
  recordJoinFail(map, '1.1.1.1', now);
  recordJoinFail(map, '2.2.2.2', now);
  recordJoinFail(map, '2.2.2.2', now);
  assert.equal(map.get('1.1.1.1')?.length, 1);
  assert.equal(map.get('2.2.2.2')?.length, 2);
});
