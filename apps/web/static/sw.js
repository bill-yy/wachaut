/**
 * Wachaut service worker — minimal by design.
 *
 * - Does NOT intercept fetches (no respondWith): the network stack behaves
 *   exactly as before; screen sharing needs a live connection anyway.
 * - Handles Web Push for the host ("viewer joined") notifications.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Empty fetch listener: no interception at all (install criteria only).
self.addEventListener('fetch', () => {});

// ── Push notifications (host alerts) ─────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch { /* malformed payload → show generic */ }
  const title = data.title || 'Wachaut';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/maskable-192.png',
      tag: data.url || 'wachaut',
      data: { url: data.url || '/room' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/room';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an already-open Wachaut window at the room if possible.
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === url && 'focus' in client) return client.focus();
      }
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
