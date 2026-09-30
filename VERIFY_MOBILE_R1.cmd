@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.28] Checking HR mobile repository...

if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)

findstr /C:"MOBILE-R1.5.28-SAFE-EMPLOYEE-HISTORY-BASELINE" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.28 Safe Employee History Baseline marker missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.27-HARD-DATE-SANITIZER-RECOVERY" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.27 hard date sanitizer recovery is missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.25-SAFE-MANUAL-UPDATE-CENTER" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 WARN: R1.5.25 safe manual update marker not found, continuing
)

findstr /C:"r122StartAutoUpdateWatchers=function" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 WARN: manual update guard marker not found, continuing
)

if exist "data\employees.json" (
  echo VERIFY_MOBILE_R1 FAIL: data\employees.json must not be published
  exit /b 1
)

if exist "fallback-data.js" (
  echo VERIFY_MOBILE_R1 FAIL: fallback-data.js must not be published
  exit /b 1
)

echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.28 Safe Employee History Baseline is ready.
exit /b 0
