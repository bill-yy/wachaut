/**
 * Anonymous pageview tracker + maintenance state.
 *
 * Privacy model (documented in /privacidad): random ids generated locally —
 * visitor id in localStorage (long-term uniqueness), session id in
 * sessionStorage (per tab). UTM params and the external referrer are
 * captured once per session (first-touch attribution). No cookies, no
 * third parties, no fingerprints.
 */

const VID_KEY = 'wachaut.vid';
const SID_KEY = 'wachaut.sid';
const UTM_KEY = 'wachaut.utm';
const REF_KEY = 'wachaut.ref';

function randomId(): string {
  return crypto.randomUUID();
}

function storeGet(storage: Storage, key: string): string | null {
  try { return storage.getItem(key); } catch { return null; }
}
function storeSet(storage: Storage, key: string, value: string): void {
  try { storage.setItem(key, value); } catch { /* private mode */ }
}

export const maintenance = $state({ active: false });

function ensureIds(): { vid: string; sid: string } {
  let vid = storeGet(localStorage, VID_KEY);
  if (!vid) {
    vid = randomId();
    storeSet(localStorage, VID_KEY, vid);
  }
  let sid = storeGet(sessionStorage, SID_KEY);
  if (!sid) {
    sid = randomId();
    storeSet(sessionStorage, SID_KEY, sid);
  }
  return { vid, sid };
}

interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

/** First-touch per session: only set if this session has no attribution yet. */
function captureAttribution(): { utm: Utm; referrer: string | null } {
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utm = {};
  for (const k of ['source', 'medium', 'campaign', 'term', 'content'] as const) {
    const v = params.get(`utm_${k}`);
    if (v) fromUrl[k] = v.slice(0, 128);
  }
  if (Object.keys(fromUrl).length > 0) {
    storeSet(sessionStorage, UTM_KEY, JSON.stringify(fromUrl));
  }
  const externalRef = document.referrer && !isInternal(document.referrer) ? document.referrer : null;
  if (externalRef && !storeGet(sessionStorage, REF_KEY)) {
    storeSet(sessionStorage, REF_KEY, externalRef.slice(0, 256));
  }

  let utm: Utm = {};
  try { utm = JSON.parse(storeGet(sessionStorage, UTM_KEY) || '{}'); } catch { /* corrupted — ignore */ }
  return { utm, referrer: storeGet(sessionStorage, REF_KEY) };
}

function isInternal(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const self = window.location.hostname.replace(/^www\./, '');
    return host === self || host.endsWith(`.${self}`);
  } catch {
    return false;
  }
}

function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  const w = window.innerWidth;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  if (w < 768) return 'mobile';
  if (w < 1200 && coarse) return 'tablet';
  return 'desktop';
}

let lastPath = '';

/**
 * Fire one pageview. Called from the root layout on every navigation
 * (initial load + SPA route changes). Failures are silent — analytics must
 * never break or slow down the site.
 */
export function trackPageView(path: string): void {
  if (typeof window === 'undefined') return;
  const normalized = (path.split(/[?#]/, 1)[0] || '/').slice(0, 128);
  if (!normalized.startsWith('/') || normalized === lastPath) return; // dedupe
  lastPath = normalized;

  const { vid, sid } = ensureIds();
  const { utm, referrer } = captureAttribution();

  const payload = JSON.stringify({
    path: normalized,
    referrer,
    vid,
    sid,
    lang: navigator.language?.slice(0, 12),
    device: detectDevice(),
    utm,
  });

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && typeof data.maintenance === 'boolean') maintenance.active = data.maintenance;
    })
    .catch(() => { /* offline / blocked — ignore */ });
}
