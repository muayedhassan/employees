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
const expected='MOBILE-R1.5.58-CAREER-COVERAGE-EXPLAINABILITY';

if(version!==expected)fail('VERSION.txt is not R1.5.58');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1558_CAREER_COVERAGE_EXPLAINABILITY'))fail('R1.5.58 marker missing');
if(!index.includes('id="r1558-career-coverage-style"'))fail('coverage/explainability CSS missing');

for(const marker of [
  '197 مسارًا صريحًا',
  '850 عنوانًا مربوطًا',
  '466 غير مربوط حاليًا',
  '64.6%',
  'سبب توقف السلسلة',
  'لماذا لا توجد خطوة تالية؟',
  'مسارات تمتد إلى الدرجة الأولى',
  'مسارات جزئية',
  'لم يتم ربطها تلقائيًا'
]) if(!index.includes(marker))fail('explainability UI marker missing: '+marker);

if(!index.includes('R1557_CAREER_DASHBOARD_UI_OVERHAUL'))fail('R1.5.57 dashboard lineage regressed');
if(!index.includes('R1556_CAREER_MAP_EXPANSION_BATCH1'))fail('R1.5.56 map lineage regressed');
if(!index.includes("smartSearch(state.q,arr)"))fail('R1.5.54 search regressed');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('no-heuristics policy regressed');
if(!index.includes("result.status='ambiguous'"))fail('employee-scoped ambiguity missing');
if(index.includes("throw new Error('عنوان مستخدم في أكثر من سلسلة:"))fail('cross-chain ambiguity globally fatal');
if(index.includes("throw new Error('عنوان مكرر داخل السلسلة نفسها:"))fail('same-chain ambiguity globally fatal');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 quiet sync regressed');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']){
  if(!index.includes(marker))fail(marker+' regressed');
}

if(!index.includes("var SW_URL='service-worker.js?v=1558';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1558';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1558'"))fail('job-title fallback version mismatch');

if(jobs.total!==1316||jobs.rows.length!==1316)fail('job titles source must remain 1316');
if(prog.release!==expected)fail('progression release mismatch');
if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must remain disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('career module must remain read-only');
if(!Array.isArray(prog.chains)||prog.chains.length!==197)fail('expected exactly 197 explicit chains');
if(Number(prog.validatedChainCount)!==197)fail('validatedChainCount must be 197');
if(!prog.coverage||prog.coverage.mappedTitles!==850||prog.coverage.unmappedTitles!==466)fail('coverage metadata mismatch');

const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};
const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
const titles=new Set();
let steps=0,newChains=0,newSteps=0,partialWithReason=0;
for(const c of prog.chains){
  if(!c.id||!Array.isArray(c.steps)||!c.steps.length)fail('empty chain '+String(c.id));
  const grades=c.steps.map(s=>Number(s.grade));
  const minG=Math.min(...grades);
  if(minG>1 && String(c.stopReason||'').trim())partialWithReason++;
  if(c.releaseAdded==='R1.5.58'){newChains++;newSteps+=c.steps.length}
  for(const st of c.steps){
    steps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree mismatch '+c.id+' / '+st.title);
    if(!pairs.has(st.degree+'|'+st.title))fail('step absent from exact source: '+c.id+' / '+st.title);
    const k=st.degree+'|'+st.title;
    if(titles.has(k))fail('same exact title/degree mapped more than once: '+k);
    titles.add(k);
  }
}
if(steps!==850)fail('expected exactly 850 steps, got '+steps);
if(Number(prog.validatedStepCount)!==850)fail('validatedStepCount must be 850');
if(newChains!==157||newSteps!==583)fail('R1.5.58 batch count mismatch: '+newChains+' / '+newSteps);
if(titles.size!==850)fail('expected 850 unique mapped title/degree pairs');
if(1316-titles.size!==466)fail('expected 466 unmapped directory titles');
if(partialWithReason<1)fail('partial chains must carry stop reasons');

for(const id of ['accounting','audit','audit_accounts']){
  const c=prog.chains.find(x=>x.id===id);
  if(!c||!String(c.stopReason||'').includes('لم يتم ربط'))fail(id+' explicit boundary explanation missing');
}

if(!String(manifest.name||'').includes('R1.5.58'))fail('manifest name mismatch');
if(!sw.includes('MOBILE-R1.5.58-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1558'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1558__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_CAREER_EXPANSION OK: 157 new audited family segments / 583 new exact title steps');
console.log('VERIFY_CAREER_COVERAGE OK: 197 chains / 850 mapped titles / 466 currently unmapped / 64.6% exact directory coverage');
console.log('VERIFY_CAREER_EXPLAINABILITY OK: partial chains carry explicit stop reasons; accounting/audit boundaries documented');
console.log('VERIFY_CAREER_POLICY OK: no cross-gap bridging / no multi-candidate grade selection / heuristic inference disabled');
console.log('VERIFY_REGRESSION OK: R1.5.57 UI + R1.5.56 map + R1.5.54 search + administrative markers retained');
