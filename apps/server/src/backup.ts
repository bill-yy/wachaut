/**
 * Daily SQLite backup: one consistent copy per UTC day, kept locally
 * (rotated) and shipped offsite as an email attachment via Resend.
 *
 * Uses better-sqlite3's online backup API — safe while the app keeps
 * writing (unlike a raw file copy, which can tear a WAL write). Runs from
 * the 5-minute sweeper; idempotent: a day that already has its file is
 * skipped, so restarts never duplicate or clobber.
 *
 * The backups live next to the DB file (…/backups/), so environments that
 * share a volume (dev + prod) keep separate backup folders automatically.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { db, DB_PATH } from './db.js';
import { captureError } from './errors.js';
import { sendAdminAttachment, mailerEnabled } from './mailer.js';

const KEEP_BACKUPS = 14;
const MAX_MAIL_BYTES = 8 * 1024 * 1024; // Resend caps attachments at 40MB total; stay well under

function backupDir(): string {
  return join(dirname(DB_PATH), 'backups');
}

function dayStamp(now: Date): string {
  return now.toISOString().slice(0, 10).replace(/-/g, '');
}

/** Fire-and-forget daily backup — never throws (sweeper-safe). */
export async function runDailyBackup(now: Date = new Date()): Promise<void> {
  const stamp = dayStamp(now);
  const dir = backupDir();
  const dest = join(dir, `wachaut-${stamp}.db`);

  try {
    if (existsSync(dest)) return; // today's copy already made
    mkdirSync(dir, { recursive: true });
    await db.backup(dest); // online, consistent snapshot
    rotate(dir);

    if (mailerEnabled()) {
      const content = readFileSync(dest);
      if (content.byteLength <= MAX_MAIL_BYTES) {
        await sendAdminAttachment(
          `Copia de seguridad ${stamp}`,
          [
            `Backup diario de la base de datos (${(content.byteLength / 1024).toFixed(1)} KB).`,
            `Origen: ${DB_PATH}`,
            'Se conservan las últimas 14 copias en el servidor; este correo es la copia externa.',
          ].join('\n'),
          { filename: `wachaut-${stamp}.db`, contentB64: content.toString('base64') },
          now.getTime(),
        );
      }
    }
  } catch (err) {
    captureError(err, { source: 'server', component: 'backup' });
  }
}

/** Keep the newest KEEP_BACKUPS files (names sort by date stamp). */
function rotate(dir: string): void {
  const files = readdirSync(dir)
    .filter((f) => /^wachaut-\d{8}\.db$/.test(f))
    .sort();
  for (const old of files.slice(0, Math.max(0, files.length - KEEP_BACKUPS))) {
    try { rmSync(join(dir, old)); } catch { /* best effort */ }
  }
}
