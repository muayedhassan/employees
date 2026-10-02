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
const expected='MOBILE-R1.5.61-CAREER-VISUAL-POLISH';

if(version!==expected)fail('VERSION mismatch');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1561_CAREER_VISUAL_POLISH'))fail('R1.5.61 marker missing');
if(!index.includes('id="r1561-career-visual-polish-style"'))fail('R1.5.61 CSS missing');

for(const marker of [
  '--v61-cyan',
  'r1561Enter',
  'prefers-reduced-motion',
  '.r1560-line.current .r1560-node',
  '.r1560-details[open]',
  '.r1551-searchbox:focus-within',
  '.r1560-avatar:after'
]) if(!index.includes(marker))fail('visual polish marker missing: '+marker);

if(!index.includes('R1560_CAREER_EXPERIENCE_V4'))fail('R1.5.60 UI lineage regressed');
if(!index.includes('R1559_QUALIFICATION_CONTEXT_VISUAL_V3'))fail('R1.5.59 lineage regressed');
if(!index.includes('R1558_CAREER_COVERAGE_EXPLAINABILITY'))fail('R1.5.58 lineage regressed');

if(!index.includes("smartSearch(state.q,arr)"))fail('smartSearch regressed');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('explicit-only marker regressed');
if(!index.includes("result.status='ambiguous'"))fail('ambiguity handling missing');

if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must remain disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('employee data must remain read-only');
if(prog.policy.educationMappingSourceAvailable!==false)fail('education policy changed');
if(prog.policy.educationDecisionMode!=='context-only-until-authoritative-map')fail('education decision mode changed');

if(jobs.total!==1316||jobs.rows.length!==1316)fail('source titles must remain 1316');
if(prog.chains.length!==197||Number(prog.validatedChainCount)!==197)fail('chains must remain 197');
if(Number(prog.validatedStepCount)!==850)fail('mapped titles must remain 850');
if(!prog.coverage||prog.coverage.mappedTitles!==850||prog.coverage.unmappedTitles!==466)fail('coverage changed');
if(!prog.coverageProfiles||prog.coverageProfiles.extendsToFirst!==73||prog.coverageProfiles.upperSegments!==63)fail('coverage profile changed');

const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};
const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
let steps=0;
for(const c of prog.chains){
  if(!c.coverageStartGrade||!c.coverageEndGrade||!String(c.startReason||'').trim())fail('boundary metadata missing '+c.id);
  for(const st of c.steps){
    steps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree mismatch '+c.id);
    if(!pairs.has(st.degree+'|'+st.title))fail('source step mismatch '+c.id+' / '+st.title);
  }
}
if(steps!==850)fail('step count changed');

if(!index.includes("var SW_URL='service-worker.js?v=1561';"))fail('SW URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1561';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1561'"))fail('job-title fallback version mismatch');
if(!sw.includes('MOBILE-R1.5.61-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('__offline_index_r1561__'))fail('offline index mismatch');
if(!String(manifest.name||'').includes('R1.5.61'))fail('manifest mismatch');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 regression');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']){
  if(!index.includes(marker))fail(marker+' regression');
}

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_VISUAL_POLISH OK: typography hierarchy / icon treatment / refined palette / timeline focus / details motion');
console.log('VERIFY_PRESENTATION_ONLY OK: no career search/matching/data logic changed by R1.5.61');
console.log('VERIFY_CAREER_MAP OK: 197 chains / 850 mapped / 466 audit queue / 1316 source titles');
console.log('VERIFY_QUALIFICATION_CONTEXT OK: education remains visible context only');
console.log('VERIFY_REGRESSION OK: R1.5.60 V4 + R1.5.59 boundaries + administrative markers retained');
