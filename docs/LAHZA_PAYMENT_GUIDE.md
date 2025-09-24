# دليل استخدام Lahza Payment API

## 📋 المتطلبات الأساسية

### 1. إعداد المتجر
- يجب أن يحتوي المتجر على `lahzaSecretKey` في قاعدة البيانات
- يمكن إضافة المفتاح من خلال API إدارة المتاجر

### 2. البيانات المطلوبة
```json
{
  "amount": 100.50,           // المبلغ (مطلوب)
  "currency": "ILS",          // العملة (اختياري، افتراضي: ILS)
  "email": "user@example.com", // البريد الإلكتروني (مطلوب)
  "customerName": "أحمد محمد"  // اسم العميل (مطلوب)
}
```

## 🚀 كيفية الاستخدام

### 1. من Swagger UI
1. اذهب إلى: `http://localhost:5001/api-docs`
2. ابحث عن قسم "Lahza Payment"
3. اختر `POST /api/lahza-payment/{storeId}/initialize`
4. أدخل Store ID: `687c9bb0a7b3f2a0831c4675`
5. استخدم البيانات التالية:

```json
{
  "amount": 99.99,
  "currency": "USD",
  "email": "moon95@gmail.com",
  "customerName": "أحمد محمد",
  "customerPhone": "+972501234567",
  "description": "دفع مقابل طلب #12345",
  "metadata": {
    "orderId": "12345",
    "userId": "687c9c02a7b3f2a0831c46be"
  }
}
```

### 2. من الكود
```javascript
const response = await axios.post('/api/lahza-payment/687c9bb0a7b3f2a0831c4675/initialize', {
  amount: 99.99,
  currency: 'USD',
  email: 'moon95@gmail.com',
  customerName: 'أحمد محمد',
  metadata: {
    orderId: '12345',
    userId: '687c9c02a7b3f2a0831c46be'
  }
});
```

## 🔧 حل المشاكل الشائعة

### خطأ: "Valid email is required"
**السبب:** لم يتم إرسال حقل `email` أو أنه فارغ
**الحل:** تأكد من إرسال بريد إلكتروني صحيح

### خطأ: "Customer name must be between 2 and 100 characters"
**السبب:** لم يتم إرسال حقل `customerName` أو أنه قصير جداً
**الحل:** تأكد من إرسال اسم عميل صحيح (2-100 حرف)

### خطأ: "Store does not have Lahza secret key configured"
**السبب:** المتجر لا يحتوي على مفتاح Lahza
**الحل:** قم بإضافة `lahzaSecretKey` للمتجر

## 📊 تنسيق الاستجابة

### نجاح العملية
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "transaction_id": "txn_123456789",
    "reference": "ref_987654321",
    "amount": "9999",
    "currency": "USD",
    "status": "pending",
    "payment_url": "https://pay.lahza.io/pay/ref_987654321",
    "authorization_url": "https://pay.lahza.io/auth/ref_987654321",
    "customer": {
      "name": "أحمد محمد",
      "email": "moon95@gmail.com",
      "phone": "+972501234567"
    },
    "metadata": {
      "storeId": "687c9bb0a7b3f2a0831c4675",
      "orderId": "12345",
      "userId": "687c9c02a7b3f2a0831c46be"
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "expires_at": "2024-01-01T01:00:00.000Z"
  }
}
```

### فشل العملية
```json
{
  "success": false,
  "message": "Failed to initialize payment",
  "error": "Store does not have Lahza secret key configured"
}
```

## 🧪 اختبار API

### تشغيل الاختبارات
```bash
# اختبار بسيط
node test/lahza-simple-test.js

# اختبار التنسيق الجديد
node test/lahza-payment-format-test.js

# اختبار شامل
node test/lahza-payment-test.js
```

### أمثلة للاختبار
```bash
# تشغيل الأمثلة
node examples/lahza-swagger-example.js
```

## 📝 ملاحظات مهمة

1. **المبلغ:** يتم تحويله تلقائياً إلى الوحدة الأصغر (سنتات)
2. **الاسم:** يتم تقسيمه تلقائياً إلى `first_name` و `last_name`
3. **Metadata:** يتم تحويله إلى JSON string
4. **العملات المدعومة:** ILS, USD, EUR
5. **التحقق:** استخدم `/verify` للتحقق من حالة الدفع
6. **الحالة:** استخدم `/status/{reference}` للحصول على حالة الدفع

## 🔗 Endpoints المتاحة

| Method | Endpoint | الوصف |
|--------|----------|--------|
| `POST` | `/api/lahza-payment/{storeId}/initialize` | بدء عملية دفع |
| `POST` | `/api/lahza-payment/{storeId}/verify` | التحقق من الدفع |
| `GET` | `/api/lahza-payment/{storeId}/status/{reference}` | حالة الدفع |
| `GET` | `/api/lahza-payment/{storeId}/test-connection` | اختبار الاتصال |
