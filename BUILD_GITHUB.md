# تشغيل وبناء QR Card

## التشغيل المحلي

يحتاج المشروع إلى Node.js 22 وpnpm. بعد استنساخ المستودع، شغّل `pnpm install` ثم `pnpm dev`. يفتح الموقع من عنوان Metro الذي يظهر في الطرفية، بينما تعمل واجهات API من الخادم المرافق. للتحقق قبل الدفع استخدم `pnpm check && pnpm lint && pnpm test`.

## البناء على GitHub

يوجد workflow في `.github/workflows/build.yml`. عند كل push إلى `main` أو إنشاء Pull Request، ينفذ GitHub فحص TypeScript وlint والاختبارات ثم يصدر نسخة الويب. كما يبني وظيفة Android native من Expo عبر `expo prebuild` ثم ينفذ Gradle وينتج ملف `app-debug.apk` قابلاً للتثبيت للاختبار. يمكن تشغيله يدوياً من تبويب **Actions → QR Card Build → Run workflow**.

بعد اكتمال التشغيل، افتح صفحة التشغيل الناجح واختر قسم **Artifacts** ثم نزّل `qr-card-android-apk` أو `qr-card-web`. لا يحتاج هذا المسار إلى `EXPO_TOKEN` لأن البناء يتم على GitHub Runner مباشرة، وليس عبر EAS.

## عنوان QR الأونلاين

يفضل إضافة متغير Repository Variable باسم `EXPO_PUBLIC_WEB_BASE_URL` من **Settings → Secrets and variables → Actions → Variables**، وقيمته عنوان الموقع المنشور مثل `https://your-domain.example`. إذا لم يُضبط المتغير، يستخدم الويب نطاق الصفحة الحالية، بينما يحتاج APK إلى عنوان عام ثابت حتى تفتح روابط QR من خارج الجهاز.

## ملاحظات Android

يدعم APK الكاميرا ومسح QR وحفظ جهات الاتصال وNFC عبر config plugins. عند عدم توفر NFC، يبقى QR هو البديل الأساسي. ملف debug الناتج مناسب للاختبار والتثبيت المباشر؛ وللنشر التجاري ينبغي لاحقاً إضافة توقيع Android آمن داخل GitHub Secrets وإعداد build release منفصل.

## مراجع

[1]: https://docs.github.com/en/actions "GitHub Actions documentation"
[2]: https://docs.expo.dev/workflow/prebuild/ "Expo Prebuild documentation"
[3]: https://developer.android.com/build/building-cmdline "Android command-line build documentation"
