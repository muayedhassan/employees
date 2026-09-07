const CACHE_NAME = 'employee-registry-r7-0-3-webview-scroll-fix-2026.09.07';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './data/fallback-data.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallbackRequest) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (err) {
    return (await cache.match(request, { ignoreSearch: true })) ||
           (fallbackRequest ? await cache.match(fallbackRequest, { ignoreSearch: true }) : undefined) ||
           Response.error();
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Always prefer the newest HTML. If the network fails, open the last cached shell.
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, './index.html'));
    return;
  }

  // Central Excel-Master JSON is read from raw GitHub. Cache the last successful
  // responses as an extra offline layer; the app also keeps its own local snapshot.
  const isCentralData = url.hostname === 'raw.githubusercontent.com' &&
    url.pathname.indexOf('/muayedhassan/employees/main/data/') >= 0;
  if (isCentralData) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Same-origin app shell: stale-while-revalidate for speed, with automatic refresh.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(hit => {
        const fresh = fetch(req).then(res => {
          if (res && res.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, res.clone())).catch(() => {});
          return res;
        }).catch(() => hit);
        return hit || fresh;
      })
    );
  }
});
