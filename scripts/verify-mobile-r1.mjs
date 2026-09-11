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

if (!index.includes("APP_RELEASE = 'MOBILE-R1.0-HRSYSTEM-LINKED'")) fail('APP_RELEASE is not Mobile R1.0');
if (!sw.includes('employee-registry-mobile-r1-2026.09.11')) fail('service worker cache name is not Mobile R1');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) fail('manifest icons are missing');
if (version.version !== 'DATA-2026.09.11-071047') fail(`unexpected data version ${version.version}`);
if (version.includesSensitiveData !== true) fail('expected sensitive data to be included for current rollout');
if (!Array.isArray(employees.perm) || !Array.isArray(employees.cont)) fail('employees.json format is invalid');
if ((employees.perm.length + employees.cont.length) !== version.totalCount) fail('employee count mismatch');
if (!summary.counts || summary.counts.modified === undefined) fail('change summary counts are invalid');
if (!index.includes('فارغ') || !index.includes('r1-sensitive-banner')) fail('Mobile R1 update display rules are missing');

ok(`Mobile R1 verified: ${version.version}, employees=${version.totalCount}, modified=${summary.counts.modified}`);
