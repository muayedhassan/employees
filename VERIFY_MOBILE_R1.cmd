@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.36] Checking pre-scope-title rollback...
if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)
findstr /C:"MOBILE-R1.5.36-PRE-SCOPE-TITLES-ROLLBACK-STABLE" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.36 rollback marker missing
  exit /b 1
)
findstr /C:"MOBILE-R1.5.31-LOADER-RECOVERY-ROLLBACK-STABLE" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: confirmed R1.5.31 stable base missing
  exit /b 1
)
findstr /C:"MOBILE-R1.5.29-MANUAL-REFRESH-TIMEOUT-GUARD" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.29 manual refresh guard missing
  exit /b 1
)
findstr /C:"MOBILE-R1.5.28-SAFE-EMPLOYEE-HISTORY-BASELINE" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.28 safe employee history missing
  exit /b 1
)
findstr /C:"MOBILE-R1.5.27-HARD-DATE-SANITIZER-RECOVERY" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.27 date recovery missing
  exit /b 1
)
findstr /C:"MOBILE-R1.5.32-SCOPE-TITLES-ONLY" "index.html" >nul
if not errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: broken R1.5.32 scope-title patch still present
  exit /b 1
)
findstr /C:"MOBILE-R1.5.33-MANUAL-SYSTEM-UPDATE-VERSION-FIX" "index.html" >nul
if not errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: broken R1.5.33 patch still present
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
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.36 exact pre-title rollback is ready.
exit /b 0
