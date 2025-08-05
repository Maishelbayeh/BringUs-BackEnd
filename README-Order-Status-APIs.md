# Order Status APIs - APIs تحديث حالة الطلب والدفع

## 🔄 APIs الجديدة المضافة

### 1. تحديث حالة الطلب (Order Status)
**Endpoint:** `PUT /api/orders/:orderId/status`

**الوصف:** تحديث حالة الطلب (pending, shipped, delivered, cancelled)

**المعاملات المطلوبة:**
- `orderId` (path parameter): معرف الطلب
- `status` (body): الحالة الجديدة
- `notes` (body, optional): ملاحظات الإدارة

**الحالات المتاحة:**
- `pending`: في الانتظار
- `shipped`: تم الشحن
- `delivered`: تم التوصيل
- `cancelled`: ملغي

**مثال على الطلب:**
```bash
curl -X PUT \
  http://localhost:5001/api/orders/64f8a1b2c3d4e5f6a7b8c9d0/status \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "shipped",
    "notes": "تم شحن الطلب عبر شركة التوصيل"
  }'
```

**مثال على الاستجابة:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "orderId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "orderNumber": "ORD2412150001",
    "status": "shipped",
    "updatedAt": "2024-12-15T10:30:00.000Z"
  }
}
```

### 2. تحديث حالة الدفع (Payment Status)
**Endpoint:** `PUT /api/orders/:orderId/payment-status`

**الوصف:** تحديث حالة الدفع (pending, paid, refunded)

**المعاملات المطلوبة:**
- `orderId` (path parameter): معرف الطلب
- `paymentStatus` (body): حالة الدفع الجديدة
- `notes` (body, optional): ملاحظات الإدارة

**حالات الدفع المتاحة:**
- `pending`: في الانتظار
- `paid`: مدفوع
- `refunded`: مسترد

**مثال على الطلب:**
```bash
curl -X PUT \
  http://localhost:5001/api/orders/64f8a1b2c3d4e5f6a7b8c9d0/payment-status \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "paymentStatus": "paid",
    "notes": "تم استلام الدفع عبر البطاقة الائتمانية"
  }'
```

**مثال على الاستجابة:**
```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": {
    "orderId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "orderNumber": "ORD2412150001",
    "paymentStatus": "paid",
    "updatedAt": "2024-12-15T10:30:00.000Z"
  }
}
```

## 🔐 الأمان والصلاحيات

### المتطلبات:
- **JWT Token**: مطلوب في header `Authorization: Bearer <token>`
- **الصلاحيات**: Admin أو Store Owner فقط
- **Validation**: تحقق من صحة البيانات المرسلة

### التحقق من الصلاحيات:
```javascript
// Check if user is admin or store owner
if (req.user.role !== 'admin' && req.user.role !== 'store_owner') {
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin or store owner only.'
  });
}
```

## 📝 Validation Rules

### Order Status Validation:
```javascript
body('status').isIn(['pending', 'shipped', 'delivered', 'cancelled'])
  .withMessage('Valid status is required')
```

### Payment Status Validation:
```javascript
body('paymentStatus').isIn(['pending', 'paid', 'refunded'])
  .withMessage('Valid payment status is required')
```

### Notes Validation:
```javascript
body('notes').optional().isString().withMessage('Notes must be a string')
```

## 🔄 الميزات الإضافية

### 1. تحديث التاريخ التلقائي
- عند تغيير الحالة إلى `delivered`: يتم تحديث `actualDeliveryDate`
- عند تغيير الحالة إلى `cancelled`: يتم تحديث `cancelledAt` و `cancelledBy`

### 2. إضافة الملاحظات
- يمكن إضافة ملاحظات إدارية مع كل تحديث
- الملاحظات تُحفظ في `order.notes.admin`

### 3. معالجة الأخطاء
- تحقق من وجود الطلب
- تحقق من صحة الحالة المرسلة
- رسائل خطأ واضحة ومفيدة

## 📊 Swagger Documentation

تم إضافة التوثيق الكامل في Swagger:

### Order Status API:
```yaml
/api/orders/{orderId}/status:
  put:
    summary: Update order status
    tags: [Orders]
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
```

### Payment Status API:
```yaml
/api/orders/{orderId}/payment-status:
  put:
    summary: Update payment status
    tags: [Orders]
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
```

## 🚀 كيفية الاستخدام

### 1. تحديث حالة الطلب:
```javascript
const updateOrderStatus = async (orderId, status, notes = '') => {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, notes })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
  }
};
```

### 2. تحديث حالة الدفع:
```javascript
const updatePaymentStatus = async (orderId, paymentStatus, notes = '') => {
  try {
    const response = await fetch(`/api/orders/${orderId}/payment-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentStatus, notes })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating payment status:', error);
  }
};
```

## ⚠️ ملاحظات مهمة

1. **الصلاحيات**: فقط Admin و Store Owner يمكنهم تحديث الحالات
2. **التحقق**: يتم التحقق من صحة الحالة قبل التحديث
3. **التواريخ**: يتم تحديث التواريخ تلقائياً عند تغيير الحالة
4. **الملاحظات**: اختيارية ولكن مفيدة لتتبع التغييرات
5. **الأمان**: JWT token مطلوب للوصول

## 🔧 الأخطاء المحتملة

### 400 Bad Request:
- `Order ID is required`
- `Status is required`
- `Invalid status. Must be one of: pending, shipped, delivered, cancelled`
- `Invalid payment status. Must be one of: pending, paid, refunded`

### 401 Unauthorized:
- `Access denied. No token provided.`
- `Invalid token`

### 403 Forbidden:
- `Access denied. Admin or store owner only.`

### 404 Not Found:
- `Order not found`

### 500 Internal Server Error:
- `Error updating order status`
- `Error updating payment status` 