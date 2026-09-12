const CACHE_NAME = 'employee-registry-mobile-r148-2026.09.12';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/fonts/hr-fonts.css',
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
      .then(keys => Promise.all(keys
        .filter(k => k.startsWith('employee-registry-') && k !== CACHE_NAME)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => clients.forEach(client => client.postMessage({ type: 'APP_CACHE_READY', cacheName: CACHE_NAME })))
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

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(request, { ignoreSearch: true });
  const fresh = fetch(request, { cache: 'no-store' }).then(response => {
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  }).catch(() => hit);
  return hit || fresh;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Always fetch the newest HTML first. This prevents old WebView shells from
  // staying stuck after a mobile UI release.
  if (req.mode === 'navigate' || (url.origin === self.location.origin && /\/(index\.html)?$/.test(url.pathname))) {
    event.respondWith(networkFirst(req, './index.html'));
    return;
  }

  // Central HRSystem / SQL Server snapshot JSON is read from raw GitHub.
  // Keep a cached copy only as offline fallback.
  const isCentralData = url.hostname === 'raw.githubusercontent.com' &&
    url.pathname.indexOf('/muayedhassan/employees/main/data/') >= 0;
  if (isCentralData) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Embedded fonts are same-origin static assets. They are cached at runtime
  // after the first successful load so Android WebView keeps the same typography offline.
  if (url.origin === self.location.origin && url.pathname.includes('/assets/fonts/')) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'GET_CACHE_NAME' && event.source) {
    event.source.postMessage({ type: 'CACHE_NAME', cacheName: CACHE_NAME });
  }
  if (data.type === 'CLEAR_OLD_CACHES') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys
      .filter(k => k.startsWith('employee-registry-') && k !== CACHE_NAME)
      .map(k => caches.delete(k)))));
  }
});
