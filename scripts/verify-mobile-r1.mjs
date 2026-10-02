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
const expected='MOBILE-R1.5.59-QUALIFICATION-CONTEXT-VISUAL-V3';

if(version!==expected)fail('VERSION mismatch');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1559_QUALIFICATION_CONTEXT_VISUAL_V3'))fail('R1.5.59 marker missing');
if(!index.includes('id="r1559-qualification-visual-v3-style"'))fail('R1.5.59 style block missing');

for(const marker of [
  'بداية التغطية ≠ بداية التعيين',
  'التحصيل الدراسي عامل مهم',
  'لا توجد قاعدة ربط رسمية',
  'بداية التغطية المثبتة',
  'المقاطع العليا لا تمثل بداية تعيين',
  'مركز تدقيق العناوين المتبقية',
  '73 عائلة من درجتين متتاليتين قيد المراجعة',
  '205 عائلات منفردة',
  '17 عائلة ملتبسة',
  '27 عائلة فيها فجوات'
]) if(!index.includes(marker))fail('qualification/design marker missing: '+marker);

if(!index.includes('R1558_CAREER_COVERAGE_EXPLAINABILITY'))fail('R1.5.58 lineage regressed');
if(!index.includes('R1557_CAREER_DASHBOARD_UI_OVERHAUL'))fail('R1.5.57 lineage regressed');
if(!index.includes("smartSearch(state.q,arr)"))fail('R1.5.54 search regressed');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('no-heuristics marker regressed');
if(!index.includes("result.status='ambiguous'"))fail('ambiguity handling missing');

if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must remain disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('employee data must remain read-only');
if(prog.policy.educationMappingSourceAvailable!==false)fail('education mapping source must explicitly remain unavailable');
if(prog.policy.educationDecisionMode!=='context-only-until-authoritative-map')fail('education decision mode mismatch');
if(!prog.coverageProfiles)fail('coverageProfiles missing');
if(prog.coverageProfiles.extendsToFirst!==73)fail('extendsToFirst count mismatch');
if(prog.coverageProfiles.partial!==124)fail('partial count mismatch');
if(prog.coverageProfiles.upperSegments!==63)fail('upperSegments count mismatch');
if(!prog.remainingAudit||prog.remainingAudit.totalTitles!==466)fail('remaining audit total mismatch');
if(prog.remainingAudit.twoConsecutiveCandidateFamilies!==73)fail('two-grade audit count mismatch');
if(prog.remainingAudit.isolatedFamilies!==205)fail('isolated audit count mismatch');
if(prog.remainingAudit.ambiguousFamilies!==17)fail('ambiguous audit count mismatch');
if(prog.remainingAudit.gapFamilies!==27)fail('gap audit count mismatch');

if(jobs.total!==1316||jobs.rows.length!==1316)fail('job-title source must remain 1316');
if(prog.chains.length!==197||Number(prog.validatedChainCount)!==197)fail('chain count must remain 197');
if(Number(prog.validatedStepCount)!==850)fail('mapped title count must remain 850');
if(!prog.coverage||prog.coverage.mappedTitles!==850||prog.coverage.unmappedTitles!==466)fail('coverage must remain 850/466');

let upper=0,extendsCount=0,partial=0,steps=0;
const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};
const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
for(const c of prog.chains){
  const gs=c.steps.map(s=>Number(s.grade)),maxG=Math.max(...gs),minG=Math.min(...gs);
  if(maxG<=4)upper++;
  if(minG===1)extendsCount++;else partial++;
  if(Number(c.coverageStartGrade)!==maxG||Number(c.coverageEndGrade)!==minG)fail('boundary metadata mismatch '+c.id);
  if(!String(c.startReason||'').trim())fail('start reason missing '+c.id);
  for(const st of c.steps){
    steps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree mismatch '+c.id);
    if(!pairs.has(st.degree+'|'+st.title))fail('step absent from source '+c.id+' / '+st.title);
  }
}
if(upper!==63||extendsCount!==73||partial!==124||steps!==850)fail('computed coverage profile mismatch');

if(!index.includes("var SW_URL='service-worker.js?v=1559';"))fail('SW URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1559';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1559'"))fail('job-title fallback version mismatch');
if(!sw.includes('MOBILE-R1.5.59-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('__offline_index_r1559__'))fail('offline index mismatch');
if(!String(manifest.name||'').includes('R1.5.59'))fail('manifest name mismatch');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 regression');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']){
  if(!index.includes(marker))fail(marker+' regression');
}

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_QUALIFICATION_CONTEXT OK: education shown as required context; no unverified education-to-grade rule is applied');
console.log('VERIFY_BOUNDARIES OK: 197 chains carry explicit coverage start/end + 63 upper-segment warnings');
console.log('VERIFY_CAREER_PROFILE OK: 73 extend to grade 1 / 124 partial / 63 upper segments');
console.log('VERIFY_AUDIT_QUEUE OK: 466 titles remain; 73 two-grade families review-only / 205 isolated / 17 ambiguous / 27 gapped');
console.log('VERIFY_CAREER_MAP OK: 197 chains / 850 exact mapped titles / 1316 source titles');
console.log('VERIFY_REGRESSION OK: R1.5.58 coverage + R1.5.57 dashboard + R1.5.54 search + admin markers retained');
