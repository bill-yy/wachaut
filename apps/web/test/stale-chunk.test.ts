import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldReloadForStaleChunk } from '../src/lib/stale-chunk.ts';

const memory = () => {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
  };
};

test('shouldReloadForStaleChunk: a chunk failure in a fresh tab reloads', () => {
  assert.equal(shouldReloadForStaleChunk(memory(), 1_000_000), true);
});

test('shouldReloadForStaleChunk: a second failure inside the window does not (no reload loop)', () => {
  const storage = memory();
  assert.equal(shouldReloadForStaleChunk(storage, 1_000_000), true);
  // A deploy that is really broken: the reloaded page fails the same chunk.
  assert.equal(shouldReloadForStaleChunk(storage, 1_000_500), false);
  assert.equal(shouldReloadForStaleChunk(storage, 1_029_999), false);
});

test('shouldReloadForStaleChunk: once the window has passed, one more reload', () => {
  const storage = memory();
  shouldReloadForStaleChunk(storage, 1_000_000);
  assert.equal(shouldReloadForStaleChunk(storage, 1_030_000), true);
  // And the window restarts from that reload.
  assert.equal(shouldReloadForStaleChunk(storage, 1_030_001), false);
});

test('shouldReloadForStaleChunk: an unreadable record never holds the reload back', () => {
  // A leftover that is not a number (older build, other value).
  const odd = memory();
  odd.setItem('wachaut.stale-chunk-reloaded-at', 'not a timestamp');
  assert.equal(shouldReloadForStaleChunk(odd, 1_000_000), true);
});

test('shouldReloadForStaleChunk: blocked or missing storage never blocks the reload', () => {
  assert.equal(shouldReloadForStaleChunk(null, 1_000_000), true);
  const blocked = {
    getItem: (): string | null => {
      throw new Error('SecurityError');
    },
    setItem: (): void => {
      throw new Error('SecurityError');
    },
  };
  assert.equal(shouldReloadForStaleChunk(blocked, 1_000_000), true);
});
