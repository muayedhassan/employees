/* MOBILE-R1.5.36-NETWORK-FIRST-RECOVERY */
const RECOVERY_RELEASE = 'MOBILE-R1.5.36-NETWORK-FIRST-RECOVERY';
const LEGACY_CACHE_PREFIX = 'employee-registry-';
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.indexOf(LEGACY_CACHE_PREFIX) === 0).map(k => caches.delete(k)));
    } catch (e) {}
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  try { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); } catch (e) {}
});
self.addEventListener('fetch', event => {
  if (!event.request || event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
