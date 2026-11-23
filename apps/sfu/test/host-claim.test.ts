/**
 * SFU media-plane authorization tests: only hosts may send media, and the
 * role gate helper behaves deterministically for every input shape.
 */
process.env.NODE_ENV = 'test'; // skip RTC_ANNOUNCED_IP gate + boot in main()
process.env.TURN_URL = '';
process.env.TURN_SECRET = '';

const mod = await import('../src/index.ts');
const canSendMedia = (mod as any).canSendMedia;
const resolveHostClaim = (mod as any).resolveHostClaim;

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;

const SECRET = 'creator-secret';
const live = { hostSecret: SECRET };
// Sentinel, not a real timer: a pending setTimeout would keep the runner alive.
const inGrace = { hostSecret: SECRET, hostDisconnectTimer: { armed: true } };

test('canSendMedia: true only for the host role', () => {
  assert.equal(canSendMedia('host'), true);
  assert.equal(canSendMedia('viewer'), false, 'viewers are recv-only — stream injection blocked');
  assert.equal(canSendMedia(undefined), false, 'peers not yet in a room cannot produce');
  assert.equal(canSendMedia('HOST'), false, 'case-sensitive — no bypass via casing');
  assert.equal(canSendMedia('host\n'), false, 'no bypass via trailing characters');
  assert.equal(canSendMedia(''), false);
  assert.equal(canSendMedia(null as any), false);
});

test('resolveHostClaim: the creator secret reclaims a room whose grace timer is armed', () => {
  assert.equal(resolveHostClaim(inGrace, SECRET), 'reclaim');
});

test('resolveHostClaim: the creator secret reclaims a LIVE room too (old socket not reaped yet)', () => {
  // Prod SFU log 2026-11-21 10:15 and 11:05: the host reconnected seconds
  // before the ping timeout declared the previous socket dead, got "Room
  // already exists", and the room was closed 30s later with viewers in it.
  assert.equal(resolveHostClaim(live, SECRET), 'reclaim');
});

test('resolveHostClaim: no secret on a live room is "room exists", not a failed claim', () => {
  // Must not count against the IP: the real host's own retries would lock it out.
  assert.equal(resolveHostClaim(live, undefined), 'room-exists');
  assert.equal(resolveHostClaim(live, ''), 'room-exists');
});

test('resolveHostClaim: no secret inside the grace window is an invalid claim', () => {
  assert.equal(resolveHostClaim(inGrace, undefined), 'invalid-secret');
  assert.equal(resolveHostClaim(inGrace, ''), 'invalid-secret');
});

test('resolveHostClaim: a wrong secret is rejected on live and grace rooms alike', () => {
  assert.equal(resolveHostClaim(live, 'not-the-secret'), 'invalid-secret');
  assert.equal(resolveHostClaim(inGrace, 'not-the-secret'), 'invalid-secret');
});

test('resolveHostClaim: non-string secrets never reclaim', () => {
  // Malformed input counts as "no secret": a live room says it exists, a
  // room in grace wants proof — and neither hands over the host slot.
  assert.equal(resolveHostClaim(live, { toString: () => SECRET }), 'room-exists');
  assert.equal(resolveHostClaim(live, 12345 as any), 'room-exists');
  assert.equal(resolveHostClaim(inGrace, { toString: () => SECRET }), 'invalid-secret');
  assert.equal(resolveHostClaim(inGrace, null as any), 'invalid-secret');
});
