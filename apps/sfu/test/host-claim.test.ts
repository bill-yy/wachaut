/**
 * SFU media-plane authorization tests: only hosts may send media, and the
 * role gate helper behaves deterministically for every input shape.
 */
process.env.NODE_ENV = 'test'; // skip RTC_ANNOUNCED_IP gate + boot in main()
process.env.TURN_URL = '';
process.env.TURN_SECRET = '';

const mod = await import('../src/index.ts');
const canSendMedia = (mod as any).canSendMedia;

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;

test('canSendMedia: true only for the host role', () => {
  assert.equal(canSendMedia('host'), true);
  assert.equal(canSendMedia('viewer'), false, 'viewers are recv-only — stream injection blocked');
  assert.equal(canSendMedia(undefined), false, 'peers not yet in a room cannot produce');
  assert.equal(canSendMedia('HOST'), false, 'case-sensitive — no bypass via casing');
  assert.equal(canSendMedia('host\n'), false, 'no bypass via trailing characters');
  assert.equal(canSendMedia(''), false);
  assert.equal(canSendMedia(null as any), false);
});
