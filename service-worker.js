const CACHE_NAME = 'employee-registry-r5-1-direct-sync-2026.09.06';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './data/fallback-data.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  const centralData = url.origin === self.location.origin && (
    url.pathname.endsWith('/data/version.json') ||
    url.pathname.endsWith('/data/employees.json') ||
    url.pathname.endsWith('/data/change-summary.json') ||
    url.pathname.endsWith('/data/fallback-data.js')
  );

  // Excel Master files: network first so new GitHub versions are detected quickly.
  if (centralData) {
    event.respondWith(
      fetch(req, {cache:'no-store'}).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req, {ignoreSearch:true}))
    );
    return;
  }

  // Navigation: network first, app shell as offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }))
    );
  }
});
