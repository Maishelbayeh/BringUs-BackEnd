# Order APIs Swagger Update - تحديث Swagger مع التوكن

## 🔄 التحديثات المطبقة على Swagger Documentation

### ✅ 1. إضافة تعريف Bearer Authentication
تم إضافة تعريف `bearerAuth` في بداية الملف:

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Enter your JWT token in the format: Bearer <token>
```

### ✅ 2. تحديث جميع APIs لتتطلب التوكن

#### A. Get Orders by Store API
```yaml
/api/orders/store/{storeId}:
  get:
    summary: Get all orders for a specific store (admin or store owner)
    tags: [Orders]
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: storeId
        required: true
        schema:
          type: string
    responses:
      200:
        description: List of orders
      400:
        description: storeId is required
      401:
        description: Access denied. No token provided.
      403:
        description: Access denied. Invalid token or insufficient permissions.
```

#### B. Create Order API
```yaml
/api/orders/store/{storeId}:
  post:
    summary: Create a new order for a specific store
    tags: [Orders]
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: storeId
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              user:
                type: string
                description: User ID
              items:
                type: array
                items:
                  type: object
                  properties:
                    product:
                      type: string
                    quantity:
                      type: number
              # ... باقي الخصائص
    responses:
      201:
        description: Order created
      400:
        description: storeId is required or validation error
      401:
        description: Access denied. No token provided.
      403:
        description: Access denied. Invalid token or insufficient permissions.
```

#### C. Update Order Status API
```yaml
/api/orders/{orderId}/status:
  put:
    summary: Update order status
    tags: [Orders]
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: orderId
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - status
            properties:
              status:
                type: string
                enum: [pending, shipped, delivered, cancelled]
              notes:
                type: string
    responses:
      200:
        description: Order status updated successfully
      400:
        description: Invalid request data
      401:
        description: Access denied. No token provided.
      403:
        description: Access denied. Admin or store owner only.
      404:
        description: Order not found
      500:
        description: Server error
```

#### D. Update Payment Status API
```yaml
/api/orders/{orderId}/payment-status:
  put:
    summary: Update payment status
    tags: [Orders]
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: orderId
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - paymentStatus
            properties:
              paymentStatus:
                type: string
                enum: [pending, paid, refunded]
              notes:
                type: string
    responses:
      200:
        description: Payment status updated successfully
      400:
        description: Invalid request data
      401:
        description: Access denied. No token provided.
      403:
        description: Access denied. Admin or store owner only.
      404:
        description: Order not found
      500:
        description: Server error
```

## 🔐 كيفية استخدام التوكن في Swagger UI

### 1. الوصول إلى Swagger UI
- افتح المتصفح واذهب إلى: `http://localhost:5001/api-docs`
- ستجد جميع APIs في واجهة Swagger

### 2. إدخال التوكن
- في أعلى الصفحة، ستجد زر "Authorize" 🔒
- اضغط على الزر
- في حقل "bearerAuth"، أدخل التوكن بالشكل التالي:
  ```
  Bearer YOUR_JWT_TOKEN_HERE
  ```
- مثال:
  ```
  Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- اضغط "Authorize"

### 3. اختبار APIs
- بعد إدخال التوكن، يمكنك اختبار جميع APIs
- سيتم إرسال التوكن تلقائياً مع كل طلب
- يمكنك رؤية التوكن في Headers عند فتح أي API

## 📝 أمثلة على الاستخدام

### مثال 1: تحديث حالة الطلب
```bash
# في Swagger UI
PUT /api/orders/64f8a1b2c3d4e5f6a7b8c9d0/status

# Headers (تلقائياً من Swagger)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Body
{
  "status": "shipped",
  "notes": "تم شحن الطلب"
}
```

### مثال 2: تحديث حالة الدفع
```bash
# في Swagger UI
PUT /api/orders/64f8a1b2c3d4e5f6a7b8c9d0/payment-status

# Headers (تلقائياً من Swagger)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Body
{
  "paymentStatus": "paid",
  "notes": "تم استلام الدفع"
}
```

## ⚠️ ملاحظات مهمة

### 1. التوكن مطلوب
- جميع APIs تتطلب توكن صالح
- بدون توكن ستحصل على خطأ 401

### 2. الصلاحيات
- Admin أو Store Owner فقط يمكنهم تحديث الحالات
- المستخدمين العاديين لا يمكنهم الوصول

### 3. صحة التوكن
- يجب أن يكون التوكن صالح وغير منتهي الصلاحية
- يجب أن يكون المستخدم نشط (`isActive: true`)

### 4. تنسيق التوكن
- يجب إدخال التوكن بالشكل: `Bearer <token>`
- لا تضع مسافات إضافية أو رموز أخرى

## 🔧 الأخطاء المحتملة

### 401 Unauthorized:
- `Access denied. No token provided.` - لم يتم إدخال توكن
- `Invalid token` - التوكن غير صالح
- `Account is deactivated` - الحساب معطل

### 403 Forbidden:
- `Access denied. Admin or store owner only.` - لا توجد صلاحيات كافية

### 404 Not Found:
- `Order not found` - الطلب غير موجود

### 500 Internal Server Error:
- `Error updating order status` - خطأ في الخادم
- `Error updating payment status` - خطأ في الخادم

## 🚀 المزايا الجديدة

### ✅ 1. واجهة تفاعلية
- إدخال التوكن مرة واحدة لجميع APIs
- اختبار مباشر من Swagger UI

### ✅ 2. توثيق شامل
- جميع الحالات والأخطاء موثقة
- أمثلة واضحة للاستخدام

### ✅ 3. أمان محسن
- التحقق من التوكن في كل طلب
- رسائل خطأ واضحة

### ✅ 4. سهولة الاستخدام
- لا حاجة لـ Postman أو أدوات خارجية
- اختبار مباشر من المتصفح

## 📊 كيفية الحصول على التوكن

### 1. تسجيل الدخول
```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### 2. استخراج التوكن
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "role": "admin"
  }
}
```

### 3. استخدام التوكن في Swagger
- انسخ التوكن من الاستجابة
- أضف `Bearer` قبل التوكن
- أدخله في Swagger UI

الآن يمكنك اختبار جميع Order APIs بسهولة من Swagger UI مع التوكن! 🎉 