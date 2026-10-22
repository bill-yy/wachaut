/**
 * Generates static/sitemap.xml from the page manifest below.
 *
 * Every localized pair emits es + en + x-default hreflang alternates on BOTH
 * entries (the hand-maintained file was missing alternates on contacto,
 * privacidad and x-default everywhere else). Run after adding pages:
 *
 *   node scripts/gen-sitemap.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const BASE = 'https://wachaut.com';

// es/en paths are the route directories (src/routes/**). lastmod optional.
const PAGES = [
  { es: '/', en: '/en/', priority: 1.0, changefreq: 'weekly' },
  { es: '/contacto/', en: '/en/contacto/', priority: 0.5, changefreq: 'monthly' },
  { es: '/privacidad/', en: '/en/privacidad/', priority: 0.3, changefreq: 'monthly' },
  { es: '/blog/', en: '/en/blog/', priority: 0.6, changefreq: 'weekly' },
  {
    es: '/blog/como-compartir-pantalla-por-whatsapp/',
    en: '/en/blog/how-to-share-your-screen-on-whatsapp/',
    priority: 0.8,
    changefreq: 'monthly',
    lastmod: '2026-10-15',
  },
  {
    es: '/blog/compartir-pantalla-online-gratis/',
    en: '/en/blog/free-online-screen-sharing/',
    priority: 0.8,
    changefreq: 'monthly',
    lastmod: '2026-10-15',
  },
];

function urlEntry({ es, en, priority, changefreq, lastmod }) {
  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="es" href="${BASE}${es}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${BASE}${en}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${es}"/>`,
  ].join('\n');
  const optional = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return (loc) => `  <url>
    <loc>${BASE}${loc}</loc>
${alternates}${optional}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PAGES.map((page) => {
  const esEntry = urlEntry(page)(page.es);
  const enEntry = urlEntry(page)(page.en);
  return `${esEntry}\n${enEntry}`;
}).join('\n')}
</urlset>
`;

const outPath = join(fileURLToPath(new URL('..', import.meta.url)), 'static', 'sitemap.xml');
writeFileSync(outPath, xml);
console.log(`sitemap written: ${outPath} (${PAGES.length * 2} urls)`);
