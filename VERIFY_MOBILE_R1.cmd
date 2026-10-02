@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.54 Candidate] Checking career search reuse...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "assets\job-title-progression.json" (echo VERIFY_MOBILE_R1 FAIL: progression map not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
findstr /C:"MOBILE-R1.5.54-CAREER-SEARCH-REUSE" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.54&exit /b 1)
findstr /C:"R1554_CAREER_SEARCH_REUSE" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: R1.5.54 search marker missing&exit /b 1)
findstr /C:"employee-registry-ui-r1554" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1554&exit /b 1)
node scripts/verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.54 career search reuse candidate is ready for phone testing.
echo NOTE: No commit or push was performed.
exit /b 0
