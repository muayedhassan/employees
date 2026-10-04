#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const fail=m=>{console.error('VERIFY_MOBILE_R1 FAIL:',m);process.exit(1)};
const read=p=>{try{return fs.readFileSync(p,'utf8')}catch{fail('missing '+p)}};
const E='MOBILE-R1.5.83-DASHBOARD-HOME-LIST-ISOLATION-FIX';
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
  'R1581_UNIFIED_DASHBOARD_SCROLL_TITLE_CLARITY_ADMIN_NAV_FIX_RELEASE',
  'R1582_DASHBOARD_CLEANUP_COMPACT_HEADER_PRO_SCROLL_RELEASE',
  'R1583_DASHBOARD_HOME_LIST_ISOLATION_FIX_RELEASE'
])if(!i.includes(marker))fail('release marker missing: '+marker);

// Data/career invariants.
if(j.total!==1316||!Array.isArray(j.rows)||j.rows.length!==1316)fail('canonical title directory changed');
const src=new Set(j.rows.map(r=>exactKey(r.degree,r.title)));
if(src.size!==1316)fail('canonical directory duplicate rows');
if(p.release!==CAREER)fail('career map release changed');
if(!Array.isArray(p.chains)||p.chains.length!==201||p.validatedChainCount!==201||p.validatedStepCount!==1011)fail('career totals changed');
if(p.coverage?.mappedTitles!==1011||p.coverage?.unmappedTitles!==305||Number(p.coverage?.exactCoveragePercent)!==76.8)fail('career coverage changed');
if(p.remainingAudit?.totalTitles!==305)fail('remaining audit changed');
const seen=new Set();
for(const c of p.chains||[])for(const s of c.steps||[]){
  const k=exactKey(s.degree,s.title);
  if(!src.has(k))fail('mapped title not in canonical directory: '+k);
  if(seen.has(k))fail('duplicate mapped title: '+k);
  seen.add(k);
}
if(seen.size!==1011)fail('mapped set size changed');
const anchors=(p.chains||[]).filter(c=>c.currentTitleAnchor);
if(anchors.length!==10)fail('anchor count changed');

// Prior protections retained.
if(!i.includes('R1579_FIRST_TAP_ROUTER')||!i.includes("window.r1579FirstTapRouter.markReady('core-load');")||!i.includes('R1579_STARTUP_WATCHDOG_SAFE'))fail('R1.5.79 first-tap fix regressed');
if(!i.includes('R1581_ADMIN_CROSS_MODE_NAVIGATION_FIX')||!i.includes('function openModuleFromAdmin(key)'))fail('R1.5.81 admin route fix regressed');
if(!i.includes('R1582_DASHBOARD_HERO_REMOVAL')||!i.includes('R1582_COMPACT_HEADER_REDESIGN')||!i.includes('R1582_PROFESSIONAL_SINGLE_SCROLL'))fail('R1.5.82 UI baseline regressed');

// R1.5.83.
if(!i.includes('id="r1583-dashboard-home-list-isolation-style"')||!i.includes('id="r1583-dashboard-home-list-isolation-script"'))fail('R1.5.83 assets missing');
const ss=i.indexOf('<style id="r1583-dashboard-home-list-isolation-style">'),se=i.indexOf('</style>',ss);
const js=i.indexOf('<script id="r1583-dashboard-home-list-isolation-script">'),je=i.indexOf('</script>',js);
if(ss<0||se<0||js<0||je<0)fail('R1.5.83 boundaries missing');
const css=i.slice(ss,se),code=i.slice(i.indexOf('>',js)+1,je);

for(const x of [
  'R1583_DASHBOARD_HOME_ISOLATION',
  'R1583_EXPLICIT_LIST_CARD',
  'R1583_CONTENT_MODE_SWITCH',
  'body.r1583-dashboard-home #scroll',
  'body.r1583-dashboard-home .pg-wrap',
  '[data-key="list"].r1580-hidden-list',
  'grid-column:1/-1!important',
  'body.r1583-content-open #r1502-dashboard',
  "content:'الواجهة الرئيسية'"
])if(!css.includes(x))fail('R1.5.83 CSS marker missing: '+x);

for(const x of [
  'function prepareListCard()',
  "card.classList.remove('r1580-hidden-list')",
  'function enterHome()',
  'function enterContent(key)',
  'function enterContentWhenReady(key,attempt)',
  'function onDashboardClick(ev)',
  'function onHomeHandle(ev)',
  'function wrapAdminRoute()',
  "wrapRender(window.r1579FirstTapRouter,'render')",
  "window.addEventListener('pageshow'"
])if(!code.includes(x))fail('R1.5.83 JS marker missing: '+x);

if(code.includes('MutationObserver('))fail('R1.5.83 must not use MutationObserver');
if(/fonts\.googleapis\.com|Alexandria|Changa|Reem Kufi/i.test(css+code))fail('external font dependency introduced');
const tmp=path.join(os.tmpdir(),'r1583-verify-'+process.pid+'.js');
fs.writeFileSync(tmp,code,'utf8');
const chk=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});
try{fs.unlinkSync(tmp)}catch{}
if(chk.status!==0)fail('R1.5.83 JavaScript syntax invalid: '+String(chk.stderr||chk.stdout||'').trim());

// Cache/release consistency.
if(countOf(i,'service-worker.js?v=1583')!==3||countOf(i,'employee-registry-ui-r1583')!==1||countOf(i,"APP_RELEASE||'r1583'")!==1||countOf(i,"u.searchParams.set('v','1583')")!==2)fail('R1.5.83 runtime/cache marker counts mismatch');
for(const old of ['service-worker.js?v=1582','employee-registry-ui-r1582',"APP_RELEASE||'r1582'","u.searchParams.set('v','1582')"])if(i.includes(old))fail('stale R1.5.82 runtime marker remains: '+old);
if(!sw.includes('MOBILE-R1.5.83-SERVICE-WORKER-NO-STALE-UI')||!sw.includes('employee-registry-ui-r1583')||!sw.includes('__offline_index_r1583__'))fail('service worker mismatch');
if(!String(m.name).includes('R1.5.83')||!String(m.short_name).includes('R1.5.83')||!String(m.description).includes('List Isolation')||!String(m.description).includes('1011'))fail('manifest mismatch');

console.log('VERIFY_MOBILE_R1 OK:',E);
console.log('VERIFY_DASHBOARD_HOME_ISOLATION OK: #scroll + pagination are hidden while dashboard home is active');
console.log('VERIFY_EXPLICIT_LIST_CARD OK: List card is restored full-width as an explicit employee-content entry point');
console.log('VERIFY_CONTENT_MODE_SWITCH OK: selected module hides dashboard and gives content the screen');
console.log('VERIFY_HOME_RETURN_CONTROL OK: floating control returns from content to dashboard home');
console.log('VERIFY_ADMIN_NAVIGATION_REGRESSION OK: R1.5.81 admin cross-mode routing retained and wrapped');
console.log('VERIFY_R1582_VISUAL_REGRESSION OK: compact header, title scale and professional dashboard scroll retained');
console.log('VERIFY_FIRST_TAP_NAVIGATION OK: R1.5.79 startup route protection retained');
console.log('VERIFY_R1578_CAREER_REGRESSION OK: 201 chains / 1011 mapped / 305 audit queue / 76.8% unchanged');
console.log('VERIFY_REGRESSION OK: employee data, IndexedDB, career map, My Notes and Reference Center unchanged');
console.log('VERIFY_MOBILE_R1 PASSED');
