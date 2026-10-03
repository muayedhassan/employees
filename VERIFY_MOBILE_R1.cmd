@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [Mobile R1.5.70 Candidate] Checking Qualification Infographic Reference...
findstr /C:"MOBILE-R1.5.70-QUALIFICATION-INFOGRAPHIC-REFERENCE" "VERSION.txt" >nul || (echo VERIFY_MOBILE_R1 FAIL: VERSION mismatch&exit /b 1)
findstr /C:"employee-registry-ui-r1570" "service-worker.js" >nul || (echo VERIFY_MOBILE_R1 FAIL: cache mismatch&exit /b 1)
node scripts/verify-mobile-r1.mjs
if errorlevel 1 exit /b 1
echo VERIFY_MOBILE_R1 PASSED: Mobile R1.5.70 Qualification Infographic Reference candidate is ready for phone testing.
echo NOTE: No commit or push was performed.
exit /b 0
