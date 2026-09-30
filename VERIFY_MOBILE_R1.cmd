@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.41] Checking job titles and shared review sync...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "recovery.html" (echo VERIFY_MOBILE_R1 FAIL: recovery.html not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
if not exist "assets\job-titles.json" (echo VERIFY_MOBILE_R1 FAIL: job titles asset missing&exit /b 1)
findstr /C:"MOBILE-R1.5.41-JOB-TITLES-REVIEW-SYNC-FIX" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.41&exit /b 1)
findstr /C:"MOBILE-R1.5.41-JOB-TITLES-REVIEW-SYNC-FIX" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: R1.5.41 release marker missing&exit /b 1)
findstr /C:"assets/job-titles.json" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: job titles wiring missing&exit /b 1)
findstr /C:"action:'review'" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: shared review status sync missing&exit /b 1)
findstr /C:"employee-registry-ui-r1541" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: service worker cache is not r1541&exit /b 1)
findstr /C:"hrIndexedDBPrimaryStore" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: IndexedDB primary store missing&exit /b 1)
node scripts\verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.41 job titles and shared review sync is ready.
exit /b 0
