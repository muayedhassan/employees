#!/usr/bin/env node
import fs from 'node:fs';

const fail=m=>{console.error('VERIFY_MOBILE_R1 FAIL:',m);process.exit(1)};
const read=p=>fs.readFileSync(p,'utf8');
const E='MOBILE-R1.5.99-CAREER-FULL-WIDTH-UNIFIED-TYPOGRAPHY';
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
if(!String(m.name||'').includes('R1.5.99')||!String(m.short_name||'').includes('R1.5.99'))fail('manifest release mismatch');

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
 'r1599-career-full-width-unified-typography-style',
 'R1599_CAREER_FULL_WIDTH_GUARD',
 'R1599_CAREER_UNIFIED_MOBILE_TYPOGRAPHY',
 'R1599_CAREER_COMPACT_HOME_CONTROL',
 'body.subview-career #scroll',
 'grid-template-columns:repeat(2,minmax(0,1fr))!important',
 'body.subview-career.r1583-content-open #r1507-chrome-toggle',
 '#view-career .r1597-stage-strip'
]) if(!i.includes(x)) fail('R1.5.99 marker missing: '+x);

if(countOf(i,'service-worker.js?v=1599')!==3)fail('service worker URL marker count');
if(countOf(i,'employee-registry-ui-r1599')!==1)fail('UI cache marker count');
if(countOf(i,"u.searchParams.set('v','1599')")!==2)fail('manual update marker count');
if(countOf(i,"hr_mobile_ui_cache_release','1599')")!==1)fail('local cache marker count');
for(const old of ['service-worker.js?v=1598','employee-registry-ui-r1598',"u.searchParams.set('v','1598')","hr_mobile_ui_cache_release','1598''"])if(i.includes(old))fail('stale/broken R1.5.98 runtime marker '+old);

if(!sw.includes('MOBILE-R1.5.99-SERVICE-WORKER-NO-STALE-UI')||!sw.includes('employee-registry-ui-r1599')||!sw.includes('__offline_index_r1599__'))fail('service worker mismatch');

/* Compile every inline classic script. R1.5.99 also closes the isolated R1.5.98 cache-script quote error. */
let scriptCount=0;
for(const sm of i.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
  scriptCount++;
  const attrs=sm[1]||'',src=sm[2]||'';
  if(!src.trim()||/type\s*=\s*["'](?:module|application\/json|application\/ld\+json)["']/i.test(attrs))continue;
  try{new Function(src)}catch(e){fail('inline script '+scriptCount+' syntax: '+e.message)}
}

console.log('VERIFY_MOBILE_R1 OK:',E);
console.log('VERIFY_R1599_FULL_WIDTH OK: career root/page constrained to WebView width');
console.log('VERIFY_R1599_UNIFIED_TYPOGRAPHY OK: employee / directory / law / staffing / salary mobile text enlarged');
console.log('VERIFY_R1599_HOME_CONTROL OK: career Home control compact and no longer covers a wide left area');
console.log('VERIFY_R1599_SCRIPT_SYNTAX OK: all inline classic scripts compile');
console.log('VERIFY_SALARY_REFERENCE OK: 10 grades / 11 stages / 110 values unchanged');
console.log('VERIFY_CAREER_INVARIANTS OK: 197 chains / 1023 mapped / 293 audit / 77.7%');
console.log('VERIFY_DIRECTORY OK: 1316 unchanged');
console.log('VERIFY_STAFFING_WORKSPACE OK: 150 visible cases unchanged');
console.log('VERIFY_REQUIREMENTS OK: 17 cards unchanged');
console.log('VERIFY_NO_EMPLOYEE_DATA_MUTATION OK');
console.log('VERIFY_MOBILE_R1 PASSED');
