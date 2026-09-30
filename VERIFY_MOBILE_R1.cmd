@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.34] Checking HR mobile repository...
if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)
findstr /C:"MOBILE-R1.5.34-LOADER-RECOVERY-FROM-R1532" "index.html" >nul || (echo VERIFY_MOBILE_R1 FAIL: R1.5.34 marker missing & exit /b 1)
findstr /C:"MOBILE-R1.5.32-SCOPE-TITLES-ONLY" "index.html" >nul || (echo VERIFY_MOBILE_R1 FAIL: R1.5.32 scope titles base missing & exit /b 1)
findstr /C:"MOBILE-R1.5.31-LOADER-RECOVERY-ROLLBACK-STABLE" "index.html" >nul || (echo VERIFY_MOBILE_R1 FAIL: R1.5.31 loader recovery base missing & exit /b 1)
findstr /C:"MOBILE-R1.5.29-MANUAL-REFRESH-TIMEOUT-GUARD" "index.html" >nul || (echo VERIFY_MOBILE_R1 FAIL: R1.5.29 manual refresh guard missing & exit /b 1)
findstr /C:"MOBILE-R1.5.28-SAFE-EMPLOYEE-HISTORY-BASELINE" "index.html" >nul || (echo VERIFY_MOBILE_R1 FAIL: R1.5.28 history baseline missing & exit /b 1)
findstr /C:"MOBILE-R1.5.27-HARD-DATE-SANITIZER-RECOVERY" "index.html" >nul || (echo VERIFY_MOBILE_R1 FAIL: R1.5.27 date fix missing & exit /b 1)
findstr /C:"MOBILE-R1.5.33-MANUAL-SYSTEM-UPDATE-VERSION-FIX" "index.html" >nul && (echo VERIFY_MOBILE_R1 FAIL: risky R1.5.33 code still present & exit /b 1)
if exist "data\employees.json" (echo VERIFY_MOBILE_R1 FAIL: data\employees.json must not be published & exit /b 1)
if exist "fallback-data.js" (echo VERIFY_MOBILE_R1 FAIL: fallback-data.js must not be published & exit /b 1)
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.34 recovery build is ready.
exit /b 0
