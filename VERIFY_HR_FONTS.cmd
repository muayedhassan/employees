@echo off
setlocal
cd /d "%~dp0"
set ERR=0
for %%F in ("assets\fonts\YaModernPro-Bold.otf" "assets\fonts\ZainMobile.ttf" "assets\fonts\SFSultan-Black.ttf" "assets\fonts\Stencil.ttf" "assets\fonts\ElfeeraScript.ttf") do (
  if exist "%%~F" (
    echo OK: %%~F
  ) else (
    echo MISSING: %%~F
    set ERR=1
  )
)
if "%ERR%"=="0" (
  echo VERIFY FONTS PASSED
  exit /b 0
)
echo VERIFY FONTS FAILED - run INSTALL_HR_FONTS.cmd C:\HR_Fonts
exit /b 1
