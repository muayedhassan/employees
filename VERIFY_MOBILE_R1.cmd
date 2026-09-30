@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.25] Checking HR mobile repository...

if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)

findstr /C:"MOBILE-R1.5.25-SAFE-MANUAL-UPDATE-CENTER" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: APP_RELEASE is not R1.5.25 Safe Manual Update Center
  exit /b 1
)

findstr /C:"MOBILE-R1.5.19-DATE-DISPLAY-FIX" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.19 stable recovery base marker is missing
  exit /b 1
)

findstr /C:"R1.5.25 SAFE MANUAL UPDATE CENTER" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: Safe Manual Update Center guard is missing
  exit /b 1
)

findstr /C:"r122StartAutoUpdateWatchers=function()" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: automatic update watchers are not disabled
  exit /b 1
)

findstr /C:"HR_SECURE_DATA_API" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 WARN: HR secure data API marker not found
)

if exist "data\employees.json" (
  echo VERIFY_MOBILE_R1 FAIL: data\employees.json must not be published
  exit /b 1
)

if exist "fallback-data.js" (
  echo VERIFY_MOBILE_R1 FAIL: fallback-data.js must not be published
  exit /b 1
)

echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.25 Safe Manual Update Center is ready.
exit /b 0
