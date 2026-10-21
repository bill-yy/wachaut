import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  pinHash,
  pinEquals,
  sanitizeChatText,
  sanitizeUsername,
  toSafeHttpUrl,
  VALID_EMOJIS,
  MAX_CHAT_LENGTH,
  MAX_USERNAME_LENGTH,
} from '../src/security.js';

describe('pinHash', () => {
  it('produces a deterministic SHA-256 hex digest', () => {
    const hash = pinHash('123456');
    assert.equal(hash.length, 64); // SHA-256 = 32 bytes = 64 hex chars
    assert.equal(hash, pinHash('123456')); // deterministic
  });

  it('produces different hashes for different PINs', () => {
    assert.notEqual(pinHash('123456'), pinHash('654321'));
  });

  it('never returns the plaintext PIN', () => {
    const hash = pinHash('123456');
    assert.ok(!hash.includes('123456'));
  });
});

describe('pinEquals', () => {
  it('returns true for a matching PIN', () => {
    const stored = pinHash('987654');
    assert.equal(pinEquals(stored, '987654'), true);
  });

  it('returns false for a wrong PIN', () => {
    const stored = pinHash('987654');
    assert.equal(pinEquals(stored, '000000'), false);
  });

  it('returns false for an empty PIN', () => {
    const stored = pinHash('987654');
    assert.equal(pinEquals(stored, ''), false);
  });
});

describe('sanitizeChatText', () => {
  it('accepts a normal string', () => {
    assert.equal(sanitizeChatText('Hola mundo'), 'Hola mundo');
  });

  it('trims whitespace', () => {
    assert.equal(sanitizeChatText('  hello  '), 'hello');
  });

  it('strips control characters', () => {
    assert.equal(sanitizeChatText('he\x00llo\x01world\x7f'), 'helloworld');
  });

  it('rejects non-string input', () => {
    assert.equal(sanitizeChatText(null), null);
    assert.equal(sanitizeChatText(123), null);
    assert.equal(sanitizeChatText(undefined), null);
  });

  it('rejects empty strings', () => {
    assert.equal(sanitizeChatText(''), null);
    assert.equal(sanitizeChatText('   '), null);
  });

  it('accepts strings up to MAX_CHAT_LENGTH', () => {
    const exact = 'a'.repeat(MAX_CHAT_LENGTH);
    assert.equal(sanitizeChatText(exact), exact);
  });

  it('rejects strings longer than MAX_CHAT_LENGTH', () => {
    const tooLong = 'a'.repeat(MAX_CHAT_LENGTH + 1);
    assert.equal(sanitizeChatText(tooLong), null);
  });
});

describe('sanitizeUsername', () => {
  it('keeps alphanumeric, dashes, and underscores', () => {
    assert.equal(sanitizeUsername('John_Doe-123'), 'John_Doe-123');
  });

  it('replaces whitespace with dashes', () => {
    assert.equal(sanitizeUsername('John Doe'), 'John-Doe');
  });

  it('strips invalid characters', () => {
    assert.equal(sanitizeUsername('user@name!'), 'username');
  });

  it('caps at MAX_USERNAME_LENGTH', () => {
    const long = 'a'.repeat(MAX_USERNAME_LENGTH + 10);
    const result = sanitizeUsername(long);
    assert.equal(result.length, MAX_USERNAME_LENGTH);
  });

  it('returns empty string for non-string input', () => {
    assert.equal(sanitizeUsername(null), '');
    assert.equal(sanitizeUsername(123), '');
  });
});

describe('VALID_EMOJIS', () => {
  it('contains expected reactions', () => {
    assert.ok(VALID_EMOJIS.has('👍'));
    assert.ok(VALID_EMOJIS.has('❤️'));
    assert.ok(VALID_EMOJIS.has('🔥'));
    assert.ok(VALID_EMOJIS.has('🎉'));
  });

  it('rejects non-allowlisted strings', () => {
    assert.ok(!VALID_EMOJIS.has('malicious'));
    assert.ok(!VALID_EMOJIS.has('<script>'));
    assert.ok(!VALID_EMOJIS.has(''));
  });
});

describe('toSafeHttpUrl (SSRF gate for SFU fetches)', () => {
  it('normalizes public ws(s) URLs to http(s) and strips the query', () => {
    assert.equal(toSafeHttpUrl('wss://sfu-wachaut.billytech.es?x=1'), 'https://sfu-wachaut.billytech.es');
    assert.equal(toSafeHttpUrl('ws://example.com:3002/health'), 'http://example.com:3002');
    assert.equal(toSafeHttpUrl('https://sfu.wachaut.com'), 'https://sfu.wachaut.com');
  });

  it('rejects loopback, private, link-local and reserved targets', () => {
    for (const bad of [
      'http://localhost:3002',
      'http://127.0.0.1:3002',
      'http://10.1.2.3',
      'http://172.16.0.5',
      'http://172.31.255.255',
      'http://192.168.1.10',
      'http://169.254.169.254',
      'http://100.64.0.1',
      'http://[::1]:3002',
      'http://[fe80::1]',
      'http://[fd00::1]',
      'http://0.0.0.0',
      'http://224.0.0.1',
      'http://svc.internal',
      'http://printer.local',
    ]) {
      assert.equal(toSafeHttpUrl(bad), null, bad + ' must be rejected');
    }
  });

  it('rejects non-HTTP schemes and garbage', () => {
    for (const bad of ['file:///etc/passwd', 'ftp://example.com', 'gopher://x', 'not a url', '']) {
      assert.equal(toSafeHttpUrl(bad), null, bad + ' must be rejected');
    }
  });

  it('allows public IPv4 literals and IPv4-mapped public IPv6', () => {
    assert.equal(toSafeHttpUrl('http://167.86.110.249:3002'), 'http://167.86.110.249:3002');
    assert.ok(toSafeHttpUrl('http://[::ffff:167.86.110.249]'));
  });
});
