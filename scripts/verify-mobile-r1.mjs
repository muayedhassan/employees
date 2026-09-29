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

const expected = 'MOBILE-R1.5.11-SECURE-DATA-MANUAL-REFRESH';
if (!index.includes(`APP_RELEASE = '${expected}'`)) fail('APP_RELEASE is not R1.5.11 secure data manual refresh');
if (version !== expected) fail('VERSION.txt mismatch');
if (!String(manifest.description || '').includes('R1.5.11')) fail('manifest description missing R1.5.11');

const requiredMarkers = [
  'R1.5.11: manual secure data refresh applies latest Google Sheets updates immediately.',
  'MOBILE-R1.5.11-SECURE-DATA-MANUAL-REFRESH',
  'r1511SecureDataManualRefresh',
  'تحديث الآن',
  'hr_secure_last_manual_refresh_r1511',
  'r1509RecoverSecureData(true)',
  'employee-registry-mobile-r1511-secure-data-manual-refresh-2026.09.29',
  'employee-registry-pdf-downloads-r1511',
  'R1.5.10: secure data instant cache shows saved Google Sheets data immediately, then refreshes in background.',
  'HR_SECURE_API_URL',
  'HR_SECURE_KEY_STORE',
  'hr1508Jsonp',
  'r1510ApplyCachedDatasetIfReady'
];
for (const marker of requiredMarkers) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`missing R1.5.11 marker: ${marker}`);
}

if (index.includes('raw.githubusercontent.com/muayedhassan/employees/main/')) fail('public GitHub employee data endpoint must not remain in index.html');
if (index.includes('<script src="data/fallback-data.js"></script>')) fail('fallback-data.js script tag must be removed from public app shell');
if (sw.includes('./data/fallback-data.js') || sw.includes('./data/job-titles.json')) fail('service worker must not precache data/ files');
if (index.includes('TEMPTEST20260929')) fail('temporary test access key leaked into app shell');

const sensitivePaths = ['data/employees.json','data/fallback-data.js','employees.xlsx','permanent.xlsx','contracts.xlsx'];
const presentSensitive = sensitivePaths.filter(exists);
if (presentSensitive.length) {
  console.warn('VERIFY_MOBILE_R1 WARNING: sensitive/legacy data files are present locally and must not be pushed to a public app repository:', presentSensitive.join(', '));
}

console.log('VERIFY_MOBILE_R1 OK:', expected);
