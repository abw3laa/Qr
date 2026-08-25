# Deployment findings

- فشل فتح HTTPS مباشرة من متصفح Sandbox برسالة `ERR_SSL_PROTOCOL_ERROR`.
- فتح HTTP أعاد توجيهاً إلى HTTPS، لكن الصفحة المنشورة تعرض: `This site is under maintenance.`
- النطاق المستهدف الصحيح هو `https://qrcard-jjdar3fj.manus.space`.
- يلزم إعادة نشر نسخة الويب/انتظار اكتمال النشر قبل اعتماد النطاق في QR الأونلاين.
