@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.22] Checking HR mobile repository...

if not exist "index.html" (
  echo VERIFY_MOBILE_R1 FAIL: index.html not found
  exit /b 1
)

findstr /C:"MOBILE-R1.5.22-SYSTEM-UPDATE-CENTER" "index.html" >nul
if errorlevel 1 (
  echo VERIFY_MOBILE_R1 FAIL: APP_RELEASE is not R1.5.22 System Update Center
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

echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.22 System Update Center is ready.
exit /b 0
