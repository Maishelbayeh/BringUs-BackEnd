# تحديث طرق الدفع مع QR Code والصور 🏦

## 📋 نظرة عامة

تم تحديث نموذج `PaymentMethod` لدعم:
- **QR Code للدفع** (مثل Reflect)
- **صور متعددة** لكل طريقة دفع
- **أنواع مختلفة من الصور** (logo, banner, qr_code, payment_screenshot)

## 🆕 الحقول الجديدة

### 1. QR Code Settings
```javascript
qrCode: {
  enabled: Boolean,        // تفعيل/إلغاء QR code
  qrCodeUrl: String,       // رابط QR code
  qrCodeImage: String,     // صورة QR code
  qrCodeData: String       // بيانات QR code
}
```

### 2. Payment Images
```javascript
paymentImages: [{
  imageUrl: String,        // رابط الصورة
  imageType: String,       // نوع الصورة
  altText: String,         // نص بديل
  priority: Number         // أولوية العرض
}]
```

## 🏷️ أنواع الصور المدعومة

| النوع | الوصف | الاستخدام |
|-------|-------|-----------|
| `logo` | شعار الشركة | شعار طريقة الدفع |
| `banner` | بانر إعلاني | إعلانات الدفع |
| `qr_code` | رمز QR | QR codes للدفع |
| `payment_screenshot` | لقطة شاشة | أمثلة على الدفع |
| `other` | أخرى | صور إضافية |

## 🔧 أنواع طرق الدفع المحدثة

| النوع | الوصف | QR Code | الصور |
|-------|-------|---------|-------|
| `cash` | نقدي | ❌ | ✅ |
| `card` | بطاقة ائتمان | ❌ | ✅ |
| `digital_wallet` | محفظة رقمية | ❌ | ✅ |
| `bank_transfer` | تحويل بنكي | ❌ | ✅ |
| `qr_code` ✅ | QR code | ✅ | ✅ |
| `other` | أخرى | ❌ | ✅ |

## 📊 مثال على البيانات

### طريقة دفع QR Code (مثل Reflect):
```javascript
{
  titleAr: 'الدفع عبر QR Code',
  titleEn: 'QR Code Payment',
  methodType: 'qr_code',
  qrCode: {
    enabled: true,
    qrCodeUrl: 'https://reflect.com/pay/store123',
    qrCodeImage: 'https://example.com/qr-code-image.png',
    qrCodeData: 'https://reflect.com/pay/store123?amount='
  },
  paymentImages: [
    {
      imageUrl: 'https://example.com/reflect-logo.png',
      imageType: 'logo',
      altText: 'Reflect Logo',
      priority: 1
    },
    {
      imageUrl: 'https://example.com/qr-code-example.png',
      imageType: 'qr_code',
      altText: 'QR Code Example',
      priority: 2
    },
    {
      imageUrl: 'https://example.com/payment-screenshot.png',
      imageType: 'payment_screenshot',
      altText: 'Payment Screenshot',
      priority: 3
    }
  ]
}
```

## 🛠️ الحقول المحذوفة

تم حذف الحقول التالية لتبسيط النموذج:
- ❌ `requiresCardNumber`
- ❌ `requiresExpiryDate`
- ❌ `requiresCVV`
- ❌ `priority` (من المستوى الرئيسي)
- ❌ `config`

## 🔍 Virtual Fields الجديدة

### 1. QR Code Info
```javascript
// الحصول على معلومات QR code
const qrInfo = paymentMethod.qrCodeInfo;
// Returns: { enabled, url, image, data } or null
```

### 2. Sorted Payment Images
```javascript
// الحصول على الصور مرتبة حسب الأولوية
const sortedImages = paymentMethod.sortedPaymentImages;
// Returns: Array sorted by priority
```

## 📝 Validation Rules

### QR Code Validation:
- إذا كان `qrCode.enabled = true`، يجب توفير `qrCodeUrl` أو `qrCodeData`
- `qrCodeImage` اختياري

### Payment Images Validation:
- `imageUrl` مطلوب لكل صورة
- `imageType` يجب أن يكون من القيم المسموحة
- `altText` أقصى 200 حرف
- `priority` لا يمكن أن يكون سالب

## 🗂️ Indexes الجديدة

```javascript
// Index للبحث السريع في QR codes
paymentMethodSchema.index({ store: 1, 'qrCode.enabled': 1 });
```

## 🧪 إنشاء بيانات تجريبية

```bash
# تشغيل سكريبت إنشاء البيانات
node scripts/createPaymentMethodData.js
```

### البيانات المنشأة:
1. **الدفع النقدي** - طريقة افتراضية
2. **بطاقة الائتمان** - مع رسوم معالجة
3. **المحفظة الرقمية** - PayPal, Apple Pay
4. **التحويل البنكي** - معلومات الحساب
5. **QR Code Payment** - مثل Reflect
6. **طرق دفع أخرى** - مرنة

## 🎯 استخدامات QR Code

### 1. Reflect-like Payment:
```javascript
qrCode: {
  enabled: true,
  qrCodeUrl: 'https://reflect.com/pay/store123',
  qrCodeData: 'https://reflect.com/pay/store123?amount='
}
```

### 2. Custom QR Code:
```javascript
qrCode: {
  enabled: true,
  qrCodeImage: 'https://example.com/custom-qr.png',
  qrCodeData: 'custom-payment-data'
}
```

### 3. Dynamic QR Code:
```javascript
qrCode: {
  enabled: true,
  qrCodeUrl: 'https://api.example.com/generate-qr?store=${storeId}&amount=${amount}'
}
```

## 🔄 Migration

### للمشاريع الموجودة:
1. **إضافة الحقول الجديدة** - اختياري
2. **تحديث البيانات الموجودة** - إذا لزم الأمر
3. **اختبار الوظائف الجديدة**

### مثال على Migration:
```javascript
// إضافة QR code لطرق الدفع الموجودة
await PaymentMethod.updateMany(
  { methodType: 'bank_transfer' },
  { 
    $set: { 
      'qrCode.enabled': true,
      'qrCode.qrCodeUrl': 'https://bank.com/transfer'
    }
  }
);
```

## 📞 الدعم

لأي استفسارات حول التحديثات الجديدة، يرجى التواصل مع فريق التطوير. 