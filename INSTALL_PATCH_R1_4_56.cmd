@echo off
setlocal
cd /d "%~dp0"
echo Installing Mobile R1.4.56 Job Titles Directory Card patch...
if not exist index.html (
  echo ERROR: copy the contents of HRMobileRepo from this patch over the existing HRMobileRepo folder.
  pause
  exit /b 1
)
if exist VERIFY_MOBILE_R1.cmd (
  call VERIFY_MOBILE_R1.cmd
) else (
  node scripts\verify-mobile-r1.mjs
)
