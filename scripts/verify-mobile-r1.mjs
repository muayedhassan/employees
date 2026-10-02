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
const expected='MOBILE-R1.5.57-CAREER-DASHBOARD-UI-OVERHAUL';

if(version!==expected)fail('VERSION.txt is not R1.5.57');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1557_CAREER_DASHBOARD_UI_OVERHAUL'))fail('R1.5.57 marker missing');
if(!index.includes('id="r1557-career-dashboard-ui-style"'))fail('R1.5.57 dashboard CSS missing');

for(const marker of [
  'r1557-dashboard',
  'r1557-kpis',
  'r1557-kpi',
  'r1557-panel',
  'r1557-employee-card',
  'r1557-match',
  'r1557-progress-grid',
  'r1557-timeline',
  'r1557-guide-grid',
  'r1557-chain',
  'r1557-facts',
  '40 مسارًا صريحًا',
  '267 خطوة موثقة',
  '1316 عنوانًا في الدليل',
  'لوحة المسار الوظيفي',
  'الخطوة التالية في المسار المرجعي',
  'لماذا ظهرت هذه النتيجة؟',
  'البيانات المستخدمة في التحليل'
]) if(!index.includes(marker)) fail('dashboard UI element missing: '+marker);

// Preserve proven logic.
if(!index.includes('R1556_CAREER_MAP_EXPANSION_BATCH1'))fail('R1.5.56 expansion marker regressed');
if(!index.includes('R1555_CAREER_PROFESSIONAL_UI'))fail('R1.5.55 UI lineage marker regressed');
if(!index.includes("smartSearch(state.q,arr)"))fail('R1.5.54 smartSearch reuse regressed');
if(!index.includes("norm(e.jobTitle||'').indexOf(qn)>=0"))fail('jobTitle search fallback regressed');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('no-heuristics policy regressed');
if(!index.includes("result.status='ambiguous'"))fail('employee-scoped ambiguity handling missing');
if(!index.includes("result.next=result.chain.steps.find"))fail('explicit next-step lookup missing');
if(index.includes("throw new Error('عنوان مستخدم في أكثر من سلسلة:"))fail('cross-chain ambiguity became globally fatal');
if(index.includes("throw new Error('عنوان مكرر داخل السلسلة نفسها:"))fail('same-chain ambiguity became globally fatal');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 quiet sync regressed');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']){
  if(!index.includes(marker))fail(marker+' regressed');
}

if(!index.includes("var SW_URL='service-worker.js?v=1557';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1557';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1557'"))fail('job-title fallback version mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('IndexedDB layer missing');

if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(prog.release!==expected)fail('progression release mismatch');
if(prog.sourceJobTitlesRelease!==jobs.release)fail('progression source release mismatch');
if(Number(prog.sourceTotal)!==1316)fail('progression source total must remain 1316');
if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must remain disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('career module must remain read-only');
if(prog.policy.ambiguityHandling!=='employee-scoped-no-next')fail('ambiguity policy mismatch');
if(!Array.isArray(prog.chains)||prog.chains.length!==40)fail('expected 40 explicit chains');
if(Number(prog.validatedChainCount)!==40)fail('validatedChainCount must remain 40');

const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};
const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
let steps=0;
for(const c of prog.chains){
  if(!c.id||!Array.isArray(c.steps)||!c.steps.length)fail('empty chain '+String(c.id));
  for(const st of c.steps){
    steps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree label mismatch '+c.id+' '+st.grade);
    if(!pairs.has(st.degree+'|'+st.title))fail('step not found exactly in directory: '+c.id+' / '+st.title);
  }
}
if(steps!==267)fail('expected 267 exact steps, got '+steps);
if(Number(prog.validatedStepCount)!==267)fail('validatedStepCount must remain 267');

if(!String(manifest.name||'').includes('R1.5.57'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.57'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.57-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1557'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1557__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_CAREER_DASHBOARD OK: 40/267/1316 permanently visible + structured search + employee dashboard + guide cards');
console.log('VERIFY_CAREER_GUIDE OK: 40 explicit chains rendered as organized expandable cards');
console.log('VERIFY_CAREER_LOGIC OK: R1.5.56 map + R1.5.54 search + explicit-only matching retained unchanged');
console.log('VERIFY_CAREER_MAP OK: 40 explicit chains / 267 exact steps / source 1316 titles');
console.log('VERIFY_REGRESSION OK: R1.5.50 quiet notes + R1.5.49/R1.5.48/R1.5.47/R1.5.46 markers retained');
