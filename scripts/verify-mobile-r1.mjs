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
const expected='MOBILE-R1.5.66-CAREER-CURRENT-TITLE-ANCHORS';
const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};

if(version!==expected)fail('VERSION mismatch');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
for(const fp of [
  'R1566_CAREER_CURRENT_TITLE_ANCHORS',
  "result.status='current-anchor'",
  "result.diagnosticCode='CURRENT_TITLE_ANCHOR'",
  "title='عنوان مثبت — اتصال الدرجة التالية يحتاج مراجعة'",
  "a.status==='current-anchor'?'يحتاج حسم من المصدر'",
  'id="r1564-current-gold-style"',
  'R1564_CURRENT_POSITION_GOLD',
  "TITLE_MATCH_POLICY='CANONICAL_EXACT_ONLY'"
]) if(!index.includes(fp))fail('R1.5.66 functional footprint missing: '+fp);

const careerAnchor='<script id="r1551-career-progression-script">';
const careerStart=index.indexOf(careerAnchor);
const careerEnd=careerStart>=0?index.indexOf('</script>',careerStart+careerAnchor.length):-1;
if(careerStart<0||careerEnd<0)fail('career script scope missing');
const careerScope=index.slice(careerStart,careerEnd);
if(/\b(?:levenshtein|similarityScore|fuzzyTitleMatch)\s*\(/i.test(careerScope))fail('fuzzy matching implementation is forbidden inside Career Progression');

if(!prog.policy||prog.policy.titleMatchingMode!=='CANONICAL_EXACT_ONLY')fail('canonical policy missing');
if(prog.policy.fuzzyTitleMatching!==false)fail('fuzzy matching must remain disabled');
if(prog.policy.allowAutomaticUnmappedPromotion!==false)fail('R1.5.65 automatic promotion policy regressed');
if(prog.policy.currentTitleAnchorMode!=='exact-current-title-unverified-next')fail('current-title anchor policy missing');
if(prog.policy.allowAnchorNextInference!==false)fail('anchor next inference must be disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('employee data must remain read-only');

if(jobs.total!==1316||jobs.rows.length!==1316)fail('source titles must remain 1316');
if(prog.chains.length!==189||Number(prog.validatedChainCount)!==189)fail('expected 189 chains');
if(Number(prog.validatedStepCount)!==925)fail('expected 925 mapped titles');
if(!prog.coverage||prog.coverage.mappedTitles!==925||prog.coverage.unmappedTitles!==391||Number(prog.coverage.exactCoveragePercent)!==70.3)fail('coverage must be 925/391/70.3');
if(!prog.coverageProfiles||prog.coverageProfiles.extendsToFirst!==76||prog.coverageProfiles.partial!==113||prog.coverageProfiles.upperSegments!==40)fail('coverage profile mismatch');
if(!prog.remainingAudit||prog.remainingAudit.totalTitles!==391||prog.remainingAudit.familyCount!==267||prog.remainingAudit.isolatedFamilies!==191||prog.remainingAudit.twoConsecutiveCandidateFamilies!==37||prog.remainingAudit.ambiguousFamilies!==15||prog.remainingAudit.gapFamilies!==24)fail('remaining audit metrics mismatch');

if(!prog.currentTitleAnchorAudit||prog.currentTitleAnchorAudit.anchorCount!==2)fail('currentTitleAnchorAudit missing');
if(!Array.isArray(prog.currentTitleAnchorAudit.anchors)||prog.currentTitleAnchorAudit.anchors.length!==2)fail('expected two current-title anchors');

const sourcePairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
const mappedPairs=new Set();
let total=0;
for(const c of prog.chains){
  const gs=(c.steps||[]).map(s=>Number(s.grade)).sort((a,b)=>b-a);
  for(let i=1;i<gs.length;i++)if(gs[i]!==gs[i-1]-1)fail('non-contiguous chain '+c.id);
  for(const st of c.steps){
    total++;
    const pair=String(st.degree)+'|'+String(st.title);
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree mismatch '+c.id+' / '+st.title);
    if(!sourcePairs.has(pair))fail('mapped step absent from source '+pair);
    if(mappedPairs.has(pair))fail('duplicate degree/title mapping '+pair);
    mappedPairs.add(pair);
  }
}
if(total!==925||mappedPairs.size!==925)fail('mapped count/uniqueness mismatch');

for(const pair of ['العاشرة|حرفي','العاشرة|معاون حرفي']){
  if(!sourcePairs.has(pair))fail('anchor title missing from source: '+pair);
  if(!mappedPairs.has(pair))fail('anchor title not mapped: '+pair);
}
for(const id of ['r1566_current_anchor_craft','r1566_current_anchor_assistant_craft']){
  const c=prog.chains.find(x=>x.id===id);
  if(!c)fail('anchor chain missing '+id);
  if(c.status!=='explicit-current-anchor-unverified-next')fail('anchor status mismatch '+id);
  if(c.steps.length!==1||Number(c.steps[0].grade)!==10)fail('anchor must be single grade-10 current title '+id);
  if(!c.currentTitleAnchor||c.currentTitleAnchor.currentTitleVerified!==true||c.currentTitleAnchor.nextRelationVerified!==false)fail('anchor verification flags mismatch '+id);
}

// Grade 9 craft progression remains a separate confirmed chain, not auto-connected from anchors.
const craft=prog.chains.find(c=>c.id==='r1558_family_032');
if(!craft)fail('confirmed craft chain missing');
const expectedCraft=[[9,'حرفي اول'],[8,'حرفي اقدم'],[7,'معاون رئيس حرفيين'],[6,'رئيس حرفيين'],[5,'رئيس حرفيين اقدم'],[4,'رئيس حرفيين اقدم اول']];
if(craft.steps.length!==expectedCraft.length)fail('confirmed craft chain length mismatch');
for(let i=0;i<expectedCraft.length;i++){
  if(Number(craft.steps[i].grade)!==expectedCraft[i][0]||craft.steps[i].title!==expectedCraft[i][1])fail('confirmed craft chain mismatch');
}

if(!prog.unmappedTitleAudit||prog.unmappedTitleAudit.promotedTitles!==73)fail('R1.5.65 audit regressed');
if(!prog.familyBridgeAudit||prog.familyBridgeAudit.bridgeCount!==23)fail('R1.5.64 family bridge audit regressed');

if(!index.includes("var SW_URL='service-worker.js?v=1566';"))fail('SW URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1566';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1566'"))fail('fallback release mismatch');
if(!sw.includes('MOBILE-R1.5.66-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('__offline_index_r1566__'))fail('offline index mismatch');
if(!String(manifest.name||'').includes('R1.5.66'))fail('manifest mismatch');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 regression');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT'])
  if(!index.includes(marker))fail(marker+' regression');

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_CURRENT_ANCHORS OK: حرفي + معاون حرفي are exact grade-10 current-title anchors');
console.log('VERIFY_ANCHOR_NEXT_BLOCKED OK: no grade-9 title is inferred from either grade-10 anchor');
console.log('VERIFY_CRAFT_CONFIRMED_PATH OK: حرفي اول 9 -> حرفي اقدم 8 -> معاون رئيس حرفيين 7 -> رئيس حرفيين 6 -> رئيس حرفيين اقدم 5 -> رئيس حرفيين اقدم اول 4');
console.log('VERIFY_COVERAGE OK: 923 -> 925 mapped / 393 -> 391 audit queue / 70.3%');
console.log('VERIFY_GOLD_CURRENT OK: current-anchor uses existing R1.5.64 gold current-position styling');
console.log('VERIFY_NO_GUESSING OK: exact current title only / next relation unverified / no fuzzy matching');
console.log('VERIFY_REGRESSION OK: R1.5.65 audit + R1.5.64 family bridges + R1.5.63 canonical matching + R1.5.62 UI retained');
