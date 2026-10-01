#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1);}
function read(p){try{return fs.readFileSync(p,'utf8');}catch(e){fail('missing '+p);}}

const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobs=JSON.parse(read('assets/job-titles.json'));
const expected='MOBILE-R1.5.43-DASHBOARD-CARD-ORDER';

if(version!==expected)fail('VERSION.txt is not R1.5.43');
if(!index.includes(`<meta name="app-release" content="${expected}">`))fail('app-release meta is not R1.5.43');
if(!index.includes('R1543_DASHBOARD_CARD_ORDER'))fail('R1.5.43 marker missing');
if(!index.includes('r1543-dashboard-card-order'))fail('R1.5.43 final block missing');

const start=index.indexOf('<script id="r1502-dashboard-radical-rebuild-script">');
if(start<0)fail('R1.5.02 dashboard script missing');
const end=index.indexOf('</script>',start);
if(end<0)fail('R1.5.02 dashboard script is not closed');
const block=index.slice(start,end);
const mm=block.match(/var MODULES=\[(.*?)\];/s);
if(!mm)fail('R1.5.02 dashboard MODULES array missing');
const keys=[...mm[1].matchAll(/key:'([^']+)'/g)].map(x=>x[1]);
const wanted=['list','reports','updates','managernotes','alerts','service','jobtitles','titlematch','system'];
if(keys.join(',')!==wanted.join(','))fail('R1.5.02 dashboard module order mismatch: '+keys.join(','));

if(!index.includes('id="r1543-dashboard-card-order-style"'))fail('dashboard order style missing');
if(!index.includes('grid-column:1 / -1'))fail('system card full-width rule missing');

if(!index.includes("var SW_URL='service-worker.js?v=1543';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1543';"))fail('cache identity mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('IndexedDB primary store missing');

if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(!index.includes("var JOB_DATA_URL='assets/job-titles.json';"))fail('job titles source mismatch');
if(!index.includes("fetch('assets/job-titles.json?v='+encodeURIComponent(APP_RELEASE||'r1543'),{cache:'no-store'})"))fail('title matching source mismatch');
if(!index.includes("action:'review'"))fail('shared review POST missing');
if(!index.includes("&includeReviewed=1"))fail('shared review state sync missing');

if(!String(manifest.name||'').includes('R1.5.43'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.43'))fail('manifest short name mismatch');

if(!sw.includes('MOBILE-R1.5.43-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1543'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1543__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
