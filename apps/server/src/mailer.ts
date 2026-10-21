/**
 * Admin email alerts via the Resend API (domain wachaut.com verified).
 *
 * Quota-aware by design: the free Resend tier allows 100 emails/day and
 * 3000/month, and a runaway error loop would burn that in minutes.
 * Strategy:
 *  - The FIRST event of a kind (per subject key) sends immediately.
 *  - Repeats inside the 5-minute batch window are aggregated into a
 *    single "subject (×N)" summary on the next flush.
 *  - Per-type daily caps plus one global daily cap leave headroom under
 *    the 100/day limit; anything suppressed by a cap is counted and
 *    included in the next daily digest, so nothing is silently lost.
 *  - Entirely disabled (silent no-op) until RESEND_API_KEY and
 *    ADMIN_NOTIFY_EMAIL are both set — the app runs unchanged without
 *    them. Failed sends are retried once on the following flush.
 *
 * Env:
 *   RESEND_API_KEY      — API key from the Resend dashboard (secret).
 *   ADMIN_NOTIFY_EMAIL  — comma-separated recipient list.
 *   MAIL_FROM           — optional From override
 *                         (default "Wachaut <alertas@wachaut.com>").
 */

// Minimal logger (fastify's pino instance is not importable from here
// without coupling; console is fine for two warn/info lines).
const log = {
  info: (msg: string) => console.log(`[mailer] ${msg}`),
  warn: (msg: string, extra?: unknown) => console.warn(`[mailer] ${msg}`, extra ?? ''),
};

const RESEND_ENDPOINT = 'https://api.resend.com/emails';const IMMEDIATE_COOLDOWN_MS = 10 * 60 * 1000; // first hit sends, rest batch
const DIGEST_MIN_INTERVAL_MS = 20 * 60 * 60 * 1000; // ~daily

export type MailType = 'security' | 'errors' | 'contact' | 'feedback' | 'capacity';

/** Per-type daily caps — together well under Resend's 100/day. */
const TYPE_CAPS: Record<MailType, number> = {
  security: 20,
  errors: 20,
  contact: 25,
  feedback: 15,
  capacity: 10,
};
/** Global daily ceiling across all types (headroom for digest + retries). */
const GLOBAL_CAP = 70;

interface BatchEntry {
  subject: string;
  firstLines: string[];
  lastLines: string[];
  count: number;
  type: MailType;
  queuedAt: number;
}

let apiKey = '';
let recipients: string[] = [];
let fromAddress = 'Wachaut <alertas@wachaut.com>';

let day = '';
let sentByType: Record<MailType, number> = { security: 0, errors: 0, contact: 0, feedback: 0, capacity: 0 };
let globalSent = 0;
let suppressedByType: Record<MailType, number> = { security: 0, errors: 0, contact: 0, feedback: 0, capacity: 0 };
let lastDigestAt = 0;

const batches = new Map<string, BatchEntry>();
const lastSentAt = new Map<string, number>();
const retryQueue: { subject: string; text: string }[] = [];

/** Read env (idempotent) — call from server bootstrap. */
export function initMailer(): void {
  apiKey = process.env.RESEND_API_KEY || '';
  recipients = (process.env.ADMIN_NOTIFY_EMAIL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  fromAddress = process.env.MAIL_FROM || fromAddress;
  if (apiKey && recipients.length) {
    log.info(`admin mail alerts enabled → ${recipients.length} recipient(s) via Resend`);
  }}

export function mailerEnabled(): boolean {
  return Boolean(apiKey && recipients.length);
}

function rolloverDay(nowMs: number): void {
  const today = new Date(nowMs).toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    sentByType = { security: 0, errors: 0, contact: 0, feedback: 0, capacity: 0 };
    globalSent = 0;
    lastSentAt.clear(); // a fresh day re-earns immediate sends
  }
}

/**
 * Queue an admin notification. `subject` should be short and stable per
 * event kind: it is the batching key. First occurrence of a kind sends
 * immediately; repeats within the cooldown window batch into the next
 * flush (quota protection — identical subjects collapse to "×N").
 */
export function notifyAdmin(
  type: MailType,
  subject: string,
  lines: string[],
  opts: { nowMs?: number } = {},
): void {
  try {
    if (!mailerEnabled()) return;
    const now = opts.nowMs ?? Date.now();
    rolloverDay(now);

    const key = `${type}|${subject}`;
    const cooled = now - (lastSentAt.get(key) ?? 0) > IMMEDIATE_COOLDOWN_MS;
    const canSendNow = globalSent < GLOBAL_CAP && sentByType[type] < TYPE_CAPS[type];

    if (cooled && canSendNow) {
      lastSentAt.set(key, now);
      sentByType[type]++;
      globalSent++;
      void sendMail(subject, renderBody(lines, now)).catch(() => {
        /* sendMail already logged; retryQueue already holds it */
      });
      return;
    }

    if (!canSendNow) {
      suppressedByType[type]++;
      return;
    }

    // Repeat within the cooldown window → batch for the next flush.
    const entry = batches.get(key);
    if (entry) {
      entry.count++;
      entry.lastLines = lines;
    } else {
      batches.set(key, { subject, firstLines: lines, lastLines: lines, count: 1, type, queuedAt: now });
    }
  } catch {
    /* alerting must never take the app down */
  }
}

/** Flush batches + retry failed sends. Driven by the 5-minute sweeper. */
export function flushMailer(nowMs: number = Date.now()): void {
  try {
    if (!mailerEnabled()) {
      batches.clear();
      retryQueue.length = 0;
      return;
    }
    rolloverDay(nowMs);

    const retrying = retryQueue.splice(0, retryQueue.length);
    for (const item of retrying) {
      if (globalSent >= GLOBAL_CAP) {
        retryQueue.push(item);
        break;
      }
      globalSent++;
      void sendMail(item.subject, item.text).catch(() => {});
    }

    for (const [key, entry] of batches) {
      if (globalSent >= GLOBAL_CAP || sentByType[entry.type] >= TYPE_CAPS[entry.type]) {
        suppressedByType[entry.type] += entry.count;
        batches.delete(key);
        continue;
      }
      const subject = entry.count > 1 ? `${entry.subject} (×${entry.count})` : entry.subject;
      const body = [
        entry.count > 1 ? `${entry.count} eventos similares en los últimos minutos.` : '',
        ...entry.firstLines,
        ...(entry.count > 1 ? ['', '— último evento —', ...entry.lastLines] : []),
      ].filter((l) => l !== '');
      sentByType[entry.type]++;
      globalSent++;
      void sendMail(subject, renderBody(body, nowMs)).catch(() => {});
      batches.delete(key);
    }

    maybeDigest(nowMs);
  } catch {
    /* never break the sweeper */
  }
}

function maybeDigest(nowMs: number): void {
  const suppressedTotal = Object.values(suppressedByType).reduce((a, b) => a + b, 0);
  if (suppressedTotal === 0) return;
  // Anchor the window on the first flush — otherwise lastDigestAt=0 would
  // fire a digest immediately on boot.
  if (!lastDigestAt) {
    lastDigestAt = nowMs;
    return;
  }
  if (nowMs - lastDigestAt < DIGEST_MIN_INTERVAL_MS) return;
  if (globalSent >= GLOBAL_CAP) return;

  const lines = [
    `${suppressedTotal} avisos quedaron suprimidos hoy por los límites diarios:`,
    ...Object.entries(suppressedByType)
      .filter(([, n]) => n > 0)
      .map(([type, n]) => `  · ${type}: ${n}`),
    '',
    'Revísalos en el panel: wachaut.com → Administración → Errores / Contacto.',
  ];
  lastDigestAt = nowMs;
  globalSent++;
  void sendMail('Resumen diario de avisos suprimidos', renderBody(lines, nowMs))
    .then(() => {
      suppressedByType = { security: 0, errors: 0, contact: 0, feedback: 0, capacity: 0 };
    })
    .catch(() => {});
}

function renderBody(lines: string[], nowMs: number): string {
  return [
    ...lines,
    '',
    `— Wachaut · alertas automáticas (${new Date(nowMs).toISOString()})`,
    `Envíos de correo hoy: ${globalSent}/${GLOBAL_CAP}`,
  ].join('\n');
}

async function sendMail(subject: string, text: string, attachment?: { filename: string; contentB64: string }): Promise<void> {
  try {
    const payload: Record<string, unknown> = { from: fromAddress, to: recipients, subject: `[Wachaut] ${subject}`, text };
    if (attachment) {
      payload.attachments = [{ filename: attachment.filename, content: attachment.contentB64 }];
    }
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      // One retry on the next flush, then give up (logged either way).
      // Attachment mails are not retried — the file may have rotated away.
      if (!attachment && retryQueue.length < 10 && !retryQueue.some((r) => r.subject === subject)) {
        retryQueue.push({ subject, text });
      }
      log.warn(`resend send failed (HTTP ${res.status})`);
    }
  } catch (err) {
    if (!attachment && retryQueue.length < 10 && !retryQueue.some((r) => r.subject === subject)) {
      retryQueue.push({ subject, text });
    }
    log.warn(`resend unreachable: ${String(err).slice(0, 200)}`);
  }
}

/**
 * One-off attachment email (daily DB backup). Bypasses the per-type caps —
 * it is at most one mail per day — but still respects the global ceiling
 * and the enabled check.
 */
export async function sendAdminAttachment(
  subject: string,
  text: string,
  attachment: { filename: string; contentB64: string },
  nowMs: number = Date.now(),
): Promise<boolean> {
  if (!mailerEnabled()) return false;
  rolloverDay(nowMs);
  if (globalSent >= GLOBAL_CAP) return false;
  globalSent++;
  await sendMail(subject, text, attachment);
  return true;
}

/** Snapshot for /metrics and tests. */
export function mailerStatus(): {
  enabled: boolean;
  sentToday: number;
  globalCap: number;
  byType: Record<MailType, number>;
  suppressed: Record<MailType, number>;
  queuedBatches: number;
} {
  return {
    enabled: mailerEnabled(),
    sentToday: globalSent,
    globalCap: GLOBAL_CAP,
    byType: { ...sentByType },
    suppressed: { ...suppressedByType },
    queuedBatches: batches.size,
  };
}

/** Tests only: restore pristine state. */
export function __resetMailerForTests(): void {
  apiKey = '';
  recipients = [];
  fromAddress = 'Wachaut <alertas@wachaut.com>';
  day = '';
  sentByType = { security: 0, errors: 0, contact: 0, feedback: 0, capacity: 0 };
  suppressedByType = { security: 0, errors: 0, contact: 0, feedback: 0, capacity: 0 };
  globalSent = 0;
  lastDigestAt = 0;
  batches.clear();
  lastSentAt.clear();
  retryQueue.length = 0;
}
