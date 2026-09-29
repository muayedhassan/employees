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

const expected = 'MOBILE-R1.5.10-SECURE-DATA-INSTANT-CACHE';
if (!index.includes(`APP_RELEASE = '${expected}'`)) fail('APP_RELEASE is not R1.5.10 secure data instant cache');
if (version !== expected) fail('VERSION.txt mismatch');
if (!String(manifest.description || '').includes('R1.5.10')) fail('manifest description missing R1.5.10');

const requiredMarkers = [
  'R1.5.10: secure data instant cache shows saved Google Sheets data immediately, then refreshes in background.',
  'R1.5.09: secure data apply fix ensures Apps Script data is forced into the UI after JSONP load.',
  'HR_SECURE_API_URL',
  'HR_SECURE_KEY_STORE',
  'hr1508Jsonp',
  'hr1508FetchSecureDataset',
  'r1509ApplySecureDataset',
  'r1509RecoverSecureData',
  'r1510ApplyCachedDatasetIfReady',
  'r1510RefreshSecureDataInBackground',
  'employee-registry-mobile-r1510-secure-data-instant-cache-2026.09.29',
  'employee-registry-pdf-downloads-r1510'
];
for (const marker of requiredMarkers) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`missing R1.5.10 marker: ${marker}`);
}

if (index.includes('raw.githubusercontent.com/muayedhassan/employees/main/')) fail('public GitHub employee data endpoint must not remain in index.html');
if (index.includes('<script src="data/fallback-data.js"></script>')) fail('fallback-data.js script tag must be removed from public app shell');
if (sw.includes('./data/fallback-data.js') || sw.includes('./data/job-titles.json')) fail('service worker must not precache data/ files');
if (sw.includes("const CACHE_NAME = 'employee-registry-mobile-r1509-secure-data-apply-fix-2026.09.29'")) fail('old r1509 active cache name still active');
if (sw.includes("const PDF_CACHE_NAME = 'employee-registry-pdf-downloads-r1509'")) fail('old r1509 active PDF cache name still active');

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
