/* MOBILE-R1.5.39-SERVICE-WORKER-NO-STALE-UI */
const SW_RELEASE = 'MOBILE-R1.5.39-SERVICE-WORKER-NO-STALE-UI';
const UI_CACHE = 'employee-registry-ui-r1539';
const LEGACY_PREFIX = 'employee-registry-';
const OFFLINE_INDEX = new Request(new URL('./__offline_index_r1539__', self.registration.scope).toString());

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys
        .filter(k => k.indexOf(LEGACY_PREFIX) === 0 && k !== UI_CACHE)
        .map(k => caches.delete(k)));
    } catch (e) {}
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  try {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  } catch (e) {}
});

async function networkFreshNavigation(request) {
  const url = new URL(request.url);
  url.searchParams.set('_sw_bust', Date.now().toString());
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'same-origin',
      redirect: 'follow',
      cache: 'no-store'
    });
    if (response && response.ok) {
      try {
        const cache = await caches.open(UI_CACHE);
        await cache.put(OFFLINE_INDEX, response.clone());
      } catch (e) {}
    }
    return response;
  } catch (e) {
    const cached = await caches.match(OFFLINE_INDEX);
    if (cached) return cached;
    throw e;
  }
}

async function networkFreshAsset(request) {
  try {
    const response = await fetch(request, {cache:'no-store'});
    if (response && response.ok) {
      try {
        const u = new URL(request.url);
        if (u.origin === self.location.origin) {
          const cache = await caches.open(UI_CACHE);
          await cache.put(request, response.clone());
        }
      } catch (e) {}
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (!request || request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFreshNavigation(request));
    return;
  }
  let sameOrigin = false;
  try { sameOrigin = new URL(request.url).origin === self.location.origin; } catch (e) {}
  if (sameOrigin) event.respondWith(networkFreshAsset(request));
});
