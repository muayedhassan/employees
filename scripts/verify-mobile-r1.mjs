#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1);}
function read(p){try{return fs.readFileSync(p,'utf8');}catch(e){fail('missing '+p);}}

const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobs=JSON.parse(read('assets/job-titles.json'));
const expected='MOBILE-R1.5.46-OFFICIAL-DATA-CONTRACT';

if(version!==expected)fail('VERSION.txt is not R1.5.46');
if(!index.includes(`<meta name="app-release" content="${expected}">`))fail('app-release meta is not R1.5.46');
if(!index.includes('R1546_OFFICIAL_DATA_CONTRACT'))fail('R1.5.46 marker missing');
if(!index.includes('id="r1546-official-data-contract"'))fail('R1.5.46 canonical block missing');
if(!index.includes('id="r1546-official-data-contract-script"'))fail('official data contract script missing');

if(!index.includes("var CACHE_KEY='hr_official_data_contract_r1546';"))fail('official packet cache missing');
if(!index.includes("var LEDGER_DB='hr_mobile_data_release_ledger_v1';"))fail('official import does not target the R1.5.45 ledger');
if(!index.includes("st.clear();"))fail('stale local release names are not cleared before official import');
if(!index.includes("source:'official-windows-history-r1546'"))fail('official Windows history ledger source missing');
if(!index.includes("changeSummary"))fail('changeSummary bridge support missing');
if(!index.includes("changeHistory"))fail('changeHistory bridge support missing');
if(!index.includes("versionMeta"))fail('versionMeta bridge support missing');
if(!index.includes("isDataVersion"))fail('official DATA-* validation missing');
if(!index.includes("__r1546Official=true"))fail('official history marker missing');
if(!index.includes("hr1508DatasetFromApi.__r1546Wrapped=true"))fail('secure API conversion wrapper missing');
if(!index.includes("applyDataset.__r1546Wrapped=true"))fail('dataset official-history import wrapper missing');
if(!index.includes("loadCentralData.__r1546Wrapped=true"))fail('central load restore wrapper missing');
if(!index.includes("window.r1546OfficialDataContract"))fail('R1.5.46 diagnostic API missing');

const start=index.indexOf('<script id="r1502-dashboard-radical-rebuild-script">');
if(start<0)fail('dashboard script missing');
const end=index.indexOf('</script>',start);
const block=index.slice(start,end);
const mm=block.match(/var MODULES=\[(.*?)\];/s);
if(!mm)fail('dashboard MODULES array missing');
const keys=[...mm[1].matchAll(/key:'([^']+)'/g)].map(x=>x[1]);
const wanted=['list','reports','updates','managernotes','service','jobtitles','titlematch','system'];
if(keys.join(',')!==wanted.join(','))fail('dashboard order regression');
if(keys.includes('alerts'))fail('alerts card returned');

if(!index.includes("var SW_URL='service-worker.js?v=1546';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1546';"))fail('cache identity mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('primary IndexedDB layer missing');
if(!index.includes("var DB_NAME='hr_mobile_data_release_ledger_v1';"))fail('R1.5.45 fallback ledger missing');

if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(!index.includes("var JOB_DATA_URL='assets/job-titles.json';"))fail('job titles source mismatch');
if(!index.includes("fetch('assets/job-titles.json?v='+encodeURIComponent(APP_RELEASE||'r1546'),{cache:'no-store'})"))fail('title matching source mismatch');
if(!index.includes("action:'review'"))fail('shared review POST missing');
if(!index.includes("&includeReviewed=1"))fail('shared review state sync missing');

if(!String(manifest.name||'').includes('R1.5.46'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.46'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.46-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1546'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1546__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
