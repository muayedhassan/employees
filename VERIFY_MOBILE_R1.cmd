@echo off
setlocal EnableExtensions
cd /d "%~dp0"
where node >nul 2>&1 || (echo NODEJS_REQUIRED&exit /b 2)
node scripts\verify-mobile-r1.mjs
if errorlevel 1 (echo VERIFY_MOBILE_R1 FAILED&exit /b 1)
echo VERIFY_MOBILE_R1 OK: R1.5.102
exit /b 0
