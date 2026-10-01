@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.49] Checking admin-only archive and shared delete...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
findstr /C:"MOBILE-R1.5.49-ADMIN-ARCHIVE-SHARED-DELETE" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.49&exit /b 1)
findstr /C:"R1549_ADMIN_ARCHIVE_SHARED_DELETE" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: R1.5.49 marker missing&exit /b 1)
findstr /C:"employee-registry-ui-r1549" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1549&exit /b 1)
node scripts/verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.49 admin archive and shared delete is ready.
exit /b 0
