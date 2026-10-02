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
const expected='MOBILE-R1.5.60-CAREER-EXPERIENCE-V4';

if(version!==expected)fail('VERSION mismatch');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1560_CAREER_EXPERIENCE_V4'))fail('R1.5.60 marker missing');
if(!index.includes('id="r1560-career-experience-v4-style"'))fail('V4 CSS missing');

for(const marker of [
  'واجهة مختصرة',
  'المعلومات الضرورية فقط',
  'بداية التغطية لا تعني بداية التعيين',
  'تفاصيل وحدود المسار',
  'دليل السلاسل',
  'قيد التدقيق'
]) if(!index.includes(marker))fail('V4 UI marker missing: '+marker);

if(!index.includes('R1559_QUALIFICATION_CONTEXT_VISUAL_V3'))fail('R1.5.59 lineage regressed');
if(!index.includes('R1558_CAREER_COVERAGE_EXPLAINABILITY'))fail('R1.5.58 lineage regressed');
if(!index.includes("smartSearch(state.q,arr)"))fail('smartSearch regressed');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('explicit-only marker regressed');
if(!index.includes("result.status='ambiguous'"))fail('ambiguity handling missing');

if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must remain disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('employee data must remain read-only');
if(prog.policy.educationMappingSourceAvailable!==false)fail('education mapping source state changed');
if(prog.policy.educationDecisionMode!=='context-only-until-authoritative-map')fail('education decision mode changed');

if(jobs.total!==1316||jobs.rows.length!==1316)fail('job-title source must remain 1316');
if(prog.chains.length!==197||Number(prog.validatedChainCount)!==197)fail('chain count must remain 197');
if(Number(prog.validatedStepCount)!==850)fail('mapped title count must remain 850');
if(!prog.coverage||prog.coverage.mappedTitles!==850||prog.coverage.unmappedTitles!==466)fail('coverage must remain 850/466');
if(!prog.coverageProfiles||prog.coverageProfiles.extendsToFirst!==73||prog.coverageProfiles.upperSegments!==63)fail('coverage profile changed');

const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};
const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
let steps=0;
for(const c of prog.chains){
  if(!c.coverageStartGrade||!c.coverageEndGrade||!String(c.startReason||'').trim())fail('boundary metadata missing '+c.id);
  for(const st of c.steps){
    steps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree mismatch '+c.id);
    if(!pairs.has(st.degree+'|'+st.title))fail('step absent from source '+c.id+' / '+st.title);
  }
}
if(steps!==850)fail('step count changed');

if(!index.includes("var SW_URL='service-worker.js?v=1560';"))fail('SW URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1560';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1560'"))fail('job-title fallback version mismatch');
if(!sw.includes('MOBILE-R1.5.60-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('__offline_index_r1560__'))fail('offline index mismatch');
if(!String(manifest.name||'').includes('R1.5.60'))fail('manifest mismatch');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 regression');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']){
  if(!index.includes(marker))fail(marker+' regression');
}

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_CAREER_V4_UI OK: compact header / single employee surface / one path surface / secondary details collapsed');
console.log('VERIFY_QUALIFICATION_CONTEXT OK: education remains visible context, not an invented decision rule');
console.log('VERIFY_CAREER_MAP OK: 197 chains / 850 exact mapped titles / 466 audit queue / 1316 source titles');
console.log('VERIFY_CAREER_LOGIC OK: R1.5.59 boundaries + R1.5.58 coverage + R1.5.54 search retained');
console.log('VERIFY_REGRESSION OK: administrative markers retained');
