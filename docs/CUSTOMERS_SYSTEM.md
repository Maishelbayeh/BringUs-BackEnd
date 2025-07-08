# نظام العملاء (Customers System) 🛒

## نظرة عامة

نظام العملاء يدعم العزل التام بين المتاجر، حيث كل متجر يرى فقط عملائه الخاصين به.

## الميزات الرئيسية

### 🔒 عزل البيانات
- كل عميل مرتبط بمتجر واحد فقط
- لا يمكن الوصول لبيانات عملاء متاجر أخرى
- حماية كاملة لخصوصية البيانات

### 👥 أنواع المستخدمين
- **عملاء (Clients)**: مرتبطين بمتجر معين
- **موظفين (Staff)**: مديرين ومشرفين للمتجر
- **مشرف عام (Superadmin)**: إدارة النظام كاملاً

### 📊 إحصائيات العملاء
- عدد العملاء النشطين
- العملاء المحظورين
- العملاء غير النشطين

## API Endpoints

### 1. جلب جميع العملاء
```http
GET /api/users/customers
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد العملاء في الصفحة (افتراضي: 10)
- `status`: حالة العميل (active, inactive, banned)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "customer_id",
      "firstName": "أحمد",
      "lastName": "محمد",
      "email": "ahmed@example.com",
      "phone": "+966501234567",
      "role": "client",
      "status": "active",
      "store": {
        "_id": "store_id",
        "name": "TechStore",
        "domain": "techstore.com"
      },
      "addresses": [...],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### 2. جلب موظفي المتجر
```http
GET /api/users/staff
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: رقم الصفحة
- `limit`: عدد الموظفين في الصفحة
- `role`: دور الموظف (admin, superadmin)

### 3. جلب عميل محدد
```http
GET /api/users/:id
Authorization: Bearer <token>
```

### 4. إنشاء عميل جديد
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "أحمد",
  "lastName": "محمد",
  "email": "ahmed@example.com",
  "password": "password123",
  "phone": "+966501234567",
  "role": "client",
  "store": "store_id"
}
```

## هيكل البيانات

### نموذج العميل (User Model)
```javascript
{
  firstName: String,        // الاسم الأول
  lastName: String,         // اسم العائلة
  email: String,           // البريد الإلكتروني (فريد)
  password: String,        // كلمة المرور (مشفرة)
  phone: String,           // رقم الهاتف
  role: String,            // الدور: client, admin, superadmin
  status: String,          // الحالة: active, inactive, banned
  store: ObjectId,         // معرف المتجر (مطلوب للعملاء)
  addresses: [{
    type: String,          // نوع العنوان: home, work, other
    street: String,        // الشارع
    city: String,          // المدينة
    state: String,         // المحافظة
    zipCode: String,       // الرمز البريدي
    country: String,       // الدولة
    isDefault: Boolean     // العنوان الافتراضي
  }],
  wishlist: [ObjectId],    // قائمة المفضلة (معرفات المنتجات)
  isEmailVerified: Boolean, // تأكيد البريد الإلكتروني
  lastLogin: Date,         // آخر تسجيل دخول
  isActive: Boolean        // حالة النشاط
}
```

## الأمان والصلاحيات

### 🔐 نظام الصلاحيات
- **Superadmin**: إدارة النظام كاملاً
- **Admin**: إدارة متجره فقط
- **Client**: الوصول لبياناته فقط

### 🛡️ حماية البيانات
- عزل تام بين المتاجر
- فحص الصلاحيات في كل طلب
- تشفير كلمات المرور
- حماية من الوصول غير المصرح

## كيفية الاستخدام

### 1. إنشاء بيانات الاختبار
```bash
# إنشاء المتاجر والموظفين
node scripts/createTestData.js

# إنشاء العملاء
node scripts/createCustomerTestData.js
```

### 2. اختبار النظام
```bash
# اختبار عزل العملاء
node examples/test-customers-api.js
```

### 3. استخدام API
```javascript
// جلب عملاء المتجر
const response = await fetch('/api/users/customers', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// إنشاء عميل جديد
const newCustomer = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'أحمد',
    lastName: 'محمد',
    email: 'ahmed@example.com',
    password: 'password123',
    role: 'client'
  })
});
```

## بيانات الاختبار

### عملاء TechStore
- `ahmed.tech@test.com` / `password123`
- `fatima.tech@test.com` / `password123`
- `omar.tech@test.com` / `password123`
- `noor.tech@test.com` / `password123`
- `youssef.tech@test.com` / `password123`

### عملاء FashionStore
- `sara.fashion@test.com` / `password123`
- `khalid.fashion@test.com` / `password123`
- `layla.fashion@test.com` / `password123`
- `abdullah.fashion@test.com` / `password123`
- `maryam.fashion@test.com` / `password123`
- `mohammed.fashion@test.com` / `password123`

## الأخطاء الشائعة

### 1. خطأ 403 - غير مصرح
```json
{
  "success": false,
  "message": "Access denied - insufficient permissions"
}
```
**الحل:** تأكد من أن المستخدم لديه صلاحيات كافية

### 2. خطأ 404 - العميل غير موجود
```json
{
  "success": false,
  "message": "User not found"
}
```
**الحل:** تأكد من معرف العميل الصحيح

### 3. خطأ 409 - البريد الإلكتروني موجود
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```
**الحل:** استخدم بريد إلكتروني مختلف

## أفضل الممارسات

### ✅ الممارسات الجيدة
- استخدم كلمات مرور قوية
- تحقق من صحة البيانات قبل الإرسال
- استخدم HTTPS في الإنتاج
- احتفظ بنسخ احتياطية من البيانات

### ❌ تجنب
- عدم تشفير كلمات المرور
- السماح بالوصول المباشر للقاعدة
- عدم التحقق من الصلاحيات
- استخدام بيانات اختبار في الإنتاج

## الدعم والمساعدة

إذا واجهت أي مشاكل:
1. تحقق من سجلات الخطأ
2. تأكد من صحة البيانات
3. تحقق من الصلاحيات
4. راجع التوثيق

---

**ملاحظة:** هذا النظام مصمم للعمل مع نظام المتاجر المتعددة ويضمن العزل التام للبيانات بين المتاجر المختلفة. 