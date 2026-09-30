#!/usr/bin/env node
import fs from 'node:fs';

function fail(msg) {
  console.error('VERIFY_MOBILE_R1 FAIL:', msg);
  process.exit(1);
}

function read(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    fail('missing ' + p);
  }
}

const index = read('index.html');
const manifest = JSON.parse(read('manifest.webmanifest'));
const sw = read('service-worker.js');
const version = read('VERSION.txt').trim();

const expected = 'MOBILE-R1.5.40-CANONICAL-RELEASE-CACHE-CONSISTENCY';

if (version !== expected) fail('VERSION.txt is not R1.5.40');

if (!index.includes(
  '<meta name="app-release" content="' + expected + '">'
)) fail('app-release meta is not R1.5.40');

if (!index.includes('R1540_CANONICAL_RELEASE_CACHE_CONSISTENCY'))
  fail('missing R1.5.40 canonical marker');

if (!index.includes('r1540-canonical-release-cache-consistency'))
  fail('missing R1.5.40 final release block');

if (!index.includes(
  "var RELEASE='MOBILE-R1.5.40-CANONICAL-RELEASE-CACHE-CONSISTENCY';"
)) fail('final release authority mismatch');

if (!index.includes("var SW_URL='service-worker.js?v=1540';"))
  fail('maintenance service worker URL mismatch');

if (!index.includes("var KEEP_CACHE='employee-registry-ui-r1540';"))
  fail('maintenance cache key mismatch');

if (!index.includes(
  "localStorage.setItem('hr_mobile_ui_cache_release','1540')"
)) fail('local cache release marker mismatch');

if (!index.includes('hrIndexedDBPrimaryStore'))
  fail('IndexedDB primary store is missing');

if (!String(manifest.name || '').includes('R1.5.40'))
  fail('manifest name mismatch');

if (!String(manifest.short_name || '').includes('R1.5.40'))
  fail('manifest short_name mismatch');

if (!String(manifest.description || '').includes('R1.5.40'))
  fail('manifest description mismatch');

if (!sw.includes('MOBILE-R1.5.40-SERVICE-WORKER-NO-STALE-UI'))
  fail('service worker release mismatch');

if (!sw.includes('employee-registry-ui-r1540'))
  fail('service worker cache mismatch');

if (!sw.includes('__offline_index_r1540__'))
  fail('offline index key mismatch');

if (/data\/employees\.json|data\/fallback-data\.js/.test(index))
  fail('legacy public data reference found in index');

if (fs.existsSync('data/employees.json'))
  fail('data/employees.json must not be published');

if (fs.existsSync('fallback-data.js'))
  fail('fallback-data.js must not be published');

console.log('VERIFY_MOBILE_R1 OK:', expected);
