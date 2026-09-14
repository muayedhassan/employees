# HRMobileRepo — Mobile R1.4.20 PDF Single Page + Download Status

إصلاح بطاقة الموظف PDF لتظهر كاملة داخل صفحة A4 واحدة دون قص أو انقسام، مع رسالة تنزيل دقيقة على Android. لا تغيير على البيانات أو Windows Master Bridge.

# HRMobileRepo — Mobile R1.4.19 Native PDF Download Bridge

إصلاح تنزيل بطاقة الموظف على Android WebView: زران مختصران «معاينة البطاقة» و«تحميل البطاقة»، مع تأكيد قبل التحميل ومسار same-origin attachment عبر Service Worker بدل الاعتماد على blob: URL. لا تغيير على البيانات أو Windows Master Bridge.

# HRMobileRepo — Mobile R1.4.17 PDF View / Direct Download

تطوير صغير فوق R1.4.16 المستقرة: تم فصل بطاقة الموظف PDF إلى زرين مستقلين، «عرض بطاقة PDF» للمعاينة فقط و«تحميل بطاقة PDF» للتنزيل المباشر بعد رسالة تأكيد. لا تغيير على تصميم البطاقة أو البيانات أو Windows Master Bridge.

# HRMobileRepo — Mobile R1.4.16 Navigation PDF Admin Polish

تطوير فوق R1.4.15 المستقرة: تنقل مقسم واحترافي يمنع تداخل الأقسام، زر حفظ PDF واضح داخل معاينة الهاتف، والإدارة مخصصة لحماية البيانات والاسترجاع فقط. لا تغيير على data/ أو Windows Master Bridge.

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


## R1.4.19 — Native PDF Download Bridge
- زر «معاينة البطاقة» للعرض فقط، وزر «تحميل البطاقة» للتنزيل بعد التأكيد.
- على تطبيق Android Median يتم تمرير Blob الـPDF إلى `median.share.downloadFile` بدل الاعتماد على رابط Service Worker فقط.
- يستخدم APK الحالي جسر Median المدمج وBlobDownloader الأصلي، لذلك لا يحتاج هذا التحديث إلى تعديل APK.
- يبقى مسار R1.4.18 كحل احتياطي للمتصفح أو عند غياب الجسر الأصلي.


## R1.4.20 — PDF Single Page + Download Status
- إنشاء البطاقة كصورة كاملة ثم احتواؤها تناسبيًا داخل صفحة A4 واحدة.
- منع قص نصف البطاقة أو تقسيمها بسبب اختلاف أبعاد WebView.
- تحسين حالة التنزيل في APK الحالي ذي التخزين الخاص بالتطبيق.
