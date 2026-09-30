@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo [Mobile R1.5.40] Checking canonical release and cache consistency...

if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)

if not exist "service-worker.js" (
  echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found
  exit /b 1
)

if not exist "recovery.html" (
  echo VERIFY_MOBILE_R1 FAIL: recovery.html not found
  exit /b 1
)

if not exist "VERSION.txt" (
  echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found
  exit /b 1
)

findstr /C:"MOBILE-R1.5.40-CANONICAL-RELEASE-CACHE-CONSISTENCY" "VERSION.txt" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.40
  exit /b 1
)

findstr /C:"MOBILE-R1.5.40-CANONICAL-RELEASE-CACHE-CONSISTENCY" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.40 release marker missing
  exit /b 1
)

findstr /C:"r1540-canonical-release-cache-consistency" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: final R1.5.40 authority missing
  exit /b 1
)

findstr /C:"employee-registry-ui-r1540" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: index cache identity is not r1540
  exit /b 1
)

findstr /C:"MOBILE-R1.5.40-SERVICE-WORKER-NO-STALE-UI" "service-worker.js" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: service worker marker missing
  exit /b 1
)

findstr /C:"employee-registry-ui-r1540" "service-worker.js" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: service worker cache is not r1540
  exit /b 1
)

findstr /C:"hrIndexedDBPrimaryStore" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: IndexedDB primary store missing
  exit /b 1
)

node scripts\verify-mobile-r1.mjs
if errorlevel 1 exit /b 1

echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.40 canonical release and cache consistency is ready.
exit /b 0
