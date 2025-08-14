# نظام تجديد الاشتراكات التلقائي

## نظرة عامة

تم إنشاء نظام تجديد الاشتراكات التلقائي لإدارة اشتراكات المتاجر بشكل تلقائي. النظام يقوم بـ:

1. **فحص الاشتراكات المنتهية** كل شهر وتحويلها إلى `inactive`
2. **تجديد تلقائي** للاشتراكات التي لديها `autoRenew: true` عند انتهاء `trialEndDate`
3. **استدعاء API Lahza** لخصم المبلغ من البطاقة

## المكونات

### 1. SubscriptionRenewalService
الخدمة الرئيسية التي تتعامل مع:
- فحص الاشتراكات المنتهية
- تجديد الاشتراكات تلقائياً
- استدعاء API Lahza
- إدارة سجل الاشتراكات

### 2. API Endpoints
- `/api/subscription-renewal/check` - فحص شامل
- `/api/subscription-renewal/expired` - فحص الاشتراكات المنتهية فقط
- `/api/subscription-renewal/auto-renew` - فحص التجديد التلقائي فقط
- `/api/subscription-renewal/test-charge` - اختبار API Lahza
- `/api/subscription-renewal/status` - حالة الخدمة

## كيفية العمل

### فحص الاشتراكات المنتهية
```javascript
// يبحث عن المتاجر التي:
// - subscription.isSubscribed: true
// - subscription.endDate < الآن
// ثم يحولها إلى inactive
```

### التجديد التلقائي
```javascript
// يبحث عن المتاجر التي:
// - subscription.autoRenew: true
// - subscription.trialEndDate <= الآن
// - subscription.isSubscribed: false
// - subscription.referenceId موجود
// - contact.email موجود
```

### استدعاء API Lahza
```javascript
POST https://api.lahza.io/transaction/charge_authorization
Headers:
  authorization: Bearer sk_test_aJgxg75kYKtW6qVuTgijJyzpuhszRSvc4
  content-type: application/json

Body:
{
  "amount": "10000", // بالـ aghora (100 شيكل = 10000 aghora)
  "email": "store@example.com",
  "authorization_code": "auth_code_from_referenceId"
}

Response:
{
  "status": true,
  "message": "Charge attempted",
  "data": {
    "amount": 10000,
    "currency": "ILS",
    "status": "success",
    "reference": "jciewopcmvbeu2",
    "gateway_response": "Approved",
    "id": 696105928,
    "authorization": {
      "authorization_code": "AUTH_ksie923sxc",
      "reusable": true
    }
  }
}
```

## تحويل العملات

النظام يحول المبالغ تلقائياً إلى الوحدات الصغيرة:

- **ILS (شيكل)**: `amount * 100` = aghora
- **JOD (دينار)**: `amount * 1000` = qirsh
- **USD (دولار)**: `amount * 100` = cents
- **EUR (يورو)**: `amount * 100` = cents
- **SAR (ريال)**: `amount * 100` = halala
- **AED (درهم)**: `amount * 100` = fils
- **EGP (جنيه)**: `amount * 100` = piastres

## Cron Job

النظام يعمل تلقائياً كل ساعة للتجربة، ويمكن تعديله ليعمل شهرياً:

```javascript
// كل شهر في اليوم الأول الساعة 2 صباحاً
const cronExpression = '0 2 1 * *';

// للتجربة: كل ساعة
setInterval(() => {
  this.runSubscriptionCheck();
}, 60 * 60 * 1000);
```

## سجل الاشتراكات

كل عملية يتم تسجيلها في `subscriptionHistory`:

```javascript
{
  action: 'payment_received' | 'payment_failed' | 'subscription_renewed' | 'subscription_expired',
  description: 'وصف بالعربية',
  details: {
    amount: 10000, // المبلغ بالوحدات الصغيرة
    currency: 'ILS',
    transactionId: 696105928,
    reference: 'jciewopcmvbeu2',
    authorizationCode: 'AUTH_ksie923sxc',
    gatewayResponse: 'Approved',
    error: 'error_message_if_failed'
  },
  performedAt: new Date()
}
```

## استخدام API

### تشغيل فحص شامل
```bash
POST /api/subscription-renewal/check
Authorization: Bearer <superadmin_token>
```

### اختبار API Lahza
```bash
POST /api/subscription-renewal/test-charge
Authorization: Bearer <superadmin_token>
Content-Type: application/json

{
  "amount": 100,
  "email": "test@example.com",
  "authorizationCode": "auth_code_123",
  "currency": "ILS"
}
```

### فحص حالة الخدمة
```bash
GET /api/subscription-renewal/status
Authorization: Bearer <superadmin_token>
```

## متطلبات البيانات

للتجديد التلقائي، يجب أن يحتوي المتجر على:

1. **subscription.autoRenew**: `true`
2. **subscription.referenceId**: رمز التفويض من Lahza
3. **subscription.amount**: المبلغ المطلوب
4. **contact.email**: البريد الإلكتروني
5. **subscription.trialEndDate**: تاريخ انتهاء التجربة

## الأمان

- جميع الـ endpoints تتطلب صلاحيات Superadmin
- API Key محفوظ في الخدمة
- جميع العمليات مسجلة في سجل الاشتراكات
- معالجة الأخطاء شاملة

## مراقبة النظام

يمكن مراقبة النظام من خلال:

1. **Console Logs**: جميع العمليات مسجلة في console
2. **API Status**: `/api/subscription-renewal/status`
3. **Subscription History**: في قاعدة البيانات
4. **Error Handling**: معالجة شاملة للأخطاء

## استكشاف الأخطاء

### مشاكل شائعة:

1. **لا يوجد referenceId**: تأكد من حفظ رمز التفويض
2. **لا يوجد email**: تأكد من وجود البريد الإلكتروني
3. **مبلغ غير صحيح**: تأكد من أن المبلغ أكبر من صفر
4. **API Lahza فشل**: تحقق من API Key والبيانات المرسلة

### فحص الأخطاء:

```bash
# فحص الاشتراكات المنتهية فقط
POST /api/subscription-renewal/expired

# فحص التجديد التلقائي فقط
POST /api/subscription-renewal/auto-renew

# اختبار API Lahza
POST /api/subscription-renewal/test-charge

# اختبار API Lahza من Terminal
npm run test-lahza-api
```
