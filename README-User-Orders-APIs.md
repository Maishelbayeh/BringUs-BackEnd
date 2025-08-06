# User Orders APIs - APIs طلبات المستخدم

## 🔧 الوظائف المضافة

### 1. الحصول على جميع طلبات المستخدم
**Endpoint:** `GET /api/orders/my-orders`

**الوصف:** يحصل على جميع الطلبات الخاصة بالمستخدم المصادق عليه

**المصادقة:** مطلوبة (JWT Token)

**الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-2024-001",
      "orderNumber": "ORD-2024-001",
      "storeName": "moon store",
      "storeId": "687c9bb0a7b3f2a0831c4675",
      "storePhone": "+1234567890",
      "storeUrl": "/store/moon",
      "currency": "USD",
      "price": 150.00,
      "date": "2024-01-15T10:30:00.000Z",
      "paid": true,
      "status": "delivered",
      "itemsCount": 2,
      "notes": "Please deliver in the morning",
      "deliveryArea": {
        "locationAr": "عمان",
        "locationEn": "Amman",
        "price": 10.00,
        "estimatedDays": 2
      },
      "items": [
        {
          "image": "https://example.com/image1.jpg",
          "name": "Product Name",
          "quantity": 2,
          "unit": "pc",
          "pricePerUnit": 50.00,
          "total": 100.00,
          "color": "#FF0000",
          "selectedSpecifications": [],
          "selectedColors": []
        }
      ],
      "pricing": {
        "subtotal": 100.00,
        "tax": 10.00,
        "shipping": 10.00,
        "discount": 0.00,
        "total": 120.00
      },
      "shippingAddress": {
        "street": "123 Main St",
        "city": "Amman",
        "country": "Jordan"
      },
      "billingAddress": {
        "street": "123 Main St",
        "city": "Amman",
        "country": "Jordan"
      },
      "paymentInfo": {
        "method": "credit_card",
        "status": "paid"
      },
      "shippingInfo": {
        "method": "express",
        "cost": 10.00
      },
      "isGift": false,
      "giftMessage": null,
      "estimatedDeliveryDate": "2024-01-17T10:30:00.000Z",
      "actualDeliveryDate": "2024-01-16T14:30:00.000Z",
      "cancelledAt": null,
      "cancelledBy": null,
      "cancellationReason": null,
      "affiliate": null,
      "coupon": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-16T14:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 2. الحصول على طلب محدد للمستخدم
**Endpoint:** `GET /api/orders/my-orders/:orderId`

**الوصف:** يحصل على تفاصيل طلب محدد للمستخدم المصادق عليه

**المصادقة:** مطلوبة (JWT Token)

**المعاملات:**
- `orderId`: معرف الطلب أو رقم الطلب

**الاستجابة:**
```json
{
  "success": true,
  "message": "Order details retrieved successfully",
  "data": {
    "id": "687e371e10f4a478c90a1288",
    "orderNumber": "ORD-2024-001",
    "storeName": "moon store",
    "storeId": "687c9bb0a7b3f2a0831c4675",
    "storePhone": "+1234567890",
    "storeUrl": "/store/moon",
    "currency": "USD",
    "price": 150.00,
    "date": "2024-01-15T10:30:00.000Z",
    "paid": true,
    "status": "delivered",
    "itemsCount": 2,
    "notes": "Please deliver in the morning",
    "deliveryArea": {
      "locationAr": "عمان",
      "locationEn": "Amman",
      "price": 10.00,
      "estimatedDays": 2
    },
    "items": [
      {
        "productId": "687e371e10f4a478c90a1289",
        "image": "https://example.com/image1.jpg",
        "name": "Product Name",
        "sku": "SKU123",
        "quantity": 2,
        "unit": "pc",
        "pricePerUnit": 50.00,
        "total": 100.00,
        "color": "#FF0000",
        "selectedSpecifications": [],
        "selectedColors": [],
        "variant": {},
        "productSnapshot": {
          "nameAr": "اسم المنتج",
          "nameEn": "Product Name",
          "images": ["https://example.com/image1.jpg"],
          "price": 50.00,
          "unit": {
            "nameEn": "pc",
            "symbol": "pc"
          },
          "color": "#FF0000",
          "sku": "SKU123"
        }
      }
    ],
    "pricing": {
      "subtotal": 100.00,
      "tax": 10.00,
      "shipping": 10.00,
      "discount": 0.00,
      "total": 120.00
    },
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Amman",
      "country": "Jordan"
    },
    "billingAddress": {
      "street": "123 Main St",
      "city": "Amman",
      "country": "Jordan"
    },
    "paymentInfo": {
      "method": "credit_card",
      "status": "paid"
    },
    "shippingInfo": {
      "method": "express",
      "cost": 10.00
    },
    "isGift": false,
    "giftMessage": null,
    "estimatedDeliveryDate": "2024-01-17T10:30:00.000Z",
    "actualDeliveryDate": "2024-01-16T14:30:00.000Z",
    "cancelledAt": null,
    "cancelledBy": null,
    "cancellationReason": null,
    "affiliate": null,
    "coupon": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:30:00.000Z"
  }
}
```

## 🔧 كيفية الاستخدام

### 1. الحصول على جميع الطلبات:
```bash
curl -X GET \
  'http://localhost:5001/api/orders/my-orders' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

### 2. الحصول على طلب محدد:
```bash
curl -X GET \
  'http://localhost:5001/api/orders/my-orders/ORD-2024-001' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

أو باستخدام معرف الطلب:
```bash
curl -X GET \
  'http://localhost:5001/api/orders/my-orders/687e371e10f4a478c90a1288' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

## 🔒 الأمان

### 1. المصادقة:
- جميع الـ APIs تتطلب JWT token صالح
- يتم استخراج معرف المستخدم من الـ token تلقائياً

### 2. التحكم في الوصول:
- المستخدم يمكنه الوصول فقط لطلباته الخاصة
- لا يمكن للمستخدم الوصول لطلبات المستخدمين الآخرين

### 3. التحقق من الصلاحيات:
```javascript
// في getMyOrders
const userId = req.user.id; // من الـ token
const orders = await Order.find({ 'user.id': userId });

// في getMyOrderById
const userId = req.user.id; // من الـ token
const order = await Order.findOne({ _id: orderId, 'user.id': userId });
```

## 📊 حالات الاستجابة

### 1. نجح الطلب (200):
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

### 2. خطأ في المصادقة (401):
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### 3. طلب غير صحيح (400):
```json
{
  "success": false,
  "message": "Order ID is required"
}
```

### 4. الطلب غير موجود (404):
```json
{
  "success": false,
  "message": "Order not found or access denied"
}
```

### 5. خطأ في الخادم (500):
```json
{
  "success": false,
  "message": "Error fetching user orders",
  "error": "Database connection error"
}
```

## 🔧 الميزات

### 1. البحث المرن:
- يدعم البحث بواسطة معرف الطلب (`_id`)
- يدعم البحث بواسطة رقم الطلب (`orderNumber`)

### 2. ترتيب النتائج:
- الطلبات مرتبة من الأحدث إلى الأقدم
- `sort({ createdAt: -1 })`

### 3. البيانات المكتملة:
- معلومات المتجر
- معلومات منطقة التوصيل
- تفاصيل المنتجات
- معلومات الدفع والشحن
- معلومات الهدايا والكوبونات

### 4. الأمان:
- التحقق من ملكية الطلب
- التحقق من صحة الـ token
- التحقق من حالة الحساب

## 🚀 الاستخدام في Frontend

### 1. React Hook Example:
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useMyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setOrders(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, error, refetch: fetchOrders };
};
```

### 2. React Component Example:
```javascript
import React from 'react';
import { useMyOrders } from './hooks/useMyOrders';

const MyOrders = () => {
  const { orders, loading, error } = useMyOrders();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>My Orders</h2>
      {orders.map(order => (
        <div key={order.id}>
          <h3>Order #{order.orderNumber}</h3>
          <p>Status: {order.status}</p>
          <p>Total: ${order.price}</p>
          <p>Date: {new Date(order.date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};
```

الآن المستخدمون يمكنهم الوصول لطلباتهم الخاصة بسهولة! 🎉 