@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.48] Checking server-authoritative administrative review state...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
findstr /C:"MOBILE-R1.5.48-SERVER-AUTHORITY-CLEANUP" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.48&exit /b 1)
findstr /C:"R1548_SERVER_AUTHORITY_CLEANUP" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: R1.5.48 marker missing&exit /b 1)
findstr /C:"employee-registry-ui-r1548" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1548&exit /b 1)
node scripts/verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.48 server authority cleanup is ready.
exit /b 0
