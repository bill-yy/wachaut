/**
 * Admin API routes — Fastify plugin registered under /api/admin.
 *
 * All routes except /login require a valid JWT in the Authorization header.
 * Data endpoints aggregate live server state (rooms, connections, SFU health).
 * User management endpoints read/write the SQLite admin_users table.
 *
 * Security model:
 *  - The auth middleware re-reads role / active / token_version from the DB
 *    on every request, so role changes and password rotations apply
 *    instantly to live tokens (a token whose `ver` is stale gets 401).
 *  - Accounts flagged must_change_password can only rotate their password
 *    or log out — nothing else until they do.
 *  - Every state-changing action (and every denial) is written to the audit
 *    log with the caller's IP and country.
 *  - Routes declare JSON schemas: malformed bodies are a 400, never a 500.
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import geoip from 'geoip-country';
import {
  signToken, verifyToken, verifyPassword,
  findUserByUsername, findUserById, listUsers,
  createUser, deactivateUser, activateUser, changePassword, changeUserRole,
  updateLastLogin, auditLog,
  isValidUsername, isValidPassword, MIN_PASSWORD_LENGTH,
  countActiveSuperadmins, setTotpPendingSecret, enableTotp, disableTotp, getTotpSecret,
  storeRecoveryCodes, consumeRecoveryCode,
} from './auth.js';
import { verifyTotp, generateTotpSecret, totpUri } from './totp.js';
import { notifyAdmin, mailerStatus } from '../mailer.js';
import { findViewerInRoom, removeViewer } from '../room-store.js';
import { queryAnalytics } from '../analytics.js';
import { queryFeedback } from '../feedback.js';
import { db, getSetting, setSetting } from '../db.js';

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

/** Drop expired entries — called from the 5-minute sweeper in index.ts. */
export function cleanupLoginAttempts(nowMs: number = Date.now()): void {
  for (const [ip, entry] of loginAttempts) {
    if (nowMs > entry.resetAt) loginAttempts.delete(ip);
  }
}

// ── Maintenance mode ─────────────────────────────────────────────────
// In-memory flag for O(1) checks, mirrored into app_settings so it survives
// restarts (loaded on first import).
let maintenanceMode = getSetting('maintenance') === '1';

export function isMaintenanceMode(): boolean {
  return maintenanceMode;
}

export function setMaintenanceMode(enabled: boolean): void {
  maintenanceMode = enabled;
  setSetting('maintenance', enabled ? '1' : '0');
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
  viewerToRoom: Map<string, string>;
  hostToRoom: Map<string, string>;
  io: any;
  connectionCounts: Map<string, number>;
  sfuHealthUrl: string;
}

// ── Auth middleware ──────────────────────────────────────────────────

/** Routes an account with must_change_password=1 may still call. */
const PASSWORD_CHANGE_PATH = /^\/api\/admin\/users\/\d+\/password$/;

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
  // Re-read the user: revocation, role changes and password rotations
  // (token_version bump) must apply to already-issued tokens immediately.
  const user = findUserById(payload.userId);
  if (!user || !user.active) {
    reply.code(401).send({ error: 'Account revoked' });
    return;
  }
  if ((payload.ver ?? 0) !== user.token_version) {
    reply.code(401).send({ error: 'Session expired' });
    return;
  }
  // Forced password rotation: only the rotation itself and logout are allowed.
  const path = req.url.split('?')[0];
  if (user.must_change_password && path !== '/api/admin/logout' && !PASSWORD_CHANGE_PATH.test(path)) {
    reply.code(403).send({ error: 'Password change required', mustChangePassword: true });
    return;
  }
  (req as any).adminUser = {
    userId: user.id,
    username: user.username,
    role: user.role, // fresh from DB — role changes bypass stale token claims
  };
  done();
}

// ── Plugin ───────────────────────────────────────────────────────────

export function registerAdminRoutes(app: FastifyInstance, state: ServerState) {
  // Auth middleware — only applied to individual protected routes via preHandler,
  // NOT as a global hook (that would block /health, /ready, /socket.io).
  const requireAuth = (req: FastifyRequest, reply: FastifyReply, done: () => void) => {
    authMiddleware(req, reply, done);
  };

  /** 403 helper that also leaves an audit trail of the denial. */
  const forbidden = (req: FastifyRequest, reply: FastifyReply, action: string) => {
    const user = (req as any).adminUser;
    auditLog(user.userId, user.username, `forbidden:${action}`, req.ip, lookupCountry(req.ip));
    return reply.code(403).send({ error: `Only superadmins can ${action}` });
  };

  // ── POST /login (no auth required) ───────────────────────────────
  app.post('/api/admin/login', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 1, maxLength: 64 },
          password: { type: 'string', minLength: 1, maxLength: 128 },
          code: { type: 'string', minLength: 1, maxLength: 16 },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username, password, code } = req.body as { username: string; password: string; code?: string };
    const ip = req.ip;
    const country = lookupCountry(ip);

    if (!checkLoginRateLimit(ip)) {
      auditLog(null, String(username).slice(0, 64), 'login_rate_limited', ip, country);
      notifyAdmin('security', `Login bloqueado por límite de intentos (${country || '??'})`, [
        `Usuario intentado: ${String(username).slice(0, 64)}`,
        `IP: ${ip}${country ? ` (${country})` : ''}`,
        'Se superaron los intentos permitidos en 10 minutos — posible fuerza bruta.',
      ], );
      return reply.code(429).send({ error: 'Too many attempts. Try again in 10 minutes.' });
    }

    const user = findUserByUsername(username);

    if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
      auditLog(user?.id ?? null, String(username).slice(0, 64), 'login_failed', ip, country);
      notifyAdmin('security', `Intento de login fallido (${country || '??'})`, [
        `Usuario intentado: ${String(username).slice(0, 64)}`,
        `IP: ${ip}${country ? ` (${country})` : ''}`,
        user && !user.active ? 'La cuenta existe pero está revocada.' : 'Credenciales incorrectas.',
      ], );
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    // Second factor: TOTP code or a one-time recovery code.
    if (user.totp_enabled) {
      const secret = user.totp_secret;
      const codeOk = (code && secret && verifyTotp(secret, code))
        || (code && consumeRecoveryCode(user.id, code));
      if (!codeOk) {
        auditLog(user.id, user.username, 'login_totp_failed', ip, country);
        notifyAdmin('security', `Código 2FA incorrecto: ${user.username}`, [
          `Usuario: ${user.username} (contraseña correcta, 2FA fallido)`,
          `IP: ${ip}${country ? ` (${country})` : ''}`,
        ], );
        return reply.code(401).send({ error: 'Invalid 2FA code', totpRequired: true });
      }
    }

    // Success — clear rate limit, update last login, audit.
    clearLoginAttempts(ip);
    updateLastLogin(user.id);
    auditLog(user.id, user.username, 'login', ip, country);

    const token = signToken({ userId: user.id, username: user.username, role: user.role, ver: user.token_version });
    return reply.send({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        totpEnabled: !!user.totp_enabled,
        mustChangePassword: !!user.must_change_password,
      },
    });
  });

  // ── POST /logout ─────────────────────────────────────────────────
  app.post('/api/admin/logout', { preHandler: requireAuth }, async (req: FastifyRequest) => {
    const user = (req as any).adminUser;
    auditLog(user.userId, user.username, 'logout', req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  // ── GET /metrics ─────────────────────────────────────────────────
  app.get('/api/admin/metrics', { preHandler: requireAuth }, async () => {
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

    const openErrors = (db.prepare("SELECT COUNT(*) as n FROM error_groups WHERE status != 'resolved'").get() as { n: number }).n;
    const errors24h = (db.prepare("SELECT COUNT(*) as n FROM error_groups WHERE last_seen >= datetime('now', '-1 day')").get() as { n: number }).n;
    const contactUnread = (db.prepare('SELECT COUNT(*) as n FROM contact_messages WHERE read = 0').get() as { n: number }).n;

    return {
      rooms: roomCount,
      viewers: totalViewers,
      connections: state.io.engine.clientsCount,
      sfu: sfuHealth,
      maintenance: maintenanceMode,
      uptime: process.uptime(),
      memory: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
      errors: { open: openErrors, last24h: errors24h },
      contact: { unread: contactUnread },
      mail: mailerStatus(),
    };
  });

  // ── GET /rooms ───────────────────────────────────────────────────
  app.get('/api/admin/rooms', { preHandler: requireAuth }, async () => {
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

  // ── POST /rooms/:id/close — force-close a live room ──────────────
  app.post('/api/admin/rooms/:id/close', {
    preHandler: requireAuth,
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 1, maxLength: 64 } } } },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const room = state.rooms.get(id);
    if (!room) {
      return reply.code(404).send({ error: 'Room not found' });
    }
    if (room.hostDisconnectTimer) clearTimeout(room.hostDisconnectTimer);
    state.io.to(id).emit('room:closed');
    state.rooms.delete(id);
    state.hostToRoom.delete(room.hostId);
    for (const [viewerId] of room.viewers) {
      state.viewerToRoom.delete(viewerId);
    }
    try {
      db.prepare('INSERT INTO room_events (event_type, room_id, viewer_count) VALUES (?, ?, ?)')
        .run('closed', id, room.viewers.size);
    } catch { /* non-critical */ }
    const user = (req as any).adminUser;
    auditLog(user.userId, user.username, `room_closed:${id}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  // ── POST /rooms/:id/kick — remove a viewer from a live room ──────
  app.post('/api/admin/rooms/:id/kick', {
    preHandler: requireAuth,
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 1, maxLength: 64 } } },
      body: {
        type: 'object',
        required: ['viewer'],
        properties: { viewer: { type: 'string', minLength: 1, maxLength: 64 } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { viewer: viewerRef } = req.body as { viewer: string };
    const room = state.rooms.get(id);
    if (!room) {
      return reply.code(404).send({ error: 'Room not found' });
    }
    const viewer = findViewerInRoom(room, viewerRef);
    if (!viewer) {
      return reply.code(404).send({ error: `Viewer "${viewerRef}" not found in room` });
    }
    state.io.to(viewer.socketId).emit('viewer:kicked', { reason: 'Expulsado por un administrador' });
    removeViewer({ rooms: state.rooms, viewerToRoom: state.viewerToRoom, hostToRoom: state.hostToRoom }, id, viewer.socketId);
    state.io.to(room.hostId).emit('viewer:left', { viewerId: viewer.socketId, username: viewer.name });
    try {
      db.prepare('INSERT INTO room_events (event_type, room_id, viewer_count) VALUES (?, ?, ?)')
        .run('viewer_left', id, room.viewers.size);
    } catch { /* non-critical */ }
    const user = (req as any).adminUser;
    auditLog(user.userId, user.username, `room_kick:${id}:${viewer.name}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  // ── GET /security ────────────────────────────────────────────────
  app.get('/api/admin/security', { preHandler: requireAuth }, async () => {
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

  // ── GET /audit — full audit log with pagination ──────────────────
  app.get('/api/admin/audit', {
    preHandler: requireAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          action: { type: 'string', minLength: 1, maxLength: 64 },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest) => {
    const { limit, offset, action } = req.query as { limit: number; offset: number; action?: string };
    if (action) {
      const like = `%${action}%`;
      const total = (db.prepare('SELECT COUNT(*) as n FROM admin_audit_log WHERE action LIKE ?').get(like) as { n: number }).n;
      const entries = db.prepare(
        'SELECT username, action, ip, country, timestamp FROM admin_audit_log WHERE action LIKE ? ORDER BY timestamp DESC LIMIT ? OFFSET ?'
      ).all(like, limit, offset);
      return { total, entries };
    }
    const total = (db.prepare('SELECT COUNT(*) as n FROM admin_audit_log').get() as { n: number }).n;
    const entries = db.prepare(
      'SELECT username, action, ip, country, timestamp FROM admin_audit_log ORDER BY timestamp DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);
    return { total, entries };
  });

  // ── GET /stats ───────────────────────────────────────────────────
  app.get('/api/admin/stats', { preHandler: requireAuth }, async () => {
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

  // ── POST /maintenance (superadmin only) ──────────────────────────
  app.post('/api/admin/maintenance', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['enabled'],
        properties: { enabled: { type: 'boolean' } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    if (user.role !== 'superadmin') {
      return forbidden(req, reply, 'toggle maintenance mode');
    }
    const { enabled } = req.body as { enabled: boolean };
    setMaintenanceMode(enabled);
    auditLog(user.userId, user.username, enabled ? 'maintenance_on' : 'maintenance_off', req.ip, lookupCountry(req.ip));
    return { maintenance: maintenanceMode };
  });

  // ── GET /analytics — traffic analytics (SEO/SEM) ──────────────────
  app.get('/api/admin/analytics', {
    preHandler: requireAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: { days: { type: 'integer', minimum: 1, maximum: 90, default: 7 } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest) => {
    const { days } = req.query as { days: number };
    return queryAnalytics(days);
  });

  // ── Errors: list / detail / status / delete ────────────────────────

  app.get('/api/admin/errors', {
    preHandler: requireAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'acknowledged', 'resolved'] },
          source: { type: 'string', enum: ['web', 'server', 'sfu'] },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest) => {
    const { status, source, limit, offset } = req.query as { status?: string; source?: string; limit: number; offset: number };
    const where: string[] = [];
    const params: unknown[] = [];
    if (status) { where.push('status = ?'); params.push(status); }
    if (source) { where.push('source = ?'); params.push(source); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = (db.prepare(`SELECT COUNT(*) as n FROM error_groups ${whereSql}`).get(...params) as { n: number }).n;
    const groups = db.prepare(
      `SELECT id, source, component, title, severity, status, count, first_seen, last_seen, sample_stack, meta
       FROM error_groups ${whereSql} ORDER BY last_seen DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);
    return { total, groups };
  });

  app.get('/api/admin/errors/:id', {
    preHandler: requireAuth,
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: number };
    const group = db.prepare('SELECT * FROM error_groups WHERE id = ?').get(id);
    if (!group) return reply.code(404).send({ error: 'Error group not found' });
    const events = db.prepare(
      'SELECT ts, page, room_id, visitor_id, country, message FROM error_events WHERE group_id = ? ORDER BY ts DESC LIMIT 20'
    ).all(id);
    return { group, events };
  });

  app.post('/api/admin/errors/:id/status', {
    preHandler: requireAuth,
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string', enum: ['open', 'acknowledged', 'resolved'] } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    const { id } = req.params as { id: number };
    const { status: newStatus } = req.body as { status: 'open' | 'acknowledged' | 'resolved' };
    const group = db.prepare('SELECT id, title FROM error_groups WHERE id = ?').get(id) as { id: number; title: string } | undefined;
    if (!group) return reply.code(404).send({ error: 'Error group not found' });
    db.prepare('UPDATE error_groups SET status = ? WHERE id = ?').run(newStatus, id);
    auditLog(user.userId, user.username, `error_status:${id}:${newStatus}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  app.delete('/api/admin/errors/:id', {
    preHandler: requireAuth,
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    const { id } = req.params as { id: number };
    const group = db.prepare('SELECT id, title FROM error_groups WHERE id = ?').get(id) as { id: number; title: string } | undefined;
    if (!group) return reply.code(404).send({ error: 'Error group not found' });
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM error_events WHERE group_id = ?').run(id);
      db.prepare('DELETE FROM error_groups WHERE id = ?').run(id);
    });
    tx();
    auditLog(user.userId, user.username, `error_delete:${id}:${group.title.slice(0, 40)}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  // ── Connections: reliability telemetry (broadcast drops) ──────────

  app.get('/api/admin/connections', {
    preHandler: requireAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: { days: { type: 'integer', minimum: 1, maximum: 30, default: 7 } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest) => {
    const { days } = req.query as { days: number };

    const hostDrops = db.prepare(
      "SELECT COUNT(*) as n, SUM(recovered) as recovered, AVG(recovery_ms) as avg_recovery FROM connection_events WHERE role = 'host' AND ts >= datetime('now', ?)"
    ).get(`-${days} days`) as { n: number; recovered: number | null; avg_recovery: number | null };

    const viewerDrops = db.prepare(
      "SELECT cause, COUNT(*) as n FROM connection_events WHERE role = 'viewer' AND ts >= datetime('now', ?) GROUP BY cause"
    ).all(`-${days} days`) as { cause: string; n: number }[];

    // Viewer recovery (derived): a network drop followed by a join of the
    // same room within 5 minutes.
    const viewerRecovered = (db.prepare(`
      SELECT COUNT(*) as n FROM connection_events c
      WHERE c.role = 'viewer' AND c.cause = 'network'
        AND c.ts >= datetime('now', ?)
        AND EXISTS (
          SELECT 1 FROM room_events r
          WHERE r.event_type = 'viewer_joined' AND r.room_id = c.room_id
            AND r.timestamp > c.ts AND r.timestamp <= datetime(c.ts, '+5 minutes')
        )
    `).get(`-${days} days`) as { n: number }).n;

    const events = db.prepare(`
      SELECT ts, room_id, role, cause, detail, duration_ms, recovered, recovery_ms, viewers_affected
      FROM connection_events ORDER BY ts DESC LIMIT 50
    `).all();

    const causeMap: Record<string, number> = {};
    for (const row of viewerDrops) causeMap[row.cause] = row.n;

    return {
      kpis: {
        hostDrops: hostDrops.n || 0,
        hostRecoveredPct: hostDrops.n ? Math.round(((hostDrops.recovered || 0) / hostDrops.n) * 100) : null,
        avgRecoveryMs: hostDrops.avg_recovery != null ? Math.round(hostDrops.avg_recovery) : null,
        viewerNetworkDrops: causeMap.network || 0,
        viewerCleanLeaves: causeMap.clean || 0,
        viewerRecovered,
      },
      events,
    };
  });

  // ── Contact messages: list / mark read / delete ────────────────────

  app.get('/api/admin/contact', {
    preHandler: requireAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest) => {
    const { limit, offset } = req.query as { limit: number; offset: number };
    const total = (db.prepare('SELECT COUNT(*) as n FROM contact_messages').get() as { n: number }).n;
    const unread = (db.prepare('SELECT COUNT(*) as n FROM contact_messages WHERE read = 0').get() as { n: number }).n;
    const messages = db.prepare(
      'SELECT id, ts, name, email, message, page, country, read FROM contact_messages ORDER BY ts DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);
    return { total, unread, messages };
  });

  app.post('/api/admin/contact/:id/read', {
    preHandler: requireAuth,
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        required: ['read'],
        properties: { read: { type: 'boolean' } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    const { id } = req.params as { id: number };
    const { read } = req.body as { read: boolean };
    const target = db.prepare('SELECT id FROM contact_messages WHERE id = ?').get(id);
    if (!target) return reply.code(404).send({ error: 'Message not found' });
    db.prepare('UPDATE contact_messages SET read = ? WHERE id = ?').run(read ? 1 : 0, id);
    auditLog(user.userId, user.username, `contact_read:${id}:${read ? 1 : 0}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  app.delete('/api/admin/contact/:id', {
    preHandler: requireAuth,
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    const { id } = req.params as { id: number };
    const target = db.prepare('SELECT id FROM contact_messages WHERE id = ?').get(id);
    if (!target) return reply.code(404).send({ error: 'Message not found' });
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
    auditLog(user.userId, user.username, `contact_delete:${id}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  // ── Feedback: aggregated ratings + recent ─────────────────────────

  app.get('/api/admin/feedback', {
    preHandler: requireAuth,
    schema: {
      querystring: {
        type: 'object',
        properties: { days: { type: 'integer', minimum: 1, maximum: 90, default: 7 } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest) => {
    const { days } = req.query as { days: number };
    return queryFeedback(days);
  });

  app.delete('/api/admin/feedback/:id', {
    preHandler: requireAuth,
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    const { id } = req.params as { id: number };
    const row = db.prepare('SELECT id, room_id, rating FROM feedback WHERE id = ?').get(id);
    if (!row) return reply.code(404).send({ error: 'Feedback not found' });
    db.prepare('DELETE FROM feedback WHERE id = ?').run(id);
    auditLog(user.userId, user.username, `feedback_delete:${id}:${(row as any).rating}★`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  // ── GET /users ───────────────────────────────────────────────────
  app.get('/api/admin/users', { preHandler: requireAuth }, async () => {
    return { users: listUsers() };
  });

  // ── POST /users (superadmin only) ────────────────────────────────
  app.post('/api/admin/users', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 32 },
          password: { type: 'string', minLength: 1, maxLength: 128 },
          role: { type: 'string', enum: ['admin', 'superadmin'] },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    if (user.role !== 'superadmin') {
      return forbidden(req, reply, 'create users');
    }
    const { username, password, role } = req.body as { username: string; password: string; role?: string };
    if (!isValidUsername(username)) {
      return reply.code(400).send({ error: 'Username must be 3-32 chars (letters, numbers, . _ -)' });
    }
    if (!isValidPassword(password)) {
      return reply.code(400).send({ error: `Password must be ${MIN_PASSWORD_LENGTH}-${128} characters` });
    }
    try {
      const newUser = createUser(username, password, role || 'admin');
      auditLog(user.userId, user.username, `create_user:${username}`, req.ip, lookupCountry(req.ip));
      notifyAdmin('security', `Usuario admin creado: ${username}`, [
        `Nuevo usuario: ${username} (rol ${newUser.role})`,
        `Creado por: ${user.username} · IP ${req.ip}`,
      ]);
      return { user: newUser };
    } catch (err: any) {
      if (err?.message?.includes('UNIQUE')) {
        return reply.code(409).send({ error: 'Username already exists' });
      }
      throw err;
    }
  });

  // ── DELETE /users/:id (superadmin only — soft revoke) ────────────
  app.delete('/api/admin/users/:id', {
    preHandler: requireAuth,
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    if (user.role !== 'superadmin') {
      return forbidden(req, reply, 'revoke users');
    }
    const { id } = req.params as { id: number };
    if (id === user.userId) {
      return reply.code(400).send({ error: 'Cannot revoke your own account' });
    }
    const target = findUserById(id);
    if (!target) {
      return reply.code(404).send({ error: 'User not found' });
    }
    // Never revoke the last active superadmin (locks everyone out of management).
    if (target.role === 'superadmin' && target.active && countActiveSuperadmins() <= 1) {
      return reply.code(400).send({ error: 'Cannot revoke the last active superadmin' });
    }
    deactivateUser(id);
    auditLog(user.userId, user.username, `revoke_user:${target.username}`, req.ip, lookupCountry(req.ip));
    notifyAdmin('security', `Cuenta admin revocada: ${target.username}`, [
      `Usuario revocado: ${target.username}`,
      `Por: ${user.username} · IP ${req.ip}`,
    ]);
    return { success: true };
  });

  // ── POST /users/:id/activate (superadmin only) ───────────────────
  app.post('/api/admin/users/:id/activate', {
    preHandler: requireAuth,
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    if (user.role !== 'superadmin') {
      return forbidden(req, reply, 'activate users');
    }
    const { id } = req.params as { id: number };
    const target = findUserById(id);
    if (!target) {
      return reply.code(404).send({ error: 'User not found' });
    }
    activateUser(id);
    auditLog(user.userId, user.username, `activate_user:${target.username}`, req.ip, lookupCountry(req.ip));
    return { success: true };
  });

  // ── POST /users/:id/role (superadmin only) ───────────────────────
  app.post('/api/admin/users/:id/role', {
    preHandler: requireAuth,
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        required: ['role'],
        properties: { role: { type: 'string', enum: ['admin', 'superadmin'] } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    if (user.role !== 'superadmin') {
      return forbidden(req, reply, 'change roles');
    }
    const { id } = req.params as { id: number };
    const { role } = req.body as { role: 'admin' | 'superadmin' };
    const target = findUserById(id);
    if (!target) {
      return reply.code(404).send({ error: 'User not found' });
    }
    if (target.role === role) {
      return reply.code(400).send({ error: `User already has role ${role}` });
    }
    // Demoting the last active superadmin would lock out management.
    if (target.role === 'superadmin' && role === 'admin' && target.active && countActiveSuperadmins() <= 1) {
      return reply.code(400).send({ error: 'Cannot demote the last active superadmin' });
    }
    changeUserRole(id, role);
    auditLog(user.userId, user.username, `role_change:${target.username}:${role}`, req.ip, lookupCountry(req.ip));
    notifyAdmin('security', `Rol cambiado: ${target.username} → ${role}`, [
      `${target.username}: ${target.role} → ${role}`,
      `Por: ${user.username} · IP ${req.ip}`,
    ]);
    return { success: true };
  });

  // ── POST /users/:id/password ─────────────────────────────────────
  app.post('/api/admin/users/:id/password', {
    preHandler: requireAuth,
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        required: ['password'],
        properties: { password: { type: 'string', minLength: 1, maxLength: 128 } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    const { id } = req.params as { id: number };
    const { password } = req.body as { password: string };

    if (!isValidPassword(password)) {
      return reply.code(400).send({ error: `Password must be ${MIN_PASSWORD_LENGTH}-128 characters` });
    }
    // Users can change their own password; superadmins can change anyone's.
    // (must_change_password accounts are only allowed here — the middleware
    // gates every other route — and the owner is themselves.)
    if (id !== user.userId && user.role !== 'superadmin') {
      auditLog(user.userId, user.username, `forbidden:change_password:${id}`, req.ip, lookupCountry(req.ip));
      return reply.code(403).send({ error: 'Not authorized' });
    }
    const target = findUserById(id);
    if (!target) {
      return reply.code(404).send({ error: 'User not found' });
    }
    changePassword(id, password);
    auditLog(user.userId, user.username, `change_password:${target.username}`, req.ip, lookupCountry(req.ip));
    notifyAdmin('security', `Contraseña cambiada: ${target.username}`, [
      `Contraseña actualizada para ${target.username}`,
      `Por: ${user.username} · IP ${req.ip}`,
      'Si no fuiste tú, revisa la cuenta de inmediato.',
    ]);
    return { success: true };
  });

  // ── 2FA (TOTP) ───────────────────────────────────────────────────

  // Generate a pending secret + otpauth URI (not enabled until verified).
  app.post('/api/admin/totp/setup', { preHandler: requireAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    const full = findUserById(user.userId)!;
    if (full.totp_enabled) {
      return reply.code(400).send({ error: '2FA is already enabled' });
    }
    const secret = generateTotpSecret();
    setTotpPendingSecret(user.userId, secret);
    return { secret, uri: totpUri(secret, full.username) };
  });

  // Verify the first code and activate. Recovery codes are returned exactly once.
  app.post('/api/admin/totp/enable', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['code'],
        properties: { code: { type: 'string', minLength: 6, maxLength: 16 } },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).adminUser;
    const full = findUserById(user.userId)!;
    if (full.totp_enabled) {
      return reply.code(400).send({ error: '2FA is already enabled' });
    }
    const { code } = req.body as { code: string };
    if (!verifyTotp(getTotpSecret(user.userId) || '', code)) {
      return reply.code(400).send({ error: 'Invalid code — check your authenticator and try again' });
    }
    enableTotp(user.userId);
    const recoveryCodes = storeRecoveryCodes(user.userId);
    auditLog(user.userId, user.username, 'totp_enable', req.ip, lookupCountry(req.ip));
    notifyAdmin('security', `2FA activado: ${user.username}`, [
      `Se activó el segundo factor para ${user.username}`,
      `IP ${req.ip}${lookupCountry(req.ip) ? ` (${lookupCountry(req.ip)})` : ''}`,
    ]);
    return { enabled: true, recoveryCodes };
  });

  // Disable 2FA. Requires the account password (and the TOTP code when active).
  // A superadmin can disable another user's 2FA (e.g. lost device) with their
  // own password + optional target userId.
  app.post('/api/admin/totp/disable', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', minLength: 1, maxLength: 128 },
          code: { type: 'string', minLength: 6, maxLength: 16 },
          userId: { type: 'integer' },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const actor = (req as any).adminUser;
    const { password, code, userId } = req.body as { password: string; code?: string; userId?: number };
    const targetId = userId ?? actor.userId;
    if (targetId !== actor.userId && actor.role !== 'superadmin') {
      return forbidden(req, reply, 'disable 2FA for other users');
    }
    // Confirm intent with the ACTING user's password.
    const actorFull = findUserByUsername(actor.username)!;
    if (!verifyPassword(password, actorFull.password_hash)) {
      return reply.code(401).send({ error: 'Invalid password' });
    }
    const target = findUserById(targetId);
    if (!target) {
      return reply.code(404).send({ error: 'User not found' });
    }
    if (!target.totp_enabled) {
      return reply.code(400).send({ error: '2FA is not enabled for this user' });
    }
    // When disabling your own 2FA, a current code is required too.
    if (targetId === actor.userId) {
      const targetFull = findUserByUsername(target.username)!;
      const codeOk = (code && targetFull.totp_secret && verifyTotp(targetFull.totp_secret, code))
        || (code && consumeRecoveryCode(targetId, code));
      if (!codeOk) {
        return reply.code(400).send({ error: 'Invalid 2FA code' });
      }
    }
    disableTotp(targetId);
    auditLog(actor.userId, actor.username, `totp_disable:${target.username}`, req.ip, lookupCountry(req.ip));
    notifyAdmin('security', `2FA DESACTIVADO: ${target.username}`, [
      `Se desactivó el segundo factor de ${target.username}`,
      `Por: ${actor.username} · IP ${req.ip}`,
      targetId === actor.userId ? 'Auto-desactivación con código verificado.' : 'Desactivada por un superadmin.',
      'Si no fuiste tú, asegúrate de que la cuenta no esté comprometida.',
    ], );
    return { success: true };
  });
}
