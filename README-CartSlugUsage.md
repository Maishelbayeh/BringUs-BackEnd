# دليل استخدام السلة مع الـ Slug للمستخدمين غير المسجلين

## ✅ النظام جاهز للاستخدام!

تم إصلاح جميع المشاكل وإعداد النظام للعمل مع المستخدمين غير المسجلين باستخدام الـ slug.

## 🚀 كيفية التشغيل

### 1. تشغيل الـ server
```bash
cd BringUs-BackEnd
npm start
```

### 2. اختبار النظام
```bash
node scripts/test-cart-slug-simple.js
```

## 📝 أمثلة الاستخدام

### إضافة منتج إلى السلة (مستخدم غير مسجل)

#### باستخدام curl:
```bash
curl -X 'POST' \
  'http://localhost:5001/api/cart' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "product": "68760d175c0a31a7ac0965dc",
  "quantity": 1,
  "storeSlug": "updatedstore",
  "selectedSpecifications": [
    {
      "specificationId": "68760979c8ff002615df12ad",
      "valueId": "68760979c8ff002615df12ad",
      "value": "قيمة تجريبية",
      "title": "صفة تجريبية"
    }
  ],
  "selectedColors": ["#000000"],
  "specificationsPrice": 10,
  "colorsPrice": 5
}'
```

#### باستخدام JavaScript:
```javascript
const response = await fetch('http://localhost:5001/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product: '68760d175c0a31a7ac0965dc',
    quantity: 1,
    storeSlug: 'updatedstore',
    selectedSpecifications: [
      {
        specificationId: '68760979c8ff002615df12ad',
        valueId: '68760979c8ff002615df12ad',
        value: 'قيمة تجريبية',
        title: 'صفة تجريبية'
      }
    ],
    selectedColors: ['#000000'],
    specificationsPrice: 10,
    colorsPrice: 5
  })
});

const data = await response.json();
console.log('Guest ID:', response.headers.get('X-Guest-ID'));
```

### جلب السلة (مستخدم غير مسجل)

#### باستخدام curl:
```bash
curl -X 'GET' \
  'http://localhost:5001/api/cart?storeSlug=updatedstore' \
  -H 'accept: */*'
```

#### باستخدام JavaScript:
```javascript
const response = await fetch('http://localhost:5001/api/cart?storeSlug=updatedstore');
const data = await response.json();
```

### إضافة إعجاب (مستخدم غير مسجل)

#### باستخدام curl:
```bash
curl -X 'POST' \
  'http://localhost:5001/api/likes/68760d175c0a31a7ac0965dc?storeSlug=updatedstore' \
  -H 'accept: */*'
```

#### باستخدام JavaScript:
```javascript
const response = await fetch('http://localhost:5001/api/likes/68760d175c0a31a7ac0965dc?storeSlug=updatedstore', {
  method: 'POST'
});
const data = await response.json();
```

### حساب سعر المنتج مع الصفات والألوان

#### باستخدام curl:
```bash
curl -X 'POST' \
  'http://localhost:5001/api/products/68760d175c0a31a7ac0965dc/calculate-price?storeSlug=updatedstore' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "selectedSpecifications": [
    {
      "specificationId": "68760979c8ff002615df12ad",
      "valueId": "68760979c8ff002615df12ad",
      "value": "قيمة تجريبية"
    }
  ],
  "selectedColors": ["#000000"]
}'
```

### جلب خيارات المنتج

#### باستخدام curl:
```bash
curl -X 'GET' \
  'http://localhost:5001/api/products/68760d175c0a31a7ac0965dc/options?storeSlug=updatedstore' \
  -H 'accept: */*'
```

## 🔧 إدارة الـ Guest ID

### الطريقة الأولى: استخدام الـ headers
```javascript
// في الطلب الأول، ستحصل على guest ID في الـ response headers
const response = await fetch('/api/cart?storeSlug=updatedstore');
const guestId = response.headers.get('X-Guest-ID');

// في الطلبات التالية، أرسل الـ guest ID في الـ headers
const response2 = await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Guest-ID': guestId
  },
  body: JSON.stringify({
    product: 'productId',
    quantity: 1,
    storeSlug: 'updatedstore'
  })
});
```

### الطريقة الثانية: استخدام الـ query parameters
```javascript
const response = await fetch('/api/cart?storeSlug=updatedstore&guestId=your-guest-id');
```

### الطريقة الثالثة: استخدام الـ body
```javascript
const response = await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product: 'productId',
    quantity: 1,
    storeSlug: 'updatedstore',
    guestId: 'your-guest-id'
  })
});
```

## 📋 جميع المسارات المدعومة

### السلة (Cart)
- `GET /api/cart?storeSlug=slug` - جلب السلة
- `POST /api/cart` - إضافة منتج إلى السلة
- `PUT /api/cart/{productId}?storeSlug=slug` - تحديث عنصر في السلة
- `DELETE /api/cart/{productId}?storeSlug=slug` - حذف عنصر من السلة
- `DELETE /api/cart?storeSlug=slug` - مسح السلة بالكامل

### الإعجابات (Likes)
- `GET /api/likes?storeSlug=slug` - جلب المنتجات المعجبة
- `POST /api/likes/{productId}?storeSlug=slug` - إضافة إعجاب
- `DELETE /api/likes/{productId}?storeSlug=slug` - إزالة إعجاب

### المنتجات (Products)
- `GET /api/products/{productId}/options?storeSlug=slug` - جلب خيارات المنتج
- `POST /api/products/{productId}/calculate-price?storeSlug=slug` - حساب سعر المنتج

## 🔄 دمج السلة عند تسجيل الدخول

عند تسجيل الدخول، يتم دمج سلة الضيف مع سلة المستخدم تلقائياً:

```javascript
// تسجيل الدخول
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

// سيتم دمج السلة تلقائياً في الـ backend
```

## ⚠️ ملاحظات مهمة

1. **الـ slug يجب أن يكون موجوداً**: تأكد من أن الـ slug موجود في قاعدة البيانات
2. **المتجر يجب أن يكون نشطاً**: فقط المتاجر بحالة 'active' مدعومة
3. **الـ guestId**: يتم توليده تلقائياً في الطلب الأول
4. **حفظ الـ guestId**: احفظ الـ guestId من الـ response headers لاستخدامه في الطلبات التالية

## 🧪 اختبار النظام

```bash
# تشغيل الاختبارات
node scripts/test-cart-slug-simple.js

# أو اختبار يدوي
curl -X 'POST' 'http://localhost:5001/api/cart' \
  -H 'Content-Type: application/json' \
  -d '{"product":"68760d175c0a31a7ac0965dc","quantity":1,"storeSlug":"updatedstore"}'
```

## 🎉 النظام جاهز!

النظام الآن يدعم كامل العمليات للمستخدمين غير المسجلين باستخدام الـ slug! 🚀 