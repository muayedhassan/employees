@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.47] Checking shared administrative review state...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
findstr /C:"MOBILE-R1.5.47-SHARED-REVIEW-STATE" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.47&exit /b 1)
findstr /C:"R1547_SHARED_REVIEW_STATE" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: shared review marker missing&exit /b 1)
findstr /C:"r1547-manager-notes-shared-review-state-script" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: shared review module missing&exit /b 1)
findstr /C:"employee-registry-ui-r1547" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1547&exit /b 1)
node scripts/verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.47 shared review state is ready.
exit /b 0
