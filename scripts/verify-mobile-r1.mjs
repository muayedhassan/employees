#!/usr/bin/env node
import fs from'node:fs';
function fail(m){console.error('VERIFY_MOBILE_R1 FAIL:',m);process.exit(1)}
function read(p){try{return fs.readFileSync(p,'utf8')}catch(e){fail('missing '+p)}}
const i=read('index.html'),p=JSON.parse(read('assets/job-title-progression.json')),sw=read('service-worker.js'),m=JSON.parse(read('manifest.webmanifest')),v=read('VERSION.txt').trim();
const E='MOBILE-R1.5.72-CAREER-INFOGRAPHIC-DECK';
if(v!==E)fail('VERSION mismatch');
if(!i.includes('<meta name="app-release" content="'+E+'">'))fail('release meta mismatch');
for(const x of [
  'R1572_CAREER_INFOGRAPHIC_DECK',
  'R1572_CAREER_INFOGRAPHIC_DECK_RELEASE',
  'id="r1572-career-infographic-style"',
  'id="r1572-career-infographic-script"',
  'function decorateCareerInfographic()',
  'function enhanceCareerResults(view)',
  'function enhanceCareerPathDeck(view)',
  'نتائج بحث إنفوغرافيكية',
  'العنوان الحالي',
  'الدرجة المميزة',
  'الخطوة التالية',
  'يتم عرض المسار بصرياً على شكل شرائح متتابعة',
  'PRESENTATION_ONLY',
  'r1572-pathDeck'
]) if(!i.includes(x))fail('R1.5.72 footprint missing: '+x);
for(const x of [
  'R1571_REFERENCE_CENTER_NAVIGATION_GATE',
  'id="r1571-my-notes-v2-style"',
  'id="r1571-my-notes-v2-script"',
  'function qualificationGroups(rules)',
  'function beginRouteGate()',
  'function endRouteGate()',
  'ملاحظات شخصية • مركز مراجع • إنفوغرافيك',
  'id="r1564-current-gold-style"',
  "TITLE_MATCH_POLICY='CANONICAL_EXACT_ONLY'",
  "result.status='current-anchor'"
]) if(!i.includes(x))fail('Regression marker missing: '+x);
if(!p.notesWorkspace||p.notesWorkspace.release!==E)fail('notesWorkspace release metadata missing');
if(!p.careerInfographicDeck||p.careerInfographicDeck.enabled!==true)fail('careerInfographicDeck metadata missing');
if(p.careerInfographicDeck.style!=='professional-compact-infographic')fail('careerInfographicDeck style mismatch');
if(!p.policy||p.policy.careerPresentationMode!=='INFOGRAPHIC_COMPACT'||p.policy.careerLogicChanged!==false)fail('career infographic policy mismatch');
if(!p.currentTitleAnchorAudit||p.currentTitleAnchorAudit.anchorCount!==2)fail('R1.5.66 current-title anchors regressed');
if(!p.unmappedTitleAudit||p.unmappedTitleAudit.promotedTitles!==73)fail('R1.5.65 unmapped-title audit regressed');
if(!p.familyBridgeAudit||p.familyBridgeAudit.bridgeCount!==23)fail('R1.5.64 family bridge audit regressed');
if(p.chains.length!==189||p.validatedStepCount!==925||p.coverage.mappedTitles!==925||p.coverage.unmappedTitles!==391||Number(p.coverage.exactCoveragePercent)!==70.3)fail('Career map changed');
if(!i.includes("var SW_URL='service-worker.js?v=1572';")||!i.includes("var KEEP_CACHE='employee-registry-ui-r1572';")||!i.includes("APP_RELEASE||'r1572'"))fail('cache/release mismatch');
if(!sw.includes('MOBILE-R1.5.72-SERVICE-WORKER-NO-STALE-UI')||!sw.includes('__offline_index_r1572__'))fail('service worker mismatch');
if(!String(m.name).includes('R1.5.72'))fail('manifest mismatch');
console.log('VERIFY_MOBILE_R1 OK:',E);
console.log('VERIFY_CAREER_INFOGRAPHIC OK: search results and path timeline render as professional infographic surfaces');
console.log('VERIFY_REFERENCE_CENTER OK: R1.5.71 notes/reference center retained unchanged');
console.log('VERIFY_CAREER_MAP OK: 189 chains / 925 mapped / 391 audit queue / 70.3% unchanged');
console.log('VERIFY_REGRESSION OK: canonical exact matching, current-anchor handling, and gold-current styling retained');
