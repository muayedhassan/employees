@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.51] Checking career progression foundation...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "assets\job-title-progression.json" (echo VERIFY_MOBILE_R1 FAIL: progression map not found&exit /b 1)
findstr /C:"MOBILE-R1.5.51-CAREER-PROGRESSION-FOUNDATION" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.51&exit /b 1)
findstr /C:"R1551_CAREER_PROGRESSION_FOUNDATION" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: career marker missing&exit /b 1)
findstr /C:"employee-registry-ui-r1551" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1551&exit /b 1)
node scripts/verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.51 career progression foundation is ready.
exit /b 0
