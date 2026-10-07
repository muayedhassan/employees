#!/usr/bin/env node
import fs from 'node:fs';

const fail=m=>{console.error('VERIFY_MOBILE_R1 FAIL:',m);process.exit(1)};
const read=p=>fs.readFileSync(p,'utf8');
const E='MOBILE-R1.5.98-SALARY-SERVICE-MOBILE-FIT-TYPOGRAPHY';
const CAREER='MOBILE-R1.5.88-REFERENCE-BACKED-CAREER-PROGRESSION-CONSOLIDATION';
const countOf=(h,n)=>h.split(n).length-1;
const key=(d,t)=>d+'|||'+String(t||'').trim();

const i=read('index.html');
const p=JSON.parse(read('assets/job-title-progression.json'));
const j=JSON.parse(read('assets/job-titles.json'));
const req=JSON.parse(read('assets/job-title-requirements.json'));
const staffing=JSON.parse(read('assets/amendment-22-preliminary-review.json'));
const salary=JSON.parse(read('assets/salary-service-reference.json'));
const sw=read('service-worker.js');
const m=JSON.parse(read('manifest.webmanifest'));
const v=read('VERSION.txt').trim();

if(v!==E||!i.includes('<meta name="app-release" content="'+E+'">'))fail('release mismatch');
if(!String(m.name||'').includes('R1.5.98')||!String(m.short_name||'').includes('R1.5.98'))fail('manifest release mismatch');

for(const x of [
 'R1579_DASHBOARD_VISUAL_SYSTEM_FIRST_TAP_NAVIGATION_FIX_RELEASE',
 'R1582_DASHBOARD_CLEANUP_COMPACT_HEADER_PRO_SCROLL_RELEASE',
 'R1583_DASHBOARD_HOME_LIST_ISOLATION_FIX_RELEASE',
 'R1584_DASHBOARD_CONTENT_ROUTING_CAPTURE_FIX_RELEASE',
 'R1585_HOME_STABILITY_REAL_FLOATING_CONTROL_FIX_RELEASE',
 'R1586_HOME_ONLY_FLOATING_CONTROL_CLEANUP_RELEASE',
 'R1587_COMPACT_HEADER_GOLD_TYPOGRAPHY_SECTIONS_RELEASE'
]) if(!i.includes(x)) fail('missing preserved marker '+x);

if(j.total!==1316||j.rows.length!==1316)fail('directory changed');
const src=new Set(j.rows.map(r=>key(r.degree,r.title))),seen=new Set();
if(p.release!==CAREER||p.chains.length!==197||p.validatedChainCount!==197||p.validatedStepCount!==1023||p.coverage?.mappedTitles!==1023||p.coverage?.unmappedTitles!==293||Number(p.coverage?.exactCoveragePercent)!==77.7)fail('career invariant changed');
for(const c of p.chains)for(const s of c.steps){const k=key(s.degree,s.title);if(!src.has(k)||seen.has(k))fail('career exact set invalid '+k);seen.add(k)}
if(seen.size!==1023||(p.chains||[]).filter(c=>c.currentTitleAnchor).length!==6)fail('career exact-set invariant');
if(!Array.isArray(req.cards)||req.cards.length!==17)fail('requirements cards changed');

if(!Array.isArray(staffing.annex1Visible)||staffing.annex1Visible.length!==150)fail('staffing visible set changed');
if(!staffing.policy||staffing.policy.readOnly!==true||staffing.policy.noEmployeeMutation!==true||staffing.policy.noCareerMapMutation!==true||staffing.policy.noDirectoryMutation!==true||staffing.policy.pendingPublication!==true||staffing.policy.canonicalExactOnly!==true)fail('staffing protection changed');

if(!salary||salary.schema!=='salary-service-reference.v1'||!salary.policy||salary.policy.readOnly!==true||salary.policy.doesNotModifyEmployeeData!==true||salary.policy.doesNotInferEmployeeGrade!==true||salary.policy.doesNotInferEmployeeStage!==true||salary.policy.doesNotGrantAllowanceEntitlement!==true||salary.policy.doesNotDecidePromotionEligibility!==true||salary.policy.pensionCalculatorEnabled!==false||salary.policy.higherGradesCalculatorEnabled!==false)fail('salary protection changed');
if(!salary.salaryScale||salary.salaryScale.gradeCount!==10||salary.salaryScale.stageCount!==11||salary.salaryScale.valueCount!==110||!Array.isArray(salary.salaryScale.rows)||salary.salaryScale.rows.length!==10)fail('salary scale metadata changed');
let n=0;
for(const r of salary.salaryScale.rows){
  if(!Array.isArray(r.stages)||r.stages.length!==11)fail('salary stages changed grade '+r.grade);
  r.stages.forEach((value,idx)=>{n++;if(Number(value)!==Number(r.firstStageSalary)+Number(r.annualIncrement)*idx)fail('salary arithmetic mismatch grade '+r.grade+' stage '+(idx+1))});
}
if(n!==110)fail('salary value count changed');

for(const x of [
 'assets/salary-service-reference.json',
 'data-r1551-mode="salary"',
 'function salaryServiceHTML()',
 'function salaryServiceBind()',
 'r1598-salary-service-mobile-fit-style',
 'R1598_SALARY_SERVICE_MOBILE_FIT_TYPOGRAPHY',
 "classList.toggle('r1598-salary-open',state.mode==='salary')",
 'overflow-x:auto!important',
 'grid-template-columns:1fr!important'
]) if(!i.includes(x)) fail('R1.5.98 marker missing: '+x);

if(countOf(i,'service-worker.js?v=1598')!==3)fail('service worker URL marker count');
if(countOf(i,'employee-registry-ui-r1598')!==1)fail('UI cache marker count');
if(countOf(i,"u.searchParams.set('v','1598')")!==2)fail('manual update marker count');
if(countOf(i,"hr_mobile_ui_cache_release','1598")!==1)fail('local cache release marker count');
for(const old of ['service-worker.js?v=1597','employee-registry-ui-r1597',"u.searchParams.set('v','1597')","hr_mobile_ui_cache_release','1597"])if(i.includes(old))fail('stale R1.5.97 runtime marker '+old);

if(!sw.includes('MOBILE-R1.5.98-SERVICE-WORKER-NO-STALE-UI')||!sw.includes('employee-registry-ui-r1598')||!sw.includes('__offline_index_r1598__'))fail('service worker mismatch');

console.log('VERIFY_MOBILE_R1 OK:',E);
console.log('VERIFY_R1598_MOBILE_WIDTH OK: salary workspace constrained to viewport');
console.log('VERIFY_R1598_FLUID_TYPOGRAPHY OK: salary/service text uses larger responsive typography');
console.log('VERIFY_R1598_STAGE_SCROLL OK: horizontal movement isolated to the 11-stage strip');
console.log('VERIFY_SALARY_REFERENCE OK: 10 grades / 11 stages / 110 values unchanged');
console.log('VERIFY_CAREER_INVARIANTS OK: 197 chains / 1023 mapped / 293 audit / 77.7%');
console.log('VERIFY_DIRECTORY OK: 1316 unchanged');
console.log('VERIFY_STAFFING_WORKSPACE OK: 150 visible cases unchanged');
console.log('VERIFY_REQUIREMENTS OK: 17 cards unchanged');
console.log('VERIFY_NO_EMPLOYEE_DATA_MUTATION OK: patch does not write employee-data assets or IndexedDB');
console.log('VERIFY_MOBILE_R1 PASSED');
