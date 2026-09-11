# سجل الموظفين - نسخة الهاتف Mobile R1.1

هذه هي نسخة الهاتف المرتبطة بنظام HRSystem على Windows عبر GitHub.

## الحالة الحالية
- إصدار واجهة الهاتف: Mobile R1.1 - Premium Employee UX
- مصدر البيانات: HRSystem / SQL Server عبر مستودع GitHub
- آخر بيانات مرفقة: DATA-2026.09.11-131725
- عدد الموظفين: 1052 = 855 دائمي + 197 عقد
- البيانات الحساسة: مشمولة حاليًا حسب قرار مرحلة التطوير

## ما الجديد في Mobile R1.1
- لوحة رئيسية أجمل في صفحة الموظفين.
- بطاقات موظفين أكثر وضوحًا وتعرض الوظيفة، الشعبة، الرقم الوظيفي، وتاريخ التعيين.
- تمييز الموظفين المعدلين في آخر نشر.
- صفحة تفاصيل موظف مرتبة بتبويبات: ملخص، الوظيفة، الهوية، إضافية، التغييرات.
- تحديث كاش Service Worker إلى Mobile R1.1 لضمان وصول الواجهة الجديدة.

## ملفات النشر الأساسية
- index.html
- service-worker.js
- manifest.webmanifest
- data/version.json
- data/employees.json
- data/change-summary.json
- data/change-history.json
- data/validation-report.json
- data/fallback-data.js

## طريقة النشر
يتم تحديث ملفات data من برنامج HRSystem على Windows ثم رفعها إلى GitHub. تطبيق الهاتف يقرأ آخر إصدار من GitHub، ويحتفظ بنسخة محلية للعمل دون إنترنت.

## ملاحظات مهمة
لا تحذف مجلد .git من C:\HRMobileRepo لأنه هو الذي يربط المجلد المحلي بمستودع GitHub.
إذا أردت تطبيق هذا الإصدار على C:\HRMobileRepo، انسخ الملفات فوق المستودع المحلي ثم نفذ Commit وPush.

## فحص النسخة
من داخل مجلد المستودع شغّل:

VERIFY_MOBILE_R1.cmd

أو:

npm run verify:mobile
