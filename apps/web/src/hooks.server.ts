import type { Handle } from '@sveltejs/kit';

/**
 * Per-locale <html lang>: app.html ships `lang="es"` (the default and the
 * correct value for the SPA shell), and every prerendered /en/** page is
 * patched to `lang="en"` here at prerender time. Crawlers read the attribute
 * from the served HTML, so a client-side fix would be useless.
 *
 * The replace-based approach is deliberate: if this hook ever stops running
 * for a route (e.g. the adapter fallback), the attribute silently falls back
 * to the correct default instead of leaking a placeholder like "%lang%".
 */
export const handle: Handle = async ({ event, resolve }) => {
  const isEnglish = event.url.pathname === '/en' || event.url.pathname.startsWith('/en/');
  return resolve(event, {
    transformPageChunk: ({ html }) =>
      isEnglish ? html.replace('<html lang="es"', '<html lang="en"') : html,
  });
};
