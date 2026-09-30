@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.33] Checking HR mobile repository...

if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)

findstr /C:"MOBILE-R1.5.33-MANUAL-SYSTEM-UPDATE-FIX" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.33 marker missing
  exit /b 1
)

findstr /C:"r1533-manual-system-update-version-fix" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.33 script missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.31-LOADER-RECOVERY-ROLLBACK-STABLE" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: stable loader recovery base missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.29-MANUAL-REFRESH-TIMEOUT-GUARD" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: manual refresh timeout guard missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.27-HARD-DATE-SANITIZER-RECOVERY" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: hard date sanitizer recovery missing
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

echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.33 manual system update version fix is ready.
exit /b 0
