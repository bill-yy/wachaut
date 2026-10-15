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
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('./web/build/', import.meta.url));
const PORT = parseInt(process.env.PORT || '3000');

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

function sendFile(res, filePath, status = 200) {
  const type = MIME[extname(filePath)] || 'application/octet-stream';
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=3600' });
  createReadStream(filePath).pipe(res);
}

createServer((req, res) => {
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
