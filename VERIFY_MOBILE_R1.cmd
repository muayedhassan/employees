@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.35] Checking HR mobile recovery package...

if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)
if not exist "service-worker.js" (
  echo VERIFY_MOBILE_R1 FAIL: service-worker.js not found
  exit /b 1
)
if not exist "recovery.html" (
  echo VERIFY_MOBILE_R1 FAIL: recovery.html not found
  exit /b 1
)

findstr /C:"MOBILE-R1.5.35-SERVICE-WORKER-CACHE-RECOVERY" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: R1.5.35 index marker missing
  exit /b 1
)
findstr /C:"MOBILE-R1.5.35-SERVICE-WORKER-CACHE-RECOVERY" "service-worker.js" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: recovery service worker marker missing
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

echo VERIFY_MOBILE_R1 PASSED: R1.5.35 service-worker cache recovery is ready.
exit /b 0
