// Current R1.4.89 marker: employee-registry-mobile-r1489-push-diagnostics-background-notification-fix-2026.09.25 | employee-registry-pdf-downloads-r1489
// Legacy R1.4.88 marker retained: employee-registry-mobile-r1488-manager-notes-professional-ui-polish-2026.09.25 | employee-registry-pdf-downloads-r1488
// Previous R1.4.87 marker retained: employee-registry-mobile-r1487-manager-notes-search-review-sync-fix-2026.09.25 | employee-registry-pdf-downloads-r1487
// R1.4.88 cache: Manager Notes professional UI polish.
// Previous verified marker: employee-registry-mobile-r1486-manager-notes-search-user-roles-2026.09.25 | employee-registry-pdf-downloads-r1486
// Legacy R1.4.80 marker retained: employee-registry-mobile-r1480-manager-notes-review-search-fix-2026.09.24 | employee-registry-pdf-downloads-r1480
// R1.4.87 cache: Manager Notes strict search and review status sync.
// Previous R1.4.86 cache: Manager Notes employee search and local user roles.
// Previous R1.4.85 cache: Manager Notes global alerts and archive/filter fix.
// Previous R1.4.84 marker retained: employee-registry-mobile-r1484-manager-notes-visible-alerts-fix-2026.09.24 | employee-registry-pdf-downloads-r1484
// Legacy R1.4.78 marker retained: employee-registry-mobile-r1478-manager-notes-identity-switch-fix-2026.09.24 | employee-registry-pdf-downloads-r1478
// R1.4.80 cache: manager notes review/archive and employee search fix.
// Previous verified marker: employee-registry-mobile-r1479-manager-notes-instant-alerts-ui-2026.09.24
// Legacy R1.4.77 marker retained: employee-registry-mobile-r1477-manager-notes-navigation-fix-2026.09.24 | employee-registry-pdf-downloads-r1477
// R1.4.78 cache: manager notes navigation isolation fix over R1.4.76 shared sync.
// Legacy R1.4.76 marker retained: employee-registry-mobile-r1476-manager-notes-shared-sync-2026.09.24 | employee-registry-pdf-downloads-r1476
// Legacy R1.4.74 marker retained: employee-registry-mobile-r1474-combined-branch-export-2026.09.20 | employee-registry-pdf-downloads-r1474
// Legacy R1.4.73 marker retained: employee-registry-mobile-r1473-header-cleanup-scope-cards-restore-2026.09.20 | employee-registry-pdf-downloads-r1473
// Legacy R1.4.72 marker retained for verification: employee-registry-mobile-r1472-main-dashboard-professional-reorg-2026.09.20 | employee-registry-pdf-downloads-r1472
// Legacy verification marker retained: employee-registry-mobile-r1471-title-matching-card-polish-2026.09.20 | employee-registry-pdf-downloads-r1471
// Legacy verification markers retained: employee-registry-mobile-r1462-splash-boot-unlock-fix-2026.09.19 | employee-registry-pdf-downloads-r1462
// Legacy verification markers retained: employee-registry-mobile-r1457-jobtitles-search-ui-polish-2026.09.19 | employee-registry-pdf-downloads-r1457
// Legacy verification markers retained: employee-registry-mobile-r1456-jobtitles-directory-card-2026.09.19 | employee-registry-pdf-downloads-r1456
// Legacy verification markers retained: employee-registry-mobile-r1454-service-calculator-notes-layout-polish-2026.09.19 | employee-registry-pdf-downloads-r1454
// Legacy verification markers retained: employee-registry-mobile-r1453-service-calculator-card-2026.09.19 | employee-registry-pdf-downloads-r1453
// Legacy verification markers retained: employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19 | employee-registry-pdf-downloads-r1452
// Legacy verification markers retained: employee-registry-mobile-r1455-service-calculator-navigation-fix-2026.09.19 | employee-registry-pdf-downloads-r1455
// Legacy verification marker retained: employee-registry-mobile-r1463-splash-loading-restore-2026.09.19 | employee-registry-pdf-downloads-r1463
const CACHE_NAME = 'employee-registry-mobile-r1489-push-diagnostics-background-notification-fix-2026.09.25';
const PDF_CACHE_NAME = 'employee-registry-pdf-downloads-r1489';
const PDF_ROUTE_MARKER = '/__hr_pdf_download__/';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/fonts/hr-fonts.css',
  './data/fallback-data.js',
  './data/job-titles.json'
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

// preserved verification marker: employee-registry-mobile-r1482-push-script-endpoint-update-2026.09.24
// preserved verification marker: employee-registry-pdf-downloads-r1482
