#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){console.error('VERIFY_MOBILE_R1 FAIL:',msg);process.exit(1)}
function read(p){try{return fs.readFileSync(p,'utf8')}catch(e){fail('missing '+p)}}
function canon(s){return String(s||'').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').replace(/\u00A0/g,' ').replace(/[\u064B-\u065F\u0670]/g,'').replace(/\u0640/g,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/\s+/g,' ').trim().toLowerCase()}

const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));
const sw=read('service-worker.js');
const version=read('VERSION.txt').trim();
const jobs=JSON.parse(read('assets/job-titles.json'));
const prog=JSON.parse(read('assets/job-title-progression.json'));
const expected='MOBILE-R1.5.65-CAREER-UNMAPPED-TITLES-AUDIT';
const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};

if(version!==expected)fail('VERSION mismatch');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1565_CAREER_UNMAPPED_TITLES_AUDIT'))fail('R1.5.65 release marker missing');

for(const footprint of [
  'id="r1564-current-gold-style"',
  'R1564_CURRENT_POSITION_GOLD',
  'function canonTitle(',
  "TITLE_MATCH_POLICY='CANONICAL_EXACT_ONLY'",
  "result.status='directory-only'",
  "result.status='not-in-directory'",
  '#view-career .r1562-stage',
  '#view-career .r1562-profile',
  '#view-career .r1562-path'
]) if(!index.includes(footprint))fail('prior functional footprint missing: '+footprint);

const careerAnchor='<script id="r1551-career-progression-script">';
const careerStart=index.indexOf(careerAnchor);
const careerEnd=careerStart>=0?index.indexOf('</script>',careerStart+careerAnchor.length):-1;
if(careerStart<0||careerEnd<0)fail('career script scope missing');
const careerScope=index.slice(careerStart,careerEnd);
if(/\b(?:levenshtein|similarityScore|fuzzyTitleMatch)\s*\(/i.test(careerScope))fail('fuzzy matching implementation is forbidden inside Career Progression');

if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must remain disabled');
if(prog.policy.titleMatchingMode!=='CANONICAL_EXACT_ONLY')fail('canonical title matching policy missing');
if(prog.policy.fuzzyTitleMatching!==false)fail('fuzzy matching must remain disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('employee data must remain read-only');
if(prog.policy.familyBridgeMode!=='manual-audited-adjacent-only')fail('R1.5.64 family bridge policy regressed');
if(prog.policy.allowAutomaticFamilyBridgeInference!==false)fail('automatic family bridge inference must remain disabled');
if(prog.policy.unmappedPromotionMode!=='manual-audited-exact-consecutive-only')fail('R1.5.65 promotion policy missing');
if(prog.policy.allowAutomaticUnmappedPromotion!==false)fail('automatic unmapped promotion must remain disabled');

if(jobs.total!==1316||jobs.rows.length!==1316)fail('source titles must remain 1316');
if(prog.chains.length!==187||Number(prog.validatedChainCount)!==187)fail('expected 187 chains after R1.5.65');
if(Number(prog.validatedStepCount)!==923)fail('expected 923 mapped titles after R1.5.65');
if(!prog.coverage||prog.coverage.mappedTitles!==923||prog.coverage.unmappedTitles!==393||Number(prog.coverage.exactCoveragePercent)!==70.1)fail('coverage must be 923/393/70.1%');

if(!prog.unmappedTitleAudit)fail('unmappedTitleAudit missing');
const audit=prog.unmappedTitleAudit;
if(audit.previousUnmappedTitles!==466||audit.promotedTitles!==73||audit.promotedByExtension!==32||audit.promotedByNewSegments!==41||audit.extendedChainCount!==17||audit.newSegmentCount!==13||audit.mappedTitlesAfter!==923||audit.remainingTitlesAfter!==393)fail('R1.5.65 audit totals mismatch');
if(!Array.isArray(audit.promoted)||audit.promoted.length!==73)fail('promoted audit list must contain 73 titles');
if(!Array.isArray(audit.blockedExamples)||audit.blockedExamples.length!==6)fail('blocked examples list mismatch');

if(!prog.remainingAudit||prog.remainingAudit.totalTitles!==393||prog.remainingAudit.familyCount!==268||prog.remainingAudit.isolatedFamilies!==191||prog.remainingAudit.twoConsecutiveCandidateFamilies!==37||prog.remainingAudit.ambiguousFamilies!==16||prog.remainingAudit.gapFamilies!==24)fail('remaining audit statistics mismatch');

if(!prog.coverageProfiles||prog.coverageProfiles.extendsToFirst!==76||prog.coverageProfiles.partial!==111||prog.coverageProfiles.upperSegments!==40)fail('coverage profile mismatch');

const sourcePairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
const mapPairs=new Set();
const canonSeen=new Map();
let totalSteps=0;
for(const c of prog.chains){
  const gs=(c.steps||[]).map(s=>Number(s.grade)).sort((a,b)=>b-a);
  if(!gs.length)fail('empty chain '+c.id);
  for(let i=1;i<gs.length;i++)if(gs[i]!==gs[i-1]-1)fail('non-contiguous chain '+c.id);
  for(const st of c.steps){
    totalSteps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree mismatch '+c.id+' / '+st.title);
    const pair=String(st.degree)+'|'+String(st.title);
    if(!sourcePairs.has(pair))fail('mapped step absent from source directory '+c.id+' / '+st.title);
    if(mapPairs.has(pair))fail('duplicate mapped degree/title pair '+pair);
    mapPairs.add(pair);
    const ck=canon(st.title);
    if(!canonSeen.has(ck))canonSeen.set(ck,[]);
    canonSeen.get(ck).push({chain:c.id,grade:Number(st.grade),title:st.title});
  }
}
if(totalSteps!==923||mapPairs.size!==923)fail('mapped step uniqueness/count mismatch');

// Every promoted title must now be in the map and source.
for(const p of audit.promoted){
  if(!mapPairs.has(String(p.degree)+'|'+String(p.title)))fail('promoted title not active: '+p.title);
  if(!sourcePairs.has(String(p.degree)+'|'+String(p.title)))fail('promoted title missing from source: '+p.title);
}

// Craft case: 9->4 active, grade 10 intentionally blocked.
const craft=prog.chains.find(c=>c.id==='r1558_family_032');
if(!craft)fail('craft chain missing');
const craftExpected=[[9,'حرفي اول'],[8,'حرفي اقدم'],[7,'معاون رئيس حرفيين'],[6,'رئيس حرفيين'],[5,'رئيس حرفيين اقدم'],[4,'رئيس حرفيين اقدم اول']];
if(craft.steps.length!==craftExpected.length)fail('craft chain length mismatch');
for(let i=0;i<craftExpected.length;i++){
  if(Number(craft.steps[i].grade)!==craftExpected[i][0]||craft.steps[i].title!==craftExpected[i][1])fail('craft chain mismatch at index '+i);
}
if(mapPairs.has('العاشرة|حرفي')||mapPairs.has('العاشرة|معاون حرفي'))fail('ambiguous craft grade 10 must remain unmapped');
if(!sourcePairs.has('العاشرة|حرفي')||!sourcePairs.has('العاشرة|معاون حرفي'))fail('craft grade 10 source titles missing');

// New segments must exist exactly.
for(let i=1;i<=13;i++){
  const id='r1565_unmapped_'+String(i).padStart(3,'0');
  if(!prog.chains.some(c=>c.id===id))fail('new audited segment missing: '+id);
}

if(!index.includes("var SW_URL='service-worker.js?v=1565';"))fail('SW URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1565';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1565'"))fail('fallback release mismatch');
if(!sw.includes('MOBILE-R1.5.65-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('__offline_index_r1565__'))fail('offline index mismatch');
if(!String(manifest.name||'').includes('R1.5.65'))fail('manifest mismatch');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 regression');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT'])
  if(!index.includes(marker))fail(marker+' regression');

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_UNMAPPED_PROMOTION OK: 73 exact audited titles promoted (32 extensions + 41 steps in 13 new explicit segments)');
console.log('VERIFY_COVERAGE OK: 850 -> 923 mapped / 466 -> 393 audit queue / 70.1% exact directory coverage');
console.log('VERIFY_CRAFT_CHAIN OK: grade 9 through grade 4 active; grade 10 remains blocked because two exact titles exist');
console.log('VERIFY_BLOCKED_CASES OK: same-grade ambiguity remains outside active progression');
console.log('VERIFY_NO_GUESSING OK: no fuzzy matching / no gap crossing / no automatic unmapped promotion');
console.log('VERIFY_GOLD_STYLE OK: R1.5.64 current-position gold emphasis retained');
console.log('VERIFY_REGRESSION OK: R1.5.64 family bridges + R1.5.63 canonical matching + R1.5.62 UI + administrative markers retained');
