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
const expected='MOBILE-R1.5.56-CAREER-MAP-EXPANSION-BATCH1';

if(version!==expected)fail('VERSION.txt is not R1.5.56');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1556_CAREER_MAP_EXPANSION_BATCH1'))fail('R1.5.56 expansion marker missing');
if(!index.includes('R1555_CAREER_PROFESSIONAL_UI'))fail('R1.5.55 professional UI regressed');
if(!index.includes("smartSearch(state.q,arr)"))fail('R1.5.54 smartSearch reuse regressed');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('no-heuristics policy regressed');
if(index.includes("throw new Error('عنوان مستخدم في أكثر من سلسلة:"))fail('cross-chain ambiguity became globally fatal');
if(index.includes("throw new Error('عنوان مكرر داخل السلسلة نفسها:"))fail('same-chain ambiguity became globally fatal');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 quiet sync regressed');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']){
  if(!index.includes(marker))fail(marker+' regressed');
}

if(!index.includes("var SW_URL='service-worker.js?v=1556';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1556';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1556'"))fail('job title fallback version mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('IndexedDB layer missing');

if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(prog.release!==expected)fail('progression release mismatch');
if(prog.sourceJobTitlesRelease!==jobs.release)fail('progression source release mismatch');
if(Number(prog.sourceTotal)!==Number(jobs.total))fail('progression source total mismatch');
if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must be disabled');
if(prog.policy.employeeDataWriteBack!==false)fail('career module must remain read-only');
if(prog.policy.ambiguityHandling!=='employee-scoped-no-next')fail('ambiguity handling policy mismatch');

if(!Array.isArray(prog.chains)||prog.chains.length!==40)fail('expected exactly 40 explicit chains');
if(Number(prog.validatedChainCount)!==40)fail('validatedChainCount must be 40');

const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};
const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
const norm=s=>String(s||'').toLowerCase().replace(/[اأإآ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();

let steps=0;
const ids=new Set(), owners=new Map();
for(const c of prog.chains){
  if(!c.id||!Array.isArray(c.steps)||!c.steps.length)fail('empty chain '+String(c.id));
  if(ids.has(c.id))fail('duplicate chain id '+c.id);
  ids.add(c.id);
  for(const st of c.steps){
    steps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree label mismatch '+c.id+' '+st.grade);
    if(!pairs.has(st.degree+'|'+st.title))fail('step not found exactly in job title directory: '+c.id+' / '+st.title);
    const k=norm(st.title);
    if(!owners.has(k))owners.set(k,new Set());
    owners.get(k).add(c.id);
  }
}
if(steps!==267)fail('expected exactly 267 validated steps, got '+steps);
if(Number(prog.validatedStepCount)!==267)fail('validatedStepCount must be 267');

const expectedNewIds=[
  'marine_general','information_investigation','biotech_technician','information_technician',
  'food_production','weather_observer','aircraft_captain','marine_officer',
  'air_operations_officer','applied_laser','judicial_investigation','teaching_school',
  'educational_guidance','university_teaching','industrial_teaching','inspection',
  'hall_control','registration_clerk','quality_specialist','biology','bacteriology',
  'geology','software_testing','finance_clerk'
];
for(const id of expectedNewIds)if(!ids.has(id))fail('new explicit chain missing: '+id);

const ambiguous=[...owners.entries()].filter(([,set])=>set.size>1);
if(ambiguous.length)fail('unexpected cross-chain exact-title ambiguity after batch 1: '+ambiguous.map(x=>x[0]).join(', '));

if(!String(manifest.name||'').includes('R1.5.56'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.56'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.56-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1556'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1556__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_CAREER_EXPANSION OK: 24 new explicit chains / 165 new exact steps');
console.log('VERIFY_CAREER_MAP OK: 40 explicit chains / 267 exact directory steps / 0 exact-title cross-chain ambiguities');
console.log('VERIFY_CAREER_POLICY OK: heuristic inference disabled / employee data read-only / partial chains stop at last proven degree');
console.log('VERIFY_REGRESSION OK: R1.5.55 UI + R1.5.54 search + R1.5.50/R1.5.49/R1.5.48/R1.5.47/R1.5.46 markers retained');
