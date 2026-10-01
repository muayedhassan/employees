#!/usr/bin/env node
import fs from 'node:fs';

function fail(msg){ console.error('VERIFY_MOBILE_R1 FAIL:', msg); process.exit(1); }
function read(p){ try { return fs.readFileSync(p,'utf8'); } catch(e){ fail('missing '+p); } }

const index = read('index.html');
const manifest = JSON.parse(read('manifest.webmanifest'));
const sw = read('service-worker.js');
const version = read('VERSION.txt').trim();
const jobs = JSON.parse(read('assets/job-titles.json'));
const expected = 'MOBILE-R1.5.48-SERVER-AUTHORITY-CLEANUP';

if(version !== expected) fail('VERSION.txt is not R1.5.48');
if(!index.includes('<meta name="app-release" content="'+expected+'">')) fail('app-release meta mismatch');
if(!index.includes('R1548_SERVER_AUTHORITY_CLEANUP')) fail('R1.5.48 marker missing');
if(!index.includes('id="r1548-canonical-release"')) fail('R1.5.48 canonical release block missing');

if(!index.includes('id="r1547-manager-notes-shared-review-state-script"')) fail('R1.5.47 shared review module missing');
if(!index.includes("window.r1547ManagerNotesSharedReview")) fail('R1.5.47 shared review API missing');
if(!index.includes("action:'review'")) fail('review action missing');
if(!index.includes("&includeReviewed=1")) fail('legacy includeReviewed sync missing');
if(!index.includes("includeReviewed:'1'")) fail('R1.5.47 includeReviewed sync missing');

if(index.includes("if(deleted[k]||deleted[sg])return;var old=byId[k]||bySig[sg];if(old){if(old.status==='reviewed')n.status='reviewed';"))
  fail('R1.4.76 can still hide server rows or override server status');
if(index.includes("if(deleted[k]||deleted[s])return;var old=byId[k]||bySig[s];if(old){if(old.status==='reviewed')n.status='reviewed';"))
  fail('R1.4.79 can still hide server rows or override server status');

const r1547Start=index.indexOf('<script id="r1547-manager-notes-shared-review-state-script">');
const r1547End=index.indexOf('</script>',r1547Start);
if(r1547Start<0||r1547End<0) fail('R1.5.47 shared review block malformed');
const r1547=index.slice(r1547Start,r1547End);
const remoteLoopStart=r1547.indexOf('(remote||[]).map(normalizeRemote).forEach(function(n){');
const localLoopStart=r1547.indexOf('local.forEach(function(n){',remoteLoopStart);
if(remoteLoopStart<0||localLoopStart<0) fail('R1.5.47 merge loops missing');
const remoteLoop=r1547.slice(remoteLoopStart,localLoopStart);
if(remoteLoop.includes('if(deleted[k]||deleted[s])return;'))
  fail('R1.5.47 remote loop still obeys device-local tombstones');

if(!index.includes('SERVER_STATUS_WINS_OVER_LOCAL_CACHE_R1548')) fail('server authority proof marker missing');
if(!index.includes('REMOTE_ROWS_IGNORE_LOCAL_TOMBSTONES_R1548')) fail('remote tombstone bypass marker missing');

if(!index.includes('R1546_OFFICIAL_DATA_CONTRACT')) fail('R1.5.46 official DATA contract regressed');
if(!index.includes('hr_official_data_contract_r1546')) fail('official DATA packet cache missing');
if(!index.includes("var DB_NAME='hr_mobile_data_release_ledger_v1';")) fail('official data ledger missing');

const dashStart=index.indexOf('<script id="r1502-dashboard-radical-rebuild-script">');
if(dashStart<0) fail('dashboard script missing');
const dashEnd=index.indexOf('</script>',dashStart);
if(dashEnd<0) fail('dashboard script closing tag missing');
const block=index.slice(dashStart,dashEnd);
const modulesStart=block.indexOf('var MODULES=[');
if(modulesStart<0) fail('dashboard MODULES array missing');
const modulesEnd=block.indexOf('];',modulesStart);
if(modulesEnd<0) fail('dashboard MODULES array end missing');
const moduleText=block.slice(modulesStart,modulesEnd+2);
const keys=[...moduleText.matchAll(/key:'([^']+)'/g)].map(x=>x[1]);
const wanted=['list','reports','updates','managernotes','service','jobtitles','titlematch','system'];
if(keys.join(',')!==wanted.join(',')) fail('dashboard order regression: '+keys.join(','));
if(keys.includes('alerts')) fail('alerts card returned');

if(!index.includes("var SW_URL='service-worker.js?v=1548';")) fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1548';")) fail('cache identity mismatch');
if(!index.includes('hrIndexedDBPrimaryStore')) fail('primary IndexedDB missing');

if(jobs.total!==1316 || !Array.isArray(jobs.rows) || jobs.rows.length!==1316) fail('job titles dataset incomplete');
if(!index.includes("fetch('assets/job-titles.json?v='+encodeURIComponent(APP_RELEASE||'r1548'),{cache:'no-store'})"))
  fail('title matching source mismatch');

if(!String(manifest.name||'').includes('R1.5.48')) fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.48')) fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.48-SERVICE-WORKER-NO-STALE-UI')) fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1548')) fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1548__')) fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:', expected);
