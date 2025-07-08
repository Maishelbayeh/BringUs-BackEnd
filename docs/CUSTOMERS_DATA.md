# بيانات العملاء - 4 يوزرز (2 لكل متجر) 👥

## نظرة عامة

تم إنشاء 4 عملاء موزعين على متجرين:
- **TechStore**: 2 عملاء
- **FashionStore**: 2 عملاء

## بيانات العملاء

### 🛠️ TechStore Customers

#### 1. أحمد محمد
- **الاسم**: أحمد محمد
- **البريد الإلكتروني**: `ahmed.tech@test.com`
- **كلمة المرور**: `password123`
- **الهاتف**: `+966501234567`
- **العنوان**: شارع الملك فهد، الرياض، الرياض
- **الرمز البريدي**: `12345`
- **الدولة**: السعودية
- **الحالة**: نشط

#### 2. فاطمة علي
- **الاسم**: فاطمة علي
- **البريد الإلكتروني**: `fatima.tech@test.com`
- **كلمة المرور**: `password123`
- **الهاتف**: `+966507654321`
- **العنوان**: شارع التحلية، جدة، مكة المكرمة
- **الرمز البريدي**: `54321`
- **الدولة**: السعودية
- **الحالة**: نشط

### 👗 FashionStore Customers

#### 1. سارة عبدالله
- **الاسم**: سارة عبدالله
- **البريد الإلكتروني**: `sara.fashion@test.com`
- **كلمة المرور**: `password123`
- **الهاتف**: `+966506667778`
- **العنوان**: شارع التحلية، جدة، مكة المكرمة
- **الرمز البريدي**: `33333`
- **الدولة**: السعودية
- **الحالة**: نشط

#### 2. خالد علي
- **الاسم**: خالد علي
- **البريد الإلكتروني**: `khalid.fashion@test.com`
- **كلمة المرور**: `password123`
- **الهاتف**: `+966508889990`
- **العنوان**: شارع الملك فهد، الرياض، الرياض
- **الرمز البريدي**: `44444`
- **الدولة**: السعودية
- **الحالة**: نشط

## ملخص البيانات

```json
{
  "totalCustomers": 4,
  "techStoreCount": 2,
  "fashionStoreCount": 2,
  "isolation": "verified"
}
```

## بيانات تسجيل الدخول

### TechStore
```
ahmed.tech@test.com / password123
fatima.tech@test.com / password123
```

### FashionStore
```
sara.fashion@test.com / password123
khalid.fashion@test.com / password123
```

## كيفية استخدام البيانات

### 1. إنشاء العملاء في قاعدة البيانات
```javascript
// استيراد البيانات
const customersData = require('./data/customers-data.json');

// إنشاء عملاء TechStore
for (const customer of customersData.techStoreCustomers) {
  await User.create({
    ...customer,
    store: techStoreId // استبدل بمعرف المتجر الفعلي
  });
}

// إنشاء عملاء FashionStore
for (const customer of customersData.fashionStoreCustomers) {
  await User.create({
    ...customer,
    store: fashionStoreId // استبدل بمعرف المتجر الفعلي
  });
}
```

### 2. اختبار تسجيل الدخول
```javascript
// تسجيل دخول عميل TechStore
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'ahmed.tech@test.com',
    password: 'password123'
  })
});

// تسجيل دخول عميل FashionStore
const loginResponse2 = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'sara.fashion@test.com',
    password: 'password123'
  })
});
```

### 3. جلب عملاء المتجر
```javascript
// جلب عملاء TechStore
const techCustomers = await fetch('/api/users/customers', {
  headers: { 'Authorization': `Bearer ${techToken}` }
});

// جلب عملاء FashionStore
const fashionCustomers = await fetch('/api/users/customers', {
  headers: { 'Authorization': `Bearer ${fashionToken}` }
});
```

## التحقق من العزل

### ✅ عزل البيانات
- كل عميل مرتبط بمتجر واحد فقط
- لا يمكن الوصول لبيانات متاجر أخرى
- حماية كاملة للخصوصية

### 🔍 اختبار العزل
```javascript
// يجب أن يعيد فقط عملاء TechStore
const techStoreCustomers = await User.find({ store: techStoreId });

// يجب أن يعيد فقط عملاء FashionStore
const fashionStoreCustomers = await User.find({ store: fashionStoreId });

// يجب أن يكون العدد 2 لكل متجر
console.log('TechStore customers:', techStoreCustomers.length); // 2
console.log('FashionStore customers:', fashionStoreCustomers.length); // 2
```

## الملفات المرتبطة

- `data/customers-data.json` - بيانات العملاء
- `scripts/createCustomerTestData.js` - script إنشاء البيانات
- `scripts/createSimpleCustomers.js` - script مبسط
- `docs/CUSTOMERS_SYSTEM.md` - توثيق النظام

## ملاحظات مهمة

1. **كلمات المرور**: جميع العملاء يستخدمون `password123` للاختبار
2. **العناوين**: عناوين سعودية واقعية
3. **الأرقام**: أرقام هواتف سعودية صحيحة
4. **العزل**: كل عميل مرتبط بمتجر واحد فقط
5. **الحالة**: جميع العملاء نشطين

---

**تم إنشاء البيانات بنجاح! 🎉** 