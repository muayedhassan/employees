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
  'MOBILE_R1_4_17_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_18_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_19_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_20_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_21_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_22_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_23_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_24_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_25_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_26_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_27_RELEASE_NOTES_AR.txt',
  'MOBILE_R1_4_28_RELEASE_NOTES_AR.txt'
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

const expectedRelease = 'MOBILE-R1.4.28-PDF-LIBRARY-LOADER-FIX';
if (release !== expectedRelease) fail(`VERSION.txt mismatch: ${release}`);
if (!index.includes(`APP_RELEASE = '${expectedRelease}'`)) fail('APP_RELEASE is not Mobile R1.4.27 PDF Vector No Canvas');
if (!String(manifest.description || '').includes('R1.4.28')) fail('manifest description was not updated');

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
for (const marker of ['r1412FormatSalary','معاينة البطاقة','تحميل البطاقة',"r1411Field('رقم الهوية','identityNo',emp.identityNo,'🪪',true)","return numeric+' د.ع';",'identityIssuer b','notes b']) {
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
if (!sw.includes("employee-registry-mobile-r1428-pdf-libfix-2026.09.14")) fail('R1.4.27 app-shell cache marker missing');
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

// R1.4.17 split PDF actions must remain, but R1.4.18 shortens the visible labels.
for (const marker of [
  'Mobile R1.4.17 - separate PDF view and confirmed direct download',
  'id="btn-view-pdf"','id="btn-download-pdf"',
  'id="card-view-pdf-btn"','id="card-download-pdf-btn"',
  'r1417ConfirmEmployeePdfDownload','window.confirm(',
  "printEmployeeCard(emp,'download')","printEmployeeCard(currentEmp,'view')"
]) if (!index.includes(marker)) fail(`R1.4.17 preserved PDF action marker missing: ${marker}`);

if (index.includes('id="btn-print-pdf"') || index.includes('id="card-print-btn"')) fail('combined legacy PDF buttons are still present');

// R1.4.18 WebView-safe direct download.
for (const marker of [
  'Mobile R1.4.18 - WebView-safe PDF download route + concise labels',
  'MOBILE R1.4.18 WEBVIEW-SAFE PDF DOWNLOAD',
  'r1418PdfDownloadUrl','r1418StagePdfBlob','r1418ReceiveGeneratedPdf',
  './__hr_pdf_download__/','STORE_PDF_DOWNLOAD',
  '>معاينة البطاقة</span>','>تحميل البطاقة</span>',
  '> معاينة البطاقة</button>','> تحميل البطاقة</button>'
]) if (!index.includes(marker)) fail(`R1.4.18 PDF marker missing: ${marker}`);

if (index.includes('معاينة فقط بدون تحميل') || index.includes('يطلب تأكيدًا قبل التنزيل')) fail('old PDF button subtexts are still visible');
if (index.includes('<small>معاينة فقط') || index.includes('<small>يطلب تأكيد')) fail('PDF buttons still contain secondary text');

const lastPrint = index.lastIndexOf('printEmployeeCard=function(emp,mode){');
if (lastPrint < 0) fail('mode-aware printEmployeeCard override missing');
const pdf27Start = index.indexOf('/* Mobile R1.4.27 - vector PDF generator: no DOM/canvas capture inside Android WebView */');
if (pdf27Start < 0) fail('R1.4.27 vector PDF block missing');
const printBlock = index.slice(pdf27Start, index.indexOf('// ── MOBILE R1.4.15 UPDATES DETAILS DRILLDOWN', pdf27Start));
for (const marker of ['pdf-toolbar','r1427DownloadEmployeePdf','r1427BuildEmployeePdf','r1420ReceiveGeneratedPdf','وضع العرض فقط']) {
  if (!printBlock.includes(marker)) fail(`PDF generation marker missing: ${marker}`);
}
if (printBlock.includes('.save(filename)')) fail('direct PDF must not depend on browser save()');
if (printBlock.includes('navigator.share')) fail('direct PDF must not route through share sheet');

for (const marker of ['PDF_CACHE_NAME','PDF_ROUTE_MARKER',"'/__hr_pdf_download__/'",'Content-Disposition','application/pdf','stagePdfDownload','STORE_PDF_DOWNLOAD','cache.delete(req.url)']) {
  if (!sw.includes(marker)) fail(`R1.4.18 service worker download marker missing: ${marker}`);
}
const pdfRoutePos = sw.indexOf('url.pathname.includes(PDF_ROUTE_MARKER)');
const navPos = sw.indexOf("req.mode === 'navigate'");
if (pdfRoutePos < 0 || navPos < 0 || pdfRoutePos > navPos) fail('PDF attachment route must run before normal navigation handling');

// R1.4.19 native Median bridge download guards.
for (const marker of [
  'Mobile R1.4.19 - Native Median PDF download bridge',
  'MOBILE R1.4.19 NATIVE MEDIAN PDF DOWNLOAD BRIDGE',
  'r1419NativeDownloader','r1419ReceiveGeneratedPdf',
  "host.share.downloadFile.bind(host.share)",
  "filename:filename||'EmployeeCard.pdf'",'open:false',
  'window.r1419ReceiveGeneratedPdf=r1419ReceiveGeneratedPdf'
]) if (!index.includes(marker)) fail(`R1.4.19 native PDF marker missing: ${marker}`);
if (!index.includes("APP_RELEASE = 'MOBILE-R1.4.28-PDF-LIBRARY-LOADER-FIX'")) fail('R1.4.28 APP_RELEASE marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1428')) fail('R1.4.28 PDF cache marker missing');

// R1.4.20 status/native bridge remains, while R1.4.21 replaces only the failing generator.
for (const marker of [
  'Mobile R1.4.20 - Single-page PDF capture + accurate Android download status',
  'MOBILE R1.4.20 SINGLE-PAGE PDF + DOWNLOAD STATUS',
  'r1420SetDownloadStatus','r1420ReceiveGeneratedPdf',
  'تم حفظ البطاقة في مجلد التنزيلات.'
]) if (!index.includes(marker)) fail(`R1.4.20 preserved marker missing: ${marker}`);

// R1.4.27: vector PDF built directly from employee data, with no DOM/canvas screenshot path.
for (const marker of [
  'Mobile R1.4.27 - vector PDF generator: no DOM/canvas capture inside Android WebView',
  'r1427EnsurePdfLib','r1427InstallFonts','r1427EmployeePdfData','r1427BuildEmployeePdf','r1427DownloadEmployeePdf',
  'SFSultan-Black.ttf','ZainMobile.ttf','Stencil.ttf',
  "pdf.addFileToVFS('ZainMobile.ttf'", "pdf.addFont('ZainMobile.ttf','HRBody','normal')",
  "pdf.roundedRect(margin,10,fullW,30", "pdf.output('blob')",
  'r1420ReceiveGeneratedPdf(blob,filename,null)',
  "if(mode==='download'){r1427DownloadEmployeePdf(emp);return;}"
]) if (!index.includes(marker)) fail(`R1.4.27 vector PDF marker missing: ${marker}`);
for (const forbidden of ['.toCanvas()','captured card is blank','var captureWorker=html2pdf().set(','html2canvas:{scale:']) {
  if (printBlock.includes(forbidden)) fail(`R1.4.27 must not use DOM/canvas capture: ${forbidden}`);
}
if (!printBlock.includes('jspdf/2.5.1/jspdf.umd.min.js')) fail('R1.4.28 jsPDF 2.5.1 primary loader missing');
if (!printBlock.includes('unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js')) fail('R1.4.28 jsPDF fallback loader missing');
if (printBlock.includes('jspdf/2.5.2/jspdf.umd.min.js')) fail('R1.4.28 must not reference unavailable jsPDF 2.5.2 cdnjs file');
if (!index.includes('Mobile R1.4.28 - fix jsPDF loader')) fail('R1.4.28 loader fix marker missing');
if (!printBlock.includes("showToast('تم تحميل البطاقة إلى مجلد التنزيلات')")) fail('R1.4.27 Downloads success message missing');

// R1.4.23: standalone Data Quality navigation is removed and unique audits are merged into Updates > Gaps.
for (const removed of ['id="stab-quality"','id="view-quality"']) {
  if (index.includes(removed)) fail(`R1.4.23 removed Quality navigation still present: ${removed}`);
}
for (const marker of [
  'Mobile R1.4.23 - merge the non-duplicated Data Quality tools into the existing Updates Center',
  'updatesQualityExtrasHTML',
  'id="updates-quality-extra"',
  'فحوص الجودة الإضافية',
  'دون تكرار النواقص أعلاه',
  'data-update-quality-filter="dupEmployeeNo"',
  'data-update-quality-filter="dupIdentityNo"',
  'data-update-quality-emp',
  "h+=gapsHTML()+updatesQualityExtrasHTML();"
]) if (!index.includes(marker)) fail(`R1.4.23 merged quality marker missing: ${marker}`);
if (!index.includes("grid-template-columns:repeat(5,minmax(0,1fr))!important")) fail('R1.4.23 five-button navigation grid missing');
if (!index.includes("if(v==='quality'){UPDATE_SECTION_VIEW='gaps';v='updates';}")) fail('legacy quality route is not redirected to Updates > Gaps');
if (index.includes("switchSub('quality')")) fail('standalone Quality navigation path is still invoked');
if (!index.includes("if(action.indexOf('quality:')===0){var qf=action.split(':')[1]||'all';UPDATE_SECTION_VIEW='gaps'")) fail('quality alerts are not routed into Updates > Gaps');
// The four established Updates tabs must remain exactly available.
for (const marker of ['<b>التعديلات</b>','<b>الجديد</b>','<b>النواقص</b>','<b>المراجعة</b>']) {
  if (!buildUpdatesBlock.includes(marker)) fail(`R1.4.23 changed established Updates tab: ${marker}`);
}


// R1.4.24: professional Reports Studio redesign and styled exports.
for (const marker of [
  'Mobile R1.4.24 - Reports Studio complete professional redesign',
  'MOBILE R1.4.24 REPORTS STUDIO REDESIGN',
  'r1424-suite','r1424-hero','r1424-templates','r1424-column-grid',
  'استوديو التقارير الاحترافي','Excel منسق','طباعة / PDF رسمي',
  'r1424ExportStyledExcel','r1424Completeness','r1424ApplyPreset',
  'data-col-preset="basic"','data-col-preset="job"','data-col-preset="all"',
  'r1424-preview-wrap','r1424-doc-kpis','r1424SvgEmblem',
  "orientation=cols.length<=6?'portrait':'landscape'",
  'assets/fonts/YaModernPro-Bold.otf','assets/fonts/ZainMobile.ttf','assets/fonts/Stencil.ttf'
]) if (!index.includes(marker)) fail(`R1.4.24 reports marker missing: ${marker}`);
if (!index.includes('id="report-xls-btn"')) fail('R1.4.24 styled Excel export button missing');
if (!index.includes("type:'application/vnd.ms-excel;charset=utf-8;'")) fail('R1.4.24 styled Excel MIME export missing');
if (!index.includes("thead{display:table-header-group}")) fail('R1.4.24 printable repeated table header missing');
if (!index.includes('grid-template-columns:repeat(4,minmax(0,1fr))')) fail('R1.4.24 report template grid missing');


// R1.4.25: report polish requested after R1.4.24.
for (const marker of [
  'Mobile R1.4.25 - Reports polish: gold icons, editable scope, clear column state',
  'MOBILE R1.4.25 REPORTS POLISH: startup toast removed, Western dates, editable scope, gold report icons and column states',
  "scope:''",
  'id="report-scope-input"',
  'r1425AutoScope','r1425EnglishDate',
  "toLocaleDateString('en-GB')",
  'r1425-doc-scope-text','r1425-doc-scope-value',
  '.r1424-template i{color:#ffd75d!important',
  '.r1424-col input:checked+span{opacity:1;color:#18224b',
  'REPORT_STATE.scope=this.value'
]) if (!index.includes(marker)) fail(`R1.4.25 reports polish marker missing: ${marker}`);
if (index.includes("showToast((LAST_DATA_STATUS?LAST_DATA_STATUS+' — ':'') + (BASE.perm.length+BASE.cont.length) + ' موظف في السجل')")) fail('R1.4.25 startup status toast is still present');
if (index.includes('id="report-scope-input" value="'+"'+escapeHTML(reportScopeText())+'"+'" disabled')) fail('R1.4.25 report scope is still disabled');
if (!index.includes("REPORT_STATE.scope='';buildReports();")) fail('R1.4.25 report type/segment scope reset missing');

ok(`Mobile R1.4.28 PDF Library Loader Fix verified: ${version.version}, perm=${employees.perm.length}, cont=${employees.cont.length}, total=${total}, modified=${summary.counts.modified}`);
