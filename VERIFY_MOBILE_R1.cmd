@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.27] Checking HR mobile repository...
if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)
findstr /C:"MOBILE-R1.5.27-HARD-DATE-SANITIZER-RECOVERY" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.27 hard date sanitizer recovery is missing
  exit /b 1
)
findstr /C:"r1526-safe-manual-update-center-script" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: Safe Manual Update Center wrapper is missing
  exit /b 1
)
findstr /C:"r1520-date-sanitizer-fix-script" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.20 sanitizer marker is missing
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
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.27 Hard Date Sanitizer Recovery is ready.
exit /b 0
