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
  'data/job-titles.json','CLEAN_BASELINE_R1_4_71_AR.txt'
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
let jobTitles;
try { jobTitles = JSON.parse(read('data/job-titles.json')); } catch (e) { fail(`job-titles JSON invalid: ${e.message}`); }

const expectedRelease = 'MOBILE-R1.4.80-MANAGER-NOTES-REVIEW-EMPLOYEE-SEARCH-FIX';
if (release !== expectedRelease) fail(`VERSION.txt mismatch: ${release}`);
if (!index.includes(`APP_RELEASE = '${expectedRelease}'`)) fail('APP_RELEASE is not Mobile R1.4.80 manager notes review employee search fix');
if (!String(manifest.description || '').includes('R1.4.80')) fail('manifest description was not updated to R1.4.80');
// R1.4.73: allow running verification inside an actual Git working tree; clean ZIPs still omit .git.
for (const stale of fs.readdirSync(root).filter(name => /^INSTALL_PATCH_R1_4_|^PATCH_FILES_R1_4_|^MOBILE_R1_4_.*_RELEASE_NOTES_AR\.txt$/.test(name))) fail(`stale patch/release file still present: ${stale}`);
for (const marker of ['MOBILE R1.4.73: cleanup stray header marker and restore compact record-scope cards','r1473-header-cleanup-scope-cards-restore-style','r1473-header-cleanup-scope-cards-restore-script','employee-registry-mobile-r1473-header-cleanup-scope-cards-restore-2026.09.20']) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.73 header cleanup/scope restore marker missing: ${marker}`);
}
if (!index.includes('.r1472-dashboard-pro .main-tab{min-height:43px')) fail('R1.4.73 compact scope card override missing');
for (const marker of ['MOBILE R1.4.74: combined branch export','r1474-combined-branch-export-script','r1474CombinedBranchRows','الدائميون أولًا ثم العقود','employee-registry-mobile-r1474-combined-branch-export-2026.09.20']) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.74 combined branch export marker missing: ${marker}`);
}
if (!index.includes("return (BASE.perm||[]).concat(BASE.cont||[]);")) fail('R1.4.74 combined perm+contract source missing');
if (!index.includes("ak=kind(a)==='perm'?0:1")) fail('R1.4.74 permanent-first export order guard missing');

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
const genderRecords = [...employees.perm, ...employees.cont].filter(e => String(e?.gender || '').trim());
if (!genderRecords.length) fail('employee gender data is unavailable for R1.4.33 reports');

// Service worker must force a fresh app shell while keeping central data network-first.
if (!sw.includes("employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19")) fail('R1.4.48 app-shell cache marker missing');
for (const marker of ['skipWaiting','clients.claim','networkFirst','staleWhileRevalidate','raw.githubusercontent.com']) {
  if (!sw.includes(marker)) fail(`service worker marker missing: ${marker}`);
}
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) fail('manifest icons are missing');

// R1.4.48 partial patch guards: unified branch reports across permanent and contract employees.
for (const marker of [
  'MOBILE R1.4.48: unified branch selector',
  'r1448-branch-contract-link-script',
  'data-r1448-scope',
  'employmentKind',
  'r1448ReportCards',
  'نطاق الموظفين داخل التقرير',
  'الجميع','الدائميون','العقود'
]) if (!index.includes(marker)) fail(`R1.4.48 branch/contracts patch marker missing: ${marker}`);
if (!index.includes("cards=(typeof r1448ReportCards==='function'?r1448ReportCards(ds):dynamicCards(ds))")) fail('R1.4.48 PDF card bridge missing');




// R1.4.49 partial patch guards: multi-branch independent PDF pages with no signatures.
for (const marker of [
  'MOBILE R1.4.49: multi-branch independent PDF pages',
  'r1449-multi-branch-pages-style',
  'r1449-multi-branch-pages-script',
  'data-r1449-division',
  'r1449BuildPdf',
  'اختيار أكثر من شعبة / قسم',
  'كل شعبة أو قسم يبدأ بصفحة جديدة',
  'بدون تواقيع',
  'كشف-متعدد-الشعب'
]) if (!index.includes(marker)) fail(`R1.4.49 multi-branch export marker missing: ${marker}`);
if (index.includes('r1449-signature-grid') || index.includes('r1449-doc-sign')) fail('R1.4.49 must not add signatures to the multi-branch PDF export');
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.49 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.49 PDF cache marker missing');
for (const marker of ['MOBILE R1.4.50: restore R1.4.48 PDF design for multi-branch export','r1450-multi-branch-design-restore-script','FIXED_BRANCH_COLS','r1450BuildPdf']) {
  if (!index.includes(marker)) fail(`R1.4.50 design restore marker missing: ${marker}`);
}
if (!index.includes("{k:'name',l:'الاسم الكامل'}") || !index.includes("{k:'division',l:'الشعبة'}") || !index.includes("{k:'employmentStatus',l:'الحالة الوظيفية'}")) fail('R1.4.50 fixed PDF column order missing');
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.50 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.50 PDF cache marker missing');
ok(`Mobile R1.4.50 Multi Branch PDF Design Restore verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);
for (const marker of ['MOBILE R1.4.51: PDF columns sync with preview','r1451-column-sync-script','r1451PdfColumns','pdfColumns()','MOBILE-R1.4.51-MULTI-BRANCH-COLUMN-SYNC']) {
  if (!index.includes(marker)) fail(`R1.4.51 column sync marker missing: ${marker}`);
}
if (index.includes("REPORT_COLUMN_DEFS.splice(idx>=0?idx+1:4,0,{k:'employmentKind'")) fail('R1.4.51 must not auto-add duplicate employmentKind column');
if (!index.includes("k==='employmentKind'||k==='type'")) fail('R1.4.51 duplicate employment kind cleanup missing');
ok(`Mobile R1.4.51 Multi Branch Column Sync verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

for (const marker of ['MOBILE R1.4.52: professional PDF report visual upgrade','r1452-professional-report-visual-upgrade-script','r1452BuildPdf','r1452PdfColumns','HRPdfZain','HRPdfSultan','ZainMobile.ttf','SFSultan-Black.ttf','كشف-احترافي','employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19','employee-registry-pdf-downloads-r1452']) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.52 professional visual marker missing: ${marker}`);
}
if (!index.includes("font:'HRPdfZain',weight:'400'")) fail('R1.4.52 Zain headings must be regular weight, not bold');
if (!index.includes("font:numeric?'HRPdfNum':'HRPdfSultan'")) fail('R1.4.52 table body must use SF Sultan for non-numeric data');
if (index.includes("font:'HRPdfZain',weight:'700'") || index.includes("font:'HRPdfZain',weight:'900'")) fail('R1.4.52 must not draw Zain headings in bold');
ok(`Mobile R1.4.52 Professional PDF Visual Upgrade verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

for (const marker of ['MOBILE R1.4.53: mobile service calculator card','r1453-mobile-service-calculator-script','r1453BuildServiceCalculator','حاسبة الخدمة الفعلية','svc-start','svc-end','employee-registry-mobile-r1453-service-calculator-card-2026.09.19','employee-registry-pdf-downloads-r1453']) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.53 service calculator marker missing: ${marker}`);
}
if (!index.includes("switchSub('service')")) fail('R1.4.53 service calculator navigation missing');
ok(`Mobile R1.4.53 Service Calculator Card verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

for (const marker of ['MOBILE R1.4.54: service calculator notes layout polish','r1454-notes-panel','r1454-note-card law','r1454-note-card add','r1454-note-card stop','ملاحظات إدارية مهمة','إضاءة قانونية وإدارية','المدد التي تُضاف للخدمة الوظيفية','المدد التي لا تُحتسب ضمن الخدمة الفعلية','employee-registry-mobile-r1454-service-calculator-notes-layout-polish-2026.09.19','employee-registry-pdf-downloads-r1454']) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.54 service calculator notes polish marker missing: ${marker}`);
}
for (const removed of ['واجهة هاتفية لحساب سنوات وأشهر وأيام الخدمة','نسخة موبايل مستقلة عن حاسبة Windows','الحساب يعتمد على فرق التقويم بين التاريخين','الغرض:</strong>']) {
  if (index.includes(removed)) fail(`R1.4.54 removed explanatory text still present: ${removed}`);
}
ok(`Mobile R1.4.54 Service Calculator Notes Layout Polish verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

for (const marker of ['MOBILE R1.4.55: service calculator navigation isolation fix','clearServiceMode','baseSwitchMain','employee-registry-mobile-r1455-service-calculator-navigation-fix-2026.09.19','employee-registry-pdf-downloads-r1455']) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.55 service calculator navigation fix marker missing: ${marker}`);
}
if (!index.includes("document.body.classList.remove('subview-service');")) fail('R1.4.55 service mode cleanup missing');
if (!index.includes("var result=baseSwitchSub(v);") || !index.includes("var result=baseSwitchMain(m);")) fail('R1.4.55 navigation wrapper missing');
ok(`Mobile R1.4.55 Service Calculator Navigation Fix verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

for (const marker of ['MOBILE R1.4.58: job titles direct search grade layout','r1458-jobtitles-direct-search-grade-layout-script','r1458BuildJobTitles','updateJobResults','jobtitle-chips-wrap','type="text" inputmode="search"','العناوين الوظيفية حسب الدرجة','jobtitle-search','r1458-degree-panel','التحديد يظهر باللون الذهبي','data/job-titles.json','employee-registry-mobile-r1463-splash-loading-restore-2026.09.19','employee-registry-pdf-downloads-r1463']) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.58 job titles direct search marker missing: ${marker}`);
}
if (index.includes('id="jobtitle-degree"') || index.includes('jobtitle-stats-wrap')) fail('R1.4.58 must remove the degree select and the stat cards below search');
if (!Array.isArray(jobTitles.rows) || jobTitles.rows.length !== 1316 || jobTitles.total !== 1316) fail('R1.4.58 job titles total must remain exactly 1316');
const expectedJobTitleCounts = {'الأولى':124,'الثانية':159,'الثالثة':172,'الرابعة':177,'الخامسة':182,'السادسة':187,'السابعة':173,'الثامنة':89,'التاسعة':26,'العاشرة':27};
for (const [degree, count] of Object.entries(expectedJobTitleCounts)) {
  if (!jobTitles.counts || jobTitles.counts[degree] !== count) fail(`R1.4.58 job title count mismatch for ${degree}`);
  if (!index.includes(degree)) fail(`R1.4.58 degree label missing in UI: ${degree}`);
}
const seqs = jobTitles.rows.map(r => r.seq);
if (seqs[0] !== 1 || seqs[seqs.length - 1] !== 1316 || new Set(seqs).size !== 1316) fail('R1.4.58 job title serial sequence is incomplete');
if (!sw.includes('./data/job-titles.json')) fail('R1.4.58 job titles file is not cached in the app shell');
if (index.includes("s.oninput=function(){jobState.q=this.value||'';renderJobTitles();}")) fail('R1.4.58 search input still rebuilds the full page and may hide the keyboard');
if (!index.includes("s.addEventListener('input',function(){jobState.q=this.value||'';updateJobResults();})")) fail('R1.4.58 direct input search binding missing');
if (!index.includes('.r1456-degree-chips{display:flex')) fail('R1.4.58 degree chips must be horizontal/flex, not vertical');
if (!index.includes('.r1456-chip.active{background:linear-gradient(135deg,#ffd166,#fff0a6)')) fail('R1.4.58 selected degree must be gold');
for (const marker of ['MOBILE-R1.4.63-SPLASH-LOADING-RESTORE','R1.4.63: restore the original data-loading splash experience','var r1463MinSplash=2300','},6200);','employee-registry-mobile-r1463-splash-loading-restore-2026.09.19','employee-registry-pdf-downloads-r1463']) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.63 splash loading restore marker missing: ${marker}`);
}
if (index.includes('R1.4.62: unlock the interface immediately after rendering data')) fail('R1.4.63 must not hide the startup screen immediately after render');
ok(`Mobile R1.4.63 Splash Loading Restore verified: titles=${jobTitles.total}`);


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
if (!index.includes(`APP_RELEASE = '${expectedRelease}'`)) fail('current APP_RELEASE marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.48 PDF cache marker missing');

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
  'SFSultan-Black.ttf','Stencil.ttf',
  "pdf.addFileToVFS('SFSultan-Black.ttf'", "pdf.addFont('SFSultan-Black.ttf','HRBody','normal')",
  "pdf.addFont('SFSultan-Black.ttf','HRHead','normal')",
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
// R1.4.29 remains in history, but R1.4.30 intentionally bypasses jsPDF Arabic text shaping entirely.
// Keep only a regression guard that the old double-shaping call was not reintroduced.
const arabicHelperStart = printBlock.indexOf('function r1427Arabic(pdf,value){');
const arabicHelperEnd = printBlock.indexOf('function r1427IsStrictNumeric', arabicHelperStart);
if (arabicHelperStart < 0 || arabicHelperEnd < 0) fail('legacy Arabic helper block missing');
const arabicHelper = printBlock.slice(arabicHelperStart, arabicHelperEnd);
if (arabicHelper.includes('pdf.processArabic(')) fail('legacy double processArabic regression detected');
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
]) if (!index.includes(marker)) fail(`R1.4.24 reports marker missing: ${marker}`);
if (!index.includes('id="report-xls-btn"')) fail('R1.4.24 styled Excel export button missing');
if (!index.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) fail('R1.4.34 XLSX MIME export missing');
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

// R1.4.30 radical Arabic PDF guard: browser Canvas shapes Arabic; jsPDF only wraps the final image.
for (const marker of [
  'Mobile R1.4.30 - browser-shaped Arabic PDF',
  'r1430EnsureCanvasFonts','r1430BuildCardCanvas','HRPdfBody','HRPdfTitle','HRPdfNum',
  "canvas.toDataURL('image/png')",
  "pdf.addImage(rendered.image,'PNG',0,0,210,297"
]) if (!index.includes(marker)) fail(`R1.4.30 PDF marker missing: ${marker}`);
const r1430Start=index.indexOf('/* Mobile R1.4.30 - browser-shaped Arabic PDF');
const r1430End=index.indexOf('async function r1427DownloadEmployeePdf',r1430Start);
if(r1430Start<0||r1430End<0) fail('R1.4.30 PDF block not found');
const r1430Block=index.slice(r1430Start,r1430End);
if(r1430Block.includes('processArabic(')) fail('R1.4.30 must not shape Arabic with jsPDF');
if(r1430Block.includes('pdf.text(')) fail('R1.4.30 final PDF builder must not write text with jsPDF');
if(!r1430Block.includes("ctx.direction=opt.numeric?'ltr':'rtl'")) fail('R1.4.30 RTL browser-canvas direction missing');
if(!r1430Block.includes("new FontFace(name,'url(\"'+r1411FontUrl(file)+'\")'")) fail('R1.4.30 local project font loader missing');

// R1.4.31 PDF footer + salary polish guards.
for (const marker of [
  'Mobile R1.4.31 - PDF footer cleanup + salary numeric font consistency',
  'r1431DrawSalaryField',
  "r1431DrawSalaryField(ctx,S,x,y,182,12,'الراتب',d.salary)",
  "family:'HRPdfNum',weight:'700',numeric:true",
  'visible PDF footer metadata and HRSystem badge intentionally removed'
]) if (!index.includes(marker)) fail(`R1.4.31 PDF polish marker missing: ${marker}`);
const r1431CanvasStart=index.indexOf('async function r1430BuildCardCanvas(emp,qualityScale){');
const r1431CanvasEnd=index.indexOf('// Sanity check: the final canvas must contain substantial non-white content.',r1431CanvasStart);
if(r1431CanvasStart<0||r1431CanvasEnd<0) fail('R1.4.31 canvas block not found');
const r1431Canvas=index.slice(r1431CanvasStart,r1431CanvasEnd);
for(const removed of ["r1430Text(ctx,'المعرّف الثابت'","r1430Text(ctx,'إصدار البيانات'","r1430Text(ctx,'وقت الإنشاء'","ctx.fillText('HRSystem'"]){
  if(r1431Canvas.includes(removed)) fail(`R1.4.31 removed footer item still rendered: ${removed}`);
}


// R1.4.32 dashboard/header redesign guards.
for (const marker of [
  'Mobile R1.4.32 - Home header redesign + compact hero metadata',
  'r1432-header','r1432-date-bar','r1432-connection-strip',
  'r1432-runtime-count','r1432-hidden-runtime',
  'r1432-home-hero','r1432-hero-meta','r1432-meta-badge',
  'mobileR1432ReleaseShort',
  '<span>إصدار البرنامج</span>',
  'واجهة موحدة للبحث والمتابعة والوصول السريع إلى بيانات الموظفين.'
]) if (!index.includes(marker)) fail(`R1.4.32 dashboard marker missing: ${marker}`);

if (index.includes('<span class="r147-mode-pill"><i class="fas fa-sparkles"></i> واجهة منظمة</span>')) fail('R1.4.32 old interface mode pill is still rendered');
if (index.includes('class="r147-version-badge"')) fail('R1.4.32 old data-version hero badge class is still rendered');
if (!index.includes("scopeLabel=mode==='cont'?'العقود':'الدائميون'")) fail('R1.4.32 scope KPI replacement missing');
if (!index.includes('grid-template-columns:1fr 1fr!important')) fail('R1.4.32 two-chip header/date layout missing');

// R1.4.33 gender/report UI guards must remain intact.
for (const marker of [
  'MOBILE R1.4.33 REPORTS GENDER + EXPORT FIX',
  "{k:'gender',l:'الجنس',defaultOn:true}",
  'r1433GenderValue','r1433GenderStats',
  'r1433-gender-male','r1433-gender-female',
  '>الذكور</div>','>الإناث</div>',
  'async function r1424DownloadBlob',
  'r1419NativeDownloader',
  "filename:name,open:false"
]) if (!index.includes(marker)) fail(`R1.4.33 preserved report marker missing: ${marker}`);
if (!index.includes("var R1424_BASIC=['num','employeeNo','name','gender'")) fail('gender is missing from Basic report preset');
if (!index.includes("var R1424_JOB=['employeeNo','name','gender'")) fail('gender is missing from Job report preset');

// R1.4.34 reliable export guards.
for (const marker of [
  'MOBILE R1.4.34 REPORTS EXPORT RELIABILITY FIX',
  'r1434EnsureXlsxLib','xlsx.full.min.js','bookType:\'xlsx\'',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  "r1424Filename('xlsx')",
  'r1434BuildReportPdf','r1434CanvasText','r1430EnsureCanvasFonts','r1427EnsurePdfLib',
  "pdf.output('blob')","r1419ReceiveGeneratedPdf(blob,r1424Filename('pdf'),null)",
  'r1434BuildReportPdf'
]) if (!index.includes(marker)) fail(`R1.4.34 export marker missing: ${marker}`);
if (index.includes("r1424Filename('xls')")) fail('legacy HTML-as-XLS export is still present');
if (!index.includes("lines.join('\\r\\n')") || !index.includes("r1424Filename('csv')")) fail('CSV export marker missing');
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('current cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.48 PDF cache marker missing');

for (const marker of ['MOBILE R1.4.35 REPORT BUILDER STUDIO + HQ PDF','r1435-workflow','data-r1435-tab=','data-r1435-quality','R1435_REPORT_PREFS','pdfScale=prefs.quality','canvas.width=Math.round(CW*pdfScale)']) if (!index.includes(marker)) fail(`R1.4.35 marker missing: ${marker}`);
ok(`Mobile R1.4.35 Report Builder Studio + HQ PDF verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${summary.counts.modified}`);


// R1.4.36 duplicate full-name card guards.
for (const marker of [
  'Mobile R1.4.36 - Duplicate Full Name Card inside Updates Center quality tools',
  'r1436FullNameKey','r1436DuplicateFullNameGroups','dupFullName',
  'data-update-quality-filter="dupFullName"','الأسماء المكررة','يعتمد على تطابق الاسم الكامل فقط',
  'الاسم الكامل مكرر'
]) if (!index.includes(marker)) fail(`R1.4.36 duplicate-name marker missing: ${marker}`);
if (!index.includes("QUALITY_FILTER==='dupEmployeeNo'||QUALITY_FILTER==='dupIdentityNo'||QUALITY_FILTER==='dupFullName'")) fail('R1.4.36 quality row routing missing');
if (!index.includes("String(value==null?'':value).trim().replace(/\\s+/g,' ')")) fail('R1.4.36 full-name whitespace normalization missing');
ok(`Mobile R1.4.36 Duplicate Full Name Card verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

// R1.4.37 employee intelligence suite guards.
for (const marker of [
  'MOBILE R1.4.37 EMPLOYEE INTELLIGENCE SUITE','R1437_CABINET_RANGES','r1437CabinetLocation',
  'r1437EmployeeTimelineHTML','سجل حركة الموظف','r1437-timeline','r1437OpenAdminDashboard',
  'لوحة الإحصائيات الإدارية','r1437-open-stats',"{id:'01',from:1,to:42,label:'الدولاب 01'}","{id:'02',from:43,to:88,label:'الدولاب 02'}"
]) if (!index.includes(marker)) fail(`R1.4.37 intelligence marker missing: ${marker}`);
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.37 cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.37 PDF cache marker missing');
ok(`Mobile R1.4.37 Employee Intelligence Suite preserved: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);
// R1.4.38 smart follow-up / History 2.0 guards.
for (const marker of [
  'MOBILE R1.4.38 SMART FOLLOW-UP + HISTORY 2.0','r1438OpenFollowup','مركز المتابعة الذكي',
  'r1438HistoryHTML','HISTORY 2.0','data-r1438-hfilter','r1438-quickbar','نسخ الرقم',
  'r1438-file-chip',"followCard('duplicates'",'آخر نشاط منشور'
]) if (!index.includes(marker)) fail(`R1.4.38 smart workflow marker missing: ${marker}`);
if (!index.includes("id=\"r1438-open-follow\"")) fail('R1.4.38 follow-up hero action missing');
if (!index.includes("document.querySelectorAll('#m-profile-body .r1437-loc,#m-profile-body .r1437-archive')")) fail('R1.4.38 large archive-location removal guard missing');
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.38 cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.38 PDF cache marker missing');
ok(`Mobile R1.4.38 Smart Follow-up + History 2.0 verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

// R1.4.39 mobile profile responsive polish guards.
for (const marker of [
  'MOBILE R1.4.39 MOBILE PROFILE RESPONSIVE POLISH','r1439-mobile-profile-polish',
  'grid-template-columns:repeat(3,minmax(0,1fr))','grid-template-columns:minmax(0,1fr) 18px minmax(0,1fr)',
  'word-break:normal!important','overflow-wrap:break-word!important','max-height:96dvh!important'
]) if (!index.includes(marker)) fail(`R1.4.39 responsive marker missing: ${marker}`);
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.39 cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.39 PDF cache marker missing');
ok(`Mobile R1.4.39 Mobile Profile Responsive Polish verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

// R1.4.40 employee-card 300 DPI guards.
for (const marker of [
  'MOBILE R1.4.40 EMPLOYEE CARD 300 DPI',
  'async function r1430BuildCardCanvas(emp,qualityScale)',
  'W=Math.round(1240*q),H=Math.round(1754*q)',
  'rendered=await renderAt(2.0)',
  "rendered=await renderAt(1.5)",
  "pdf.addImage(rendered.image,'PNG',0,0,210,297,undefined,'SLOW')",
  '300 DPI employee card fallback to 225 DPI'
]) if (!index.includes(marker)) fail(`R1.4.40 high-resolution employee PDF marker missing: ${marker}`);
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.40 cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.40 PDF cache marker missing');

// R1.4.41 Dashboard + Data Version UI Polish guards.
for (const marker of [
  'Mobile R1.4.41 - Dashboard + Data Version UI Polish',
  'إصدار قاعدة البيانات',
  'r1441-kpis',
  'is-current',
  'is-selected-alt',
  'r1441-backup-version',
  "document.getElementById('hdr-title').textContent=isAdmin?'لوحة التحكم - الإدارة':'سجل الموظفين';",
  'جمهورية العراق • وزارة الزراعة'
]) if (!index.includes(marker)) fail(`R1.4.41 marker missing: ${marker}`);
if (index.includes('<div class="hdr-title" id="hdr-title">سجل الموظفين الدائميين</div>')) fail('R1.4.41 old permanent-only header title still present');
if (index.includes("isPerm?'سجل الموظفين الدائميين':'سجل موظفي العقود'")) fail('R1.4.41 old mode-specific header title logic still present');
if (index.includes('<div class="safety-note"><i class="fas fa-circle-info"></i> في وضع Windows Master')) fail('R1.4.41 old Windows Master safety note still present');
if (index.includes("<span>المعروض</span><b>'+shown+'</b><small>نتائج حالية</small>")) fail('R1.4.41 displayed-results KPI still present');
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.41 cache marker missing');

ok(`Mobile R1.4.40 Employee Card 300 DPI verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);
ok(`Mobile R1.4.41 Dashboard + Data Version UI Polish verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);
// R1.4.42 Windows-style professional report export guards.
for (const marker of [
  'MOBILE R1.4.42 WINDOWS STYLE PROFESSIONAL REPORTS',
  'r1442-windows-report-style',
  'r1442-windows-report-script',
  'مديرية زراعة صلاح الدين',
  'نظام شؤون الموظفين والموارد البشرية',
  'منشئ التقرير: نظام شؤون الموظفين',
  'كروت الصفحة الأولى فقط',
  'statCard(ctx,startX',
  'firstRows=',
  'otherRows=',
  "text(ctx,'صفحة '+(page+1)+' من '+total",
  "text(ctx,'عدد السجلات: '+records",
  'r1442-preview-report-title'
]) if (!index.includes(marker)) fail(`R1.4.42 professional report marker missing: ${marker}`);
for (const removed of [
  "ctx.fillText((DATA_VERSION||'—')+'   |   '+ref",
  "ctx.fillText('Page '+(page+1)+' / '+totalPages",
  "['اكتمال البيانات',score+'%']",
  "['نوع السجل',mode==='perm'?'دائمي':'عقود']",
  "r1434CanvasText(ctx,'نطاق التقرير: '+reportScopeText()",
  "تم إنشاء التقرير من نظام سجل موظفي مديرية زراعة صلاح الدين • '+APP_RELEASE"
]) {
  const r1442Start=index.indexOf('/* MOBILE R1.4.42 WINDOWS STYLE PROFESSIONAL REPORTS */');
  const r1442Block=r1442Start>=0?index.slice(r1442Start):'';
  if (r1442Block.includes(removed)) fail(`R1.4.42 removed legacy report element reintroduced: ${removed}`);
}
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.42 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.42 PDF cache marker missing');
ok(`Mobile R1.4.42 Windows Style Professional Reports verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);
// R1.4.43 Windows-report visual polish guards.
for (const marker of [
  'MOBILE R1.4.43 WINDOWS REPORT VISUAL POLISH',
  'r1443-windows-report-visual-style',
  'r1443-windows-report-visual-script',
  'r1443BuildPdf',
  'drawFullHeader(ctx,CW,margin,title,ds)',
  'drawStats(ctx,CW,margin,stats)',
  "['ذكور',stats.male",
  "['إناث',stats.female",
  "['عقود',stats.cont",
  "['دائمي',stats.perm",
  "['الإجمالي',stats.total",
  'Ya Modern Pro',
  'ZainMobile',
  'Stencil',
  'r1443-preview-head',
  'r1443-preview-table-title',
  "text(ctx,'صفحة '+(page+1)+' من '+total",
  "text(ctx,'عدد السجلات: '+records"
]) if (!index.includes(marker)) fail(`R1.4.43 report visual marker missing: ${marker}`);
if (!index.includes("if(window.r1443BuildPdf)window.r1443BuildPdf();else buildPdf();")) fail('R1.4.43 report button routing missing');
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.43 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.43 PDF cache marker missing');
ok(`Mobile R1.4.43 Windows Report Visual Polish verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

// R1.4.44 report cards + table typography polish guards.
for (const marker of [
  'MOBILE R1.4.44 REPORT CARDS + TABLE TYPOGRAPHY POLISH',
  'r1444-report-cards-table-typography-style',
  'r1444-report-cards-table-typography-script',
  'r1444BuildPdf',
  "r1430LoadCanvasFont('HRPdfSultan','SFSultan-Black.ttf','900')",
  "font:'HRPdfBody',weight:'700',color:'#fff'",
  "font:isNum?'HRPdfNum':'HRPdfSultan'",
  'r1444-kpi-icon',
  'دائمي', 'عقود', 'إناث', 'ذكور',
  "window.r1443BuildPdf=buildPdf"
]) if (!index.includes(marker)) fail(`R1.4.44 report polish marker missing: ${marker}`);
const r1444Start=index.indexOf('/* MOBILE R1.4.44 REPORT CARDS + TABLE TYPOGRAPHY POLISH */');
const r1444Block=r1444Start>=0?index.slice(r1444Start):'';
if (r1444Block.includes("['الإجمالي'")) fail('R1.4.44 total KPI was reintroduced in the new report block');
if (r1444Block.includes('drawTableTitle(')) fail('R1.4.44 table title/results strip was reintroduced');
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.44 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.44 PDF cache marker missing');
ok(`Mobile R1.4.44 Reports Cards & Table Typography Polish verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

// R1.4.45 adaptive professional reports phase 1 guards.
for (const marker of [
  'MOBILE R1.4.45 ADAPTIVE REPORT DESIGN PHASE 1',
  'r1445-adaptive-report-phase1-style',
  'r1445-adaptive-report-phase1-script',
  'r1445BuildPdf',
  'function smartTitle()',
  'function contextItems()',
  'function dynamicCards(ds)',
  'function drawContext(ctx,CW,margin,items,y)',
  'كشف الموظفين المعدلين في آخر تحديث',
  'الشعب الممثلة',
  'العناوين الوظيفية',
  'حقول ناقصة',
  'r1445-context-strip',
  'r1445-smart-title',
  'otherTop=102',
  'window.r1444BuildPdf=buildPdf'
]) if (!index.includes(marker)) fail(`R1.4.45 adaptive report marker missing: ${marker}`);
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.45 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.45 PDF cache marker missing');
ok(`Mobile R1.4.45 Adaptive Report Design Phase 1 verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);
// R1.4.46 adaptive professional reports phase 2 guards.
for (const marker of [
  'MOBILE R1.4.46 ADAPTIVE REPORT DESIGN PHASE 2',
  'r1446-adaptive-report-phase2-style',
  'r1446-adaptive-report-phase2-script',
  'r1446BuildPdf',
  "compact:{label:'رسمي مختصر'",
  "detailed:{label:'رسمي تفصيلي'",
  "quick:{label:'كشف سريع'",
  "admin:{label:'كشف إداري'",
  'function orientationFor(cols)',
  "return (cols||[]).length<=4?'portrait':'landscape'",
  'اتجاه الصفحة تلقائي',
  'function cellStyle(col,value)',
  'function drawInstitutionalFooter(ctx,CW,CH,margin,page,total,records)',
  "font:st.numeric?'HRPdfNum':'HRPdfSultan'",
  "orientation:orientation,unit:'mm',format:'a4'",
  "pdf.addPage('a4',orientation)",
  'r1446-template-presets',
  'r1446-preview-orientation',
  'window.r1445BuildPdf=buildPdf'
]) if (!index.includes(marker)) fail(`R1.4.46 adaptive report phase 2 marker missing: ${marker}`);
if (!sw.includes('employee-registry-mobile-r1452-professional-pdf-visual-upgrade-2026.09.19')) fail('R1.4.46 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1452')) fail('R1.4.46 PDF cache marker missing');

// R1.4.71 title matching card polish guards.
for (const marker of [
  'MOBILE R1.4.71: title matching card polish + stray marker cleanup over stable R1.4.70',
  'r1471-stray-marker-cleanup',
  'r1471-card-main',
  'r1471-avatar',
  'r1471-meta',
  'الدرجة الوظيفية',
  'الشعبة / القسم',
  'MOBILE-R1.4.71-TITLE-MATCHING-CARD-POLISH'
]) if (!index.includes(marker)) fail(`R1.4.71 matching card polish marker missing: ${marker}`);
const r1471CardFn = index.slice(index.indexOf('function r1471Icon'), index.indexOf('function renderResults', index.indexOf('function r1471Icon')));
for (const removed of ['نوع التعيين', 'الأضبارة', 'الرقم الوظيفي']) {
  if (r1471CardFn.includes(removed)) fail(`R1.4.71 matching card still renders removed field: ${removed}`);
}
if (!sw.includes('employee-registry-mobile-r1472-main-dashboard-professional-reorg-2026.09.20')) fail('R1.4.72 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1472')) fail('R1.4.72 PDF cache marker missing');

// R1.4.70 safe matching rebuild guards: matching must be isolated from boot and program cards must be professional.
for (const marker of [
  'MOBILE R1.4.70: safe title/grade matching rebuild + professional program cards',
  'r1470-title-match-style',
  'r1470-title-match-script',
  'view-titlematch',
  'مطابقة العنوان الوظيفي مع الدرجة',
  'r1470-program-grid',
  'r1470BuildTitleMatching',
  "switchSub('titlematch')"
]) if (!index.includes(marker)) fail(`R1.4.70 matching rebuild marker missing: ${marker}`);
if (!sw.includes('employee-registry-mobile-r1472-main-dashboard-professional-reorg-2026.09.20')) fail('R1.4.70/72 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1472')) fail('R1.4.70/72 PDF cache marker missing');

ok(`Mobile R1.4.46 Adaptive Report Design Phase 2 verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);


// R1.4.72 main dashboard professional reorganization guards.
for (const marker of [
  'MOBILE R1.4.72: main dashboard professional reorganization',
  'r1472-main-dashboard-professional-reorganization-style',
  'r1472-main-dashboard-professional-reorganization-script',
  'r1472-dashboard-pro',
  'r1472-program-grid',
  'r1472-home-actions-clean',
  'r1472SyncMainDashboard',
  'فصل نطاق السجل عن أقسام البرنامج'
]) if (!index.includes(marker) && !String(manifest.description||'').includes(marker)) fail(`R1.4.72 dashboard reorganization marker missing: ${marker}`);
if (!index.includes("{id:'titlematch',label:'المطابقة'") || !index.includes("{id:'service',label:'الخدمة'") || !index.includes("{id:'jobtitles',label:'العناوين'")) fail('R1.4.72 program module registry missing critical tools');
if (!index.includes('r1472-actions-clean')) fail('R1.4.72 duplicated hero action cleanup missing');
if (!sw.includes('employee-registry-mobile-r1472-main-dashboard-professional-reorg-2026.09.20')) fail('R1.4.72 app-shell cache marker missing');
if (!sw.includes('employee-registry-pdf-downloads-r1472')) fail('R1.4.72 PDF cache marker missing');
ok(`Mobile R1.4.73 Header Cleanup Scope Cards Restore verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);

// R1.4.73 stable loading + header cleanup verification
(function verifyR1471(){
  const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const ver = fs.readFileSync(path.join(root, 'VERSION.txt'), 'utf8').trim();
  if (ver !== expectedRelease) fail('R1.4.80 VERSION.txt mismatch');
  if (!(idx.includes('Promise.race([') && idx.includes('r122RegisterServiceWorker()') && idx.includes('setTimeout(resolve,1200)'))) fail('R1.4.63 service worker timeout guard missing');
  if (!idx.includes('R1.4.63 boot watchdog')) fail('R1.4.63 boot watchdog missing');
  if (!idx.includes(expectedRelease)) fail('R1.4.80 APP_RELEASE missing');
  if (!idx.includes('var r1463MinSplash=2300')) fail('R1.4.63 minimum splash duration missing');
  if (idx.includes('R1.4.62: unlock the interface immediately after rendering data')) fail('R1.4.63 must not use immediate splash hide');
  ok('Mobile R1.4.77 Manager Notes Navigation Fix verified: navigation organized and stable loading preserved');
})();


// R1.4.76 manager notes shared sync guards.
for (const marker of [
  'MOBILE R1.4.76: Manager Notes Shared Sync',
  'r1476-manager-notes-sync-style',
  'r1476-manager-notes-sync-script',
  'view-managernotes',
  'ملاحظات المدير والحركات الإدارية',
  'هوية هذا الجهاز',
  'إرسال ملاحظة إدارية',
  'hr_manager_notes_r1475',
  'hr_device_identity_r1475',
  'employee-registry-mobile-r1476-manager-notes-shared-sync-2026.09.24'
]) if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.76 manager notes marker missing: ${marker}`);
if (!sw.includes('employee-registry-pdf-downloads-r1476')) fail('R1.4.76 legacy PDF cache marker missing');
for (const marker of [
  'MOBILE R1.4.77: Manager Notes Navigation Fix',
  'r1477-manager-notes-navigation-fix-style',
  'r1477-manager-notes-navigation-fix-script',
  'r1477ClearManagerNotesView',
  'clearManagerNotesView',
  'body:not(.subview-managernotes) #view-managernotes',
  'employee-registry-mobile-r1477-manager-notes-navigation-fix-2026.09.24'
]) if (!index.includes(marker) && !sw.includes(marker)) fail(`R1.4.77 manager notes navigation marker missing: ${marker}`);
if (!sw.includes('employee-registry-pdf-downloads-r1477')) fail('R1.4.77 PDF cache marker missing');
ok(`Mobile R1.4.77 Manager Notes Navigation Fix verified: ${version.version}, perm=${version.permCount}, cont=${version.contCount}, total=${version.totalCount}, modified=${version.modifiedCount}`);


for (const marker of ['MOBILE R1.4.78: Manager Notes Identity Switch Fix','r1478-manager-notes-identity-switch-fix-script','r1478SetManagerNotesRole','تغيير هوية هذا الجهاز','مدير الموارد']) {
  if (!index.includes(marker)) fail(`R1.4.78 manager notes identity switch marker missing: ${marker}`);
}
if (!sw.includes('employee-registry-mobile-r1478-manager-notes-identity-switch-fix-2026.09.24')) fail('R1.4.78 app-shell cache marker missing');
ok('Mobile R1.4.78 Manager Notes Identity Switch Fix verified');


// R1.4.79 manager notes instant alerts, sender fix, and dense UI guards.
for (const marker of ['MOBILE R1.4.79: instant manager notes UX','r1479-manager-notes-instant-alerts-ui-script','r1479ManagerNotesSyncNow','r1479ManagerNotesPlayAlert','وصلت ']) {
  if (!index.includes(marker)) fail(`R1.4.79 manager notes marker missing: ${marker}`);
}
if (!sw.includes('employee-registry-mobile-r1479-manager-notes-instant-alerts-ui-2026.09.24')) fail('R1.4.79 app-shell cache marker missing');
ok('Mobile R1.4.79 Manager Notes Instant Alerts UI verified');


// R1.4.80 manager notes review/archive + employee direct search guards.
for (const marker of ['MOBILE R1.4.80: fixes Manager Notes sender label','r1480-manager-notes-review-search-fix-script','r1480-emp-results','hr_manager_notes_deleted_r1480','الأرشيف','مدير الموارد البشرية']) {
  if (!index.includes(marker)) fail(`R1.4.80 manager notes review/search marker missing: ${marker}`);
}
if (!index.includes("sender:'مدير الموارد البشرية'")) fail('R1.4.80 manager sender hardening missing');
if (!sw.includes('employee-registry-mobile-r1480-manager-notes-review-search-fix-2026.09.24')) fail('R1.4.80 app-shell cache marker missing');
ok('Mobile R1.4.80 Manager Notes Review Employee Search Fix verified');
