@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.50] Checking quiet administrative notes synchronization...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
findstr /C:"MOBILE-R1.5.50-QUIET-MANAGER-NOTES-SYNC" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.50&exit /b 1)
findstr /C:"R1550_QUIET_MANAGER_NOTES_SYNC" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: quiet notes marker missing&exit /b 1)
findstr /C:"employee-registry-ui-r1550" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1550&exit /b 1)
node scripts/verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.50 quiet manager notes sync is ready.
exit /b 0
