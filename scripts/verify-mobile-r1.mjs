#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1);}
function read(p){try{return fs.readFileSync(p,'utf8');}catch(e){fail('missing '+p);}}

const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobs=JSON.parse(read('assets/job-titles.json'));
const expected='MOBILE-R1.5.44-DATA-CHANGE-LEDGER-STICKY';

if(version!==expected)fail('VERSION.txt is not R1.5.44');
if(!index.includes(`<meta name="app-release" content="${expected}">`))fail('app-release meta is not R1.5.44');
if(!index.includes('R1544_DATA_CHANGE_LEDGER_STICKY'))fail('R1.5.44 marker missing');
if(!index.includes('id="r1544-data-change-ledger-sticky"'))fail('R1.5.44 final block missing');
if(!index.includes('id="r1544-data-change-ledger-sticky-script"'))fail('sticky data ledger script missing');

if(index.includes('LAST_CHANGE_SUMMARY=null;\n      CHANGE_HISTORY={schemaVersion:1,versions:[]};'))
  fail('destructive secure-load history reset still present');
if(index.includes("if(version===window.__r1514LastVersion){version=now}"))
  fail('fake same-data-version timestamp still present');
if(!index.includes('if(s.__r1544CurrentDataVersion===true)return true;'))
  fail('R1.5.15 current-data marker support missing');

if(!index.includes("var STATE_KEY='hr_data_change_ledger_r1544';"))
  fail('sticky data ledger state missing');
if(!index.includes('window.hrIndexedDB.loadChanges'))
  fail('IndexedDB change restore missing');
if(!index.includes('window.hrIndexedDB.saveChanges'))
  fail('IndexedDB change persistence missing');
if(!index.includes('beforeV&&afterV&&beforeV!==afterV'))
  fail('DATA_VERSION transition guard missing');
if(!index.includes('__r1544CurrentDataVersion:true'))
  fail('current data-version marker missing');

const start=index.indexOf('<script id="r1502-dashboard-radical-rebuild-script">');
if(start<0)fail('dashboard script missing');
const end=index.indexOf('</script>',start);
const block=index.slice(start,end);
const mm=block.match(/var MODULES=\[(.*?)\];/s);
if(!mm)fail('dashboard MODULES array missing');
const keys=[...mm[1].matchAll(/key:'([^']+)'/g)].map(x=>x[1]);
const wanted=['list','reports','updates','managernotes','alerts','service','jobtitles','titlematch','system'];
if(keys.join(',')!==wanted.join(','))fail('dashboard order regression');
if(!index.includes('id="r1543-dashboard-card-order-style"'))fail('dashboard bottom-system style missing');
if(!index.includes('grid-column:1 / -1'))fail('system card full-width rule missing');

if(!index.includes("var SW_URL='service-worker.js?v=1544';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1544';"))fail('cache identity mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('IndexedDB primary store missing');

if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(!index.includes("var JOB_DATA_URL='assets/job-titles.json';"))fail('job titles source mismatch');
if(!index.includes("fetch('assets/job-titles.json?v='+encodeURIComponent(APP_RELEASE||'r1544'),{cache:'no-store'})"))fail('title matching source mismatch');
if(!index.includes("action:'review'"))fail('shared review POST missing');
if(!index.includes("&includeReviewed=1"))fail('shared review state sync missing');

if(!String(manifest.name||'').includes('R1.5.44'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.44'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.44-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1544'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1544__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
