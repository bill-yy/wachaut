/**
 * Admin API routes — Fastify plugin registered under /api/admin.
 *
 * All routes except /login require a valid JWT in the Authorization header.
 * Data endpoints aggregate live server state (rooms, connections, SFU health).
 * User management endpoints read/write the SQLite admin_users table.
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import geoip from 'geoip-country';
import {
  signToken, verifyToken, verifyPassword,
  findUserByUsername, findUserById, listUsers,
  createUser, deactivateUser, activateUser, changePassword,
  updateLastLogin, auditLog, type AdminToken,
} from './auth.js';
import { db } from '../db.js';

// ── Rate limiting for login attempts (in-memory, per IP) ─────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_LOGIN_ATTEMPTS) return false;
  entry.count++;
  return true;
}

function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// ── Maintenance mode (global flag) ───────────────────────────────────
let maintenanceMode = false;

export function isMaintenanceMode(): boolean {
  return maintenanceMode;
}

// ── Country lookup ───────────────────────────────────────────────────

function lookupCountry(ip: string): string {
  try {
    const result = geoip.lookup(ip);
    return result?.country || '??';
  } catch {
    return '??';
  }
}

// ── Live server state interface (injected from index.ts) ─────────────

export interface ServerState {
  rooms: Map<string, any>;
  io: any;
  connectionCounts: Map<string, number>;
  sfuHealthUrl: string;
}

// ── Auth middleware ──────────────────────────────────────────────────

function authMiddleware(req: FastifyRequest, reply: FastifyReply, done: () => void) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'No token provided' });
    return;
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    reply.code(401).send({ error: 'Invalid or expired token' });
    return;
  }
  // Verify user is still active.
  const user = findUserById(payload.userId);
  if (!user || !user.active) {
    reply.code(401).send({ error: 'Account revoked' });
    return;
  }
  (req as any).adminUser = payload;
  done();
}

// ── Plugin ───────────────────────────────────────────────────────────

export function registerAdminRoutes(app: FastifyInstance, state: ServerState) {
  app.addHook('preHandler', (req, reply, done) => {
    // Skip auth for login endpoint.
    if (req.url === '/api/admin/login') { done(); return; }
    authMiddleware(req, reply, done);
  });

  // ── POST /login ──────────────────────────────────────────────────
  app.post('/api/admin/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const { username, password } = req.body as { username?: string; password?: string };
    const ip = req.ip;

    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password required' });
    }

    if (!checkLoginRateLimit(ip)) {
      return reply.code(429).send({ error: 'Too many attempts. Try again in 10 minutes.' });
    }

    const user = findUserByUsername(username);
    const country = lookupCountry(ip);

    if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
      auditLog(user?.id ?? null, username, 'login_failed', ip, country);
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    // Success — clear rate limit, update last login, audit.
    clearLoginAttempts(ip);
    updateLastLogin(user.id);
    auditLog(user.id, username, 'login', ip, country);

    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    return reply.send({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  });

  // ── GET /metrics ─────────────────────────────────────────────────
  app.get('/api/admin/metrics', async () => {
    const roomCount = state.rooms.size;
    let totalViewers = 0;
    for (const room of state.rooms.values()) {
      totalViewers += room.viewers.size;
    }

    // Fetch SFU health.
    let sfuHealth: any = null;
    try {
      const res = await fetch(`${state.sfuHealthUrl}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) sfuHealth = await res.json();
    } catch { /* SFU unreachable */ }

    return {
      rooms: roomCount,
      viewers: totalViewers,
      connections: state.io.engine.clientsCount,
      sfu: sfuHealth,
      maintenance: maintenanceMode,
      uptime: process.uptime(),
      memory: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
    };
  });

  // ── GET /rooms ───────────────────────────────────────────────────
  app.get('/api/admin/rooms', async () => {
    const roomsData = [];
    for (const [id, room] of state.rooms) {
      const viewers = Array.from(room.viewers.values()).map((v: any) => ({
        name: v.name,
        joinedAt: v.joinedAt,
        connected: v.connected,
      }));
      roomsData.push({
        id,
        hostId: room.hostId,
        createdAt: room.createdAt,
        viewerCount: room.viewers.size,
        isSharing: room.isSharing,
        isMuted: room.isMuted,
        chatMessages: room.chat?.length || 0,
        viewers,
      });
    }
    return { rooms: roomsData };
  });

  // ── GET /security ────────────────────────────────────────────────
  app.get('/api/admin/security', async () => {
    const ips = [];
    for (const [ip, count] of state.connectionCounts) {
      ips.push({ ip, connections: count, country: lookupCountry(ip) });
    }
    ips.sort((a, b) => b.connections - a.connections);

    // Recent audit log entries (last 20).
    const audit = db.prepare(
      'SELECT username, action, ip, country, timestamp FROM admin_audit_log ORDER BY timestamp DESC LIMIT 20'
    ).all();

    return { ips, auditLog: audit };
  });

  // ── GET /stats ───────────────────────────────────────────────────
  app.get('/api/admin/stats', async () => {
    // Last 7 days of traffic.
    const traffic = db.prepare(
      `SELECT date, total_rooms, peak_viewers, total_viewers, countries
       FROM traffic_stats ORDER BY date DESC LIMIT 7`
    ).all();

    // Top countries from room_events (all time).
    const countries = db.prepare(
      `SELECT country, COUNT(*) as count FROM room_events
       WHERE country IS NOT NULL AND country != '??'
       GROUP BY country ORDER BY count DESC LIMIT 10`
    ).all();

    // Total rooms ever created.
    const totalRooms = db.prepare(
      "SELECT COUNT(*) as n FROM room_events WHERE event_type = 'created'"
    ).get() as { n: number };

    return { traffic, countries, totalRoomsCreated: totalRooms.n };
  });

  // ── POST /maintenance ────────────────────────────────────────────
  app.post('/api/admin/maintenance', async (req: FastifyRequest, reply: FastifyReply) => {
    const { enabled } = req.body as { enabled?: boolean };
    if (typeof enabled !== 'boolean') {
      return reply.code(400).send({ error: 'enabled (boolean) required' });
    }
    const user = (req as any).adminUser as AdminToken;
    maintenanceMode = enabled;
    auditLog(user.userId, user.username, enabled ? 'maintenance_on' : 'maintenance_off', req.ip, lookupCountry(req.ip));
    return { maintenance: maintenanceMode };
  });

  // ── GET /users ───────────────────────────────────────────────────
  app.get('/api/admin/users', async () => {
    return { users: listUsers() };
  });

  // ── POST /users (superadmin only) ────────────────────────────────
  app.post('/api/admin/users', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser as AdminToken;
    if (user.role !== 'superadmin') {
      return reply.code(403).send({ error: 'Only superadmins can create users' });
    }
    const { username, password, role } = req.body as { username?: string; password?: string; role?: string };
    if (!username || !password) {
      return reply.code(400).send({ error: 'username and password required' });
    }
    if (role && !['admin', 'superadmin'].includes(role)) {
      return reply.code(400).send({ error: 'role must be admin or superadmin' });
    }
    try {
      const newUser = createUser(username, password, role || 'admin');
      auditLog(user.userId, user.username, `create_user:${username}`, req.ip, lookupCountry(req.ip));
      return { user: newUser };
    } catch (err: any) {
      if (err?.message?.includes('UNIQUE')) {
        return reply.code(409).send({ error: 'Username already exists' });
      }
      throw err;
    }
  });

  // ── DELETE /users/:id (superadmin only) ──────────────────────────
  app.delete('/api/admin/users/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser as AdminToken;
    if (user.role !== 'superadmin') {
      return reply.code(403).send({ error: 'Only superadmins can revoke users' });
    }
    const { id } = req.params as { id: string };
    const targetId = parseInt(id);
    if (targetId === user.userId) {
      return reply.code(400).send({ error: 'Cannot revoke your own account' });
    }
    const target = findUserById(targetId);
    if (!target) {
      return reply.code(404).send({ error: 'User not found' });
    }
    deactivateUser(targetId);
    auditLog(user.userId, user.username, `revoke_user:${target.username}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  // ── POST /users/:id/password ─────────────────────────────────────
  app.post('/api/admin/users/:id/password', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser as AdminToken;
    const { id } = req.params as { id: string };
    const targetId = parseInt(id);
    const { password } = req.body as { password?: string };

    if (!password || password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters' });
    }
    // Users can change their own password; superadmins can change anyone's.
    if (targetId !== user.userId && user.role !== 'superadmin') {
      return reply.code(403).send({ error: 'Not authorized' });
    }
    const target = findUserById(targetId);
    if (!target) {
      return reply.code(404).send({ error: 'User not found' });
    }
    changePassword(targetId, password);
    auditLog(user.userId, user.username, `change_password:${target.username}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  // ── POST /users/:id/activate (superadmin only) ───────────────────
  app.post('/api/admin/users/:id/activate', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser as AdminToken;
    if (user.role !== 'superadmin') {
      return reply.code(403).send({ error: 'Only superadmins can activate users' });
    }
    const { id } = req.params as { id: string };
    const targetId = parseInt(id);
    const target = findUserById(targetId);
    if (!target) {
      return reply.code(404).send({ error: 'User not found' });
    }
    activateUser(targetId);
    auditLog(user.userId, user.username, `activate_user:${target.username}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });
}
