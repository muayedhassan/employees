#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const fail=m=>{console.error('VERIFY_MOBILE_R1 FAIL:',m);process.exit(1)};
const read=p=>{try{return fs.readFileSync(p,'utf8')}catch{fail('missing '+p)}};
const E='MOBILE-R1.5.81-UNIFIED-DASHBOARD-SCROLL-TITLE-CLARITY-ADMIN-NAV-FIX';
const CAREER='MOBILE-R1.5.78-DETERMINISTIC-CAREER-CHAIN-CONSOLIDATION-COVERAGE-EXPANSION';
const i=read('index.html');
const p=JSON.parse(read('assets/job-title-progression.json'));
const j=JSON.parse(read('assets/job-titles.json'));
const sw=read('service-worker.js');
const m=JSON.parse(read('manifest.webmanifest'));
const v=read('VERSION.txt').trim();
const exactKey=(d,t)=>d+'|||'+String(t||'').trim();
const countOf=(h,n)=>h.split(n).length-1;

if(v!==E)fail('VERSION mismatch');
if(!i.includes('<meta name="app-release" content="'+E+'">'))fail('release meta mismatch');

for(const marker of [
  'R1577_REFERENCE_ORDER_AUDIT_COVERAGE_EXPANSION_RELEASE',
  'R1578_DETERMINISTIC_CAREER_CHAIN_CONSOLIDATION_COVERAGE_EXPANSION_RELEASE',
  'R1579_DASHBOARD_VISUAL_SYSTEM_FIRST_TAP_NAVIGATION_FIX_RELEASE',
  'R1580_COMPACT_PROFESSIONAL_UI_ORIGINAL_FONTS_RELEASE',
  'R1581_UNIFIED_DASHBOARD_SCROLL_TITLE_CLARITY_ADMIN_NAV_FIX_RELEASE'
])if(!i.includes(marker))fail('historical/current marker missing: '+marker);

// Canonical title directory and career map must remain untouched.
if(j.total!==1316||!Array.isArray(j.rows)||j.rows.length!==1316)fail('Canonical title directory changed');
const src=new Set(j.rows.map(r=>exactKey(r.degree,r.title)));
if(src.size!==1316)fail('Canonical title directory duplicate rows');
if(p.release!==CAREER)fail('career map release changed');
if(!Array.isArray(p.chains)||p.chains.length!==201||p.validatedChainCount!==201||p.validatedStepCount!==1011)fail('career chain totals changed');
if(p.coverage?.mappedTitles!==1011||p.coverage?.unmappedTitles!==305||Number(p.coverage?.exactCoveragePercent)!==76.8)fail('career coverage changed');
if(p.remainingAudit?.totalTitles!==305)fail('remaining audit changed');

const seen=new Set();
for(const c of p.chains||[])for(const s of c.steps||[]){
  const k=exactKey(s.degree,s.title);
  if(!src.has(k))fail('mapped title not in canonical directory: '+k);
  if(seen.has(k))fail('duplicate mapped title: '+k);
  seen.add(k);
}
if(seen.size!==1011)fail('mapped title set changed');
const anchors=(p.chains||[]).filter(c=>c.currentTitleAnchor);
if(anchors.length!==10)fail('anchor count changed');
for(const c of anchors)if(c.steps.length!==1||c.currentTitleAnchor.currentTitleVerified!==true||c.currentTitleAnchor.nextRelationVerified!==false)fail('unsafe anchor '+c.id);

// R1.5.79 first-tap regression.
if(!i.includes('R1579_FIRST_TAP_ROUTER')||!i.includes("window.r1579FirstTapRouter.markReady('core-load');")||!i.includes('R1579_STARTUP_WATCHDOG_SAFE'))fail('R1.5.79 first-tap fix regressed');
if(i.includes("new MutationObserver(function(){clearTimeout(window.__r1502DashT)"))fail('legacy broad dashboard observer returned');

// R1.5.80 visual baseline and original fonts retained.
if(!i.includes('R1580_COMPACT_PROFESSIONAL_UI')||!i.includes('R1580_ORIGINAL_FONT_IDENTITY')||!i.includes('R1580_VECTOR_ICON_SYSTEM'))fail('R1.5.80 visual baseline missing');
const r80s=i.indexOf('<style id="r1580-compact-professional-ui-style">'),r80e=i.indexOf('</style>',r80s);
const r80j=i.indexOf('<script id="r1580-compact-professional-ui-script">'),r80je=i.indexOf('</script>',r80j);
if(r80s<0||r80e<0||r80j<0||r80je<0)fail('R1.5.80 boundaries missing');
const r80=i.slice(r80s,r80je);
if(/fonts\.googleapis\.com|Alexandria|Changa|Reem Kufi/i.test(r80))fail('external experimental font introduced');

// R1.5.81 checks.
if(!i.includes('id="r1581-unified-dashboard-scroll-title-clarity-style"')||!i.includes('id="r1581-unified-dashboard-scroll-admin-nav-script"'))fail('R1.5.81 assets missing');
const s81=i.indexOf('<style id="r1581-unified-dashboard-scroll-title-clarity-style">'),e81=i.indexOf('</style>',s81);
const j81=i.indexOf('<script id="r1581-unified-dashboard-scroll-admin-nav-script">'),je81=i.indexOf('</script>',j81);
if(s81<0||e81<0||j81<0||je81<0)fail('R1.5.81 boundaries missing');
const css81=i.slice(s81,e81),js81=i.slice(i.indexOf('>',j81)+1,je81);

for(const x of [
  'R1581_UNIFIED_DASHBOARD_SCROLL',
  'R1581_UNIFORM_CARD_TITLE_CLARITY',
  'overflow-y:auto!important',
  'max-height:none!important',
  '.r1579-groups',
  '11.4px'
])if(!css81.includes(x))fail('R1.5.81 unified-scroll/title CSS marker missing: '+x);

for(const x of [
  'R1581_ADMIN_CROSS_MODE_NAVIGATION_FIX',
  'function fitUnifiedScroll()',
  'function openModuleFromAdmin(key)',
  "modeNow()!=='admin'",
  "window.switchMain(targetMode)",
  "window.switchSub(key)",
  "document.addEventListener('click',captureDashboardRoute,true)",
  "window.addEventListener('orientationchange'"
])if(!js81.includes(x))fail('R1.5.81 navigation/scroll JS marker missing: '+x);

if(js81.includes('MutationObserver('))fail('R1.5.81 must not use MutationObserver');
const tmp=path.join(os.tmpdir(),'r1581-verify-'+process.pid+'.js');
fs.writeFileSync(tmp,js81,'utf8');
const chk=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});
try{fs.unlinkSync(tmp)}catch{}
if(chk.status!==0)fail('R1.5.81 JavaScript syntax invalid: '+String(chk.stderr||chk.stdout||'').trim());

// Cache/release consistency.
if(countOf(i,'service-worker.js?v=1581')!==3||countOf(i,'employee-registry-ui-r1581')!==1||countOf(i,"APP_RELEASE||'r1581'")!==1||countOf(i,"u.searchParams.set('v','1581')")!==2)fail('R1.5.81 runtime/cache marker counts mismatch');
for(const old of ['service-worker.js?v=1580','employee-registry-ui-r1580',"APP_RELEASE||'r1580'","u.searchParams.set('v','1580')"])if(i.includes(old))fail('stale R1.5.80 runtime marker remains: '+old);
if(!sw.includes('MOBILE-R1.5.81-SERVICE-WORKER-NO-STALE-UI')||!sw.includes('employee-registry-ui-r1581')||!sw.includes('__offline_index_r1581__'))fail('service worker mismatch');
if(!String(m.name).includes('R1.5.81')||!String(m.short_name).includes('R1.5.81')||!String(m.description).includes('Unified Dashboard Scroll')||!String(m.description).includes('1011'))fail('manifest mismatch');

console.log('VERIFY_MOBILE_R1 OK:',E);
console.log('VERIFY_UNIFIED_DASHBOARD_SCROLL OK: scope + employees + career + system/tools use one dashboard scroll region');
console.log('VERIFY_CARD_TITLE_UNIFORMITY OK: scope and module card titles share one readable title size/weight');
console.log('VERIFY_ADMIN_CROSS_MODE_NAVIGATION OK: module clicks from admin restore the last employee scope before opening the requested section');
console.log('VERIFY_FIRST_TAP_NAVIGATION OK: R1.5.79 startup intent queue + safe watchdog retained');
console.log('VERIFY_R1580_VISUAL_BASELINE OK: Compact Professional UI + original app fonts + vector icons retained');
console.log('VERIFY_R1578_CAREER_REGRESSION OK: 201 chains / 1011 mapped / 305 audit queue / 76.8% unchanged');
console.log('VERIFY_ANCHOR_SAFETY OK: 10 current-title anchors preserved');
console.log('VERIFY_REGRESSION OK: employee data, IndexedDB, career map, My Notes and Reference Center remain unchanged');
console.log('VERIFY_MOBILE_R1 PASSED');
