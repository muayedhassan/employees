@echo off
setlocal
set ROOT=%~dp0HRMobileRepo
if not exist "%ROOT%" set ROOT=%CD%
cd /d "%ROOT%"
echo Cleaning old mobile documentation and legacy Excel workflow...
del /q DEPLOY_GUIDE_AR.txt 2>nul
del /q DEPLOY_R4_AR.txt 2>nul
del /q R4_NOTES_AR.txt 2>nul
del /q R5_DEPLOY_AR.txt 2>nul
del /q R5_EXCEL_UPDATE_AR.txt 2>nul
del /q README.txt 2>nul
del /q README_R4_1_AR.txt 2>nul
del /q README_R4_2_AR.txt 2>nul
del /q README_R5_EXCEL_MASTER_AR.txt 2>nul
del /q .github\workflows\update-employees.yml 2>nul
echo Cleanup completed. Run VERIFY_MOBILE_R1.cmd from the HRMobileRepo folder.
pause
