import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const fail = msg => { console.error('VERIFY FAILED:', msg); process.exit(1); };
const ok = msg => console.log('OK:', msg);

for (const f of ['index.html','service-worker.js','manifest.webmanifest','data/version.json','data/employees.json','data/change-summary.json','data/change-history.json','data/validation-report.json','data/fallback-data.js']) {
  if (!fs.existsSync(path.join(root, f))) fail(`missing ${f}`);
}

const index = read('index.html');
const sw = read('service-worker.js');
const manifest = JSON.parse(read('manifest.webmanifest'));
const version = JSON.parse(read('data/version.json'));
const employees = JSON.parse(read('data/employees.json'));
const summary = JSON.parse(read('data/change-summary.json'));

if (!index.includes("APP_RELEASE = 'MOBILE-R1.4.12-PDF-CARD-POLISH'")) fail('APP_RELEASE is not Mobile R1.4.12');
for (const marker of ['r14-hero','r14-emp-card','r14-card-inner','r146-kpi','r147-kpi','r147-profile-hero','mobile-chrome-toggle','chrome-collapsed','mobileR146SyncChrome','search-sec.compact-search','mobileR14BuildHome','mobileR14ProfileHero','renderQuickSearch=function','تحديث التطبيق والبيانات']) {
  if (!index.includes(marker)) fail(`Mobile R1.4.12 marker missing: ${marker}`);
}
if (!index.includes('اضغط لعرض التفاصيل الكاملة داخل بطاقة الموظف')) fail('focused employee card hint is missing');
if (!sw.includes('employee-registry-mobile-r1412-2026.09.12')) fail('service worker cache name is not Mobile R1.4.12');
if (!sw.includes('clients.claim') || !sw.includes('skipWaiting') || !sw.includes('networkFirst')) fail('service worker update strategy is incomplete');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) fail('manifest icons are missing');
if (!String(manifest.description || '').includes('Mobile R1.4.12')) fail('manifest description was not updated');
if (!fs.existsSync(path.join(root, 'assets/fonts/hr-fonts.css'))) fail('embedded font readiness stylesheet is missing');
const fontCss = read('assets/fonts/hr-fonts.css');
for (const marker of ['HRTitleArabic','HRBodyArabic','HRSultanArabic','HRNumberFont','HREnglishDecor','YaModernPro-Bold.otf','ZainMobile.ttf','SFSultan-Black.ttf','Stencil.ttf','ElfeeraScript.ttf','--hr-english-decor-font']) { if (!fontCss.includes(marker)) fail(`font readiness marker missing: ${marker}`); }
const optionalFonts = ['assets/fonts/YaModernPro-Bold.otf','assets/fonts/ZainMobile.ttf','assets/fonts/SFSultan-Black.ttf','assets/fonts/Stencil.ttf','assets/fonts/ElfeeraScript.ttf'];
const presentFonts = optionalFonts.filter(f => fs.existsSync(path.join(root, f)));
if (presentFonts.length > 0) {
  ok(`embedded fonts present: ${presentFonts.length}/5`);
} else {
  console.warn('WARN: custom font files are not installed yet. Run INSTALL_HR_FONTS.cmd before final push if you want identical mobile typography.');
}
if (!version.version || !String(version.version).startsWith('DATA-')) fail(`unexpected data version ${version.version}`);
if (!Array.isArray(employees.perm) || !Array.isArray(employees.cont)) fail('employees.json format is invalid');
if ((employees.perm.length + employees.cont.length) !== version.totalCount) fail('employee count mismatch');
if (!summary.counts || summary.counts.modified === undefined) fail('change summary counts are invalid');
if (!index.includes('فارغ') || !index.includes('بحث شامل')) fail('search/detail display rules are missing');


for (const marker of ['mobile-chrome-bar','r146-kpis','r147-kpis','r147-profile-grid','users-viewfinder','filter-circle-check']) {
  if (!index.includes(marker) && marker !== 'MOBILE_R1_4_6_RELEASE_NOTES_AR') fail(`R1.4.6 polish marker missing: ${marker}`);
}
if (!fs.existsSync(path.join(root, 'MOBILE_R1_4_6_RELEASE_NOTES_AR.txt'))) fail('R1.4.6 release notes are missing');

if (index.includes('id="refresh-data-btn"')) fail('duplicate header refresh button must be removed');
if (index.includes('id="connection-refresh"')) fail('duplicate connection refresh button must be removed');
if (!index.includes("function mobileR14ShortVersion(v){return String(v||'—');}")) fail('data version should be displayed in full DATA-* order');
if (!index.includes("if(s)s.textContent='';")) fail('mini chrome subtitle should be empty to avoid crowded DATA text');
if (!index.includes('data-profile-panel="')) fail('profile tab panels must use data-profile-panel for reliable switching');
if (!index.includes("pid=p.getAttribute('data-profile-panel')||p.getAttribute('data-panel')")) fail('profile tab binder must support current and legacy panel attributes');
if (!fs.existsSync(path.join(root, 'MOBILE_R1_4_10_RELEASE_NOTES_AR.txt'))) fail('R1.4.10 release notes are missing');

if (!fs.existsSync(path.join(root, 'MOBILE_R1_4_12_RELEASE_NOTES_AR.txt'))) fail('R1.4.12 release notes are missing');
const r1412Block = index.slice(index.lastIndexOf('function r1412FieldSlug'));
for (const marker of ['MOBILE-R1.4.12-PDF-CARD-POLISH','r1412FormatSalary','طباعة بطاقة الموظف PDF']) {
  if (!index.includes(marker)) fail(`R1.4.12 PDF polish marker missing: ${marker}`);
}
if (!r1412Block.includes("r1411Field('رقم الهوية','identityNo',emp.identityNo,'🪪',true)")) fail('identity number must be wide in PDF card');
if (!r1412Block.includes("return numeric+' د.ع';")) fail('salary currency should be after the number');
if (!r1412Block.includes('identityIssuer b') || !r1412Block.includes('notes b')) fail('identity issuer and notes must use body typography in PDF card');
if (r1412Block.includes('بطاقة موظف إلكترونية صادرة من HRSystem</div></header><section class=\"person\"')) fail('R1.4.12 PDF header subline should be removed');
if (r1412Block.includes('<footer class=\"foot\"><div class=\"fmeta\">إصدار البيانات')) fail('R1.4.12 PDF footer metadata should be removed');
if (r1412Block.includes('<img class=\"qr\"')) fail('R1.4.12 PDF QR block should be removed from employee card');


ok(`Mobile R1.4.12 verified: ${version.version}, employees=${version.totalCount}, modified=${summary.counts.modified}`);
