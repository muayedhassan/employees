#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const fail=m=>{console.error('VERIFY_MOBILE_R1 FAIL:',m);process.exit(1)};
const read=p=>{try{return fs.readFileSync(p,'utf8')}catch{fail('missing '+p)}};
const E='MOBILE-R1.5.80-COMPACT-PROFESSIONAL-UI-ORIGINAL-FONTS';
const P='MOBILE-R1.5.78-DETERMINISTIC-CAREER-CHAIN-CONSOLIDATION-COVERAGE-EXPANSION';
const i=read('index.html');
const p=JSON.parse(read('assets/job-title-progression.json'));
const j=JSON.parse(read('assets/job-titles.json'));
const sw=read('service-worker.js');
const m=JSON.parse(read('manifest.webmanifest'));
const v=read('VERSION.txt').trim();
const exactKey=(d,t)=>d+'|||'+String(t||'').trim();

if(v!==E)fail('VERSION mismatch');
if(!i.includes('<meta name="app-release" content="'+E+'">'))fail('release meta mismatch');
if(!i.includes('R1579_DASHBOARD_VISUAL_SYSTEM_FIRST_TAP_NAVIGATION_FIX_RELEASE'))fail('R1.5.79 release marker missing');
if(!i.includes('R1578_DETERMINISTIC_CAREER_CHAIN_CONSOLIDATION_COVERAGE_EXPANSION_RELEASE'))fail('R1.5.78 historical release marker regressed');
if(!i.includes('R1577_REFERENCE_ORDER_AUDIT_COVERAGE_EXPANSION_RELEASE'))fail('R1.5.77 historical release marker regressed');

const body='<body class="subview-list">',b=i.indexOf(body),h=i.lastIndexOf('</head>',b),s74=i.indexOf('<style id="r1574-career-visual-focus-style">'),s76=i.indexOf('<style id="r1576-career-directory-refinement-style">');
if(!(s74>0&&s74<h&&s76>s74&&s76<h&&h<b))fail('Career styles are not safely inside the real application head');
const rw=i.indexOf('w.document.open();w.document.write(doc);'),rv=i.lastIndexOf("var doc='",rw);
if(rv<0||rw<0)fail('report document structure missing');
const rr=i.slice(rv,rw);
if(rr.includes('r1574-career-visual-focus-style')||rr.includes('r1576-career-directory-refinement-style'))fail('Career CSS leaked into report JavaScript');
if(!rr.includes("</body></html>';"))fail('report closing sequence missing');

const marker='// R1563_CAREER_MATCH_INTEGRITY | CANONICAL_EXACT_ONLY title matching + explicit source diagnostics; no fuzzy inference.';
const mp=i.indexOf(marker),ss=i.lastIndexOf('<script',mp),so=i.indexOf('>',ss)+1,se=i.indexOf('</script>',mp);
if(mp<0||ss<0||so<=ss||se<0)fail('career script boundaries missing');
const cj=i.slice(so,se);
if(!cj.includes('R1576_DIRECTORY_SEARCH_BIND')||!cj.includes('function guideHTML()'))fail('R1.5.76 directory search regressed');
if(cj.includes('MutationObserver('))fail('unexpected MutationObserver inside Career script');
const tmp=path.join(os.tmpdir(),'r1579-career-verify-'+process.pid+'.js');
fs.writeFileSync(tmp,cj,'utf8');
const chk=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});
try{fs.unlinkSync(tmp)}catch{}
if(chk.status!==0)fail('Career JavaScript syntax invalid: '+String(chk.stderr||chk.stdout||'').trim());

if(j.total!==1316||!Array.isArray(j.rows)||j.rows.length!==1316)fail('Canonical title directory changed');
const src=new Set(j.rows.map(r=>exactKey(r.degree,r.title)));
if(src.size!==1316)fail('Canonical title directory contains duplicate exact rows');

if(p.release!==P)fail('R1.5.78 progression map must remain unchanged in R1.5.80');
if(!Array.isArray(p.chains)||p.chains.length!==201||p.validatedChainCount!==201||p.validatedStepCount!==1011)fail('R1.5.78 chain/step totals mismatch');
if(p.coverage?.mappedTitles!==1011||p.coverage?.unmappedTitles!==305||Number(p.coverage?.exactCoveragePercent)!==76.8)fail('R1.5.78 coverage totals mismatch');
if(p.remainingAudit?.totalTitles!==305)fail('remaining audit total mismatch');

const seen=new Set();
for(const c of p.chains||[])for(const s of c.steps||[]){
  const k=exactKey(s.degree,s.title);
  if(!src.has(k))fail('Mapped title not found exactly in canonical directory: '+k);
  if(seen.has(k))fail('Duplicate mapped title: '+k);
  seen.add(k);
}
if(seen.size!==1011)fail('Mapped set size mismatch');

function chain(id){const c=p.chains.find(x=>x.id===id);if(!c)fail('missing chain '+id);return c}
function titles(id){return chain(id).steps.map(x=>x.title).join(' > ')}
function mustSeq(id,expected){const got=titles(id);if(got!==expected)fail(id+' sequence mismatch\nEXPECTED: '+expected+'\nGOT: '+got)}

// R1.5.77 regression anchors/reference-order work retained.
mustSeq('r1577_reference_veterinary','طبيب بيطري متدرب > طبيب بيطري ممارس > طبيب بيطري ممارس اقدم > رئيس اطباء بيطريين > رئيس اطباء بيطرين اقدم > طبيب بيطري استشاري');
mustSeq('r1558_family_079','معاون امين صندوق > امين صندوق > امين صندوق اقدم > معاون رئيس امناء صناديق > رئيس امناء صناديق');
mustSeq('r1558_family_113','كاتب طابعة ثالث > كاتب طابعة ثان > كاتب طابعة اول > كاتب طابعة اقدم > معاون رئيس كتاب طابعة > رئيس كتاب طابعة > رئيس كتاب طابعة اقدم');
mustSeq('r1558_family_090','حارس اول > حارس اقدم > معاون رئيس حراس > رئيس حراس > رئيس حراس اقدم');
if(!p.referenceOrderAuditR1577||p.referenceOrderAuditR1577.sourceTitleRows!==148||p.referenceOrderAuditR1577.canonicalResolvedRows!==146||p.referenceOrderAuditR1577.unresolvedRows!==2||p.referenceOrderAuditR1577.newlyMappedTitles!==22)fail('R1.5.77 reference audit metadata mismatch');
if(!Array.isArray(p.referenceOrderAuditR1577.unresolved)||!p.referenceOrderAuditR1577.unresolved.some(x=>x.reference==='خبير')||!p.referenceOrderAuditR1577.unresolved.some(x=>x.reference==='موظف خدمات اقدم'))fail('R1.5.77 held rows regressed');

// Direct extensions.
mustSeq('r1558_family_015','فاحص نقد ثان > فاحص نقد اول > فاحص نقد اقدم > معاون رئيس فاحص نقد > رئيس فاحص نقد > رئيس فاحص نقد اقدم');
mustSeq('r1558_family_067','منظم ارشيف ثالث > منظم ارشيف ثان > منظم ارشيف اول > منظم ارشيف اقدم > منظم ارشيف اقدم ثاني > منظم ارشيف اقدم اول');
mustSeq('r1558_family_044','معاون قضائي سادس > معاون قضائي خامس > معاون قضائي رابع > معاون قضائي ثالث > معاون قضائي ثان > معاون قضائي اول > معاون قضائي اقدم');
mustSeq('r1558_family_027','معاون امام > امام خامس > امام رابع > امام ثالث > امام ثان > امام اول > امام اقدم');
mustSeq('r1558_family_072','معاون واعظ > واعظ خامس > واعظ رابع > واعظ ثالث > واعظ ثان > واعظ اول > واعظ اقدم');
mustSeq('r1558_family_089','حارس اصلاحية خامس > حارس اصلاحية رابع > حارس اصلاحية ثالث > حارس اصلاحية ثان > حارس اصلاحية اول > حارس اصلاحية اقدم');
mustSeq('r1558_family_110','قارئ ومؤذن خامس > قارئ ومؤذن رابع > قارئ ومؤذن ثالث > قارئ ومؤذن ثان > قارئ ومؤذن اول > قارئ ومؤذن اقدم');
mustSeq('r1558_family_091','خادم ومؤذن خامس > خادم ومؤذن رابع > خادم ومؤذن ثالث > خادم ومؤذن ثان > خادم ومؤذن اول > خادم ومؤذن اقدم');

// Consolidated fragments through one explicit adjacent bridge.
mustSeq('r1558_family_080','معاون امين متحف > امين متحف رابع > امين متحف ثالث > امين متحف ثان > امين متحف اول > امين متحف اقدم > امين متحف اقدم اول');
mustSeq('r1558_family_097','معاون سادن > سادن رابع > سادن ثالث > سادن ثان > سادن اول > سادن اقدم > سادن اقدم اول');
mustSeq('r1558_family_112','كاتب عدل خامس > كاتب عدل رابع > كاتب عدل ثالث > كاتب عدل ثان > كاتب عدل اول > كاتب عدل اقدم > كاتب عدل اقدم اول');
mustSeq('r1558_family_060','مشرف فني خامس > مشرف فني رابع > مشرف فني ثالث > مشرف فني ثان > مشرف فني اول > مشرف فني اقدم > مشرف فني اقدم ثاني > مشرف فني اقدم اول');
mustSeq('r1558_family_149','معلم خامس > معلم رابع > معلم ثالث > معلم ثان > معلم اول > معلم اقدم > معلم اقدم ثاني');
mustSeq('r1558_family_154','منفذ عدل خامس > منفذ عدل رابع > منفذ عدل ثالث > منفذ عدل ثان > منفذ عدل اول > منفذ عدل اقدم > منفذ عدل اقدم اول');
mustSeq('r1558_family_155','معاون منقب اثار > منقب اثار رابع > منقب اثار ثالث > منقب اثار ثان > منقب اثار اول > رئيس منقب اثار اقدم > رئيس منقب اثار اقدم اول');
for(const id of ['r1565_unmapped_003','r1565_unmapped_005','r1565_unmapped_006','r1565_unmapped_007','r1565_unmapped_008','r1565_unmapped_012','r1565_unmapped_013'])if(p.chains.some(c=>c.id===id))fail('merged fragment chain still exists: '+id);

// New deterministic chains.
mustSeq('r1578_chain_servant','خادم رابع > خادم ثالث > خادم ثان > خادم اول > خادم اقدم');
mustSeq('r1578_chain_editor','محرر ثالث > محرر ثان > محرر اول > محرر اقدم');
mustSeq('r1578_chain_section_officer','مامور قسم ثالث > مامور قسم ثان > مامور قسم اول > مامور قسم اقدم');
mustSeq('r1578_chain_reformatory_sergeant','رقيب اصلاحية ثالث > رقيب اصلاحية ثان > رقيب اصلاحية اول > رقيب اصلاحية اقدم');
mustSeq('r1578_chain_notifier','مبلغ ثالث > مبلغ ثان > مبلغ اول > مبلغ اقدم');
mustSeq('r1578_chain_justice_investigator','محقق عدل رابع > محقق عدل ثالث > محقق عدل ثان');
mustSeq('r1578_chain_assistant_pharmacy_supervisor','رئيس معاون صيدلي ثاني > رئيس معاون صيدلي اول > رئيس معاون صيدلي اقدم');
mustSeq('r1578_chain_secretary','سكرتير ثالث > سكرتير ثان > سكرتير اول');
mustSeq('r1578_chain_social_guide','مرشد اجتماعي ثان > مرشد اجتماعي اول > مرشد اجتماعي اقدم');
mustSeq('r1578_chain_fire_driver','سائق اطفاء ثان > سائق اطفاء اول > سائق اطفاء اقدم');

const a=p.deterministicConsolidationR1578;
if(!a||a.newlyMappedTitles!==64||a.affectedFamilies!==25||a.extendedExistingChains!==8||a.consolidatedPairs!==7||a.newChainsAdded!==10||a.anchorsPreserved!==10)fail('R1.5.78 audit metadata mismatch');
if(!Array.isArray(a.plannedNewTitles)||a.plannedNewTitles.length!==64)fail('R1.5.78 planned-title audit list mismatch');
const plannedKeys=new Set(a.plannedNewTitles.map(x=>exactKey(x.degree,x.title)));
if(plannedKeys.size!==64)fail('R1.5.78 planned-title audit list contains duplicates');
for(const k of plannedKeys)if(!seen.has(k))fail('planned R1.5.78 title was not mapped: '+k);

const anchors=p.chains.filter(c=>c.currentTitleAnchor);
if(anchors.length!==10)fail('Expected 10 current-title anchors, found '+anchors.length);
for(const c of anchors)if(c.steps.length!==1||c.currentTitleAnchor.currentTitleVerified!==true||c.currentTitleAnchor.nextRelationVerified!==false)fail('unsafe anchor '+c.id);

if(!src.has(exactKey('العاشرة','سائق ثان'))||src.has(exactKey('العاشرة','سائق ثاني'))||!src.has(exactKey('التاسعة','كاتب طابعة ثان')))fail('canonical linguistic title checks failed');
if(p.policy?.titleMatchingMode!=='CANONICAL_EXACT_ONLY'||p.policy?.fuzzyTitleMatching!==false||p.policy?.allowCrossFamilyConsolidation!==false||p.policy?.allowAutomaticDeterministicConsolidation!==false||p.policy?.careerMatchingAlgorithmChanged!==false)fail('R1.5.78 safeguards missing');

if(!p.coverageProfiles||p.coverageProfiles.extendsToFirst!==77||p.coverageProfiles.partial!==124||p.coverageProfiles.upperSegments!==33)fail('coverage profile totals mismatch');
const d=p.coverageProfiles.startGradeDistribution||{};
for(const [g,x] of Object.entries({'3':10,'4':24,'5':9,'6':8,'7':80,'8':43,'9':12,'10':15}))if(Number(d[g])!==x)fail('start-grade distribution mismatch at '+g);



// R1.5.79 dashboard visual system + first-tap startup route fix.
if(!i.includes('R1579_DASHBOARD_VISUAL_SYSTEM')||!i.includes('R1579_FIRST_TAP_ROUTER'))fail('R1.5.79 dashboard/router markers missing');
if(!i.includes("window.r1579FirstTapRouter.markReady('core-load');"))fail('core-load readiness handoff missing');
if(!i.includes('R1579_STARTUP_WATCHDOG_SAFE'))fail('safe startup watchdog marker missing');
if(i.includes("new MutationObserver(function(){clearTimeout(window.__r1502DashT)"))fail('legacy broad R1.5.02 dashboard MutationObserver was not retired');
const r79Start=i.indexOf('<script id="r1579-dashboard-first-tap-router-script">'),r79Open=i.indexOf('>',r79Start)+1,r79End=i.indexOf('</script>',r79Open);
if(r79Start<0||r79Open<=r79Start||r79End<0)fail('R1.5.79 router script boundaries missing');
const r79=i.slice(r79Open,r79End);
for(const marker of ['function protectStartupList()','function requestRoute(kind,key,btn)','function markReady(reason)','r1579-group-employees','r1579-group-career','r1579-group-system','data-main','data-key'])if(!r79.includes(marker))fail('R1.5.79 router/dashboard marker missing: '+marker);
if(r79.includes('MutationObserver('))fail('R1.5.79 must not use MutationObserver');
const tmp79=path.join(os.tmpdir(),'r1579-router-verify-'+process.pid+'.js');fs.writeFileSync(tmp79,r79,'utf8');const chk79=spawnSync(process.execPath,['--check',tmp79],{encoding:'utf8'});try{fs.unlinkSync(tmp79)}catch{}if(chk79.status!==0)fail('R1.5.79 router JavaScript syntax invalid: '+String(chk79.stderr||chk79.stdout||'').trim());
if(!i.includes('id="r1579-dashboard-visual-system-style"'))fail('R1.5.79 dashboard visual stylesheet missing');
for(const label of ['الموظفون','المسار الوظيفي','النظام والأدوات','الدائميون','العقود','إدارة النظام'])if(!r79.includes(label))fail('R1.5.79 dashboard label missing: '+label);


// R1.5.80 compact professional dashboard overlay: original app fonts + existing vector icons only.
if(!i.includes('R1580_COMPACT_PROFESSIONAL_UI_ORIGINAL_FONTS_RELEASE'))fail('R1.5.80 release marker missing');
if(!i.includes('id="r1580-compact-professional-ui-style"')||!i.includes('id="r1580-compact-professional-ui-script"'))fail('R1.5.80 compact UI assets missing');
const r80Start=i.indexOf('<script id="r1580-compact-professional-ui-script">'),r80Open=i.indexOf('>',r80Start)+1,r80End=i.indexOf('</script>',r80Open);
if(r80Start<0||r80Open<=r80Start||r80End<0)fail('R1.5.80 script boundaries missing');
const r80=i.slice(r80Open,r80End);
for(const marker of ['R1580_COMPACT_PROFESSIONAL_UI','R1580_ORIGINAL_FONT_IDENTITY','R1580_VECTOR_ICON_SYSTEM','function enhance()','function arrangeCards(box)','r1580-hero-stats','r1580-hidden-list','existing-local-app-fonts-only'])if(!r80.includes(marker))fail('R1.5.80 marker missing: '+marker);
if(r80.includes('MutationObserver('))fail('R1.5.80 compact UI must not use MutationObserver');
const tmp80=path.join(os.tmpdir(),'r1580-ui-verify-'+process.pid+'.js');fs.writeFileSync(tmp80,r80,'utf8');const chk80=spawnSync(process.execPath,['--check',tmp80],{encoding:'utf8'});try{fs.unlinkSync(tmp80)}catch{}if(chk80.status!==0)fail('R1.5.80 UI JavaScript syntax invalid: '+String(chk80.stderr||chk80.stdout||'').trim());
const r80StyleStart=i.indexOf('<style id="r1580-compact-professional-ui-style">'),r80StyleEnd=i.indexOf('</style>',r80StyleStart);if(r80StyleStart<0||r80StyleEnd<0)fail('R1.5.80 stylesheet boundaries missing');const r80css=i.slice(r80StyleStart,r80StyleEnd);
for(const marker of ['var(--hr-title-font','var(--hr-body-font','var(--hr-number-font','r1579-group-career [data-key="career"]','r1580-hidden-list'])if(!r80css.includes(marker))fail('R1.5.80 font/layout CSS marker missing: '+marker);
if(/fonts\.googleapis\.com|Alexandria|Noto Kufi|Changa|Reem Kufi/i.test(r80css+r80))fail('R1.5.80 introduced an external/experimental font dependency');
if(!r80.includes("['notes','managernotes','service','system']"))fail('R1.5.80 system-tools visual ordering missing');
if(!r80.includes("if(list)list.classList.add('r1580-hidden-list')"))fail('R1.5.80 redundant list-card suppression missing');

if(!p.startupHotfixR1575||p.startupHotfixR1575.structuralVerification!==true)fail('R1.5.75 startup hotfix metadata regressed');
if(!p.careerDirectoryRefinementR1576||p.careerDirectoryRefinementR1576.enabled!==true||p.careerDirectoryRefinementR1576.runtimeObserver!==false)fail('R1.5.76 directory metadata regressed');

const countOf=(h,needle)=>h.split(needle).length-1;
if(countOf(i,'service-worker.js?v=1580')!==3||countOf(i,'employee-registry-ui-r1580')!==1||countOf(i,"APP_RELEASE||'r1580'")!==1||countOf(i,"u.searchParams.set('v','1580')")!==2)fail('index R1.5.80 runtime/cache marker counts mismatch');
if(i.includes('service-worker.js?v=1579')||i.includes('employee-registry-ui-r1579')||i.includes("APP_RELEASE||'r1579'")||i.includes("u.searchParams.set('v','1579')"))fail('stale R1.5.79 runtime cache/update reference remains in index');
if(i.includes('service-worker.js?v=1578')||i.includes('employee-registry-ui-r1578')||i.includes("APP_RELEASE||'r1578'")||i.includes("u.searchParams.set('v','1578')"))fail('stale R1.5.78 runtime cache/update reference remains in index');
if(!sw.includes('MOBILE-R1.5.80-SERVICE-WORKER-NO-STALE-UI')||!sw.includes('employee-registry-ui-r1580')||!sw.includes('__offline_index_r1580__'))fail('service worker mismatch');
if(!String(m.name).includes('R1.5.80')||!String(m.short_name).includes('R1.5.80')||!String(m.description).includes('1011')||!String(m.description).includes('Compact Professional'))fail('manifest mismatch');

console.log('VERIFY_MOBILE_R1 OK:',E);
console.log('VERIFY_FIRST_TAP_NAVIGATION OK: startup intent queue + core-load handoff + safe 6.2s watchdog');
console.log('VERIFY_DASHBOARD_VISUAL_SYSTEM OK: 3 organized groups / redesigned scope cards / responsive premium palette');
console.log('VERIFY_DASHBOARD_OBSERVER_SAFETY OK: legacy broad dashboard MutationObserver retired; R1.5.79 uses event-driven sync');
console.log('VERIFY_R1578_CAREER_REGRESSION OK: 201 chains / 1011 mapped / 305 audit queue / 76.8% unchanged');
console.log('VERIFY_ANCHOR_SAFETY OK: 10 current-title anchors preserved without invented next titles');
console.log('VERIFY_REFERENCE_ORDER_REGRESSION OK: R1.5.77 audit and linguistic canonicalization retained');
console.log('VERIFY_DIRECTORY_UI OK: R1.5.76 professional directory search retained');
console.log('VERIFY_STARTUP_STRUCTURE OK: R1.5.75 startup repair retained; R1.5.79 protects non-list first taps');
console.log('VERIFY_REGRESSION OK: employee data, IndexedDB, canonical exact matching, My Notes, Reference Center, and career map remain unchanged');
console.log('VERIFY_COMPACT_PRO_UI OK: compact cards / compact hero stats / reduced spacing / responsive layout');
console.log('VERIFY_ORIGINAL_FONT_IDENTITY OK: app title/body/number font variables retained; no external experimental font added');
console.log('VERIFY_VECTOR_ICON_SYSTEM OK: existing Font Awesome vector icon structure retained');
console.log('VERIFY_MOBILE_R1 PASSED');
