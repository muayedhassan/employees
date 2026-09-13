import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const fail = msg => { console.error('VERIFY FAILED:', msg); process.exit(1); };
const ok = msg => console.log('OK:', msg);

const required = [
  'index.html','service-worker.js','manifest.webmanifest','VERSION.txt',
  'data/version.json','data/employees.json','data/change-summary.json',
  'data/change-history.json','data/validation-report.json','data/fallback-data.js',
  'MOBILE_R1_4_17_RELEASE_NOTES_AR.txt'
];
for (const f of required) if (!fs.existsSync(path.join(root, f))) fail(`missing ${f}`);

const index = read('index.html');
const sw = read('service-worker.js');
const release = read('VERSION.txt').trim();
let manifest, version, employees, summary;
try { manifest = JSON.parse(read('manifest.webmanifest')); } catch (e) { fail(`manifest JSON invalid: ${e.message}`); }
try { version = JSON.parse(read('data/version.json')); } catch (e) { fail(`data/version.json invalid: ${e.message}`); }
try { employees = JSON.parse(read('data/employees.json')); } catch (e) { fail(`data/employees.json invalid: ${e.message}`); }
try { summary = JSON.parse(read('data/change-summary.json')); } catch (e) { fail(`change-summary JSON invalid: ${e.message}`); }

const expectedRelease = 'MOBILE-R1.4.17-PDF-VIEW-DIRECT-DOWNLOAD';
if (release !== expectedRelease) fail(`VERSION.txt mismatch: ${release}`);
if (!index.includes(`APP_RELEASE = '${expectedRelease}'`)) fail('APP_RELEASE is not Mobile R1.4.17 PDF View Direct Download');
if (!String(manifest.description || '').includes('R1.4.17')) fail('manifest description was not updated');

// Critical regression guard: the R1.4.13 failure was a JavaScript syntax break caused by
// the updates CSS block being injected into inline JS / printable HTML builders.
const inlineScripts = Array.from(index.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)).map(m => m[1]).join('\n;\n');
try { new Function(inlineScripts); } catch (err) { fail(`index.html inline JavaScript syntax error: ${err.message}`); }
try { new Function(read('data/fallback-data.js')); } catch (err) { fail(`fallback-data.js syntax error: ${err.message}`); }

const updateCssMarker = '/* Mobile R1.4.14 - Updates center clean active cards */';
const updateCssCount = index.split(updateCssMarker).length - 1;
if (updateCssCount !== 1) fail(`updates CSS marker must appear exactly once, found ${updateCssCount}`);
if (inlineScripts.includes(updateCssMarker)) fail('updates CSS block was injected inside JavaScript again');

const start = index.indexOf('function buildUpdates(){');
const end = index.indexOf('// ── REPORT SUPPORT', start);
if (start < 0 || end < 0) fail('buildUpdates block not found');
const buildUpdatesBlock = index.slice(start, end);
for (const marker of [
  'r1414-updates-hero','r1414-tabs-in-hero',
  'data-update-section="changes"','data-update-section="additions"',
  'data-update-section="gaps"','data-update-section="review"'
]) if (!buildUpdatesBlock.includes(marker)) fail(`updates center marker missing: ${marker}`);
for (const removed of ['updates-version-pill','update-kpi-ribbon','r1-sensitive-banner','section-mini-explainer changes','section-mini-explainer additions','section-mini-explainer gaps','section-mini-explainer review']) {
  if (buildUpdatesBlock.includes(removed)) fail(`removed updates element still rendered: ${removed}`);
}

// Load path must remain fallback -> central -> counts/render.
for (const marker of ['await loadFileFallback();','await loadCentralData(false);',"splashCount('sc-perm',BASE.perm.length)","splashCount('sc-cont',BASE.cont.length)","splashCount('sc-all',BASE.perm.length+BASE.cont.length)",'filt=BASE.perm; buildLetters(); buildAdvancedFilters();','render();']) {
  if (!index.includes(marker)) fail(`load/boot marker missing: ${marker}`);
}
if (!index.includes("https://raw.githubusercontent.com/muayedhassan/employees/main/") || !index.includes("fetchJSON('data/employees.json")) fail('central GitHub data endpoint marker missing');

// Preserve R1.4.12 PDF card polish requested before R1.4.13.
const pdfBlock = index.slice(index.lastIndexOf('function r1412FieldSlug'));
for (const marker of ['r1412FormatSalary','عرض بطاقة PDF','تحميل بطاقة PDF',"r1411Field('رقم الهوية','identityNo',emp.identityNo,'🪪',true)","return numeric+' د.ع';",'identityIssuer b','notes b']) {
  if (!pdfBlock.includes(marker) && !index.includes(marker)) fail(`PDF polish marker missing: ${marker}`);
}

// Data integrity: do not hard-code one dataset version, but the counts must agree.
if (!Array.isArray(employees.perm) || !Array.isArray(employees.cont)) fail('employees.json format is invalid');
const total = employees.perm.length + employees.cont.length;
if (total !== version.totalCount) fail(`employee count mismatch: JSON=${total}, version=${version.totalCount}`);
if (employees.perm.length !== version.permCount || employees.cont.length !== version.contCount) fail('perm/cont counts mismatch');
if (!String(version.version || '').startsWith('DATA-')) fail(`unexpected data version: ${version.version}`);
if (!summary.counts || summary.counts.modified === undefined) fail('change summary counts are invalid');

// Service worker must force a fresh app shell while keeping central data network-first.
if (!sw.includes("employee-registry-mobile-r1417-pdfactions-2026.09.13")) fail('R1.4.17 PDF actions cache marker missing');
for (const marker of ['skipWaiting','clients.claim','networkFirst','staleWhileRevalidate','raw.githubusercontent.com']) {
  if (!sw.includes(marker)) fail(`service worker marker missing: ${marker}`);
}
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) fail('manifest icons are missing');


// R1.4.15 update-detail drilldown guards.
for (const marker of ['Mobile R1.4.15 - Updates details drilldown','r1415UpdateRef','r1415EmployeeRef','r1415GapTarget','r1415EmptyUpdateState','r1415ActivateProfileTab','data-update-target=\"history\"','data-update-jump-version']) {
  if (!index.includes(marker)) fail(`R1.4.15 updates detail marker missing: ${marker}`);
}
if (!index.includes("openUpdateEmployee=function(ref,targetTab,versionContext)")) fail('R1.4.15 openUpdateEmployee override missing');
if (!index.includes("r1415ActivateProfileTab(targetTab||'basic')")) fail('updated employee does not drill into requested profile tab');
if (!index.includes("if(targetTab==='history'&&R1415_UPDATE_FOCUS_VERSION)")) fail('modified employee history context marker missing');


// R1.4.16 navigation / admin cleanup guards must remain intact.
for (const marker of [
  'Mobile R1.4.16 - professional navigation, mobile PDF save toolbar, admin safety-only',
  'id="r1416-nav-card"','نطاق السجل','أقسام البرنامج','r1416SyncNavigation',
  'r1416-hidden-compat','r1416-admin-only','حماية البيانات والاسترجاع'
]) if (!index.includes(marker)) fail(`R1.4.16 preserved marker missing: ${marker}`);

const adminStart = index.indexOf('<div id="view-admin"');
const adminEnd = index.indexOf('<div class="pg-wrap" id="pg">', adminStart);
if (adminStart < 0 || adminEnd < 0) fail('admin view block not found');
const adminBlock = index.slice(adminStart, adminEnd);
for (const removedVisible of ['Windows Master <span','سجل الموظفين <span','admin-summary']) {
  if (adminBlock.includes(removedVisible)) fail(`removed admin UI is still visible: ${removedVisible}`);
}
if (!adminBlock.includes('id="data-safety-section"')) fail('data safety section missing from admin');

if (!index.includes("views.forEach(function(x){var el=document.getElementById('view-'+x);if(el)el.style.display=(mode!=='admin'&&subView===x)?'block':'none';});")) fail('exclusive content-view guard missing');
if (!index.includes("if(mode==='admin')return;r1416SwitchSubBase(v);")) fail('admin subview overlap guard missing');
if (!index.includes("el.className='sub-tab'+(selected?' '+subActive:'');")) fail('exclusive active-module class guard missing');
if (!index.includes('body.chrome-collapsed .r1416-nav-card{display:none!important}')) fail('collapsed navigation-card guard missing');

// R1.4.17 PDF actions: preview is view-only; download requires confirmation and then auto-downloads.
for (const marker of [
  'Mobile R1.4.17 - separate PDF view and confirmed direct download',
  'id="btn-view-pdf"','id="btn-download-pdf"',
  'id="card-view-pdf-btn"','id="card-download-pdf-btn"',
  'معاينة فقط بدون تحميل','يطلب تأكيدًا قبل التنزيل',
  'r1417ConfirmEmployeePdfDownload','window.confirm(',
  "printEmployeeCard(emp,'download')","printEmployeeCard(currentEmp,'view')"
]) if (!index.includes(marker)) fail(`R1.4.17 PDF action marker missing: ${marker}`);

if (index.includes('id="btn-print-pdf"') || index.includes('id="card-print-btn"')) fail('combined legacy PDF buttons are still present');

const lastPrint = index.lastIndexOf('printEmployeeCard=function(emp,mode){');
if (lastPrint < 0) fail('R1.4.17 mode-aware printEmployeeCard override missing');
const printBlock = index.slice(lastPrint, index.indexOf('// ── MOBILE R1.4.15 UPDATES DETAILS DRILLDOWN', lastPrint));
for (const marker of ['pdf-toolbar','view-mode','download-mode','autoDownload','html2pdf.js/0.10.2/html2pdf.bundle.min.js','.save(filename)','تم إرسال بطاقة PDF إلى التنزيلات.','وضع العرض فقط']) {
  if (!printBlock.includes(marker)) fail(`R1.4.17 direct PDF marker missing: ${marker}`);
}
if (printBlock.includes('navigator.share')) fail('R1.4.17 direct download must not route through share sheet');

ok(`Mobile R1.4.17 PDF View/Direct Download verified: ${version.version}, perm=${employees.perm.length}, cont=${employees.cont.length}, total=${total}, modified=${summary.counts.modified}`);
