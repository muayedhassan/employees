@echo off
setlocal
cd /d "%~dp0"
echo [Mobile R1.4.3] Checking HR mobile repository...
node scripts\verify-mobile-r1.mjs
if errorlevel 1 (
  echo VERIFY FAILED.
  pause
  exit /b 1
)
echo VERIFY PASSED.
pause
