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

if (!index.includes("APP_RELEASE = 'MOBILE-R1.2.1-LOAD-HOTFIX'")) fail('APP_RELEASE is not Mobile R1.2.1');
if (!index.includes('mobile-r11-home') || !index.includes('MOBILE R1.2') || !index.includes('r12-scope-stack')) fail('Mobile R1.2.1 UI block is missing');
if (!index.includes('r12-emp-card') || !index.includes('mobileR12ProfileHero') || !index.includes('mobileR12MatchInfo')) fail('Mobile R1.2 search/profile UI is missing');
if (!sw.includes('employee-registry-mobile-r121-2026.09.11')) fail('service worker cache name is not Mobile R1.2.1');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) fail('manifest icons are missing');
if (!version.version || !String(version.version).startsWith('DATA-')) fail(`unexpected data version ${version.version}`);
if (version.includesSensitiveData !== true) fail('expected sensitive data to be included for current rollout');
if (!Array.isArray(employees.perm) || !Array.isArray(employees.cont)) fail('employees.json format is invalid');
if ((employees.perm.length + employees.cont.length) !== version.totalCount) fail('employee count mismatch');
if (!summary.counts || summary.counts.modified === undefined) fail('change summary counts are invalid');
if (!index.includes('فارغ') || !index.includes('بحث شامل') || !index.includes('r12-profile-hero')) fail('R1.2 search/detail display rules are missing');

ok(`Mobile R1.2.1 verified: ${version.version}, employees=${version.totalCount}, modified=${summary.counts.modified}`);
