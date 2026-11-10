/* R1.5.106 private preview worker — no application-data cache. */
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode==='navigate')e.respondWith(fetch(r,{cache:'no-store'}));});
