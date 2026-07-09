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

  CREATE INDEX IF NOT EXISTS idx_room_events_timestamp ON room_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON admin_audit_log(timestamp);
`);

export { db };
export type Db = DatabaseType;
