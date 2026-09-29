#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function exists(p){ return fs.existsSync(path.join(root,p)); }
function fail(msg){ console.error('VERIFY_MOBILE_R1 FAILED:', msg); process.exit(1); }

const index = read('index.html');
const sw = read('service-worker.js');
const manifest = JSON.parse(read('manifest.webmanifest'));
const version = read('VERSION.txt').trim();

const expected = 'MOBILE-R1.5.08-SECURE-DATA-RECOVERY';
if (!index.includes(`APP_RELEASE = '${expected}'`)) fail('APP_RELEASE is not R1.5.08 secure data recovery');
if (version !== expected) fail('VERSION.txt mismatch');
if (!String(manifest.description || '').includes('R1.5.08')) fail('manifest description missing R1.5.08');

const requiredMarkers = [
  'R1.5.08: secure data recovery from private Google Sheets',
  'HR_SECURE_API_URL',
  'HR_SECURE_KEY_STORE',
  'hr1508Jsonp',
  'hr1508FetchSecureDataset',
  'employee-registry-mobile-r1508-secure-data-recovery-2026.09.29',
  'employee-registry-pdf-downloads-r1508'
];
for (const marker of requiredMarkers) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`missing R1.5.08 marker: ${marker}`);
}

if (index.includes('raw.githubusercontent.com/muayedhassan/employees/main/')) fail('public GitHub employee data endpoint must not remain in index.html');
if (index.includes('<script src="data/fallback-data.js"></script>')) fail('fallback-data.js script tag must be removed from public app shell');
if (sw.includes('./data/fallback-data.js') || sw.includes('./data/job-titles.json')) fail('service worker must not precache data/ files');
if (sw.includes("const CACHE_NAME = 'employee-registry-mobile-r1507-chrome-safe-floating-toggle-2026.09.29'")) fail('old r1507 active cache name still active');
if (sw.includes("const PDF_CACHE_NAME = 'employee-registry-pdf-downloads-r1507'")) fail('old r1507 active PDF cache name still active');

// The app must not contain the temporary test access key.
if (index.includes('TEMPTEST20260929')) fail('temporary test access key leaked into app shell');

// Optional data files are no longer required for verification. If present in a legacy working copy,
// warn only; the secure public repository should delete them before publishing.
const sensitivePaths = ['data/employees.json','data/fallback-data.js','employees.xlsx','permanent.xlsx','contracts.xlsx'];
const presentSensitive = sensitivePaths.filter(exists);
if (presentSensitive.length) {
  console.warn('VERIFY_MOBILE_R1 WARNING: sensitive/legacy data files are present locally and must not be pushed to a public app repository:', presentSensitive.join(', '));
}

console.log('VERIFY_MOBILE_R1 OK:', expected);
