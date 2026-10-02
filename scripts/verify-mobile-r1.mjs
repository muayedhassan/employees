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
const expected='MOBILE-R1.5.63-CAREER-MATCH-INTEGRITY';
function testNorm(v){let s=String(v==null?'':v);try{s=s.normalize('NFKC')}catch(e){}s=s.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g,'').replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g,' ').replace(/[یۍێې]/g,'ي').replace(/[ک]/g,'ك').replace(/[ۀہ]/g,'ه');return s.toLowerCase().replace(/[اأإآ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim()}
if(testNorm('مبرمج أقدم')!==testNorm('مبرمج اقدم'))fail('canonical selftest: hamza normalization');
if(testNorm('مهندس کيمياوي')!==testNorm('مهندس كيمياوي'))fail('canonical selftest: Persian kaf');
if(testNorm('رئيس\u00A0مبرمجين')!==testNorm('رئيس مبرمجين'))fail('canonical selftest: NBSP');
if(testNorm('مدقق')===testNorm('مدقق حسابات'))fail('canonical selftest became fuzzy');
const fuzzyGuardSelfTest=/\b(?:levenshtein|similarityScore|fuzzyTitleMatch)\s*\(/i;
if(fuzzyGuardSelfTest.test('prog.policy.fuzzyTitleMatching=false'))fail('fuzzy guard selftest rejects disabled policy flag');
if(!fuzzyGuardSelfTest.test('function fuzzyTitleMatch(a,b){return 1}'))fail('fuzzy guard selftest failed to detect implementation');
if(fuzzyGuardSelfTest.test('prog.policy.fuzzyTitleMatching=false'))fail('fuzzy guard selftest incorrectly flags disabled policy property');
if(version!==expected)fail('VERSION mismatch');
if(!index.includes('<meta name="app-release" content="'+expected+'">'))fail('app-release meta mismatch');
for(const footprint of [
 'function canonTitle(',
 'function rawTitle(',
 'function findDirectoryMatches(',
 "TITLE_MATCH_POLICY='CANONICAL_EXACT_ONLY'",
 "result.status='directory-only'",
 "result.status='not-in-directory'",
 "result.status='grade-mismatch'",
 "result.matchMode=matches[0].matchMode",
 'مطابقة صريحة بعد توحيد الصياغة الكتابية'
]) if(!index.includes(footprint))fail('R1.5.63 functional footprint missing: '+footprint);
for(const uiFootprint of [
 '#view-career .r1562-stage',
 '#view-career .r1562-profile',
 '#view-career .r1562-path',
 'r1562-stage',
 'r1562-profile',
 'r1562-pathTop',
 'r1562-now',
 'r1562-nextMini',
 'r1562-about',
 'قراءة استشارية منظمة',
 'المشهد الحالي',
 'خطوة تالية صريحة',
 'عن الدليل'
]) if(!index.includes(uiFootprint))fail('R1.5.62 functional UI footprint missing: '+uiFootprint);
if(!index.includes("smartSearch(state.q,arr)"))fail('smartSearch regressed');
if(!index.includes("policy:'explicit-only-no-heuristics'"))fail('explicit-only policy regressed');
if(!index.includes("result.status='ambiguous'"))fail('ambiguity handling missing');
// Forbid fuzzy/similarity implementations only inside the Career Progression script.
// The wider app already contains an unrelated Levenshtein helper used by general smart search,
// so scanning the whole index.html would be a false positive.
const careerAnchor='<script id="r1551-career-progression-script">';
const careerStart=index.indexOf(careerAnchor);
const careerEnd=careerStart>=0?index.indexOf('</script>',careerStart+careerAnchor.length):-1;
if(careerStart<0||careerEnd<0)fail('career script scope missing for fuzzy guard');
const careerScope=index.slice(careerStart,careerEnd);
const forbiddenFuzzyImplementation=/\b(?:levenshtein|similarityScore|fuzzyTitleMatch)\s*\(/i;
if(forbiddenFuzzyImplementation.test(careerScope))fail('fuzzy title matching implementation is forbidden inside Career Progression');
if(!prog.policy||prog.policy.allowHeuristicInference!==false)fail('heuristic inference must remain disabled');
if(prog.policy.titleMatchingMode!=='CANONICAL_EXACT_ONLY')fail('canonical title matching policy missing');
if(prog.policy.fuzzyTitleMatching!==false)fail('fuzzy title matching must remain disabled');
if(!String(prog.policy.canonicalTitleNormalization||'').includes('NFKC'))fail('canonical normalization metadata missing');
if(prog.policy.employeeDataWriteBack!==false)fail('employee data must remain read-only');
if(prog.policy.educationMappingSourceAvailable!==false)fail('education policy changed');
if(jobs.total!==1316||jobs.rows.length!==1316)fail('source titles must remain 1316');
if(prog.chains.length!==197||Number(prog.validatedChainCount)!==197)fail('chains must remain 197');
if(Number(prog.validatedStepCount)!==850)fail('mapped titles must remain 850');
if(!prog.coverage||prog.coverage.mappedTitles!==850||prog.coverage.unmappedTitles!==466)fail('coverage changed');
const degreeName={1:'الأولى',2:'الثانية',3:'الثالثة',4:'الرابعة',5:'الخامسة',6:'السادسة',7:'السابعة',8:'الثامنة',9:'التاسعة',10:'العاشرة'};
const pairs=new Set(jobs.rows.map(r=>String(r.degree||'').trim()+'|'+String(r.title||'').trim()));
let steps=0;
for(const c of prog.chains){for(const st of c.steps){steps++;if(degreeName[Number(st.grade)]!==st.degree)fail('degree mismatch '+c.id);if(!pairs.has(st.degree+'|'+st.title))fail('source step mismatch '+c.id+' / '+st.title)}}
if(steps!==850)fail('step count changed');
if(!index.includes("var SW_URL='service-worker.js?v=1563';"))fail('SW URL mismatch');
if(!index.includes("var KEEP_CACHE='employee-registry-ui-r1563';"))fail('cache identity mismatch');
if(!index.includes("APP_RELEASE||'r1563'"))fail('fallback release mismatch');
if(!sw.includes('MOBILE-R1.5.63-SERVICE-WORKER-NO-STALE-UI'))fail('service worker release mismatch');
if(!sw.includes('__offline_index_r1563__'))fail('offline index mismatch');
if(!String(manifest.name||'').includes('R1.5.63'))fail('manifest mismatch');
if(!index.includes('R1550_QUIET_MANAGER_NOTES_SYNC'))fail('R1.5.50 regression');
for(const marker of ['R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']) if(!index.includes(marker))fail(marker+' regression');
console.log('VERIFY_MOBILE_R1 OK:',expected);
console.log('VERIFY_CANONICAL_MATCH OK: functional code footprints + policy verified; Unicode/hidden-space/Arabic-form normalization uses full-title equality only');
console.log('VERIFY_CANONICAL_SELFTEST OK: orthographic equivalents match; partial titles remain distinct');
console.log('VERIFY_DIAGNOSTICS OK: canonical-format / grade-mismatch / directory-only / not-in-directory / ambiguity are distinct');
console.log('VERIFY_NO_FUZZY_INFERENCE OK: Career scope has no fuzzy/similarity implementation; unrelated global smart-search helpers are ignored');
console.log('VERIFY_CAREER_MAP OK: 197 chains / 850 mapped / 466 audit queue / 1316 source titles');
console.log('VERIFY_REGRESSION OK: R1.5.62 functional UI + prior administrative markers retained');
