@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.26] Checking HR mobile repository...

if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)

findstr /C:"MOBILE-R1.5.26-DATE-SANITIZER-SAFE" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: APP_RELEASE is not R1.5.26 Date Sanitizer Safe
  exit /b 1
)

findstr /C:"MOBILE-R1.5.20-DATE-SANITIZER-FIX" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.20 Date Sanitizer Fix is missing
  exit /b 1
)

findstr /C:"SAFE MANUAL UPDATE CENTER" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: Safe Manual Update Center is missing
  exit /b 1
)

findstr /C:"r122StartAutoUpdateWatchers=function" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: auto update guard is missing
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

echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.26 Date Sanitizer Safe is ready.
exit /b 0
