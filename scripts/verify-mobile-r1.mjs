#!/usr/bin/env node
import fs from 'node:fs';
function fail(msg){ console.error('VERIFY_MOBILE_R1 FAIL:', msg); process.exit(1); }
function read(p){ try { return fs.readFileSync(p,'utf8'); } catch(e){ fail('missing '+p); } }
const index = read('index.html');
const manifest = JSON.parse(read('manifest.webmanifest'));
const sw = read('service-worker.js');
const expected = 'MOBILE-R1.5.19-DATE-DISPLAY-FIX';
if (!index.includes(`APP_RELEASE = '${expected}'`)) fail('APP_RELEASE is not R1.5.19 date display fix');
if (!index.includes('r1518-employee-modal-cleanup-script')) fail('missing R1.5.18 employee modal cleanup');
if (!index.includes('r1519-date-display-fix-script')) fail('missing R1.5.19 date display fix script');
if (!index.includes('hrIndexedDBPrimaryStore')) fail('missing IndexedDB primary store API');
if (!String(manifest.description || '').includes('R1.5.19')) fail('manifest description missing R1.5.19');
if (!sw.includes('R1.5.19')) fail('service worker missing R1.5.19 marker');
if (/data\/employees\.json|data\/fallback-data\.js/.test(index)) fail('legacy public data file reference found in index');
console.log('VERIFY_MOBILE_R1 OK:', expected);
