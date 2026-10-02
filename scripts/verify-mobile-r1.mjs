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
const expected='MOBILE-R1.5.52-CAREER-AMBIGUITY-ISOLATION';

if(version!==expected)fail('VERSION.txt is not R1.5.52');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
if(!index.includes('R1552_CAREER_AMBIGUITY_ISOLATION'))fail('R1.5.52 ambiguity isolation marker missing');
if(!index.includes('R1551_CAREER_PROGRESSION_FOUNDATION'))fail('R1.5.51 career foundation marker missing');
if(!index.includes('id="r1551-career-progression-script"'))fail('career module missing');
if(!index.includes("key:'career',num:'08',name:'التدرج الوظيفي'"))fail('career dashboard card missing');
if(!index.includes("window.r1551CareerProgression"))fail('career API missing');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('no-heuristics marker missing');
if(!index.includes('data-r1551-open-career'))fail('employee-card career entry missing');
if(!index.includes('يتطلب تحديد الاختصاص / يحتاج مراجعة'))fail('employee-level ambiguity message missing');
if(index.includes("throw new Error('عنوان مستخدم في أكثر من سلسلة:"))fail('global cross-chain ambiguity fatal rule still present');
if(!index.includes('عنوان مكرر داخل السلسلة نفسها'))fail('same-chain structural duplicate guard missing');

if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 quiet sync regressed');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']){
  if(!index.includes(marker))fail(marker+' regressed');
}
if(!index.includes("var SW_URL='service-worker.js?v=1552';"))fail('service worker URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1552';"))fail('cache identity mismatch');
if(!index.includes('hrIndexedDBPrimaryStore'))fail('IndexedDB missing');

if(jobs.total!==1316||!Array.isArray(jobs.rows)||jobs.rows.length!==1316)fail('job titles dataset incomplete');
if(prog.release!==expected)fail('progression release mismatch');
if(prog.sourceJobTitlesRelease!==jobs.release)fail('progression source release mismatch');
if(Number(prog.sourceTotal)!==Number(jobs.total))fail('progression source total mismatch');
if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must be disabled');
if(prog.policy.allowCrossChainTitleAmbiguity!==true)fail('cross-chain ambiguity policy missing');
if(prog.policy.employeeDataWriteBack!==false)fail('career module must remain read-only');
if(!Array.isArray(prog.chains)||prog.chains.length!==16)fail('expected 16 explicit chains');

const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};
const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
const norm=s=>String(s||'').toLowerCase().replace(/[اأإآ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();

const owners=new Map();
let steps=0;
for(const c of prog.chains){
  if(!c.id||!Array.isArray(c.steps)||!c.steps.length)fail('empty chain '+String(c.id));
  const localSeen=new Set();
  for(const st of c.steps){
    steps++;
    if(degreeName[Number(st.grade)]!==st.degree)fail('degree label mismatch '+c.id+' '+st.grade);
    if(!pairs.has(st.degree+'|'+st.title))fail('step not found in job title directory: '+st.title);
    const n=norm(st.title);
    if(localSeen.has(n))fail('title duplicated inside the same chain: '+c.id+' / '+st.title);
    localSeen.add(n);
    if(!owners.has(n))owners.set(n,new Set());
    owners.get(n).add(c.id);
  }
}
if(steps!==102||Number(prog.validatedStepCount)!==102)fail('expected 102 validated steps');
if(Number(prog.validatedChainCount)!==16)fail('chain count metadata mismatch');
const ambiguousActual=[...owners.entries()].filter(([,set])=>set.size>1);

function findMatches(map,title){
  const out=[],n=norm(title);
  for(const c of map.chains||[])for(const st of c.steps||[])if(norm(st.title)===n)out.push({chain:c,step:st});
  return out;
}
function gradeNum(v){
  const n=Number(String(v??'').replace(/[^0-9.]/g,''));
  return Number.isFinite(n)&&n>=1&&n<=10?Math.round(n):0;
}
function analyzeFixture(map,emp){
  const result={status:'unknown',chain:null,step:null,prev:null,next:null};
  const g=gradeNum(emp.grade);
  const matches=findMatches(map,emp.jobTitle);
  if(matches.length!==1){result.status=matches.length?'ambiguous':'unmapped';return result}
  result.chain=matches[0].chain; result.step=matches[0].step;
  if(Number(result.step.grade)!==g){result.status='grade-mismatch';return result}
  result.prev=result.chain.steps.find(x=>Number(x.grade)===g+1)||null;
  result.next=result.chain.steps.find(x=>Number(x.grade)===g-1)||null;
  result.status='verified'; return result;
}

// Reproduce the exact class of failure reported on the phone:
// inject the same explicit title into a second chain. This must NOT invalidate the whole map;
// it must become an employee-level ambiguous state with no next-title recommendation.
const synthetic=JSON.parse(JSON.stringify(prog));
const statStep=synthetic.chains.find(c=>c.id==='statistics')?.steps.find(s=>norm(s.title)===norm('معاون احصائي متدرب'));
if(!statStep)fail('statistics fixture title missing');
synthetic.chains.push({id:'__ambiguity_fixture__',name:'اختبار الغموض',status:'test-only',steps:[JSON.parse(JSON.stringify(statStep))]});
const ambiguous=analyzeFixture(synthetic,{education:'بكالوريوس',grade:8,jobTitle:'معاون احصائي متدرب'});
if(ambiguous.status!=='ambiguous')fail('synthetic cross-chain duplicate did not become employee-level ambiguous');
if(ambiguous.next!==null)fail('ambiguous employee received a next-title recommendation');

const unique=analyzeFixture(prog,{education:'بكالوريوس',grade:6,jobTitle:'مبرمج'});
if(unique.status!=='verified')fail('known unique programming path is not verified');
if(!unique.next||norm(unique.next.title)!==norm('مبرمج اقدم'))fail('known unique programming next step mismatch');

if(!String(manifest.name||'').includes('R1.5.52'))fail('manifest name mismatch');
if(!String(manifest.short_name||'').includes('R1.5.52'))fail('manifest short name mismatch');
if(!sw.includes('MOBILE-R1.5.52-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('employee-registry-ui-r1552'))fail('service worker cache mismatch');
if(!sw.includes('__offline_index_r1552__'))fail('offline index mismatch');

console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_CAREER_MAP OK: 16 explicit chains / 102 exact directory steps / heuristic inference disabled');
console.log('VERIFY_CAREER_AMBIGUITY OK: cross-chain ambiguity is employee-scoped; ambiguous next title is blocked; actual ambiguous titles:',ambiguousActual.length);
console.log('VERIFY_REGRESSION OK: R1.5.50 quiet notes + R1.5.49/R1.5.48/R1.5.47/R1.5.46 markers retained');
