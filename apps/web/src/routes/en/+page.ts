// English landing: server-rendered + prerendered for crawlers.
// trailingSlash 'always' emits en/index.html (directory form) so the static
// server resolves /en/ without a rewrite.
export const ssr = true;
export const prerender = true;
export const trailingSlash = 'always';
