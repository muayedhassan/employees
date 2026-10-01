#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1)}
function read(p){try{return fs.readFileSync(p,'utf8')}catch(e){fail('missing '+p)}}
const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobs=JSON.parse(read('assets/job-titles.json'));
const expected='MOBILE-R1.5.49-ADMIN-ARCHIVE-SHARED-DELETE';

if(version!==expected)fail('VERSION.txt is not R1.5.49');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1549_ADMIN_ARCHIVE_SHARED_DELETE'))fail('R1.5.49 marker missing');
if(!index.includes('id="r1549-admin-archive-shared-delete-script"'))fail('admin archive module missing');
if(!index.includes('id="r1549-canonical-release"'))fail('R1.5.49 canonical block missing');
if(!index.includes('body.r1549-hr-manager [data-r1475-filter="archive"]'))fail('HR manager archive hide rule missing');
if(!index.includes("action:'delete'"))fail('shared delete action missing');
if(!index.includes("role:'system_admin'"))fail('admin role delete guard missing');
if(!index.includes("String(data.status||'')!=='deleted'"))fail('server delete confirmation missing');
if(!index.includes('حذف نهائي من الأرشيف'))fail('admin archive delete label missing');
if(!index.includes('window.r1549AdminArchiveSharedDelete'))fail('R1.5.49 diagnostic API missing');

if(!index.includes('R1548_SERVER_AUTHORITY_CLEANUP'))fail('R1.5.48 server authority regressed');
if(!index.includes('R1547_SHARED_REVIEW_STATE'))fail('R1.5.47 shared review regressed');
if(!index.includes('R1546_OFFICIAL_DATA_CONTRACT'))fail('R1.5.46 official DATA contract regressed');

const dashStart=index.indexOf('<script id="r1502-dashboard-radical-rebuild-script">');
if(dashStart<0)fail('dashboard script missing');
const dashEnd=index.indexOf('</script>',dashStart);
const block=index.slice(dashStart,dashEnd);
const modulesStart=block.indexOf('var MODULES=[');
if(modulesStart<0)fail('dashboard MODULES array missing');
const modulesEnd=block.indexOf('];',modulesStart);
if(modulesEnd<0)fail('dashboard MODULES end missing');
const moduleText=block.slice(modulesStart,modulesEnd+2);
const keys=[...moduleText.matchAll(/key:'([^']+)'/g)].map(x=>x[1]);
const wanted=['list','reports','updates','managernotes','service','jobtitles','titlematch','system'];
if(keys.join(',')!==wanted.join(','))fail('dashboard order regression: '+keys.join(','));
if(keys.includes('alerts'))fail('alerts card returned');

if(!index.includes("var SW_URL='service-worker.js?v=1549';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1549';"))fail('cache identity mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('primary IndexedDB missing');
if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(!index.includes("fetch('assets/job-titles.json?v='+encodeURIComponent(APP_RELEASE||'r1549'),{cache:'no-store'})"))fail('title matching source mismatch');

if(!String(manifest.name||'').includes('R1.5.49'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.49'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.49-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1549'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1549__'))fail('offline index mismatch');
console.log('VERIFY_MOBILE_R1 OK:',expected);
