@echo off
echo Installing Mobile R1.4.64 Safe Title Grade Matching Patch...
xcopy /E /Y /I "%~dp0*" "%~dp0..\" >nul
echo Done. Run VERIFY_MOBILE_R1.cmd from the HRMobileRepo root.
pause
