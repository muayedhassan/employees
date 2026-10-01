@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.44] Checking sticky data-change ledger...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)
findstr /C:"MOBILE-R1.5.44-DATA-CHANGE-LEDGER-STICKY" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.44&exit /b 1)
findstr /C:"R1544_DATA_CHANGE_LEDGER_STICKY" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: sticky ledger marker missing&exit /b 1)
findstr /C:"hr_data_change_ledger_r1544" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: sticky ledger state missing&exit /b 1)
findstr /C:"employee-registry-ui-r1544" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1544&exit /b 1)
node scripts\verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.44 sticky data-change ledger is ready.
exit /b 0
