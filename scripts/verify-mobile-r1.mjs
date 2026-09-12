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

if (!index.includes("APP_RELEASE = 'MOBILE-R1.4.9-CLEAN-DATA-BADGE-REFRESH-DEDUP'")) fail('APP_RELEASE is not Mobile R1.4.9');
for (const marker of ['r14-hero','r14-emp-card','r14-card-inner','r146-kpi','r147-kpi','r147-profile-hero','mobile-chrome-toggle','chrome-collapsed','mobileR146SyncChrome','search-sec.compact-search','mobileR14BuildHome','mobileR14ProfileHero','renderQuickSearch=function','تحديث التطبيق والبيانات']) {
  if (!index.includes(marker)) fail(`Mobile R1.4.9 marker missing: ${marker}`);
}
if (!index.includes('اضغط لعرض التفاصيل الكاملة داخل بطاقة الموظف')) fail('focused employee card hint is missing');
if (!sw.includes('employee-registry-mobile-r149-2026.09.12')) fail('service worker cache name is not Mobile R1.4.9');
if (!sw.includes('clients.claim') || !sw.includes('skipWaiting') || !sw.includes('networkFirst')) fail('service worker update strategy is incomplete');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) fail('manifest icons are missing');
if (!String(manifest.description || '').includes('Mobile R1.4.9')) fail('manifest description was not updated');
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
if (!index.includes('MOBILE_R1_4_9_RELEASE_NOTES_AR.txt') && !fs.existsSync(path.join(root, 'MOBILE_R1_4_9_RELEASE_NOTES_AR.txt'))) fail('R1.4.9 release notes are missing');

ok(`Mobile R1.4.9 verified: ${version.version}, employees=${version.totalCount}, modified=${summary.counts.modified}`);
