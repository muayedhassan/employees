#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1)}
function read(p){try{return fs.readFileSync(p,'utf8')}catch(e){fail('missing '+p)}}
const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobs=JSON.parse(read('assets/job-titles.json'));
const expected='MOBILE-R1.5.50-QUIET-MANAGER-NOTES-SYNC';

if(version!==expected)fail('VERSION.txt is not R1.5.50');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 marker missing');
if(!index.includes('id="r1550-quiet-manager-notes-sync-script"'))fail('quiet sync module missing');
if(!index.includes("mode:'open-manual-action-only'"))fail('quiet sync mode missing');

const a=index.indexOf('<script id="r1547-manager-notes-shared-review-state-script">');
const b=index.indexOf('</script>',a);
if(a<0||b<0)fail('R1.5.47 block missing');
const r1547=index.slice(a,b);
if(r1547.includes("setInterval(function(){if(!document.hidden&&document.body.classList.contains('subview-managernotes'))syncNow(false,true)},30000)"))fail('30-second sync still present');
if(r1547.includes("document.addEventListener('visibilitychange',function(){if(!document.hidden&&document.body.classList.contains('subview-managernotes'))setTimeout(function(){syncNow(false,true)},350)})"))fail('visibility sync still present');
if(r1547.includes("window.addEventListener('pageshow',function(){if(document.body.classList.contains('subview-managernotes'))setTimeout(function(){syncNow(false,true)},250)})"))fail('pageshow sync still present');

const c=index.indexOf('<style id="r1505-notes-chrome-counts-header-style">');
const d=index.indexOf('</script>',c);
if(c<0||d<0)fail('R1.5.05 helper block missing');
const r1505=index.slice(c,d);
if(r1505.includes("setInterval(function(){autoSyncWhenOpen()},300000)"))fail('5-minute auto sync still present');
if(r1505.includes("window.addEventListener('focus',function(){setTimeout(tick,80);setTimeout(autoSyncWhenOpen,500)})"))fail('focus auto sync still present');
if(r1505.includes("document.addEventListener('visibilitychange',function(){if(!document.hidden){setTimeout(tick,80);setTimeout(autoSyncWhenOpen,700)}})"))fail('visibility auto sync still present');

if(!index.includes("if(mov){setTimeout(visibleLog,250);setTimeout(autoSyncWhenOpen,900)}"))fail('open-screen sync missing');
if(!index.includes("setTimeout(refreshAfterSend,120)"))fail('after-send refresh missing');

for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']){
  if(!index.includes(marker))fail(marker+' regressed');
}

if(!index.includes("var SW_URL='service-worker.js?v=1550';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1550';"))fail('cache identity mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('IndexedDB missing');
if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(!index.includes("fetch('assets/job-titles.json?v='+encodeURIComponent(APP_RELEASE||'r1550'),{cache:'no-store'})"))fail('title matching source mismatch');

if(!String(manifest.name||'').includes('R1.5.50'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.50'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.50-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1550'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1550__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
