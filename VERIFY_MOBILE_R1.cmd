@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.29] Checking HR mobile repository...

if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)

findstr /C:"MOBILE-R1.5.29-MANUAL-REFRESH-TIMEOUT-GUARD" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.29 manual refresh timeout guard is missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.28-SAFE-EMPLOYEE-HISTORY-BASELINE" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.28 safe employee history baseline is missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.27-HARD-DATE-SANITIZER-RECOVERY" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.27 hard date sanitizer recovery is missing
  exit /b 1
)

findstr /C:"SAFE-MANUAL-UPDATE-CENTER" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: Safe manual update center marker is missing
  exit /b 1
)

if exist "data\employees.json" (
  echo VERIFY_MOBILE_R1 FAIL: data\employees.json must not be published
  exit /b 1
)

if exist "fallback-data.js" (
  echo VERIFY_MOBILE_R1 FAIL: fallback-data.js must not be published
  exit /b 1
)

echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.29 Manual Refresh Timeout Guard is ready.
exit /b 0
