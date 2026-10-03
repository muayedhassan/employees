#!/usr/bin/env node
import fs from'node:fs';
function fail(m){console.error('VERIFY_MOBILE_R1 FAIL:',m);process.exit(1)}
function read(p){try{return fs.readFileSync(p,'utf8')}catch(e){fail('missing '+p)}}
const i=read('index.html'),p=JSON.parse(read('assets/job-title-progression.json')),sw=read('service-worker.js'),m=JSON.parse(read('manifest.webmanifest')),v=read('VERSION.txt').trim();
const E='MOBILE-R1.5.73-CAREER-INFOGRAPHIC-CSS-SAFE';
if(v!==E)fail('VERSION mismatch');
if(!i.includes('<meta name="app-release" content="'+E+'">'))fail('release meta mismatch');
for(const x of ['id="r1573-career-infographic-css"','R1573_CAREER_INFOGRAPHIC_CSS_SAFE','R1573_CAREER_INFOGRAPHIC_CSS_SAFE_RELEASE','#view-career .r1551-result','#view-career .r1560-line.current','#view-career .r1562-now:before'])if(!i.includes(x))fail('R1.5.73 CSS footprint missing: '+x);
if(i.includes('id="r1573-career-infographic-script"')||i.includes('R1573_CAREER_INFOGRAPHIC_SCRIPT'))fail('R1.5.73 must not add Career JavaScript');
const a=i.indexOf('<style id="r1573-career-infographic-css">'),b=i.indexOf('</style>',a),css=i.slice(a,b);
for(const bad of ['<script','MutationObserver','innerHTML','addEventListener','setTimeout','requestAnimationFrame'])if(css.includes(bad))fail('CSS-only block contains forbidden runtime token: '+bad);
for(const x of ['R1571_REFERENCE_CENTER_NAVIGATION_GATE','id="r1571-my-notes-v2-style"','id="r1571-my-notes-v2-script"','function qualificationGroups(rules)','function beginRouteGate()','function endRouteGate()','id="r1564-current-gold-style"',"TITLE_MATCH_POLICY='CANONICAL_EXACT_ONLY'","result.status='current-anchor'"])if(!i.includes(x))fail('Regression marker missing: '+x);
if(i.includes('r1572-career-infographic')||i.includes('R1572_CAREER_INFOGRAPHIC'))fail('Broken R1.5.72 footprint found');
if(!p.careerInfographicCSS||p.careerInfographicCSS.enabled!==true||p.careerInfographicCSS.mode!=='CSS_ONLY'||p.careerInfographicCSS.javascriptAdded!==false||p.careerInfographicCSS.observerAdded!==false||p.careerInfographicCSS.domRewrite!==false)fail('CSS-only metadata missing');
if(!p.policy||p.policy.careerPresentationMode!=='CSS_ONLY_INFOGRAPHIC'||p.policy.careerLogicChanged!==false)fail('Career policy mismatch');
if(!p.currentTitleAnchorAudit||p.currentTitleAnchorAudit.anchorCount!==2)fail('current-title anchors regressed');
if(!p.unmappedTitleAudit||p.unmappedTitleAudit.promotedTitles!==73)fail('unmapped-title audit regressed');
if(!p.familyBridgeAudit||p.familyBridgeAudit.bridgeCount!==23)fail('family bridge audit regressed');
if(p.chains.length!==189||p.validatedStepCount!==925||p.coverage.mappedTitles!==925||p.coverage.unmappedTitles!==391||Number(p.coverage.exactCoveragePercent)!==70.3)fail('Career map changed');
if(!i.includes("var SW_URL='service-worker.js?v=1573';")||!i.includes("var KEEP_CACHE='employee-registry-ui-r1573';")||!i.includes("APP_RELEASE||'r1573'"))fail('cache/release mismatch');
if(!sw.includes('MOBILE-R1.5.73-SERVICE-WORKER-NO-STALE-UI')||!sw.includes('__offline_index_r1573__'))fail('service worker mismatch');
if(!String(m.name).includes('R1.5.73'))fail('manifest mismatch');
console.log('VERIFY_MOBILE_R1 OK:',E);
console.log('VERIFY_CAREER_CSS_INFOGRAPHIC OK: Career presentation is CSS-only; no observer/script/DOM rewrite');
console.log('VERIFY_REFERENCE_CENTER OK: R1.5.71 My Notes and reference center retained');
console.log('VERIFY_CAREER_MAP OK: 189 chains / 925 mapped / 391 audit queue / 70.3% unchanged');
console.log('VERIFY_REGRESSION OK: exact matching, current anchors, gold-current semantics, and navigation gate retained');
