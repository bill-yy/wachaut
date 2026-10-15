/**
 * Feedback client: send a post-broadcast rating and/or contact message.
 * SessionStorage dedupe keeps the rating prompt from nagging twice.
 */

import { getAnalyticsIds } from './tracker.svelte';

export interface FeedbackPayload {
  roomId: string;
  role: 'host' | 'viewer';
  rating: number;
  answers?: Record<string, string>;
  comment?: string;
}

export function hasRated(roomId: string): boolean {
  try { return sessionStorage.getItem(`wachaut.rated.${roomId}`) === '1'; } catch { return false; }
}

export async function sendFeedback(payload: FeedbackPayload): Promise<boolean> {
  try {
    sessionStorage.setItem(`wachaut.rated.${payload.roomId}`, '1');
  } catch { /* private mode */ }
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, vid: getAnalyticsIds().vid }),
      keepalive: true,
    });
    // 409 = already rated today — treat as success (the goal is achieved).
    return res.ok || res.status === 409;
  } catch {
    return false;
  }
}

export async function sendContact(opts: { name?: string; email?: string; message: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: opts.name?.trim() || undefined,
        email: opts.email?.trim() || undefined,
        message: opts.message,
        page: window.location.pathname.slice(0, 128),
      }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    return { ok: false, error: data.error || 'No se pudo enviar. Inténtalo de nuevo.' };
  } catch {
    return { ok: false, error: 'No se pudo enviar. Comprueba tu conexión.' };
  }
}
