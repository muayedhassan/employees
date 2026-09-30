@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.24] Checking HR mobile repository...

if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)

findstr /C:"MOBILE-R1.5.24-UPDATE-LOOP-GUARD" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: Update Loop Guard R1.5.24 is missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.23-INSTANT-SCOPE-COUNTERS" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: Instant Scope Counters R1.5.23 is missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.22-SYSTEM-UPDATE-CENTER" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: System Update Center R1.5.22 is missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.21-EMPLOYEE-HISTORY-TIMELINE" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: Employee History Timeline R1.5.21 is missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.20-DATE-SANITIZER-FIX" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: Date Sanitizer R1.5.20 is missing
  exit /b 1
)

findstr /C:"MOBILE-R1.5.17-INDEXEDDB-PRIMARY-STORE" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: IndexedDB Primary Store R1.5.17 is missing
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

echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.24 Update Loop Guard is ready.
exit /b 0
