/**
 * SQLite database connection + schema for Wachaut admin panel.
 *
 * Uses better-sqlite3 (synchronous, fast, native). The DB file lives at
 * /app/server/data/wachaut.db inside the container — a Docker volume
 * must be mounted there for persistence across deploys.
 *
 * WAL mode is enabled so the admin dashboard can read live metrics while
 * the signaling server writes concurrently without blocking.
 */

import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DB_PATH = process.env.WACHAUT_DB_PATH || join(process.cwd(), 'data', 'wachaut.db');

// Ensure the directory exists (for local dev where data/ may not exist yet).
mkdirSync(dirname(DB_PATH), { recursive: true });

const db: DatabaseType = new Database(DB_PATH);

// WAL mode: concurrent reads during writes, no reader-writer blocking.
db.pragma('journal_mode = WAL');
// Normal sync mode: fast writes, small window of corruption on power loss.
// Acceptable for metrics/admin data (not financial transactions).
db.pragma('synchronous = NORMAL');
// Keep WAL under control — checkpoint when it grows past 1MB.
db.pragma('wal_autocheckpoint = 1000');

// ── Schema ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'admin',  -- 'admin' | 'superadmin'
    active        INTEGER NOT NULL DEFAULT 1,     -- 0 = revoked
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    last_login    TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    username   TEXT,
    action     TEXT NOT NULL,   -- 'login', 'login_failed', 'create_user', etc.
    ip         TEXT,
    country    TEXT,
    timestamp  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES admin_users(id)
  );

  CREATE TABLE IF NOT EXISTS room_events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type    TEXT NOT NULL,     -- 'created', 'closed', 'viewer_joined', 'viewer_left'
    room_id       TEXT,
    host_ip       TEXT,
    country       TEXT,
    viewer_count  INTEGER DEFAULT 0,
    timestamp     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS traffic_stats (
    date          TEXT NOT NULL UNIQUE,  -- 'YYYY-MM-DD'
    total_rooms   INTEGER DEFAULT 0,
    peak_viewers  INTEGER DEFAULT 0,
    total_viewers INTEGER DEFAULT 0,
    countries     TEXT DEFAULT '{}'      -- JSON: { "ES": 42, "FR": 12, ... }
  );

  CREATE TABLE IF NOT EXISTS pageviews (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    ts             TEXT NOT NULL DEFAULT (datetime('now')),
    visitor_id     TEXT,
    session_id     TEXT,
    path           TEXT,
    referrer       TEXT,
    referrer_host  TEXT,
    utm_source     TEXT,
    utm_medium     TEXT,
    utm_campaign   TEXT,
    utm_term       TEXT,
    utm_content    TEXT,
    country        TEXT,
    device         TEXT,
    lang           TEXT,
    ip_hash        TEXT
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_room_events_timestamp ON room_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON admin_audit_log(timestamp);
  CREATE INDEX IF NOT EXISTS idx_pageviews_ts ON pageviews(ts);
  CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews(path);
  CREATE INDEX IF NOT EXISTS idx_pageviews_referrer_host ON pageviews(referrer_host);
`);

// ── Migrations (idempotent column/table additions) ─────────────────────
//
// SQLite has no "ADD COLUMN IF NOT EXISTS", so each migration checks the
// current table info first. This runs on every boot and is a no-op once
// applied.

function hasColumn(table: string, column: string): boolean {
  // pragma_table_info() is a table-valued function, so the table name can be
  // a bound parameter (no string interpolation into SQL).
  const rows = db.prepare('SELECT name FROM pragma_table_info(?)').all(table) as { name: string }[];
  return rows.some((r) => r.name === column);
}

/** True the first time the token-version migration runs (pre-2FA schema). */
let ranTokenVersionMigration = false;
if (!hasColumn('admin_users', 'token_version')) {
  ranTokenVersionMigration = true;
  db.exec(`
    ALTER TABLE admin_users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE admin_users ADD COLUMN totp_secret TEXT;
    ALTER TABLE admin_users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE admin_users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
  `);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_recovery_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    code_hash  TEXT NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES admin_users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_recovery_codes_user ON admin_recovery_codes(user_id);
`);

// One-time security rotation: every account that existed before token
// versions were introduced must change its password on next login. This
// retires credentials created from ADMIN_BOOTSTRAP_PASSWORD or the CLI.
if (ranTokenVersionMigration) {
  db.prepare('UPDATE admin_users SET must_change_password = 1').run();
}

// ── Persisted settings ───────────────────────────────────────────────
// Generic key/value store for flags that must survive restarts (currently
// the maintenance mode flag).

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}

export { db };
export type Db = DatabaseType;
