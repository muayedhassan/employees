#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1)}
function read(p){try{return fs.readFileSync(p,'utf8')}catch(e){fail('missing '+p)}}
const index=read('index.html');
const sw=read('service-worker.js');
const manifest=JSON.parse(read('manifest.webmanifest'));
const version=read('VERSION.txt').trim();
const prog=JSON.parse(read('assets/job-title-progression.json'));
const jobs=JSON.parse(read('assets/job-titles.json'));
const expected='MOBILE-R1.5.67-QUALIFICATION-REFERENCE-LAYER';

if(version!==expected)fail('VERSION mismatch');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
for(const fp of [
  'R1567_QUALIFICATION_REFERENCE_LAYER',
  'id="r1567-qualification-reference-style"',
  'function qualificationLookup(emp)',
  'function qualificationHTML(emp)',
  'المؤهل وبداية التعيين',
  'دليل بداية التعيين حسب المؤهل',
  'مرجع فقط',
  'لا يفترض التطبيق أنه المؤهل الذي تم التعيين بموجبه',
  'المؤهل يظهر كمرجع نظامي مستقل ولا يغيّر المسار تلقائيًا'
]) if(!index.includes(fp))fail('qualification UI footprint missing: '+fp);

if(!prog.qualificationReference)fail('qualificationReference missing');
const q=prog.qualificationReference;
if(q.mode!=='reference-only-no-progression-effect')fail('qualification reference mode mismatch');
if(q.currentEducationIsAppointmentEducation!==false||q.affectsCareerMatching!==false||q.affectsEmployeeGrade!==false||q.affectsEmployeeData!==false)fail('qualification reference must remain non-operative');
if(!Array.isArray(q.rules)||q.rules.length!==9)fail('expected 9 qualification reference rules');

const expectedRules=[
 ['no_certificate',10,1],['primary',10,4],['middle',9,1],['secondary',8,1],
 ['institute_2y',8,5],['bachelor_standard',7,1],['bachelor_5plus',6,1],
 ['master',6,3],['doctorate',5,3]
];
for(const [id,grade,rank] of expectedRules){
  const r=q.rules.find(x=>x.id===id);
  if(!r||Number(r.grade)!==grade||Number(r.rank)!==rank)fail('qualification rule mismatch: '+id);
}
if(!String(q.legalBasis||'').includes('قانون رواتب موظفي الدولة والقطاع العام رقم (22) لسنة 2008'))fail('legal basis missing');
if(!q.displayPolicy||!String(q.displayPolicy.bachelor||'').includes('لا يختار التطبيق')||!String(q.displayPolicy.diploma||'').includes('مشروطة'))fail('conditional display policy missing');

if(!prog.policy||prog.policy.qualificationReferenceMode!=='reference-only-no-progression-effect')fail('qualification reference policy missing');
if(prog.policy.allowQualificationToAlterCareerMatch!==false)fail('qualification must not alter career matching');

// Career map must be byte-logically unchanged in counts and policy behavior.
if(jobs.total!==1316||jobs.rows.length!==1316)fail('source directory count changed');
if(prog.chains.length!==189||Number(prog.validatedChainCount)!==189)fail('career chain count changed');
if(Number(prog.validatedStepCount)!==925)fail('mapped title count changed');
if(!prog.coverage||prog.coverage.mappedTitles!==925||prog.coverage.unmappedTitles!==391||Number(prog.coverage.exactCoveragePercent)!==70.3)fail('career coverage changed');
if(!prog.currentTitleAnchorAudit||prog.currentTitleAnchorAudit.anchorCount!==2)fail('R1.5.66 anchors regressed');
if(!prog.unmappedTitleAudit||prog.unmappedTitleAudit.promotedTitles!==73)fail('R1.5.65 audit regressed');
if(!prog.familyBridgeAudit||prog.familyBridgeAudit.bridgeCount!==23)fail('R1.5.64 bridges regressed');

for(const fp of [
  'id="r1564-current-gold-style"',
  "TITLE_MATCH_POLICY='CANONICAL_EXACT_ONLY'",
  "result.status='current-anchor'",
  "result.status='directory-only'",
  "result.status='grade-mismatch'"
]) if(!index.includes(fp))fail('prior career footprint missing: '+fp);

const careerAnchor='<script id="r1551-career-progression-script">';
const a=index.indexOf(careerAnchor),b=a>=0?index.indexOf('</script>',a+careerAnchor.length):-1;
if(a<0||b<0)fail('career script scope missing');
const careerScope=index.slice(a,b);
if(/\b(?:levenshtein|similarityScore|fuzzyTitleMatch)\s*\(/i.test(careerScope))fail('fuzzy matching implementation is forbidden inside Career Progression');

// Qualification helpers are display-only: no writeback and no call that changes analyze/matching.
const qStart=careerScope.indexOf('function qrefNorm(');
const qEnd=careerScope.indexOf('function employeeDetail(',qStart);
if(qStart<0||qEnd<0)fail('qualification helper scope missing');
const qScope=careerScope.slice(qStart,qEnd);
for(const forbidden of ['findTitleMatches(','analyze(','emp.grade=','emp.jobTitle=','emp.education=','state.map.chains.push'])
  if(qScope.includes(forbidden))fail('qualification helper contains operative career mutation/matching: '+forbidden);

if(!index.includes("var SW_URL='service-worker.js?v=1567';"))fail('SW URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1567';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1567'"))fail('fallback release mismatch');
if(!sw.includes('MOBILE-R1.5.67-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('__offline_index_r1567__'))fail('offline index mismatch');
if(!String(manifest.name||'').includes('R1.5.67'))fail('manifest mismatch');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 regression');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT'])
  if(!index.includes(marker))fail(marker+' regression');

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_QUALIFICATION_REFERENCE OK: 9 reference rows / legal basis present / reference-only mode');
console.log('VERIFY_QUALIFICATION_UI OK: compact employee reference card + collapsible full guide');
console.log('VERIFY_BACHELOR_CAUTION OK: no automatic 4-year vs 5-year selection');
console.log('VERIFY_DIPLOMA_CAUTION OK: diploma/institute reference remains conditional on type and duration');
console.log('VERIFY_NO_CAREER_EFFECT OK: qualification helpers do not call matching/analyze or mutate employee/career data');
console.log('VERIFY_CAREER_MAP OK: 189 chains / 925 mapped / 391 audit queue / 70.3% unchanged');
console.log('VERIFY_REGRESSION OK: R1.5.66 anchors + R1.5.65 audit + R1.5.64 gold style + prior administrative markers retained');
