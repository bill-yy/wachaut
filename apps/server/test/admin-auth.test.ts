/**
 * Admin auth unit tests: password hashing, JWT lifecycle (expiry, token
 * version invalidation), credential policy, bootstrap and TOTP.
 *
 * Env (temp DB path + test JWT secret) must be set BEFORE importing the
 * db-dependent modules — hence the dynamic imports below.
 */
import { fileURLToPath } from 'node:url';

process.env.WACHAUT_DB_PATH = fileURLToPath(new URL('./tmp-admin-auth-test.db', import.meta.url));
process.env.ADMIN_JWT_SECRET = 'test-secret-0123456789abcdef';
process.env.ADMIN_JWT_EXPIRY = '2s';

const {
  hashPassword, verifyPassword,
  signToken, verifyToken,
  createUser, findUserByUsername, findUserById, changePassword,
  isValidUsername, isValidPassword,
  storeRecoveryCodes, consumeRecoveryCode,
  bootstrapAdmin,
} = await import('../src/admin/auth.ts');
const {
  generateTotpSecret, totpUri, totpCode, verifyTotp,
  generateRecoveryCodes, hashRecoveryCode,
} = await import('../src/admin/totp.ts');
const { db } = await import('../src/db.ts');

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { rmSync } = await import('node:fs');

// ── Password hashing ─────────────────────────────────────────────────

test('hashPassword/verifyPassword roundtrip; wrong password rejected', () => {
  const hash = hashPassword('correct horse battery staple');
  assert.ok(verifyPassword('correct horse battery staple', hash));
  assert.ok(!verifyPassword('wrong password', hash));
  assert.notEqual(hash, hashPassword('correct horse battery staple'), 'salt must be random per hash');
});

test('verifyPassword rejects malformed stored hashes', () => {
  assert.ok(!verifyPassword('x', 'not-a-hash'));
  assert.ok(!verifyPassword('x', 'a:b'));
});

// ── Credential policy ────────────────────────────────────────────────

test('username policy: 3-32 chars of [a-zA-Z0-9_.-]', () => {
  assert.ok(isValidUsername('admin'));
  assert.ok(isValidUsername('guille_01.mx'));
  assert.ok(!isValidUsername('ab'));            // too short
  assert.ok(!isValidUsername('a'.repeat(33)));  // too long
  assert.ok(!isValidUsername('bad name!'));     // invalid chars
});

test('password policy: 10-128 chars', () => {
  assert.ok(isValidPassword('a'.repeat(10)));
  assert.ok(!isValidPassword('a'.repeat(9)));
  assert.ok(!isValidPassword('a'.repeat(129)));
});

// ── JWT lifecycle ────────────────────────────────────────────────────

test('signToken/verifyToken roundtrip carries ver', () => {
  const token = signToken({ userId: 1, username: 'admin', role: 'superadmin', ver: 0 });
  const payload = verifyToken(token);
  assert.ok(payload);
  assert.equal(payload!.userId, 1);
  assert.equal(payload!.username, 'admin');
  assert.equal(payload!.ver, 0);
});

test('expired token is rejected (ADMIN_JWT_EXPIRY=2s)', async () => {
  const token = signToken({ userId: 1, username: 'admin', role: 'admin', ver: 0 });
  await new Promise((r) => setTimeout(r, 2500));
  assert.equal(verifyToken(token), null);
});

test('tampered token is rejected', () => {
  const token = signToken({ userId: 1, username: 'admin', role: 'admin', ver: 0 });
  assert.equal(verifyToken(`${token}x`), null);
});

test('changePassword bumps token_version so stale tokens are detectable', () => {
  const user = createUser('rotating-user', 'password-123456', 'admin');
  assert.equal(findUserById(user.id)!.token_version, 0);
  changePassword(user.id, 'new-password-123456');
  const after = findUserById(user.id)!;
  assert.equal(after.token_version, 1, 'password change must bump token_version');
  assert.equal(after.must_change_password, 0, 'rotation clears the forced flag');
});

// ── Bootstrap ────────────────────────────────────────────────────────

test('bootstrapAdmin: weak password skipped, strong password creates flagged superadmin, idempotent', () => {
  const savedPass = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  db.prepare('DELETE FROM admin_users').run(); // start from an empty table

  try {
    // Too weak → refuses to create.
    process.env.ADMIN_BOOTSTRAP_PASSWORD = 'short';
    bootstrapAdmin();
    assert.equal(findUserByUsername('admin'), undefined, 'weak bootstrap password must not create a user');

    // Strong enough → creates exactly once, flagged for forced rotation.
    process.env.ADMIN_BOOTSTRAP_PASSWORD = 'bootstrap-password-123';
    bootstrapAdmin();
    const admin = findUserByUsername('admin');
    assert.ok(admin, 'bootstrap user created');
    assert.equal(admin!.role, 'superadmin');
    assert.equal(admin!.must_change_password, 1, 'bootstrap credential must be rotated on first login');

    // Second call must not overwrite the existing user.
    process.env.ADMIN_BOOTSTRAP_PASSWORD = 'different-password-456';
    bootstrapAdmin();
    assert.equal(verifyPassword('different-password-456', findUserByUsername('admin')!.password_hash), false,
      'bootstrap must not overwrite an existing user');
    assert.equal(verifyPassword('bootstrap-password-123', findUserByUsername('admin')!.password_hash), true);
  } finally {
    process.env.ADMIN_BOOTSTRAP_PASSWORD = savedPass;
  }
});

// ── TOTP (RFC 6238 test vectors) ─────────────────────────────────────

test('TOTP matches the RFC 6238 SHA-1 reference vectors', () => {
  // Secret = ASCII '12345678901234567890' base32-encoded.
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  // At T=59s the reference code is 94287082 → last 6 digits 287082.
  assert.equal(totpCode(secret, 59_000), '287082');
  // At T=1111111109s the reference is 07081804 → 6 digits 081804.
  assert.equal(totpCode(secret, 1_111_111_109_000), '081804');
});

test('verifyTotp accepts the current code and ±1 step, rejects others', () => {
  const secret = generateTotpSecret();
  const now = Date.now();
  const code = totpCode(secret, now);
  assert.ok(verifyTotp(secret, code, 1, now));
  // Code from 3 steps ago is outside the window.
  assert.ok(!verifyTotp(secret, totpCode(secret, now - 3 * 30_000), 1, now));
  assert.ok(!verifyTotp(secret, '000000'), 'random code rejected');
  assert.ok(!verifyTotp(secret, 'abc12'), 'malformed code rejected');
});

test('totpUri is a well-formed otpauth URL', () => {
  const uri = totpUri('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 'guille');
  assert.ok(uri.startsWith('otpauth://totp/Wachaut%3Aguille?'));
  assert.ok(uri.includes('digits=6'));
  assert.ok(uri.includes('period=30'));
});

// ── Recovery codes ───────────────────────────────────────────────────

test('recovery codes: correct format, hashed storage, single use', () => {
  const user = createUser('recovery-user', 'password-123456', 'admin');
  const codes = storeRecoveryCodes(user.id, 4);
  assert.equal(codes.length, 4);
  for (const code of codes) {
    assert.match(code, /^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  }
  // Stored hashed, not plaintext.
  const rows = db.prepare('SELECT code_hash FROM admin_recovery_codes WHERE user_id = ?').all(user.id) as { code_hash: string }[];
  assert.equal(rows.length, 4);
  for (const row of rows) assert.ok(!codes.includes(row.code_hash));

  // First use consumes, second use fails; wrong user cannot use the code.
  assert.ok(consumeRecoveryCode(user.id, codes[0]));
  assert.ok(!consumeRecoveryCode(user.id, codes[0]));
  assert.ok(!consumeRecoveryCode(user.id + 9999, codes[1]));

  // Re-storing wipes old codes.
  const fresh = storeRecoveryCodes(user.id, 2);
  assert.ok(!consumeRecoveryCode(user.id, codes[1]), 'old codes are dead after regeneration');
  assert.ok(consumeRecoveryCode(user.id, fresh[0]));
});

test('hashRecoveryCode is case/whitespace insensitive', () => {
  assert.equal(hashRecoveryCode('abcde-fghij'), hashRecoveryCode(' ABCDE-FGHIJ '));
});

// ── Cleanup ──────────────────────────────────────────────────────────

test('teardown: remove temp db', () => {
  db.close();
  rmSync(process.env.WACHAUT_DB_PATH!, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-wal`, { force: true });
  rmSync(`${process.env.WACHAUT_DB_PATH}-shm`, { force: true });
});
