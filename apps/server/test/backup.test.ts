/**
 * Daily backup: one file per UTC day (idempotent), rotated to the newest
 * 14, mailed as an attachment only when the mailer is configured. Runs
 * against a throwaway DB via WACHAUT_DB_PATH.
 */
import { fileURLToPath } from 'node:url';

process.env.WACHAUT_DB_PATH = fileURLToPath(new URL('./tmp-backup-test.db', import.meta.url));
delete process.env.RESEND_API_KEY; // mailer off — local backup only

const { runDailyBackup } = await import('../src/backup.ts');
const { db } = await import('../src/db.ts');

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { existsSync, writeFileSync, mkdirSync, readdirSync, rmSync } = await import('node:fs');
const { dirname, join } = await import('node:path');

const DIR = join(dirname(process.env.WACHAUT_DB_PATH.replace('file:///', '')), 'backups');

test('backup: creates exactly one file per day and is idempotent', async () => {
  db.prepare("SELECT 1").get(); // touch the DB so the file has schema
  const now = new Date('2026-10-16T12:00:00Z');
  await runDailyBackup(now);
  const stamp = '20261016';
  assert.ok(existsSync(join(DIR, `wachaut-${stamp}.db`)), 'backup file created');

  // Second run the same day → no duplicate, no error.
  db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('probe', 'v2')").run();
  await runDailyBackup(new Date('2026-10-16T23:00:00Z'));
  const same = readdirSync(DIR).filter((f) => f === `wachaut-${stamp}.db`);
  assert.equal(same.length, 1, 'still exactly one file for the day');

  // The snapshot is a readable sqlite DB with the schema inside.
  const Database = (await import('better-sqlite3')).default;
  const copy = new Database(join(DIR, `wachaut-${stamp}.db`), { readonly: true });
  const tables = copy.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_settings'").all();
  assert.equal(tables.length, 1, 'schema present in the backup');
  copy.close();
});

test('backup: rotation keeps the newest 14', async () => {
  // Seed 16 fake dated backups, then run for a new day → only the newest 14 survive.
  rmSync(DIR, { recursive: true, force: true });
  mkdirSync(DIR, { recursive: true });
  for (let d = 1; d <= 16; d++) {
    writeFileSync(join(DIR, `wachaut-202609${String(d).padStart(2, '0')}.db`), Buffer.from('x'));
  }
  await runDailyBackup(new Date('2026-10-17T00:05:00Z'));
  const files = readdirSync(DIR).filter((f) => /^wachaut-\d{8}\.db$/.test(f)).sort();
  assert.equal(files.length, 14, '17 matching files → newest 14 kept');
  assert.equal(files[0], 'wachaut-20260904.db', 'three oldest pruned');
  assert.equal(files[files.length - 1], 'wachaut-20261017.db', 'today present');
});

// cleanup (the .db file itself stays — better-sqlite3 holds it open on Windows)
test('backup: remove tmp backups dir', () => {
  rmSync(DIR, { recursive: true, force: true });
});
