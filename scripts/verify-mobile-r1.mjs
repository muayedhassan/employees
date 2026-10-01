#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1);}
function read(p){try{return fs.readFileSync(p,'utf8');}catch(e){fail('missing '+p);}}

const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobs=JSON.parse(read('assets/job-titles.json'));
const expected='MOBILE-R1.5.45-DATA-RELEASE-LEDGER-RECOVERY';

if(version!==expected)fail('VERSION.txt is not R1.5.45');
if(!index.includes(`<meta name="app-release" content="${expected}">`))fail('app-release meta is not R1.5.45');
if(!index.includes('R1545_DATA_RELEASE_LEDGER_RECOVERY'))fail('R1.5.45 marker missing');
if(!index.includes('id="r1545-data-release-ledger-recovery"'))fail('R1.5.45 final release block missing');
if(!index.includes('id="r1545-data-release-ledger-script"'))fail('data release ledger script missing');

const start=index.indexOf('<script id="r1502-dashboard-radical-rebuild-script">');
if(start<0)fail('dashboard script missing');
const end=index.indexOf('</script>',start);
const block=index.slice(start,end);
const mm=block.match(/var MODULES=\[(.*?)\];/s);
if(!mm)fail('dashboard MODULES array missing');
const keys=[...mm[1].matchAll(/key:'([^']+)'/g)].map(x=>x[1]);
const wanted=['list','reports','updates','managernotes','service','jobtitles','titlematch','system'];
if(keys.join(',')!==wanted.join(','))fail('dashboard module order mismatch: '+keys.join(','));
if(keys.includes('alerts'))fail('alerts dashboard card still present');
if(!index.includes('id="r1545-dashboard-alert-removal-style"'))fail('service row layout style missing');
if(!index.includes('.r1502-module-card[data-key="service"]{grid-column:1 / -1}'))fail('service full-row layout missing');
if(!index.includes('id="r1543-dashboard-card-order-style"'))fail('system bottom layout missing');

if(!index.includes("var DB_NAME='hr_mobile_data_release_ledger_v1';"))fail('release ledger IndexedDB missing');
if(!index.includes("var STORE='releases';"))fail('release store missing');
if(!index.includes("idbGetAll('backups')"))fail('safety backup recovery missing');
if(!index.includes('snapshot-recovery'))fail('snapshot diff recovery missing');
if(!index.includes('official-data-version-change'))fail('official DATA_VERSION transition capture missing');
if(!index.includes('__r1545DataRelease:true'))fail('official release summary marker missing');
if(!index.includes('MAX_SNAPSHOTS=8'))fail('release snapshot retention missing');

if(index.includes('LAST_CHANGE_SUMMARY=null;\n      CHANGE_HISTORY={schemaVersion:1,versions:[]};'))
  fail('destructive change-history reset returned');
if(index.includes("if(version===window.__r1514LastVersion){version=now}"))
  fail('fake data version fallback returned');

if(!index.includes("var SW_URL='service-worker.js?v=1545';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1545';"))fail('cache identity mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('IndexedDB primary store missing');

if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(!index.includes("var JOB_DATA_URL='assets/job-titles.json';"))fail('job titles source mismatch');
if(!index.includes("fetch('assets/job-titles.json?v='+encodeURIComponent(APP_RELEASE||'r1545'),{cache:'no-store'})"))fail('title matching source mismatch');
if(!index.includes("action:'review'"))fail('shared review POST missing');
if(!index.includes("&includeReviewed=1"))fail('shared review state sync missing');

if(!String(manifest.name||'').includes('R1.5.45'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.45'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.45-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1545'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1545__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
