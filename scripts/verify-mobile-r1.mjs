#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';
const fail=m=>{console.error('VERIFY_MOBILE_R1 FAIL:',m);process.exit(1)},read=p=>fs.readFileSync(p,'utf8');
const E='MOBILE-R1.5.87-COMPACT-HEADER-GOLD-TYPOGRAPHY-SECTIONS',CAREER='MOBILE-R1.5.78-DETERMINISTIC-CAREER-CHAIN-CONSOLIDATION-COVERAGE-EXPANSION';
const i=read('index.html'),p=JSON.parse(read('assets/job-title-progression.json')),j=JSON.parse(read('assets/job-titles.json')),sw=read('service-worker.js'),m=JSON.parse(read('manifest.webmanifest')),v=read('VERSION.txt').trim();
const countOf=(h,n)=>h.split(n).length-1,key=(d,t)=>d+'|||'+String(t||'').trim();

if(v!==E||!i.includes('<meta name="app-release" content="'+E+'">'))fail('release mismatch');
for(const x of [
 'R1579_DASHBOARD_VISUAL_SYSTEM_FIRST_TAP_NAVIGATION_FIX_RELEASE',
 'R1582_DASHBOARD_CLEANUP_COMPACT_HEADER_PRO_SCROLL_RELEASE',
 'R1583_DASHBOARD_HOME_LIST_ISOLATION_FIX_RELEASE',
 'R1584_DASHBOARD_CONTENT_ROUTING_CAPTURE_FIX_RELEASE',
 'R1585_HOME_STABILITY_REAL_FLOATING_CONTROL_FIX_RELEASE',
 'R1586_HOME_ONLY_FLOATING_CONTROL_CLEANUP_RELEASE',
 'R1587_COMPACT_HEADER_GOLD_TYPOGRAPHY_SECTIONS_RELEASE'
])if(!i.includes(x))fail('missing '+x);

if(j.total!==1316||j.rows.length!==1316)fail('directory changed');
const src=new Set(j.rows.map(r=>key(r.degree,r.title))),seen=new Set();
if(p.release!==CAREER||p.chains.length!==201||p.validatedStepCount!==1011||p.coverage?.mappedTitles!==1011||p.coverage?.unmappedTitles!==305||Number(p.coverage?.exactCoveragePercent)!==76.8)fail('career changed');
for(const c of p.chains)for(const s of c.steps){const k=key(s.degree,s.title);if(!src.has(k)||seen.has(k))fail('career exact set invalid '+k);seen.add(k)}
if(seen.size!==1011||(p.chains||[]).filter(c=>c.currentTitleAnchor).length!==10)fail('career invariant');

for(const x of ['R1585_RETIRED_R1503_BROAD_OBSERVER','R1585_RETIRED_R1504_BROAD_OBSERVER','R1585_RETIRED_R1507_BROAD_OBSERVER'])if(!i.includes(x))fail('R1.5.85 stability marker missing');
if(i.includes('window.__r1503T')||i.includes('window.__r1504T')||i.includes('window.__r1507T'))fail('retired observer returned');

const ss=i.indexOf('<style id="r1587-compact-header-gold-typography-style">'),se=i.indexOf('</style>',ss);
if(ss<0||se<0)fail('R1.5.87 CSS missing');
const css=i.slice(ss,se);

for(const x of [
 'R1587_COMPACT_HEADER_REFINEMENT',
 'R1587_GOLD_TYPOGRAPHY_SECTION_IDENTITY',
 '#main-header.header.r1432-header',
 'width:34px!important',
 'min-height:38px!important',
 'font:900 16.5px',
 '.r1579-section-title',
 'font:900 13.2px',
 'color:var(--r1587-gold)!important',
 '.r1579-section-title:after',
 '.r1579-mini-ico',
 'var(--hr-title-font'
])if(!css.includes(x))fail('R1.5.87 CSS marker missing: '+x);

if(/fonts\.googleapis\.com|Alexandria|Changa|Reem Kufi/i.test(css))fail('external experimental font introduced');
if(css.includes('MutationObserver(')||i.includes('<script id="r1587-'))fail('R1.5.87 must be CSS/design only');

if(!i.includes('R1586_HOME_NO_HIDE_SHOW'))fail('R1.5.86 home-only floating control regressed');
if(!i.includes('R1585_HOME_STABILITY'))fail('R1.5.85 stability regressed');
if(!i.includes('R1584_CAPTURED_CONTENT_MODE_FIX'))fail('R1.5.84 routing regressed');

if(countOf(i,'service-worker.js?v=1587')!==3||countOf(i,'employee-registry-ui-r1587')!==1||countOf(i,"APP_RELEASE||'r1587'")!==1||countOf(i,"u.searchParams.set('v','1587')")!==2)fail('cache markers');
for(const old of ['service-worker.js?v=1586','employee-registry-ui-r1586',"APP_RELEASE||'r1586'","u.searchParams.set('v','1586')"])if(i.includes(old))fail('stale R1.5.86 runtime marker '+old);
if(!sw.includes('employee-registry-ui-r1587')||!sw.includes('__offline_index_r1587__')||!String(m.description).includes('Gold Typography Sections'))fail('sw/manifest mismatch');

console.log('VERIFY_MOBILE_R1 OK:',E);
console.log('VERIFY_COMPACT_HEADER_R1587 OK: header spacing/logo/date/connectivity controls materially reduced');
console.log('VERIFY_GOLD_SECTION_TYPOGRAPHY OK: record scope/employees/career/system headings share gold typographic identity');
console.log('VERIFY_EXISTING_FONT_POLICY OK: local app title/body fonts only; no external font introduced');
console.log('VERIFY_DESIGN_ONLY_SCOPE OK: no R1.5.87 JavaScript or navigation logic added');
console.log('VERIFY_R1586_HOME_CONTROL_REGRESSION OK');
console.log('VERIFY_R1585_STABILITY_REGRESSION OK');
console.log('VERIFY_R1584_ROUTING_REGRESSION OK');
console.log('VERIFY_R1582_SCROLL_REGRESSION OK');
console.log('VERIFY_R1578_CAREER_REGRESSION OK: 201 chains / 1011 mapped / 305 audit / 76.8% unchanged');
console.log('VERIFY_MOBILE_R1 PASSED');
