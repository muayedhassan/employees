@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.43] Checking dashboard card order...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
findstr /C:"MOBILE-R1.5.43-DASHBOARD-CARD-ORDER" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.43&exit /b 1)
findstr /C:"R1543_DASHBOARD_CARD_ORDER" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: dashboard marker missing&exit /b 1)
findstr /C:"r1543-dashboard-card-order-style" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: dashboard style missing&exit /b 1)
findstr /C:"employee-registry-ui-r1543" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1543&exit /b 1)
node scripts\verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.43 dashboard card order is ready.
exit /b 0
