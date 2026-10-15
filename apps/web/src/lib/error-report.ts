/**
 * Client-side error reporter: beacon to POST /api/errors (same pattern as
 * the analytics tracker). Throttled per fingerprint and capped per session
 * so a crashing loop can never flood the endpoint (or the panel).
 */

import { getAnalyticsIds } from './tracker.svelte';

const THROTTLE_MS = 30_000;
const MAX_PER_SESSION = 20;

let sentThisSession = 0;
const lastSentAt = new Map<string, number>();

export interface ClientErrorContext {
  component?: string;
  roomId?: string;
  severity?: 'error' | 'warning';
}

function throttleKey(component: string, message: string): string {
  return `${component}|${message.replace(/\d+/g, '#').slice(0, 100)}`;
}

export function captureClientError(err: unknown, ctx: ClientErrorContext = {}): void {
  if (typeof window === 'undefined') return;
  try {
    if (sentThisSession >= MAX_PER_SESSION) return;

    const message = (err instanceof Error ? err.message : String(err)).slice(0, 500) || 'Unknown error';
    const component = (ctx.component || 'unknown').slice(0, 64);

    const key = throttleKey(component, message);
    const now = Date.now();
    const last = lastSentAt.get(key) || 0;
    if (now - last < THROTTLE_MS) return;
    lastSentAt.set(key, now);

    // Best-effort page context (room id in the path is already there).
    const page = window.location.pathname.slice(0, 128);

    const payload = JSON.stringify({
      source: 'web',
      message,
      stack: err instanceof Error ? err.stack?.slice(0, 4000) : undefined,
      component,
      severity: ctx.severity || 'error',
      page,
      roomId: ctx.roomId?.slice(0, 64),
      vid: getAnalyticsIds().vid,
    });

    sentThisSession++;
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => { /* reporting must never break the site */ });
  } catch { /* never throw from the reporter */ }
}

/**
 * Global safety net: uncaught exceptions and unhandled promise rejections.
 * Installed once from the root layout.
 */
let installed = false;
export function installGlobalErrorHandlers(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    // event.error is the Error object; fall back to the message for
    // cross-origin script errors (which carry no details).
    captureClientError(event.error || event.message || 'window error', { component: 'window.onerror' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureClientError(event.reason || 'unhandled rejection', { component: 'unhandledrejection' });
  });
}
