# Affiliation Store Isolation - حل مشكلة تضارب البريد الإلكتروني

## 🚨 المشكلة

عندما يكون لديك نفس البريد الإلكتروني في متاجر مختلفة، يحدث تضارب في نظام تسجيل الدخول والتحقق من البريد الإلكتروني.

### مثال على المشكلة:
- **المتجر الأول**: `ahmed@example.com` في متجر "Store A"
- **المتجر الثاني**: `ahmed@example.com` في متجر "Store B"
- **المشكلة**: عند تسجيل الدخول، النظام لا يعرف أي متجر يريد المستخدم الدخول إليه

## ✅ الحل المطبق

### 1. **عزل المتاجر في قاعدة البيانات**
```javascript
// في AffiliationController.js
const existingAffiliate = await Affiliation.findOne({
  email: req.body.email,
  store: storeId  // ✅ يتحقق من المتجر الحالي فقط
});

const existingUser = await User.findOne({
  email: req.body.email,
  store: storeId  // ✅ يتحقق من المتجر الحالي فقط
});
```

### 2. **إضافة مرجع المتجر للمستخدم**
```javascript
// عند إنشاء المستخدم
const userData = {
  firstName: req.body.firstName,
  lastName: req.body.lastName,
  email: req.body.email,
  password: req.body.password,
  phone: req.body.mobile,
  role: 'affiliate',
  status: 'active',
  isActive: true,
  store: storeId  // ✅ إضافة مرجع المتجر
};
```

### 3. **نظام تسجيل الدخول مع storeSlug**
```javascript
// في auth.js
if (storeSlug) {
  // البحث في متجر محدد
  user = await User.findOne({ 
    email, 
    store: store._id 
  });
} else {
  // البحث في جميع المتاجر (للمشرفين)
  user = await User.findOne({ email });
}
```

## 🔧 كيفية الاستخدام

### 1. **إنشاء Affiliate في متجر محدد**
```bash
curl -X 'POST' \
  'https://bringus-backend.onrender.com/api/affiliations' \
  -H 'Authorization: Bearer STORE_1_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed@example.com",
    "password": "password123",
    "mobile": "+970599888888",
    "address": "الخليل، فلسطين",
    "percent": 8
  }'
```

### 2. **إنشاء نفس البريد الإلكتروني في متجر آخر**
```bash
curl -X 'POST' \
  'https://bringus-backend.onrender.com/api/affiliations' \
  -H 'Authorization: Bearer STORE_2_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed@example.com",
    "password": "password123",
    "mobile": "+970599888888",
    "address": "رام الله، فلسطين",
    "percent": 10
  }'
```

### 3. **تسجيل الدخول مع تحديد المتجر**
```bash
# تسجيل الدخول إلى المتجر الأول
curl -X 'POST' \
  'https://bringus-backend.onrender.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "ahmed@example.com",
    "password": "password123",
    "storeSlug": "store1"
  }'

# تسجيل الدخول إلى المتجر الثاني
curl -X 'POST' \
  'https://bringus-backend.onrender.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "ahmed@example.com",
    "password": "password123",
    "storeSlug": "store2"
  }'
```

## 📊 هيكل البيانات

### User Model
```javascript
{
  _id: ObjectId,
  firstName: "أحمد",
  lastName: "محمد",
  email: "ahmed@example.com",
  password: "hashed_password",
  phone: "+970599888888",
  role: "affiliate",
  store: ObjectId("store1_id"),  // ✅ مرجع المتجر
  isActive: true,
  isEmailVerified: true
}
```

### Affiliation Model
```javascript
{
  _id: ObjectId,
  firstName: "أحمد",
  lastName: "محمد",
  email: "ahmed@example.com",
  store: ObjectId("store1_id"),  // ✅ مرجع المتجر
  userId: ObjectId("user_id"),   // ✅ مرجع المستخدم
  affiliateCode: "ABC12345",
  percent: 8,
  status: "Active"
}
```

## 🔍 سيناريوهات الاختبار

### ✅ سيناريو 1: إنشاء Affiliate في متجرين مختلفين
```javascript
// المتجر الأول
POST /api/affiliations
Authorization: Bearer STORE_1_TOKEN
{
  "email": "ahmed@example.com",
  "store": "store1_id"
}

// المتجر الثاني
POST /api/affiliations
Authorization: Bearer STORE_2_TOKEN
{
  "email": "ahmed@example.com",
  "store": "store2_id"
}
// ✅ يجب أن ينجح كلا الطلبين
```

### ❌ سيناريو 2: محاولة إنشاء duplicate في نفس المتجر
```javascript
// محاولة ثانية في نفس المتجر
POST /api/affiliations
Authorization: Bearer STORE_1_TOKEN
{
  "email": "ahmed@example.com",
  "store": "store1_id"
}
// ❌ يجب أن يفشل مع رسالة "Email already exists in this store"
```

### ✅ سيناريو 3: تسجيل الدخول مع storeSlug
```javascript
// تسجيل الدخول إلى المتجر الأول
POST /api/auth/login
{
  "email": "ahmed@example.com",
  "password": "password123",
  "storeSlug": "store1"
}
// ✅ يجب أن ينجح ويعيد بيانات المتجر الأول

// تسجيل الدخول إلى المتجر الثاني
POST /api/auth/login
{
  "email": "ahmed@example.com",
  "password": "password123",
  "storeSlug": "store2"
}
// ✅ يجب أن ينجح ويعيد بيانات المتجر الثاني
```

## 🚀 المميزات

### 1. **عزل كامل للمتاجر**
- كل متجر له بيانات منفصلة
- لا توجد تداخلات بين المتاجر
- أمان عالي للبيانات

### 2. **مرونة في تسجيل الدخول**
- إمكانية تسجيل الدخول إلى متجر محدد
- دعم للمشرفين للوصول إلى جميع المتاجر
- نظام tokens منفصل لكل متجر

### 3. **إدارة سهلة**
- واجهة موحدة لجميع المتاجر
- APIs متسقة عبر جميع المتاجر
- توثيق شامل في Swagger

## ⚠️ ملاحظات مهمة

### 1. **storeSlug مطلوب للتسجيل**
```javascript
// ❌ خطأ - بدون storeSlug
{
  "email": "ahmed@example.com",
  "password": "password123"
}

// ✅ صحيح - مع storeSlug
{
  "email": "ahmed@example.com",
  "password": "password123",
  "storeSlug": "store1"
}
```

### 2. **التحقق من صحة المتجر**
```javascript
// النظام يتحقق من وجود المتجر أولاً
const store = await Store.findOne({ slug: storeSlug });
if (!store) {
  return res.status(400).json({
    success: false,
    message: 'Store not found'
  });
}
```

### 3. **أمان البيانات**
- كل متجر له token منفصل
- لا يمكن الوصول لبيانات متجر آخر
- تشفير كلمات المرور منفصل

## 🧪 الاختبار

```bash
# تشغيل اختبارات العزل
node test/affiliation-store-isolation-test.js
```

## 📚 المراجع

- [AffiliationController.js](../Controllers/AffiliationController.js)
- [auth.js](../Routes/auth.js)
- [User Model](../Models/User.js)
- [Store Model](../Models/Store.js)
