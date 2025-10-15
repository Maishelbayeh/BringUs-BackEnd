# Connect Plus Integration Setup

## 📋 Overview

تم إنشاء APIs للتعامل مع خدمة Connect Plus للتوصيل. هذه الخدمة تسمح بإدارة الطلبات والتوصيل من خلال نظام موحد.

## 🔧 Setup

### 1. إعداد Token
أضف الـ Connect Plus token إلى متغيرات البيئة:

```bash
# في ملف .env
CONNECT_PLUS_TOKEN=your-connect-plus-token-here
```

أو يمكنك تعديل الدالة `getConnectPlusToken()` في `Controllers/ConnectPlusController.js`:

```javascript
const getConnectPlusToken = () => {
  return 'your-actual-token-here';
};
```

### 2. اختبار الاتصال
```bash
curl -X 'GET' \
  'https://bringus-backend.onrender.com/api/connect-plus/test-connection' \
  -H 'accept: application/json'
```

## 🚀 Available APIs

### 1. **Add Orders** - إضافة طلبات
```bash
POST /api/connect-plus/add-orders
```

**Body Example:**
```json
{
  "orders_list": [
    {
      "address": "test address",
      "customer_mobile": "0595215291",
      "customer_name": "Customer Name",
      "area": "الخليل",
      "connection": 245,
      "sub_area": "الظاهرية",
      "country": "PS",
      "country_code": "+972",
      "note": "note",
      "order_reference": "abcd1241",
      "product_info": "product_info",
      "package_cost": 598,
      "total_cod": "638",
      "payment_method": "",
      "order_lines": [
        {
          "id": "",
          "product_variant": 458,
          "quantity": 1,
          "price": "15.00",
          "total_price": "15.00"
        }
      ]
    }
  ]
}
```

### 2. **Get Products** - الحصول على المنتجات
```bash
POST /api/connect-plus/get-products
```

**Body Example:**
```json
{
  "size": 30,
  "filters": []
}
```

### 3. **Get Variants** - الحصول على متغيرات المنتجات
```bash
POST /api/connect-plus/get-variants
```

**Body Example:**
```json
{
  "size": 30,
  "filters": []
}
```

### 4. **Get Delivery Companies** - الحصول على شركات التوصيل
```bash
POST /api/connect-plus/get-delivery-companies
```

**Body Example:**
```json
{
  "size": 30,
  "filters": []
}
```

### 5. **Get Delivery Fee** - حساب رسوم التوصيل
```bash
POST /api/connect-plus/get-delivery-fee
```

**Body Example:**
```json
{
  "connection": 245,
  "area": 10
}
```

### 6. **Get Area Sub Area** - الحصول على المناطق
```bash
GET /api/connect-plus/get-area-sub-area?code=PS
```

### 7. **Test Connection** - اختبار الاتصال
```bash
GET /api/connect-plus/test-connection
```

## 📚 Swagger Documentation

يمكنك الوصول إلى التوثيق الكامل في Swagger UI:
- URL: `https://bringus-backend.onrender.com/api-docs`
- ابحث عن قسم "Connect Plus"

## 🧪 Testing

### تشغيل الاختبارات
```bash
# اختبار جميع الـ APIs
node test/connect-plus-test.js
```

### أمثلة للاختبار
```bash
# اختبار الاتصال
curl -X GET https://bringus-backend.onrender.com/api/connect-plus/test-connection

# الحصول على المناطق
curl -X GET "https://bringus-backend.onrender.com/api/connect-plus/get-area-sub-area?code=PS"

# الحصول على المنتجات
curl -X POST https://bringus-backend.onrender.com/api/connect-plus/get-products \
  -H "Content-Type: application/json" \
  -d '{"size": 10, "filters": []}'
```

## 📋 Field Descriptions

### Order Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | string | ✅ | عنوان التوصيل |
| `customer_mobile` | string | ✅ | رقم هاتف العميل |
| `customer_name` | string | ✅ | اسم العميل |
| `area` | string | ✅ | المنطقة |
| `connection` | integer | ✅ | معرف الاتصال |
| `sub_area` | string | ✅ | المنطقة الفرعية |
| `country` | string | ✅ | رمز الدولة |
| `country_code` | string | ✅ | رمز هاتف الدولة |
| `order_reference` | string | ✅ | مرجع الطلب |
| `package_cost` | number | ✅ | تكلفة الطرد |
| `total_cod` | string | ✅ | إجمالي الدفع عند الاستلام |
| `order_lines` | array | ✅ | عناصر الطلب |

### Order Line Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_variant` | integer | ✅ | معرف متغير المنتج |
| `quantity` | integer | ✅ | الكمية |
| `price` | string | ✅ | السعر |
| `total_price` | string | ✅ | السعر الإجمالي |

## 🔗 Connect Plus API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/add_orders` | إضافة طلبات |
| `POST` | `/get_products` | الحصول على المنتجات |
| `POST` | `/get_product_variants` | الحصول على متغيرات المنتجات |
| `POST` | `/get_connected_companies` | الحصول على شركات التوصيل |
| `POST` | `/get_delivery_fee` | حساب رسوم التوصيل |
| `GET` | `/get_area_sub_area` | الحصول على المناطق |

## ⚠️ Important Notes

1. **Token Required**: جميع الـ APIs تتطلب Connect Plus token صحيح
2. **Validation**: جميع الحقول المطلوبة يتم التحقق منها
3. **Error Handling**: يتم التعامل مع الأخطاء وإرجاع رسائل واضحة
4. **Logging**: جميع الطلبات والاستجابات يتم تسجيلها في الـ console

## 🚀 Next Steps

1. احصل على Connect Plus token من الخدمة
2. أضف الـ token إلى متغيرات البيئة
3. اختبر الاتصال باستخدام `/test-connection`
4. ابدأ باستخدام الـ APIs الأخرى حسب الحاجة
