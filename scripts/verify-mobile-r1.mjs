#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1)}
function read(p){try{return fs.readFileSync(p,'utf8')}catch(e){fail('missing '+p)}}
const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobs=JSON.parse(read('assets/job-titles.json'));
const expected='MOBILE-R1.5.47-SHARED-REVIEW-STATE';

if(version!==expected)fail('VERSION.txt is not R1.5.47');
if(!index.includes(`<meta name="app-release" content="${expected}">`))fail('app-release meta mismatch');
if(!index.includes('R1547_SHARED_REVIEW_STATE'))fail('R1.5.47 marker missing');
if(!index.includes('id="r1547-manager-notes-shared-review-state-script"'))fail('shared review module missing');
if(!index.includes('id="r1547-canonical-release"'))fail('R1.5.47 canonical release block missing');
if(!index.includes("window.r1547ManagerNotesSharedReview"))fail('R1.5.47 diagnostic API missing');
if(!index.includes("action:'review'"))fail('legacy shared review POST missing');
if(!index.includes("action:'review',"))fail('server-confirmed JSONP review action missing');
if(!index.includes("mergeAuthoritative"))fail('authoritative shared-state merge missing');
if(!index.includes("if(source==='remote')return"))fail('stale remote cache pruning missing');
if(!index.includes("اعتماد تمت المراجعة مخصص لمسؤول النظام"))fail('admin-only review guard missing');
if(!index.includes("لم يتم اعتماد المراجعة مركزيًا"))fail('failed server review guard missing');
if(!index.includes("id:note.id,senderName:note.sender"))fail('stable note ID send missing');

if(!index.includes('R1546_OFFICIAL_DATA_CONTRACT'))fail('R1.5.46 official DATA contract regressed');
if(!index.includes('hr_official_data_contract_r1546'))fail('official DATA packet cache missing');
if(!index.includes("var DB_NAME='hr_mobile_data_release_ledger_v1';"))fail('data ledger missing');

const start=index.indexOf('<script id="r1502-dashboard-radical-rebuild-script">');
if(start<0)fail('dashboard script missing');
const end=index.indexOf('</script>',start);
if(end<0)fail('dashboard script closing tag missing');
const block=index.slice(start,end);
const modulesStart=block.indexOf('var MODULES=[');
if(modulesStart<0)fail('dashboard MODULES array missing');
const modulesEnd=block.indexOf('];',modulesStart);
if(modulesEnd<0)fail('dashboard MODULES array end missing');
const moduleText=block.slice(modulesStart,modulesEnd+2);
const keys=[...moduleText.matchAll(/key:'([^']+)'/g)].map(x=>x[1]);
const wanted=['list','reports','updates','managernotes','service','jobtitles','titlematch','system'];
if(keys.join(',')!==wanted.join(','))fail('dashboard order regression: '+keys.join(','));
if(keys.includes('alerts'))fail('alerts card returned');

if(!index.includes("var SW_URL='service-worker.js?v=1547';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1547';"))fail('cache identity mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('primary IndexedDB missing');

if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(!index.includes("fetch('assets/job-titles.json?v='+encodeURIComponent(APP_RELEASE||'r1547'),{cache:'no-store'})"))fail('title matching source mismatch');
if(!index.includes("&includeReviewed=1"))fail('reviewed-state retrieval missing');

if(!String(manifest.name||'').includes('R1.5.47'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.47'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.47-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1547'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1547__'))fail('offline index mismatch');
console.log('VERIFY_MOBILE_R1 OK:',expected);
