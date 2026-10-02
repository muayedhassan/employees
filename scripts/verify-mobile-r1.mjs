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
const expected='MOBILE-R1.5.64-CAREER-FAMILY-BRIDGE-AUDIT';
const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};

if(version!==expected)fail('VERSION mismatch');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
for(const footprint of ['id="r1564-current-gold-style"','R1564_CURRENT_POSITION_GOLD','--career-gold','.r1560-line.current .r1560-node','.r1560-line.current .r1560-linetitle','.r1562-now b'])
  if(!index.includes(footprint))fail('gold current-position footprint missing: '+footprint);

for(const footprint of ['function canonTitle(',"TITLE_MATCH_POLICY='CANONICAL_EXACT_ONLY'","result.status='directory-only'","result.status='not-in-directory'","result.status='grade-mismatch'",'#view-career .r1562-stage','#view-career .r1562-profile','#view-career .r1562-path','المشهد الحالي','خطوة تالية صريحة'])
  if(!index.includes(footprint))fail('prior functional footprint missing: '+footprint);

if(!index.includes("smartSearch(state.q,arr)"))fail('smartSearch regressed');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('explicit-only policy regressed');
if(!index.includes("result.status='ambiguous'"))fail('ambiguity handling missing');

const careerAnchor='<script id="r1551-career-progression-script">';
const careerStart=index.indexOf(careerAnchor);
const careerEnd=careerStart>=0?index.indexOf('</script>',careerStart+careerAnchor.length):-1;
if(careerStart<0||careerEnd<0)fail('career script scope missing');
const careerScope=index.slice(careerStart,careerEnd);
if(/\b(?:levenshtein|similarityScore|fuzzyTitleMatch)\s*\(/i.test(careerScope))fail('fuzzy title matching implementation is forbidden inside Career Progression');

if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must remain disabled');
if(prog.policy.titleMatchingMode!=='CANONICAL_EXACT_ONLY')fail('canonical title matching policy missing');
if(prog.policy.fuzzyTitleMatching!==false)fail('fuzzy title matching must remain disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('employee data must remain read-only');
if(prog.policy.educationMappingSourceAvailable!==false)fail('education policy changed');
if(prog.policy.familyBridgeMode!=='manual-audited-adjacent-only')fail('family bridge policy mismatch');
if(prog.policy.allowAutomaticFamilyBridgeInference!==false)fail('automatic family bridge inference must remain disabled');

if(jobs.total!==1316||jobs.rows.length!==1316)fail('source titles must remain 1316');
if(prog.chains.length!==174||Number(prog.validatedChainCount)!==174)fail('expected 174 chains after bridge audit');
if(Number(prog.validatedStepCount)!==850)fail('mapped title count must remain 850');
if(!prog.coverage||prog.coverage.mappedTitles!==850||prog.coverage.unmappedTitles!==466)fail('coverage must remain 850/466');
if(!prog.familyBridgeAudit||prog.familyBridgeAudit.bridgeCount!==23)fail('expected 23 audited bridges');
if(!Array.isArray(prog.familyBridgeAudit.bridges)||prog.familyBridgeAudit.bridges.length!==23)fail('bridge audit list must contain 23 bridges');
if(!Array.isArray(prog.familyBridgeAudit.blockedCandidates)||prog.familyBridgeAudit.blockedCandidates.length!==3)fail('blocked bridge review must contain 3 cases');

const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
let steps=0,extendsToFirst=0,partial=0,upperSegments=0;
for(const c of prog.chains){
  const gs=(c.steps||[]).map(s=>Number(s.grade));
  if(!gs.length)fail('empty chain '+c.id);
  for(const st of c.steps){
    steps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree mismatch '+c.id+' / '+st.title);
    if(!pairs.has(String(st.degree)+'|'+String(st.title)))fail('source step mismatch '+c.id+' / '+st.title);
  }
  const start=Math.max(...gs),end=Math.min(...gs);
  if(end===1)extendsToFirst++;else partial++;
  if(start<=4)upperSegments++;
  const sorted=[...gs].sort((a,b)=>b-a);
  for(let i=1;i<sorted.length;i++)if(sorted[i]!==sorted[i-1]-1)fail('non-contiguous bridged chain '+c.id);
}
if(steps!==850)fail('step count changed');
if(extendsToFirst!==73||partial!==101||upperSegments!==43)fail('coverage profile mismatch after bridges');
if(!prog.coverageProfiles||prog.coverageProfiles.extendsToFirst!==73||prog.coverageProfiles.partial!==101||prog.coverageProfiles.upperSegments!==43)fail('stored coverage profile mismatch');

const bridgeKeys=new Set(prog.familyBridgeAudit.bridges.map(b=>b.key));
for(const key of ['medical_devices_tech','pilot','diver','artist','weather_forecaster','director','sports_trainer','technical_trainer','correspondent','guide','surveyor','proofreader','designer','software_designer','dresser','commentator','technical_engineer','librarian','materials_examiner','lab_analyst','air_transport_controller','radiographer','physical_therapy'])
  if(!bridgeKeys.has(key))fail('missing audited bridge '+key);

const survey=prog.chains.find(c=>c.id==='r1558_family_128');
if(!survey)fail('merged survey chain missing');
const surveyExpected=[[8,'معاون مساح'],[7,'مساح'],[6,'مساح اقدم'],[5,'معاون رئيس مساحين'],[4,'رئيس مساحين'],[3,'رئيس مساحين اقدم'],[2,'رئيس مساحين اقدم اول']];
if(survey.steps.length!==surveyExpected.length)fail('survey bridge step count mismatch');
for(let i=0;i<surveyExpected.length;i++){
  if(Number(survey.steps[i].grade)!==surveyExpected[i][0]||survey.steps[i].title!==surveyExpected[i][1])fail('survey bridge mismatch at index '+i);
}
if(prog.chains.some(c=>c.id==='r1558_family_059'))fail('old survey upper segment should have been merged');

if(!prog.chains.some(c=>c.id==='r1558_family_092'))fail('رسام segment must remain separate');
if(!prog.chains.some(c=>c.id==='r1558_family_093'))fail('رسام هندسي segment must remain separate');
if(!prog.chains.some(c=>c.id==='r1558_family_034'))fail('رسامين upper segment must remain separate');
if(!prog.chains.some(c=>c.id==='audit_accounts'))fail('audit accounts lower segment must remain separate');
if(!prog.chains.some(c=>c.id==='r1558_family_084'))fail('audit management segment must remain separate');

if(!index.includes("var SW_URL='service-worker.js?v=1564';"))fail('SW URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1564';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1564'"))fail('fallback release mismatch');
if(!sw.includes('MOBILE-R1.5.64-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('__offline_index_r1564__'))fail('offline index mismatch');
if(!String(manifest.name||'').includes('R1.5.64'))fail('manifest mismatch');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 regression');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT'])
  if(!index.includes(marker))fail(marker+' regression');

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_FAMILY_BRIDGES OK: 23 manually audited adjacent-family bridges / 197 -> 174 chains / 850 exact steps unchanged');
console.log('VERIFY_SURVEY_CHAIN OK: معاون مساح -> مساح -> مساح اقدم -> معاون رئيس مساحين -> رئيس مساحين -> رئيس مساحين اقدم -> رئيس مساحين اقدم اول');
console.log('VERIFY_BLOCKED_BRIDGES OK: ambiguous or role-shift cases remain separate; no automatic choice was made');
console.log('VERIFY_CURRENT_GOLD OK: current grade number + current title + current-position summary receive gold emphasis');
console.log('VERIFY_NO_GUESSING OK: no new title / no fuzzy matching / no automatic family bridge inference');
console.log('VERIFY_CAREER_MAP OK: 174 chains / 850 mapped / 466 audit queue / 1316 source titles');
console.log('VERIFY_REGRESSION OK: R1.5.63 canonical matching + R1.5.62 UI + administrative markers retained');
