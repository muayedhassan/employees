@echo off
chcp 65001 >nul
echo Installing Mobile R1.4.49 Multi Branch Independent Pages Patch...
if not exist index.html (
  echo ERROR: Run this installer from inside HRMobileRepo.
  pause
  exit /b 1
)
if exist VERIFY_MOBILE_R1.cmd (
  call VERIFY_MOBILE_R1.cmd
) else (
  npm run verify:mobile
)
echo Done.
pause
