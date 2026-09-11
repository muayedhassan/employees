@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_HR_FONTS.ps1" %*
exit /b %errorlevel%
