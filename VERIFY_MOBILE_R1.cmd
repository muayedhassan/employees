@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.46] Checking official Windows DATA contract...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "VERSION.txt" (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt not found&exit /b 1)

findstr /C:"MOBILE-R1.5.46-OFFICIAL-DATA-CONTRACT" "VERSION.txt" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: VERSION.txt is not R1.5.46&exit /b 1)

findstr /C:"R1546_OFFICIAL_DATA_CONTRACT" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: official data contract marker missing&exit /b 1)

findstr /C:"hr_official_data_contract_r1546" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: official packet cache missing&exit /b 1)

findstr /C:"official-windows-history-r1546" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: official Windows history import missing&exit /b 1)

findstr /C:"employee-registry-ui-r1546" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: cache is not r1546&exit /b 1)

node scripts\verify-mobile-r1.mjs
if errorlevel 1 exit /b 1

echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.46 official Windows DATA contract is ready.
exit /b 0
