import Database from 'better-sqlite3';
import { join } from 'node:path';
import webPush from 'web-push';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushRecord {
  id: number;
  roomId: string;
  socketId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

const DB_PATH = process.env.PUSH_DB_PATH || join(process.cwd(), 'data', 'push-subscriptions.db');

function ensureDb() {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      socket_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_push_room ON push_subscriptions(room_id);
    CREATE INDEX IF NOT EXISTS idx_push_socket ON push_subscriptions(socket_id);
  `);
  return db;
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) db = ensureDb();
  return db;
}

export function configureVapid(): void {
  const subject = process.env.VAPID_SUBJECT || 'mailto:guillermo@billytech.es';
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    const keys = webPush.generateVAPIDKeys();
    webPush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
    console.warn('VAPID keys were generated at runtime. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars for persistence.');
    console.warn(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
    console.warn(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
    return;
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || '';
}

export function upsertSubscription(
  roomId: string,
  socketId: string,
  subscription: PushSubscription
): void {
  const stmt = getDb().prepare(`
    INSERT INTO push_subscriptions (room_id, socket_id, endpoint, p256dh, auth)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      room_id = excluded.room_id,
      socket_id = excluded.socket_id,
      p256dh = excluded.p256dh,
      auth = excluded.auth
  `);
  stmt.run(roomId, socketId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth);
}

export function removeSubscriptionBySocketId(socketId: string): void {
  const stmt = getDb().prepare('DELETE FROM push_subscriptions WHERE socket_id = ?');
  stmt.run(socketId);
}

export function removeSubscriptionByEndpoint(endpoint: string): void {
  const stmt = getDb().prepare('DELETE FROM push_subscriptions WHERE endpoint = ?');
  stmt.run(endpoint);
}

export function getSubscriptionsForRoom(roomId: string): PushRecord[] {
  const stmt = getDb().prepare('SELECT * FROM push_subscriptions WHERE room_id = ?');
  return stmt.all(roomId) as PushRecord[];
}

export async function sendNotification(record: PushRecord, payload: unknown): Promise<void> {
  const subscription: PushSubscription = {
    endpoint: record.endpoint,
    keys: {
      p256dh: record.p256dh,
      auth: record.auth,
    },
  };

  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    const statusCode = (err as webPush.WebPushError)?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      removeSubscriptionByEndpoint(record.endpoint);
    }
    throw err;
  }
}

export async function notifyRoom(roomId: string, payload: unknown, excludeSocketId?: string): Promise<void> {
  const records = getSubscriptionsForRoom(roomId);
  await Promise.all(
    records
      .filter((r) => r.socketId !== excludeSocketId)
      .map(async (record) => {
        try {
          await sendNotification(record, payload);
        } catch (err) {
          console.error('Failed to send push notification:', err);
        }
      })
  );
}
