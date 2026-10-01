#!/usr/bin/env node
import fs from 'node:fs';

function fail(msg){ console.error('VERIFY_MOBILE_R1 FAIL:', msg); process.exit(1); }
function read(p){ try{return fs.readFileSync(p,'utf8');}catch(e){fail('missing '+p);} }

const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobTitles=JSON.parse(read('assets/job-titles.json'));

const expected='MOBILE-R1.5.42-TITLE-MATCH-DATA-SOURCE-FIX';

if(version!==expected) fail('VERSION.txt is not R1.5.42');
if(!index.includes(`<meta name="app-release" content="${expected}">`)) fail('app-release meta is not R1.5.42');
if(!index.includes('R1542_TITLE_MATCH_DATA_SOURCE_FIX')) fail('missing R1.5.42 marker');
if(!index.includes('r1542-title-match-data-source-fix')) fail('missing R1.5.42 final release block');
if(!index.includes("var RELEASE='MOBILE-R1.5.42-TITLE-MATCH-DATA-SOURCE-FIX';")) fail('final release authority mismatch');
if(!index.includes("var SW_URL='service-worker.js?v=1542';")) fail('maintenance service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1542';")) fail('maintenance cache key mismatch');
if(!index.includes("localStorage.setItem('hr_mobile_ui_cache_release','1542')")) fail('local cache release marker mismatch');

if(!index.includes('hrIndexedDBPrimaryStore')) fail('IndexedDB primary store missing');

if(jobTitles.total!==1316 || !Array.isArray(jobTitles.rows) || jobTitles.rows.length!==1316)
  fail('job titles dataset incomplete');

if(!index.includes("var JOB_DATA_URL='assets/job-titles.json';"))
  fail('job titles interface source mismatch');

if(!index.includes("fetch('assets/job-titles.json?v='+encodeURIComponent(APP_RELEASE||'r1542'),{cache:'no-store'})"))
  fail('title matching source mismatch');

if(index.includes("fetch('data/job-titles.json',{cache:'no-store'})"))
  fail('legacy title matching source still present');

if(!index.includes("action:'review'"))
  fail('R1.5.41 shared review status POST missing');

if(!index.includes("&includeReviewed=1"))
  fail('R1.5.41 reviewed-state synchronization missing');

if(!index.includes("window.r1479ManagerNotesSyncNow(false,true)"))
  fail('R1.5.41 forced cross-device sync missing');

if(!String(manifest.name||'').includes('R1.5.42')) fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.42')) fail('manifest short_name mismatch');
if(!String(manifest.description||'').includes('R1.5.42')) fail('manifest description mismatch');

if(!sw.includes('MOBILE-R1.5.42-SERVICE-WORKER-NO-STALE-UI')) fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1542')) fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1542__')) fail('offline index mismatch');

if(/data\/employees\.json|data\/fallback-data\.js/.test(index))
  fail('legacy public employee data reference found');

if(fs.existsSync('data/employees.json'))
  fail('data/employees.json must not be published');

if(fs.existsSync('fallback-data.js'))
  fail('fallback-data.js must not be published');

console.log('VERIFY_MOBILE_R1 OK:', expected);
