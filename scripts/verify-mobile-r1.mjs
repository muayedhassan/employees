#!/usr/bin/env node
import fs from'node:fs';
function fail(m){console.error('VERIFY_MOBILE_R1 FAIL:',m);process.exit(1)}
function read(p){try{return fs.readFileSync(p,'utf8')}catch(e){fail('missing '+p)}}
const i=read('index.html'),p=JSON.parse(read('assets/job-title-progression.json')),sw=read('service-worker.js'),m=JSON.parse(read('manifest.webmanifest')),v=read('VERSION.txt').trim();
const E='MOBILE-R1.5.71-REFERENCE-CENTER-NAVIGATION-GATE';
if(v!==E)fail('VERSION mismatch');
if(!i.includes('<meta name="app-release" content="'+E+'">'))fail('release meta mismatch');
for(const x of [
  'R1571_REFERENCE_CENTER_NAVIGATION_GATE',
  'R1571_GLOBAL_NAVIGATION_GATE',
  'id="r1571-my-notes-v2-style"',
  'id="r1571-my-notes-v2-script"',
  'function qualificationGroups(rules)',
  "order=['general','institute','undergrad','graduate']",
  "institute:{title:'المعاهد والدبلوم بعد الإعدادية'",
  'function certificateAllowanceHTML()',
  'function familyAllowanceHTML()',
  'function promotionReferenceHTML()',
  'مخصصات الشهادة والحرفة',
  'الإعالة والأطفال',
  'العلاوة والترفيع',
  'function beginRouteGate()',
  'function endRouteGate()',
  "document.documentElement.classList.add('r1571-route-gate')",
  "html.r1571-route-gate #view-list",
  'ملاحظات شخصية • مركز مراجع • إنفوغرافيك'
]) if(!i.includes(x))fail('R1.5.71 footprint missing: '+x);
if(i.includes('id="r1570-my-notes-v2-style"')||i.includes('id="r1570-my-notes-v2-script"'))fail('old R1.5.70 notes block still present');
if(!p.notesWorkspace||p.notesWorkspace.release!==E)fail('notesWorkspace release metadata missing');
if(p.notesWorkspace.navigation!=='dashboard-restore+history-back')fail('notes navigation regressed');
if(p.notesWorkspace.referencePresentation!=='reference-center-v2')fail('reference center metadata missing');
if(!p.notesWorkspace.navigationGate||p.notesWorkspace.navigationGate.listFlashPrevention!==true)fail('navigation gate metadata missing');
if(p.policy.notesAffectEmployeeData!==false)fail('notesAffectEmployeeData must remain false');
if(!p.currentTitleAnchorAudit||p.currentTitleAnchorAudit.anchorCount!==2)fail('R1.5.66 current-title anchors regressed');
if(!p.unmappedTitleAudit||p.unmappedTitleAudit.promotedTitles!==73)fail('R1.5.65 unmapped-title audit regressed');
if(!p.familyBridgeAudit||p.familyBridgeAudit.bridgeCount!==23)fail('R1.5.64 family bridge audit regressed');
if(p.chains.length!==189||p.validatedStepCount!==925||p.coverage.mappedTitles!==925||p.coverage.unmappedTitles!==391||Number(p.coverage.exactCoveragePercent)!==70.3)fail('Career map changed');
for(const x of ['id="r1564-current-gold-style"',"TITLE_MATCH_POLICY='CANONICAL_EXACT_ONLY'","result.status='current-anchor'"]) if(!i.includes(x))fail('Career regression: '+x);
const a=i.indexOf('<script id="r1571-my-notes-v2-script">'),b=i.indexOf('</script>',a),s=i.slice(a,b);
for(const x of [
  "DB_NAME='hr_mobile_personal_notes'",
  'function restoreDashboard()',
  'function notesBack()',
  'function openReader(id)',
  'function exportNotes()',
  'function importBackupFile(file)',
  'function openEmployeeNote(emp)',
  'qualificationReferenceHTML()',
  'certificateAllowanceHTML()',
  'familyAllowanceHTML()',
  'promotionReferenceHTML()',
  'beginRouteGate()',
  'endRouteGate()',
  "closest('#r1502-dashboard')"
]) if(!s.includes(x))fail('Notes/reference/navigation implementation missing: '+x);
for(const x of ['employeeDataWriteBack=true','git push','fetch("https://api.github.com']) if(s.includes(x))fail('forbidden Notes integration: '+x);
if(!i.includes("var SW_URL='service-worker.js?v=1571';")||!i.includes("var KEEP_CACHE='employee-registry-ui-r1571';")||!i.includes("APP_RELEASE||'r1571'"))fail('cache/release mismatch');
if(!sw.includes('MOBILE-R1.5.71-SERVICE-WORKER-NO-STALE-UI')||!sw.includes('__offline_index_r1571__'))fail('service worker mismatch');
if(!String(m.name).includes('R1.5.71'))fail('manifest mismatch');
for(const x of ['R1550_QUIET_MANAGER_NOTES_SYNC','R1549_ADMIN_ARCHIVE_SHARED_DELETE','R1548_SERVER_AUTHORITY_CLEANUP','R1547_SHARED_REVIEW_STATE','R1546_OFFICIAL_DATA_CONTRACT']) if(!i.includes(x))fail('administrative regression: '+x);
console.log('VERIFY_MOBILE_R1 OK:',E);
console.log('VERIFY_QUALIFICATION_GROUPING OK: institute/diploma is separate after preparatory and before university');
console.log('VERIFY_NAVIGATION_GATE OK: employee-list flash is suppressed while non-list sections open');
console.log('VERIFY_REFERENCE_CENTER OK: 4 reference modules / qualification + certificate/craft + family + allowance/promotion');
console.log('VERIFY_NOTES_WORKSPACE OK: navigation/reader/employee note/backup retained');
console.log('VERIFY_CAREER_MAP OK: 189 chains / 925 mapped / 391 audit queue / 70.3% unchanged');
console.log('VERIFY_REGRESSION OK: prior Career and administrative markers retained');
