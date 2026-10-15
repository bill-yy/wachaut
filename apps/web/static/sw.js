/**
 * Wachaut service worker — deliberately minimal.
 *
 * Its only job is to satisfy the browser install criteria for the
 * add-to-home-screen prompt. It does NOT intercept fetches (no respondWith)
 * so the network stack behaves exactly as before: screen sharing requires a
 * live connection, and the prerendered pages cache fine through plain HTTP.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Empty fetch listener: no interception at all.
self.addEventListener('fetch', () => {});
