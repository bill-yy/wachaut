/**
 * TOTP two-factor authentication (RFC 6238) — zero dependencies.
 *
 * HMAC-SHA1 is mandated by the TOTP specification (all authenticator apps
 * implement it); the secret is high-entropy random so SHA-1's collision
 * weakness is irrelevant here.
 */

import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

// ── Base32 (RFC 4648, no padding) ─────────────────────────────────────

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// ── Secret generation ─────────────────────────────────────────────────

/** Generate a new 160-bit TOTP secret, base32-encoded (authenticator-friendly). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Build the otpauth:// URI that QR generators expect. */
export function totpUri(secret: string, account: string, issuer = 'Wachaut'): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(STEP_SECONDS) });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// ── Code generation / verification ────────────────────────────────────

function hotp(secret: Buffer, counter: number): string {
  const mac = createHmac('sha1', secret).update(Buffer.from(counter.toString(16).padStart(16, '0'), 'hex')).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const binary = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

/** Current code for a secret (used by tests; exposure is time-limited by design). */
export function totpCode(secret: string, nowMs: number = Date.now()): string {
  return hotp(base32Decode(secret), Math.floor(nowMs / 1000 / STEP_SECONDS));
}

/**
 * Verify a 6-digit code against a secret, accepting ±`window` time steps
 * (covers clock drift between phone and server). Constant-time comparison.
 */
export function verifyTotp(secret: string, code: string, window = 1, nowMs: number = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(nowMs / 1000 / STEP_SECONDS);
  const key = base32Decode(secret);
  const submitted = Buffer.from(code, 'utf8');
  for (let drift = -window; drift <= window; drift++) {
    const expected = Buffer.from(hotp(key, counter + drift), 'utf8');
    if (expected.length === submitted.length && timingSafeEqual(expected, submitted)) return true;
  }
  return false;
}

// ── Recovery codes ────────────────────────────────────────────────────

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)

/** Generate `count` one-time recovery codes in the form XXXXX-XXXXX. */
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(10);
    let code = '';
    for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}

/** Recovery codes are stored hashed (SHA-256) — a DB leak must not leak usable codes. */
export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase().replace(/\s/g, '')).digest('hex');
}
