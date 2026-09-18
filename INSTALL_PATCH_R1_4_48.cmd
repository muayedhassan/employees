@echo off
chcp 65001 >nul
setlocal
if not exist index.html (
  echo ERROR: شغل هذا الملف من داخل مجلد HRMobileRepo الخاص بإصدار R1.4.46.
  pause
  exit /b 1
)
echo تم وضع ملفات التحديث داخل هذه الحزمة حسب نفس المسارات.
echo انسخ الملفات فوق R1.4.46 ثم شغل VERIFY_MOBILE_R1.cmd.
echo.
echo ملاحظة: هذا الملف إرشادي فقط إذا فتحت الحزمة داخل مجلد منفصل.
pause
