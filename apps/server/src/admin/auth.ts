/**
 * Admin authentication: scrypt password hashing + JWT tokens + TOTP (2FA).
 *
 * Passwords are stored as `salt_hex:hash_hex` (salt is 16 random bytes,
 * hash is scrypt output). scrypt is memory-hard, resistant to GPU/ASIC
 * brute force — far stronger than the SHA-256 used for room PINs.
 *
 * JWTs expire after ADMIN_JWT_EXPIRY (default 8h). The signing secret comes
 * from ADMIN_JWT_SECRET (mandatory in production). Tokens carry
 * { userId, username, role, ver } — `ver` mirrors the user's token_version
 * column so a password change instantly invalidates every issued token.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { generateRecoveryCodes, hashRecoveryCode } from './totp.js';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '8h';

// A forgeable default secret in production is a critical misconfiguration:
// anyone reading the public repo could mint admin tokens. Refuse to boot.
if (process.env.NODE_ENV === 'production' && (JWT_SECRET === 'dev-secret-change-me' || JWT_SECRET.length < 16)) {
  throw new Error(
    '[admin] ADMIN_JWT_SECRET must be set to a strong random value (>= 16 chars) in production. ' +
    'Generate one with: openssl rand -hex 32'
  );
}

// ── Credential policy ─────────────────────────────────────────────────

export const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
}

// ── Password hashing ─────────────────────────────────────────────────

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expectedHash = Buffer.from(hashHex, 'hex');
  const actualHash = scryptSync(plain, salt, 64);
  // Constant-time comparison to prevent timing attacks.
  return actualHash.length === expectedHash.length && timingSafeEqual(actualHash, expectedHash);
}

// ── JWT ──────────────────────────────────────────────────────────────

export interface AdminToken {
  userId: number;
  username: string;
  role: string;
  /** token_version at signing time — compared against the DB on every request. */
  ver: number;
}

export function signToken(payload: AdminToken): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): AdminToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminToken;
  } catch {
    return null;
  }
}

// ── User management ──────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  username: string;
  role: string;
  active: number;
  created_at: string;
  last_login: string | null;
  token_version: number;
  totp_enabled: number;
  must_change_password: number;
}

const USER_COLUMNS = 'id, username, role, active, created_at, last_login, token_version, totp_enabled, must_change_password';

export function findUserByUsername(username: string): (AdminUser & { password_hash: string; totp_secret: string | null }) | undefined {
  return db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;
}

export function findUserById(id: number): AdminUser | undefined {
  return db.prepare(`SELECT ${USER_COLUMNS} FROM admin_users WHERE id = ?`).get(id) as AdminUser | undefined;
}

export function listUsers(): AdminUser[] {
  return db.prepare(`SELECT ${USER_COLUMNS} FROM admin_users ORDER BY created_at`).all() as AdminUser[];
}

export function countActiveSuperadmins(): number {
  const row = db.prepare("SELECT COUNT(*) as n FROM admin_users WHERE role = 'superadmin' AND active = 1").get() as { n: number };
  return row.n;
}

export function createUser(username: string, password: string, role: string = 'admin'): AdminUser {
  const hash = hashPassword(password);
  const info = db.prepare('INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, role);
  return findUserById(Number(info.lastInsertRowid))!;
}

export function deactivateUser(id: number): void {
  db.prepare('UPDATE admin_users SET active = 0 WHERE id = ?').run(id);
}

export function activateUser(id: number): void {
  db.prepare('UPDATE admin_users SET active = 1 WHERE id = ?').run(id);
}

export function changeUserRole(id: number, role: 'admin' | 'superadmin'): void {
  db.prepare('UPDATE admin_users SET role = ? WHERE id = ?').run(role, id);
}

/** Change a password, bump token_version (kills live tokens) and clear any forced rotation. */
export function changePassword(id: number, newPassword: string): void {
  const hash = hashPassword(newPassword);
  db.prepare(
    'UPDATE admin_users SET password_hash = ?, token_version = token_version + 1, must_change_password = 0 WHERE id = ?'
  ).run(hash, id);
}

export function updateLastLogin(id: number): void {
  db.prepare("UPDATE admin_users SET last_login = datetime('now') WHERE id = ?").run(id);
}

// ── TOTP storage ─────────────────────────────────────────────────────

export function setTotpPendingSecret(id: number, secret: string): void {
  db.prepare('UPDATE admin_users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?').run(secret, id);
}

export function enableTotp(id: number): void {
  db.prepare('UPDATE admin_users SET totp_enabled = 1 WHERE id = ?').run(id);
}

export function disableTotp(id: number): void {
  db.prepare('UPDATE admin_users SET totp_secret = NULL, totp_enabled = 0 WHERE id = ?').run(id);
}

/** The stored TOTP secret (pending or active) for an account, or null. */
export function getTotpSecret(id: number): string | null {
  const row = db.prepare('SELECT totp_secret FROM admin_users WHERE id = ?').get(id) as { totp_secret: string | null } | undefined;
  return row?.totp_secret ?? null;
}

/** Replace the user's recovery codes; returns the plaintext codes (shown exactly once). */
export function storeRecoveryCodes(id: number, count = 8): string[] {
  const codes = generateRecoveryCodes(count);
  const insert = db.prepare('INSERT INTO admin_recovery_codes (user_id, code_hash) VALUES (?, ?)');
  const wipe = db.prepare('DELETE FROM admin_recovery_codes WHERE user_id = ?');
  const tx = db.transaction(() => {
    wipe.run(id);
    for (const code of codes) insert.run(id, hashRecoveryCode(code));
  });
  tx();
  return codes;
}

/**
 * Try to consume a recovery code (one-time). Returns true when the code was
 * valid and unused — the code is marked consumed either way.
 */
export function consumeRecoveryCode(userId: number, code: string): boolean {
  const hash = hashRecoveryCode(code);
  const row = db.prepare(
    'SELECT id FROM admin_recovery_codes WHERE user_id = ? AND code_hash = ? AND used = 0 LIMIT 1'
  ).get(userId, hash) as { id: number } | undefined;
  if (!row) return false;
  db.prepare('UPDATE admin_recovery_codes SET used = 1 WHERE id = ?').run(row.id);
  return true;
}

// ── Audit log ────────────────────────────────────────────────────────

export function auditLog(userId: number | null, username: string, action: string, ip: string, country: string): void {
  db.prepare('INSERT INTO admin_audit_log (user_id, username, action, ip, country) VALUES (?, ?, ?, ?, ?)').run(
    userId, username, action, ip, country
  );
}

// ── Bootstrap first superadmin ───────────────────────────────────────

/**
 * If the admin_users table is empty and ADMIN_BOOTSTRAP_PASSWORD is set,
 * create the first superadmin. Safe to call on every startup — does
 * nothing if users already exist or the env var is absent.
 *
 * The created account is flagged must_change_password so the bootstrap
 * credential is rotated on first login.
 */
export function bootstrapAdmin(): void {
  const count = db.prepare('SELECT COUNT(*) as n FROM admin_users').get() as { n: number };
  if (count.n > 0) return;

  const bootstrapPass = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!bootstrapPass) {
    console.log('[admin] No users found and ADMIN_BOOTSTRAP_PASSWORD not set — admin panel will be empty.');
    console.log('[admin] Run: node dist/admin/setup.js create-user');
    return;
  }
  if (!isValidPassword(bootstrapPass)) {
    console.error(`[admin] ADMIN_BOOTSTRAP_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters — skipping bootstrap.`);
    return;
  }

  createUser('admin', bootstrapPass, 'superadmin');
  db.prepare("UPDATE admin_users SET must_change_password = 1 WHERE username = 'admin'").run();
  auditLog(null, 'system', 'bootstrap_admin', 'system', '??');
  console.log('[admin] Bootstrap superadmin "admin" created (password rotation required on first login). Remove ADMIN_BOOTSTRAP_PASSWORD from env.');
}
