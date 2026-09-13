# HRMobileRepo — Mobile R1.4.15 Updates Details Drilldown

تطوير مركز التحديثات فوق R1.4.14 المستقرة: الموظف المعدل يفتح مباشرة على سجل التغييرات، مع ربط أقوى لسجل الموظف وإظهار زر للوصول إلى آخر إصدار يحتوي تغييرات فعلية عندما يكون آخر نشر بلا تغييرات. لا تغيير على data/ أو Windows Master Bridge.

# HRMobileRepo — Mobile R1.4.14 Load Restore Hotfix

إصلاح تحميل R1.4.13 مع الحفاظ على مركز التحديثات النظيف والبطاقات الأربع التفاعلية في الأعلى، دون تغيير بيانات الموظفين أو مسار Windows → GitHub.

# HRMobileRepo — Mobile R1.4.12

هذا الإصدار يصقل بطاقة طباعة الموظف PDF ويثبت قاعدة خطوط الأرقام والتواريخ.

- الأرقام والتواريخ بخط Stencil.
- جهة إصدار الهوية والملاحظات بخط النص العادي.
- الراتب يظهر بالصيغة: الرقم ثم د.ع.
- لا تغيير على البيانات أو الربط مع HRSystem.

# HRMobileRepo — Mobile R1.4.10 Profile Tab Switch Hotfix

إصلاح تبديل تبويبات بطاقة الموظف: الوظيفة، الهوية، الملاحظات، والتغييرات تظهر الآن عند الضغط عليها بدل بقاء البطاقة على نفس المحتوى.

الأمر المقترح بعد النسخ:

```bat
VERIFY_HR_FONTS.cmd
VERIFY_MOBILE_R1.cmd
git add -A
git commit -m "Mobile R1.4.10: profile tab switch hotfix"
git push
```

---

# HRMobileRepo — Mobile R1.4.8 Load Restore Hotfix

إصدار إصلاحي بعد R1.4.7 لاستعادة تحميل البيانات والأرقام عند فتح التطبيق، مع الحفاظ على تصميم الكروت والتفاصيل والخطوط المضمنة.

الأمر المقترح بعد النسخ:

```bat
VERIFY_HR_FONTS.cmd
VERIFY_MOBILE_R1.cmd
git add -A
git commit -m "Mobile R1.4.8: load restore hotfix"
git push
```


## Mobile R1.4.9
صقل واجهة الهاتف بإزالة النص المصغر غير الضروري، توحيد عرض إصدار البيانات، وحذف أزرار التحديث المكررة من الهيدر. التحديث الرسمي يبقى من حالة النظام.
