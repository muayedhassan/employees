@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.39] Checking static scope title fix...
if not exist "index.html" (echo VERIFY_MOBILE_R1 FAIL: index.html not found&exit /b 1)
if not exist "service-worker.js" (echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found&exit /b 1)
if not exist "recovery.html" (echo VERIFY_MOBILE_R1 FAIL: recovery.html not found&exit /b 1)
findstr /C:"MOBILE-R1.5.39-SCOPE-TITLES-STATIC-FIX" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: R1.5.39 release marker missing&exit /b 1)
findstr /C:"R1539_SCOPE_TITLES_STATIC_FIX" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: R1.5.39 static scope marker missing&exit /b 1)
findstr /C:"r1539-scope-titles-static-fix" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: final R1.5.39 release authority missing&exit /b 1)
findstr /C:"MOBILE-R1.5.39-SERVICE-WORKER-NO-STALE-UI" "service-worker.js" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: R1.5.39 service worker marker missing&exit /b 1)
findstr /C:"MOBILE-R1.5.36-PRE-SCOPE-TITLES-ROLLBACK-STABLE" "index.html" >nul
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: stable R1.5.36 base missing&exit /b 1)
findstr /C:"MOBILE-R1.5.32-SCOPE-TITLES-ONLY" "index.html" >nul
if not errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: broken R1.5.32 patch present&exit /b 1)
findstr /C:"MOBILE-R1.5.33-MANUAL-SYSTEM-UPDATE-VERSION-FIX" "index.html" >nul
if not errorlevel 1 (echo VERIFY_MOBILE_R1 FAIL: broken R1.5.33 patch present&exit /b 1)
if exist "data\employees.json" (echo VERIFY_MOBILE_R1 FAIL: data file must not be published&exit /b 1)
if exist "fallback-data.js" (echo VERIFY_MOBILE_R1 FAIL: fallback-data.js must not be published&exit /b 1)
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.39 static scope titles fix is ready.
exit /b 0
