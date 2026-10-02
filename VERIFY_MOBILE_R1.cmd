@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.64 Candidate] Checking Career Family Bridge Audit...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "assets\job-title-progression.json" (echo VERIFY_MOBILE_R1 FAIL: progression map not found&exit /b 1)
if not exist "assets\job-titles.json" (echo VERIFY_MOBILE_R1 FAIL: job titles source not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
findstr /C:"MOBILE-R1.5.64-CAREER-FAMILY-BRIDGE-AUDIT" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.64&exit /b 1)
findstr /C:"employee-registry-ui-r1564" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1564&exit /b 1)
node scripts/verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.64 Career Family Bridge Audit candidate is ready for phone testing.
echo NOTE: No commit or push was performed.
exit /b 0
