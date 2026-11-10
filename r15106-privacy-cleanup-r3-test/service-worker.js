/* R1.5.106 network-only Service Worker: erase legacy UI caches on production scope activation. */
const PROD_SCOPE = new URL(self.registration.scope).pathname === '/employees/';
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  if(PROD_SCOPE){
    const keys=await caches.keys();
    for(const key of keys){if(/^(?:employee-registry-|hr-employee-|hr-mobile-)/i.test(key))await caches.delete(key);}
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode==='navigate')e.respondWith(fetch(r,{cache:'no-store'}));});
