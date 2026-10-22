/**
 * Security helpers for the Wachaut signaling server.
 * Extracted into a separate module so they can be unit-tested.
 */

import crypto from 'node:crypto';
import { isIP } from 'node:net';

export const MAX_CHAT_LENGTH = 500;
export const MAX_USERNAME_LENGTH = 24;

function isPrivateIPv4(host: string): boolean {
  const [a, b] = host.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127) return true;          // this-network, private, loopback
  if (a === 169 && b === 254) return true;                     // link-local (cloud metadata!)
  if (a === 172 && b >= 16 && b <= 31) return true;            // private
  if (a === 192 && b === 168) return true;                     // private
  if (a === 100 && b >= 64 && b <= 127) return true;           // CGNAT
  if (a >= 224) return true;                                   // multicast / reserved
  return false;
}

/**
 * Normalize an operator-configured URL (ws(s)→http(s), query stripped) and
 * refuse anything the server should never fetch: non-HTTP schemes,
 * localhost-style names, loopback/private/reserved addresses. Guards the
 * SFU health/error endpoints so a tampered env var cannot turn the server
 * into an internal-network probe (SSRF). Returns null when unsafe.
 */
export function toSafeHttpUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.replace(/^ws/, 'http'));
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return null;
  }
  const ipVersion = isIP(host);
  if (ipVersion === 4) return isPrivateIPv4(host) ? null : `${url.protocol}//${url.host}`;
  if (ipVersion === 6) {
    if (host === '::' || host === '::1') return null;
    if (/^fe[89ab]/.test(host)) return null;        // link-local
    if (/^f[cd]/.test(host) || /^ff/.test(host)) return null; // ULA / multicast
    const mapped = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
    if (mapped) return isPrivateIPv4(mapped[1]) ? null : `${url.protocol}//${url.host}`;
    return `${url.protocol}//${url.host}`;
  }
  return `${url.protocol}//${url.host}`;
}

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
