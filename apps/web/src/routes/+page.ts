// Landing: fully server-rendered + prerendered so crawlers (and WhatsApp
// link previews) get real HTML content, not the SPA shell. The layout-level
// `ssr = false` stays for room/admin routes which need browser APIs.
export const ssr = true;
export const prerender = true;
