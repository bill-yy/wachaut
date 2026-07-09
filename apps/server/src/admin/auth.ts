/**
 * Admin authentication: scrypt password hashing + JWT tokens.
 *
 * Passwords are stored as `salt_hex:hash_hex` (salt is 16 random bytes,
 * hash is scrypt output). scrypt is memory-hard, resistant to GPU/ASIC
 * brute force — far stronger than the SHA-256 used for room PINs.
 *
 * JWTs expire in 1 hour. The signing secret comes from ADMIN_JWT_SECRET
 * env var. Tokens carry { userId, username, role }.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRY = '1h';

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
}

export function signToken(payload: AdminToken): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
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
}

export function findUserByUsername(username: string): (AdminUser & { password_hash: string }) | undefined {
  return db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;
}

export function findUserById(id: number): AdminUser | undefined {
  return db.prepare('SELECT id, username, role, active, created_at, last_login FROM admin_users WHERE id = ?').get(id) as AdminUser | undefined;
}

export function listUsers(): AdminUser[] {
  return db.prepare('SELECT id, username, role, active, created_at, last_login FROM admin_users ORDER BY created_at').all() as AdminUser[];
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

export function changePassword(id: number, newPassword: string): void {
  const hash = hashPassword(newPassword);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, id);
}

export function updateLastLogin(id: number): void {
  db.prepare("UPDATE admin_users SET last_login = datetime('now') WHERE id = ?").run(id);
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

  createUser('admin', bootstrapPass, 'superadmin');
  console.log('[admin] Bootstrap superadmin "admin" created. Remove ADMIN_BOOTSTRAP_PASSWORD from env.');
}
