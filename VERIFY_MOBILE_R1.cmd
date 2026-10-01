@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.45] Checking data release ledger recovery...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
findstr /C:"MOBILE-R1.5.45-DATA-RELEASE-LEDGER-RECOVERY" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.45&exit /b 1)
findstr /C:"R1545_DATA_RELEASE_LEDGER_RECOVERY" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: release ledger marker missing&exit /b 1)
findstr /C:"hr_mobile_data_release_ledger_v1" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: data release ledger IndexedDB missing&exit /b 1)
findstr /C:"r1545-dashboard-alert-removal-style" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: alerts-card layout fix missing&exit /b 1)
findstr /C:"employee-registry-ui-r1545" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1545&exit /b 1)
node scripts\verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.45 data release ledger recovery is ready.
exit /b 0
