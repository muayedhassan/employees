#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1)}
function read(p){try{return fs.readFileSync(p,'utf8')}catch(e){fail('missing '+p)}}

const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobs=JSON.parse(read('assets/job-titles.json'));
const prog=JSON.parse(read('assets/job-title-progression.json'));
const expected='MOBILE-R1.5.54-CAREER-SEARCH-REUSE';

if(version!==expected)fail('VERSION.txt is not R1.5.54');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1554_CAREER_SEARCH_REUSE'))fail('R1.5.54 marker missing');
if(!index.includes('id="r1551-career-progression-script"'))fail('career module missing');
if(!index.includes("window.r1551CareerProgression"))fail('career API missing');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('no-heuristics marker missing');
if(index.includes("throw new Error('عنوان مستخدم في أكثر من سلسلة:"))fail('cross-chain ambiguity became globally fatal again');
if(index.includes("throw new Error('عنوان مكرر داخل السلسلة نفسها:"))fail('same-chain ambiguity became globally fatal again');

if(!index.includes("typeof smartSearch==='function'"))fail('career search does not reuse smartSearch');
if(!index.includes("smartSearch(state.q,arr)"))fail('career search smartSearch call missing');
if(!index.includes("norm(e.jobTitle||'').indexOf(qn)>=0"))fail('explicit job-title search fallback missing');
if(index.includes("parts.every(function(p){return hay.indexOf(p)>=0})"))fail('old strict parallel employee search still present');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 quiet sync regressed');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']){
  if(!index.includes(marker))fail(marker+' regressed');
}

if(!index.includes("var SW_URL='service-worker.js?v=1554';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1554';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1554'"))fail('job title fallback version mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('IndexedDB layer missing');

if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(prog.release!==expected)fail('progression release mismatch');
if(prog.sourceJobTitlesRelease!==jobs.release)fail('progression source release mismatch');
if(Number(prog.sourceTotal)!==Number(jobs.total))fail('progression source total mismatch');
if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must be disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('career module must remain read-only');
if(prog.policy.ambiguityHandling!=='employee-scoped-no-next')fail('ambiguity handling policy mismatch');
if(!Array.isArray(prog.chains)||prog.chains.length!==16)fail('expected 16 explicit chains');

let steps=0;
const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};
const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
for(const c of prog.chains){
  if(!c.id||!Array.isArray(c.steps)||!c.steps.length)fail('empty chain '+String(c.id));
  for(const st of c.steps){
    steps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree label mismatch '+c.id+' '+st.grade);
    if(!pairs.has(st.degree+'|'+st.title))fail('step not found in job title directory: '+st.title);
  }
}
if(steps!==102||Number(prog.validatedStepCount)!==102)fail('expected 102 validated steps');
if(Number(prog.validatedChainCount)!==16)fail('chain count metadata mismatch');

if(!String(manifest.name||'').includes('R1.5.54'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.54'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.54-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1554'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1554__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_CAREER_MAP OK: 16 explicit chains / 102 exact directory steps / heuristic inference disabled');
console.log('VERIFY_CAREER_SEARCH OK: existing smartSearch reused for employee name/number; explicit jobTitle search retained');
console.log('VERIFY_CAREER_AMBIGUITY OK: non-blocking employee-scoped ambiguity retained');
console.log('VERIFY_REGRESSION OK: R1.5.50 quiet notes + R1.5.49/R1.5.48/R1.5.47/R1.5.46 markers retained');
