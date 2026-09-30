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

const expected = 'MOBILE-R1.5.16-INDEXEDDB-FOUNDATION';
if (!index.includes(`APP_RELEASE = '${expected}'`)) fail('APP_RELEASE is not R1.5.16 IndexedDB foundation');
if (version !== expected) fail('VERSION.txt mismatch');
if (!String(manifest.description || '').includes('R1.5.16')) fail('manifest description missing R1.5.16');

const requiredMarkers = [
  'R1.5.16: IndexedDB foundation stores secure dataset and change history for future large offline features.',
  'MOBILE-R1.5.16-INDEXEDDB-FOUNDATION',
  'r1516-indexeddb-foundation-script',
  'hr_mobile_secure_store_r1516',
  'window.hrIndexedDB',
  'employee-registry-mobile-r1516-indexeddb-foundation-2026.09.30',
  'R1.5.15: persistent local change history keeps previous/current values after app restart until a new secure update arrives.',
  'MOBILE-R1.5.15-PERSISTENT-CHANGE-HISTORY',
  'r1515PersistentChangeHistory',
  'hr_persistent_change_summary_r1515',
  'hr_persistent_change_history_r1515',
  'R1.5.14: safe change trace records previous/current values after secure Google Sheets updates without touching startup loading.',
  'MOBILE-R1.5.14-SAFE-CHANGE-TRACE',
  'r1514SafeChangeTrace',
  'القيمة السابقة',
  'القيمة الجديدة',
  'CHANGE_HISTORY_CACHE_KEY',
  'employee-registry-mobile-r1515-persistent-change-history-2026.09.30',
  'employee-registry-pdf-downloads-r1515',
  'R1.5.13: emergency loader rollback keeps R1.5.13 stable refresh and disables broken R1.5.12 change trace.',
  'r1513SecureDataManualRefresh',
  'تحديث الآن',
  'hr_secure_last_manual_refresh_r1513',
  'r1509RecoverSecureData(true)',
  'R1.5.10: secure data instant cache shows saved Google Sheets data immediately, then refreshes in background.',
  'HR_SECURE_API_URL',
  'HR_SECURE_KEY_STORE',
  'hr1508Jsonp',
  'r1510ApplyCachedDatasetIfReady'
];
for (const marker of requiredMarkers) {
  if (!index.includes(marker) && !sw.includes(marker)) fail(`missing R1.5.13 marker: ${marker}`);
}

if (index.includes('raw.githubusercontent.com/muayedhassan/employees/main/')) fail('public GitHub employee data endpoint must not remain in index.html');
if (index.includes('<script src="data/fallback-data.js"></script>')) fail('fallback-data.js script tag must be removed from public app shell');
if (sw.includes('./data/fallback-data.js') || sw.includes('./data/job-titles.json')) fail('service worker must not precache data/ files');
if (index.includes('TEMPTEST20260929')) fail('temporary test access key leaked into app shell');
if (index.includes('MOBILE-R1.5.12-SECURE-DATA-CHANGE-TRACE')) fail('broken R1.5.12 change trace release must not remain active');

const sensitivePaths = ['data/employees.json','data/fallback-data.js','employees.xlsx','permanent.xlsx','contracts.xlsx'];
const presentSensitive = sensitivePaths.filter(exists);
if (presentSensitive.length) {
  console.warn('VERIFY_MOBILE_R1 WARNING: sensitive/legacy data files are present locally and must not be pushed to a public app repository:', presentSensitive.join(', '));
}

console.log('VERIFY_MOBILE_R1 OK:', expected);
