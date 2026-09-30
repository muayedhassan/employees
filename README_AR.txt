مشروع تطبيق الموظفين WebView / Median
=====================================

الحالة المعتمدة:
Mobile R1.5.40 — Current Stable

Commit الإصدار المستقر:
861643ac7d517e6c0a4a40b8af372c9cf6e37d31

المسار المحلي:
C:\HRMobileRepo-SecureApp

الملفات والمجلدات الأساسية:
- index.html
- service-worker.js
- recovery.html
- manifest.webmanifest
- VERSION.txt
- assets/
- scripts/
- .github/workflows/
- VERIFY_MOBILE_R1.cmd
- أدوات تثبيت وفحص الخطوط
- package.json

الحالة التقنية:
- IndexedDB هو المخزن الأساسي للبيانات المحلية.
- localStorage يبقى مرآة توافق للواجهة.
- Service Worker والكاش موحدان على R1.5.40.
- التحديث اليدوي يعمل بصورة مستقرة.
- إصلاح عرض التواريخ مستقر.
- النصوص المعتمدة: الدائميون، العقود، إدارة النظام.
- ملفات بيانات الموظفين لا تُنشر في Git.

سياسة التطوير:
- أي تطوير جديد يبدأ من R1.5.40 فقط.
- لا يعتمد R1.5.30 أو R1.5.33 كنقطة أساس.
- ملفات الإصلاح والباتش والنسخ الاحتياطية تبقى محلية ولا تدخل المستودع.
- data/ وdata-source/ وملفات Excel تبقى محلية وغير منشورة.
- يجب تشغيل VERIFY_MOBILE_R1.cmd وnpm run verify:mobile قبل كل إصدار.
