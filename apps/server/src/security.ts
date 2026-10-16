/**
 * Security helpers for the Wachaut signaling server.
 * Extracted into a separate module so they can be unit-tested.
 */

import crypto from 'node:crypto';

export const MAX_CHAT_LENGTH = 500;
export const MAX_USERNAME_LENGTH = 24;

/** Hash a PIN with SHA-256 so it's never stored/compared in plaintext. */
export function pinHash(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

/** Constant-time comparison of a stored hash against a given plaintext PIN. */
export function pinEquals(storedHash: string, givenPin: string): boolean {
  const givenHash = pinHash(givenPin);
  const a = Buffer.from(storedHash, 'hex');
  const b = Buffer.from(givenHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Allowlist of valid reaction emojis (must match the client's set).
export const VALID_EMOJIS = new Set([
  '👍', '👎', '❤️', '🔥', '👏', '😂', '🎉', '😮', '😢', '😡',
  '👋', '✌️', '💪', '🙏', '⭐', '💯', '🎯', '💡', '🎵', '☕', '🍕', '🎂',
]);

// Loose IPv4/IPv6 shape check — enough to reject header garbage without
// pretending to be a full validator.
const IP_SHAPE = /^[0-9a-fA-F.:]{3,45}$/;

/**
 * Real client IP behind Cloudflare + Traefik.
 *
 * Priority: CF-Connecting-IP (set by Cloudflare, which strips any spoofed
 * inbound value — the only trustworthy source for proxied traffic), then
 * X-Forwarded-For leftmost (direct→Traefik traffic; spoofable only by
 * clients that inject their own XFF), then the socket address.
 */
export function clientIpFromHeaders(headers: Record<string, unknown>, fallback: string): string {
  const cf = headers['cf-connecting-ip'];
  if (typeof cf === 'string' && IP_SHAPE.test(cf.trim())) return cf.trim();
  const xff = headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const first = xff.split(',')[0].trim();
    if (IP_SHAPE.test(first)) return first;
  }
  return fallback;
}

/** Sanitize chat text: validate type, strip control chars, cap length. */
export function sanitizeChatText(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (cleaned.length === 0 || cleaned.length > MAX_CHAT_LENGTH) return null;
  return cleaned;
}

/** Sanitize a username: trim, replace whitespace, strip invalid chars, cap length. */
export function sanitizeUsername(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, MAX_USERNAME_LENGTH);
}
