/**
 * Contact form + post-broadcast feedback (ratings with key questions).
 *
 * Both endpoints are public and same-origin (Traefik routes /api/contact and
 * /api/feedback on the main domain); each has its own per-IP rate limiter.
 * The raw IP is never stored — geoip country + salted hash only, same as
 * the rest of the platform's telemetry.
 */

import { createHash } from 'node:crypto';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import geoip from 'geoip-country';
import { db } from './db.js';

const IP_HASH_SALT = process.env.ADMIN_JWT_SECRET || 'feedback-salt';

// ── Rate limiters (in-memory, per IP; cleaned by the sweeper) ────────
const contactCalls = new Map<string, { count: number; resetAt: number }>();
const feedbackCalls = new Map<string, { count: number; resetAt: number }>();

function checkRate(map: Map<string, { count: number; resetAt: number }>, ip: string, max: number): boolean {
  const now = Date.now();
  const entry = map.get(ip);
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function cleanupFeedbackRateLimits(nowMs: number = Date.now()): void {
  for (const map of [contactCalls, feedbackCalls]) {
    for (const [ip, entry] of map) {
      if (nowMs > entry.resetAt) map.delete(ip);
    }
  }
}

function lookupCountry(ip: string): string | null {
  try {
    return geoip.lookup(ip)?.country || null;
  } catch {
    return null;
  }
}

function hashIp(ip: string): string {
  return createHash('sha256').update(`${IP_HASH_SALT}:${ip}`).digest('hex').slice(0, 16);
}

// ── Feedback question definitions (single source of truth) ───────────
// Keys and values are fixed enums so the admin aggregation is exact and
// the client renders whatever the role map contains.

export const FEEDBACK_QUESTIONS: Record<'viewer' | 'host', Record<string, string[]>> = {
  viewer: {
    video: ['fluida', 'cortes', 'entrecortada'],
    entrada: ['sin_problemas', 'tardo', 'no_conecte'],
    recomendaria: ['si', 'tal_vez', 'no'],
  },
  host: {
    emision: ['facil', 'dificultades', 'frustrante'],
    estabilidad: ['estable', 'algunos_cortes', 'cortes_constantes'],
    volveria: ['si', 'tal_vez', 'no'],
  },
};

// ── Public routes ────────────────────────────────────────────────────

export function registerFeedbackRoutes(app: FastifyInstance): void {
  app.post('/api/contact', {
    schema: {
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 64 },
          email: { type: 'string', maxLength: 128, format: 'email' },
          message: { type: 'string', minLength: 5, maxLength: 2000 },
          page: { type: 'string', maxLength: 128 },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    if (!checkRate(contactCalls, req.ip, 5)) {
      return reply.code(429).send({ ok: false, error: 'Demasiados envíos. Espera un minuto.' });
    }
    const { name, email, message, page } = req.body as {
      name?: string; email?: string; message: string; page?: string;
    };
    db.prepare('INSERT INTO contact_messages (name, email, message, page, ip_hash, country) VALUES (?, ?, ?, ?, ?, ?)')
      .run(name?.trim() || null, email?.trim().toLowerCase() || null, message.trim(), page || null, hashIp(req.ip), lookupCountry(req.ip));
    return { ok: true };
  });

  app.post('/api/feedback', {
    schema: {
      body: {
        type: 'object',
        required: ['roomId', 'role', 'rating'],
        properties: {
          roomId: { type: 'string', minLength: 1, maxLength: 64 },
          role: { type: 'string', enum: ['host', 'viewer'] },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          // Loose here (maxProperties caps the payload); the handler does the
          // strict per-role key/value enum check that JSON schema can't express.
          answers: {
            type: 'object',
            maxProperties: 3,
            additionalProperties: { type: 'string', maxLength: 32 },
          },
          comment: { type: 'string', maxLength: 500 },
          vid: { type: 'string', pattern: '^[a-zA-Z0-9-]{8,64}$' },
        },
        additionalProperties: false,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    if (!checkRate(feedbackCalls, req.ip, 10)) {
      return reply.code(429).send({ ok: false });
    }
    const body = req.body as {
      roomId: string; role: 'host' | 'viewer'; rating: number;
      answers?: Record<string, string>; comment?: string; vid?: string;
    };

    // Answers: every key must belong to the role's question set with a
    // valid enum value (the schema alone can't check per-role).
    const allowed = FEEDBACK_QUESTIONS[body.role];
    const answers = body.answers || {};
    for (const [key, value] of Object.entries(answers)) {
      if (!allowed[key] || !allowed[key].includes(value)) {
        return reply.code(400).send({ ok: false, error: `Respuesta inválida para "${key}"` });
      }
    }

    // Dedupe: one rating per IP + room + role per day (spam/accidental
    // double submits would skew the aggregates).
    const ipHash = hashIp(req.ip);
    const dup = db.prepare(
      "SELECT id FROM feedback WHERE ip_hash = ? AND room_id = ? AND role = ? AND ts >= datetime('now', '-1 day') LIMIT 1"
    ).get(ipHash, body.roomId, body.role);
    if (dup) {
      return reply.code(409).send({ ok: false, error: 'already rated' });
    }

    db.prepare('INSERT INTO feedback (room_id, role, rating, answers, comment, visitor_id, ip_hash, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(body.roomId, body.role, body.rating, JSON.stringify(answers), body.comment?.trim() || null, body.vid || null, ipHash, lookupCountry(req.ip));
    return { ok: true };
  });
}

// ── Admin aggregation ────────────────────────────────────────────────

/**
 * Aggregates feedback for the admin panel: count, average, 1-5
 * distribution, host/viewer split, per-question answer distributions and
 * the most recent entries (with comments). Volume is low — aggregate in
 * memory over the selected window.
 */
export function queryFeedback(days: number): any {
  const rows = db.prepare(
    "SELECT ts, room_id, role, rating, answers, comment, country FROM feedback WHERE ts >= datetime('now', ?) ORDER BY ts DESC"
  ).all(`-${days} days`) as { ts: string; room_id: string; role: string; rating: number; answers: string; comment: string | null; country: string | null }[];

  const distribution = [0, 0, 0, 0, 0];
  let sum = 0;
  const roles = { host: 0, viewer: 0 };
  // questionDists[role][key][value] = count
  const questionDists: Record<string, Record<string, Record<string, number>>> = { host: {}, viewer: {} };

  for (const row of rows) {
    sum += row.rating;
    distribution[row.rating - 1]++;
    roles[row.role as 'host' | 'viewer']++;
    let answers: Record<string, string> = {};
    try { answers = JSON.parse(row.answers || '{}'); } catch { /* corrupted — skip answers */ }
    const dist = questionDists[row.role];
    for (const [key, value] of Object.entries(answers)) {
      dist[key] = dist[key] || {};
      dist[key][value] = (dist[key][value] || 0) + 1;
    }
  }

  // Fill every question with its full option list (zeros included) so the
  // UI renders a stable shape.
  const questions: Record<string, { question: string; options: { value: string; count: number }[] }[]> = {};
  const LABELS: Record<string, string> = {
    video: 'Calidad de vídeo', entrada: 'Entrada a la sala', recomendaria: '¿Recomendaría Wachaut?',
    emision: 'Experiencia emitiendo', estabilidad: 'Estabilidad de conexión', volveria: '¿Volvería a emitir?',
  };
  for (const role of ['viewer', 'host'] as const) {
    questions[role] = Object.entries(FEEDBACK_QUESTIONS[role]).map(([key, options]) => ({
      question: LABELS[key] || key,
      options: options.map((value) => ({ value, count: questionDists[role][key]?.[value] || 0 })),
    }));
  }

  return {
    count: rows.length,
    average: rows.length ? Math.round((sum / rows.length) * 10) / 10 : null,
    distribution,
    roles,
    questions,
    recent: rows.slice(0, 50),
  };
}
