# نظام تتبع الطلبات من رابط الأفلييت

## نظرة عامة

تم تطوير نظام متكامل لتتبع الطلبات التي تأتي من روابط الأفلييت. هذا النظام يتيح لك:

1. **تتبع الطلبات**: معرفة أي الطلبات جاءت من رابط أفلييت معين
2. **حساب العمولة**: حساب العمولة من مجموع أسعار المنتجات فقط (بدون التوصيل)
3. **إحصائيات مفصلة**: الحصول على إحصائيات شاملة عن أداء الأفلييت
4. **تتبع التحويل**: معرفة الوقت المستغرق من النقر على الرابط حتى إنشاء الطلب

## الميزات الجديدة

### 1. حقول تتبع إضافية في نموذج الطلب

تم إضافة حقول جديدة في نموذج `Order` لتتبع معلومات الأفلييت:

```javascript
affiliateTracking: {
  isAffiliateOrder: { type: Boolean, default: false },
  affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliation' },
  referralSource: { type: String, enum: ['direct_link', 'social_media', 'email', 'other'] },
  utmSource: { type: String },
  utmMedium: { type: String },
  utmCampaign: { type: String },
  clickTimestamp: { type: Date },
  orderTimestamp: { type: Date },
  conversionTime: { type: Number }, // بالدقائق
  commissionEarned: { type: Number, default: 0 },
  commissionPercentage: { type: Number, default: 0 }
}
```

### 2. حساب العمولة من المنتجات فقط

تم تعديل نظام حساب العمولة ليكون من مجموع أسعار المنتجات فقط، وليس من المجموع الكامل الذي يتضمن تكلفة التوصيل.

## API Endpoints الجديدة

### 1. الحصول على معلومات الأفلييت من الكود

```http
GET /api/affiliations/code/{affiliateCode}?storeId={storeId}
```

**مثال:**
```bash
curl -X GET "http://localhost:3000/api/affiliations/code/DYQFQCV?storeId=687505893fbf3098648bfe16"
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "Affiliate found successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed@example.com",
    "affiliateCode": "DYQFQCV",
    "affiliateLink": "http://localhost:5174/moon/affiliate/dyqfqcvE",
    "percent": 8,
    "status": "Active"
  }
}
```

### 2. الحصول على الطلبات التي تأتي من رابط الأفلييت

```http
GET /api/orders/store/{storeId}/affiliate-orders
```

**المعاملات الاختيارية:**
- `affiliateId`: تصفية حسب أفلييت معين
- `startDate`: تاريخ البداية (YYYY-MM-DD)
- `endDate`: تاريخ النهاية (YYYY-MM-DD)
- `status`: حالة الطلب

**مثال:**
```bash
curl -X GET "http://localhost:3000/api/orders/store/687505893fbf3098648bfe16/affiliate-orders?affiliateId=507f1f77bcf86cd799439011"
```

### 3. الحصول على إحصائيات الطلبات

```http
GET /api/orders/store/{storeId}/affiliate-stats
```

**المعاملات الاختيارية:**
- `startDate`: تاريخ البداية (YYYY-MM-DD)
- `endDate`: تاريخ النهاية (YYYY-MM-DD)

**مثال:**
```bash
curl -X GET "http://localhost:3000/api/orders/store/687505893fbf3098648bfe16/affiliate-stats?startDate=2024-01-01&endDate=2024-12-31"
```

## كيفية إنشاء طلب مع تتبع الأفلييت

### 1. إنشاء طلب عادي مع إضافة معرف الأفلييت

```javascript
const orderData = {
  user: "507f1f77bcf86cd799439013", // معرف المستخدم
  items: [
    {
      product: "507f1f77bcf86cd799439011",
      quantity: 2
    }
  ],
  shippingAddress: {
    firstName: "أحمد",
    lastName: "محمد",
    email: "ahmed@example.com",
    phone: "+970599123456",
    address: "الخليل، فلسطين"
  },
  billingAddress: {
    firstName: "أحمد",
    lastName: "محمد",
    email: "ahmed@example.com",
    phone: "+970599123456",
    address: "الخليل، فلسطين"
  },
  paymentInfo: {
    method: "cash_on_delivery"
  },
  shippingInfo: {
    method: "standard"
  },
  affiliate: "507f1f77bcf86cd799439011", // معرف الأفلييت
  deliveryArea: "507f1f77bcf86cd799439012"
};

const response = await axios.post('/api/orders/store/687505893fbf3098648bfe16', orderData);
```

### 2. إنشاء طلب مع معلومات تتبع إضافية

```javascript
const orderData = {
  // ... البيانات الأساسية
  affiliate: "507f1f77bcf86cd799439011",
  
  // معلومات التتبع الإضافية
  referralSource: "direct_link", // أو "social_media", "email", "other"
  utmSource: "facebook",
  utmMedium: "social",
  utmCampaign: "summer_sale",
  clickTimestamp: "2024-01-15T10:30:00Z" // وقت النقر على الرابط
};
```

## مثال عملي

### الخطوة 1: الحصول على معلومات الأفلييت

```javascript
// عندما يزور المستخدم الرابط: http://localhost:5174/moon/affiliate/dyqfqcvE
const affiliateCode = 'dyqfqcvE'; // استخراج الكود من الرابط

const response = await axios.get(`/api/affiliations/code/${affiliateCode}`, {
  params: { storeId: '687505893fbf3098648bfe16' }
});

const affiliateInfo = response.data.data;
console.log('معلومات الأفلييت:', affiliateInfo);
```

### الخطوة 2: إنشاء الطلب مع التتبع

```javascript
const orderData = {
  // ... بيانات الطلب
  affiliate: affiliateInfo.id,
  referralSource: 'direct_link',
  clickTimestamp: new Date().toISOString()
};

const orderResponse = await axios.post('/api/orders/store/687505893fbf3098648bfe16', orderData);
```

### الخطوة 3: التحقق من الطلبات

```javascript
// الحصول على جميع الطلبات التي تأتي من رابط الأفلييت
const affiliateOrders = await axios.get('/api/orders/store/687505893fbf3098648bfe16/affiliate-orders');

// الحصول على إحصائيات
const stats = await axios.get('/api/orders/store/687505893fbf3098648bfe16/affiliate-stats');
```

## معلومات التتبع المحفوظة

عند إنشاء طلب من رابط أفلييت، يتم حفظ المعلومات التالية:

1. **معلومات الأفلييت الأساسية**: الاسم، البريد الإلكتروني، الكود، النسبة
2. **معلومات التتبع**: مصدر الإحالة، UTM parameters
3. **معلومات التحويل**: وقت النقر، وقت الطلب، وقت التحويل
4. **معلومات العمولة**: العمولة المكتسبة، النسبة المئوية

## مثال على الاستجابة

```json
{
  "success": true,
  "message": "Affiliate orders retrieved successfully",
  "data": {
    "orders": [
      {
        "orderNumber": "ORD-2024-001",
        "createdAt": "2024-01-15T12:30:00Z",
        "status": "pending",
        "pricing": {
          "subtotal": 100,
          "total": 110
        },
        "affiliateTracking": {
          "isAffiliateOrder": true,
          "affiliateId": "507f1f77bcf86cd799439011",
          "referralSource": "direct_link",
          "utmSource": "facebook",
          "utmMedium": "social",
          "utmCampaign": "summer_sale",
          "clickTimestamp": "2024-01-15T10:30:00Z",
          "orderTimestamp": "2024-01-15T12:30:00Z",
          "conversionTime": 120, // دقائق
          "commissionEarned": 8, // 8% من 100
          "commissionPercentage": 8
        },
        "affiliateInfo": {
          "firstName": "أحمد",
          "lastName": "محمد",
          "email": "ahmed@example.com",
          "affiliateCode": "DYQFQCV",
          "percent": 8
        }
      }
    ],
    "totalOrders": 1,
    "totalCommission": 8,
    "averageConversionTime": 120
  }
}
```

## تشغيل المثال

يمكنك تشغيل المثال الموجود في `examples/affiliate-tracking-example.js`:

```bash
node examples/affiliate-tracking-example.js
```

## ملاحظات مهمة

1. **حساب العمولة**: العمولة تحسب من مجموع أسعار المنتجات فقط، وليس من المجموع الكامل
2. **التتبع التلقائي**: عند إرسال `affiliate` في بيانات الطلب، يتم تتبع المعلومات تلقائياً
3. **التحقق من صحة الكود**: يتم التحقق من صحة كود الأفلييت وحالة الأفلييت قبل حفظ الطلب
4. **الأمان**: جميع النقاط النهائية محمية ومتحققة من صحة البيانات

## استكشاف الأخطاء

### مشكلة: لا يتم العثور على الأفلييت
- تأكد من صحة كود الأفلييت
- تأكد من أن الأفلييت نشط (status: 'Active')
- تأكد من أن الأفلييت ينتمي للمتجر الصحيح

### مشكلة: لا يتم حفظ معلومات التتبع
- تأكد من إرسال `affiliate` في بيانات الطلب
- تأكد من صحة معرف الأفلييت
- تحقق من سجلات الخطأ في الخادم

### مشكلة: العمولة لا تحسب بشكل صحيح
- تأكد من أن النسبة المئوية للأفلييت صحيحة
- تحقق من أن العمولة تحسب من `subtotal` وليس من `total`

