const CACHE_NAME = 'employee-registry-mobile-r1434-reports-export-reliability-2026.09.16';
const PDF_CACHE_NAME = 'employee-registry-pdf-downloads-r1434';
const PDF_ROUTE_MARKER = '/__hr_pdf_download__/';
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
        .filter(k => k.startsWith('employee-registry-') && k !== CACHE_NAME && k !== PDF_CACHE_NAME)
        .map(k => caches.delete(k))))
      .then(() => caches.delete(PDF_CACHE_NAME).catch(() => false))
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

function contentDisposition(filename) {
  const encoded = encodeURIComponent(filename || 'EmployeeCard.pdf')
    .replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  return `attachment; filename="EmployeeCard.pdf"; filename*=UTF-8''${encoded}`;
}

async function stagePdfDownload(data) {
  if (!data || !data.url || !data.blob) throw new Error('invalid pdf download payload');
  const url = new URL(data.url, self.location.origin);
  if (url.origin !== self.location.origin || !url.pathname.includes(PDF_ROUTE_MARKER)) {
    throw new Error('invalid pdf download url');
  }
  const filename = String(data.filename || 'EmployeeCard.pdf');
  const response = new Response(data.blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition(filename),
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff'
    }
  });
  const cache = await caches.open(PDF_CACHE_NAME);
  await cache.put(url.href, response);
  return url.href;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // R1.4.18: serve staged PDF as a normal same-origin HTTPS attachment.
  // Android WebView can hand this response to its download handler, unlike blob: URLs.
  if (url.origin === self.location.origin && url.pathname.includes(PDF_ROUTE_MARKER)) {
    event.respondWith((async () => {
      const cache = await caches.open(PDF_CACHE_NAME);
      const hit = await cache.match(req.url);
      if (!hit) return new Response('PDF download expired', { status: 404 });
      const out = hit.clone();
      event.waitUntil(cache.delete(req.url).catch(() => false));
      return out;
    })());
    return;
  }

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
      .filter(k => k.startsWith('employee-registry-') && k !== CACHE_NAME && k !== PDF_CACHE_NAME)
      .map(k => caches.delete(k)))));
  }
  if (data.type === 'STORE_PDF_DOWNLOAD') {
    const port = event.ports && event.ports[0];
    event.waitUntil(stagePdfDownload(data)
      .then(url => { if (port) port.postMessage({ ok: true, url }); })
      .catch(err => { if (port) port.postMessage({ ok: false, error: String(err && err.message || err) }); }));
  }
});
