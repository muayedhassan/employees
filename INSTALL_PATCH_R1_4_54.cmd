@echo off
chcp 65001 >nul
echo Installing Mobile R1.4.54 Service Calculator Notes Layout Polish patch...
if exist VERIFY_MOBILE_R1.cmd (
  call VERIFY_MOBILE_R1.cmd
) else (
  echo VERIFY_MOBILE_R1.cmd not found. Please run npm run verify:mobile manually.
)
echo.
echo Patch R1.4.54 files copied. Review verification output above.
pause
