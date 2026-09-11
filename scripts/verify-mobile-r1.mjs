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

if (!index.includes("APP_RELEASE = 'MOBILE-R1.3.1-CLEAN-FOCUSED-UX'")) fail('APP_RELEASE is not Mobile R1.3.1');
if (!index.includes('mobileR131BuildHome') || !index.includes('r131-home-hero') || !index.includes('CLEAN FOCUSED UX')) fail('Mobile R1.3.1 home UI is missing');
if (!index.includes('r131-clean-card') || !index.includes('r131-seq') || !index.includes('r131-file')) fail('Mobile R1.3.1 compact list cards are missing');
if (!index.includes('القائمة الرئيسية تعرض الاسم، التسلسل، ورقم الاضبارة فقط')) fail('Mobile R1.3.1 compact card rule is missing');
if (!index.includes('mobileR131ProfileHero') || !index.includes('profileRow') || !index.includes('employeeHistoryHTML')) fail('Mobile R1.3.1 profile details are incomplete');
if (!index.includes('r122RegisterServiceWorker') || !index.includes('r122RefreshAppAndData') || !index.includes('r122CheckForAppUpdate')) fail('auto update logic is missing');
if (!sw.includes('employee-registry-mobile-r131-2026.09.11')) fail('service worker cache name is not Mobile R1.3.1');
if (!sw.includes('clients.claim') || !sw.includes('skipWaiting') || !sw.includes('networkFirst')) fail('service worker update strategy is incomplete');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) fail('manifest icons are missing');
if (!String(manifest.description || '').includes('Mobile R1.3.1')) fail('manifest description was not updated');
if (!version.version || !String(version.version).startsWith('DATA-')) fail(`unexpected data version ${version.version}`);
if (!Array.isArray(employees.perm) || !Array.isArray(employees.cont)) fail('employees.json format is invalid');
if ((employees.perm.length + employees.cont.length) !== version.totalCount) fail('employee count mismatch');
if (!summary.counts || summary.counts.modified === undefined) fail('change summary counts are invalid');

ok(`Mobile R1.3.1 verified: ${version.version}, employees=${version.totalCount}, modified=${summary.counts.modified}`);
