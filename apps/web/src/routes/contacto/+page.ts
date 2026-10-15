// Server-rendered + prerendered: real HTML for crawlers (see routes/+page.ts).
// trailingSlash 'always' emits contacto/index.html (directory form) so the
// static server resolves /contacto without a rewrite; client navigation
// normalizes the URL.
export const ssr = true;
export const prerender = true;
export const trailingSlash = 'always';
