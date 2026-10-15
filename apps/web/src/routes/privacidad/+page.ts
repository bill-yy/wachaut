// Server-rendered + prerendered: real HTML for crawlers (see routes/+page.ts).
// trailingSlash 'always' emits privacidad/index.html (directory form) so the
// static server resolves /privacidad without a rewrite.
export const ssr = true;
export const prerender = true;
export const trailingSlash = 'always';
