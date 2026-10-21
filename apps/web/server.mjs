/**
 * Static file server for the Wachaut web build.
 *
 * Routing rules:
 *  - Exact files (assets, og.png, robots.txt, sitemap.xml) → served as-is.
 *  - Prerendered directory pages (/contacto/, /privacidad/) → their index.html.
 *  - SPA routes (/room/**, /admin/**) → the prerendered landing shell
 *    (index.html) so the client router can hydrate; these are client-only.
 *  - Everything else → 404.html (which for crawlers is a soft-404 page).
 *
 * Replaces `serve -s` (which rewrote EVERY path to index.html, hiding the
 * prerendered pages from crawlers) with explicit, predictable behavior.
 */
import { createReadStream, existsSync, statSync, readFileSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('./web/build/', import.meta.url));
const PORT = parseInt(process.env.PORT || '3000');

/**
 * Internal signaling-server URL (dokploy network), e.g. http://wachaut-server:3001.
 * When set, /room/<id> requests get a live og:title injected into the SPA
 * shell so links shared on WhatsApp/Telegram preview "en directo" + title.
 */
const API_INTERNAL = (process.env.API_INTERNAL_URL || '').replace(/\/$/, '');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

/** Client-only routes: hydrate from the landing shell (has the app bundle). */
function isSpaRoute(pathname) {
  return pathname === '/room' || pathname.startsWith('/room/') ||
         pathname === '/admin' || pathname.startsWith('/admin/');
}

// ── Live room previews (og tags for /room/<id>) ─────────────────────────
const ROOM_INFO_TTL_MS = 30_000;
const roomInfoCache = new Map(); // roomId → { at, data }
const roomIdRe = /^\/room\/([A-Za-z0-9_-]{1,64})\/?$/;

async function fetchRoomInfo(roomId) {
  if (!API_INTERNAL) return null;
  const hit = roomInfoCache.get(roomId);
  if (hit && Date.now() - hit.at < ROOM_INFO_TTL_MS) return hit.data;
  try {
    const res = await fetch(`${API_INTERNAL}/api/room-info/${encodeURIComponent(roomId)}`, {
      signal: AbortSignal.timeout(400),
      headers: { accept: 'application/json' },
    });
    const data = res.ok ? await res.json() : null;
    if (roomInfoCache.size > 500) roomInfoCache.clear();
    roomInfoCache.set(roomId, { at: Date.now(), data });
    return data;
  } catch {
    return null; // API down/slow → serve the plain shell, never block the room
  }
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * og injection for a live /room/<id>: title/description plus the canonical
 * og:url so scrapers associate the preview with the room link itself.
 */
function injectLiveOg(html, info, roomUrl) {
  const title = info?.title
    ? `${info.title} — Wachaut`
    : 'Wachaut — pantalla en directo · screen live';
  const desc = info?.title
    ? 'En directo ahora: únete con un clic · Live now: join with one click'
    : 'Alguien está compartiendo su pantalla — únete con un clic · Someone is sharing their screen';
  const tags =
    `<meta property="og:title" content="${escapeHtml(title)}"/>` +
    `<meta property="og:description" content="${escapeHtml(desc)}"/>` +
    `<meta property="og:type" content="website"/>` +
    (roomUrl ? `<meta property="og:url" content="${escapeHtml(roomUrl)}"/>` : '') +
    `<meta name="twitter:title" content="${escapeHtml(title)}"/>` +
    `<meta name="twitter:description" content="${escapeHtml(desc)}"/>`;
  return html.replace('</head>', `${tags}</head>`);
}

// ── Security headers ────────────────────────────────────────────────────
// The Fastify API sets its own headers via helmet; this static server had
// none at all. Notes on the CSP:
//  - script/style 'unsafe-inline': SvelteKit prod builds embed one inline
//    bootstrap script and inline style attributes everywhere. The inline
//    script is build-hashed, so a hash-based policy would churn every build;
//    'unsafe-inline' still blocks every EXTERNAL script/style host, which is
//    the dominant XSS vector for a static app.
//  - wss:/https: in connect-src: signaling and the SFU may live on a sibling
//    origin per environment (api-wachaut / sfu-wachaut).
//  - display-capture=(self) is REQUIRED — getDisplayMedia is the product.
//  - media-src blob:: the local-recording preview uses object URLs.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self' https: wss:",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  // 180 days, no includeSubDomains yet: every current subdomain is HTTPS
  // (www/wadmin/sfu) but opting the whole zone in is a one-way door best
  // flipped deliberately later.
  'Strict-Transport-Security': 'max-age=15552000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), display-capture=(self), geolocation=()',
};

/** Cache policy: hashed bundles are immutable forever; everything else 1h. */
function cacheControlFor(filePath) {
  const ext = extname(filePath);
  if (ext === '.html') return 'no-cache';
  if (filePath.includes('/_app/immutable/')) return 'public, max-age=31536000, immutable';
  return 'public, max-age=3600';
}

function sendFile(res, filePath, status = 200, extraHeaders = {}) {
  const type = MIME[extname(filePath)] || 'application/octet-stream';
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': cacheControlFor(filePath),
    ...SECURITY_HEADERS,
    ...extraHeaders,
  });
  createReadStream(filePath).pipe(res);
}

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    // Normalize and confine to ROOT (blocks ../ traversal).
    const safe = normalize(pathname).replace(/^([/\\])+/, '');
    const target = join(ROOT, safe);

    // Exact file match (assets, robots.txt, sitemap.xml, og.png…).
    if (safe && target.startsWith(ROOT) && existsSync(target) && statSync(target).isFile()) {
      sendFile(res, target);
      return;
    }
    // Prerendered directory page: /contacto/ → contacto/index.html.
    const dirIndex = join(target, 'index.html');
    if (target.startsWith(ROOT) && existsSync(dirIndex)) {
      sendFile(res, dirIndex);
      return;
    }
    // Live room preview: for /room/<id>, ask the API for the room and inject
    // a live og:title into the shell (WhatsApp/Telegram link previews).
    const roomMatch = pathname.match(roomIdRe);
    if (roomMatch && API_INTERNAL) {
      const info = await fetchRoomInfo(roomMatch[1]);
      if (info?.exists) {
        try {
          const shell = readFileSync(join(ROOT, '404.html'), 'utf-8');
          // og:url uses the public host the requester asked for (www vs apex).
          const host = String(req.headers.host || '').replace(/[^a-zA-Z0-9.-]/g, '');
          const roomUrl = host ? `https://${host}${pathname}` : '';
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
            ...SECURITY_HEADERS,
          });
          res.end(injectLiveOg(shell, info, roomUrl));
          return;
        } catch { /* fall through to the plain shell */ }
      }
    }
    // SPA routes get the adapter's fallback shell (empty body + app bundles).
    // NOT the prerendered landing: serving landing HTML at /admin or /room
    // causes a hydration mismatch (client expects the admin/room route) which
    // breaks rendering — the shell hydrates cleanly into any route.
    if (isSpaRoute(pathname)) {
      sendFile(res, join(ROOT, '404.html'));
      return;
    }
    // Unknown → soft-404 page (404 status so crawlers drop it).
    sendFile(res, join(ROOT, '404.html'), 404);
  } catch {
    res.writeHead(500);
    res.end('Internal error');
  }
}).listen(PORT, '0.0.0.0', () => console.log(`web static server on 0.0.0.0:${PORT}`));
