# Upload API Documentation

## نظرة عامة

تم إنشاء API جديد لرفع الصور إلى Cloudflare R2 مع تنظيم أفضل للملفات حسب المتجر والمجلد.

## Endpoints المتاحة

### 1. رفع صورة واحدة
**POST** `/api/stores/upload-image`

#### المعاملات المطلوبة:
- `image` (file): ملف الصورة
- `storeId` (string): معرف المتجر

#### المعاملات الاختيارية:
- `folder` (string): اسم المجلد (افتراضي: 'general')

#### مثال للاستخدام:
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('storeId', '687505893fbf3098648bfe16');
formData.append('folder', 'products');

const response = await axios.post('/api/stores/upload-image', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

#### الاستجابة:
```json
{
  "success": true,
  "data": {
    "url": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/687505893fbf3098648bfe16/products/1234567890-123456789.png",
    "key": "687505893fbf3098648bfe16/products/1234567890-123456789.png",
    "originalName": "product.png",
    "size": 1024000,
    "mimetype": "image/png"
  }
}
```

### 2. رفع صور متعددة
**POST** `/api/stores/upload-multiple-images`

#### المعاملات المطلوبة:
- `images` (files[]): مصفوفة ملفات الصور (حد أقصى 10 صور)
- `storeId` (string): معرف المتجر

#### المعاملات الاختيارية:
- `folder` (string): اسم المجلد (افتراضي: 'general')

#### مثال للاستخدام:
```javascript
const formData = new FormData();
files.forEach(file => {
  formData.append('images', file);
});
formData.append('storeId', '687505893fbf3098648bfe16');
formData.append('folder', 'products');

const response = await axios.post('/api/stores/upload-multiple-images', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

#### الاستجابة:
```json
{
  "success": true,
  "data": [
    {
      "url": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/687505893fbf3098648bfe16/products/1234567890-123456789.png",
      "key": "687505893fbf3098648bfe16/products/1234567890-123456789.png",
      "originalName": "product1.png",
      "size": 1024000,
      "mimetype": "image/png"
    },
    {
      "url": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/687505893fbf3098648bfe16/products/1234567890-987654321.png",
      "key": "687505893fbf3098648bfe16/products/1234567890-987654321.png",
      "originalName": "product2.png",
      "size": 2048000,
      "mimetype": "image/jpeg"
    }
  ]
}
```

## تنظيم الملفات

### هيكل المجلدات:
```
{storeId}/
├── products/          # صور المنتجات
├── gallery/           # صور المعرض
├── logos/             # شعارات المتجر
├── banners/           # البانرات
└── general/           # ملفات عامة (افتراضي)
```

### أمثلة على استخدام المجلدات:

#### لصور المنتجات:
```javascript
formData.append('folder', 'products');
```

#### لشعارات المتجر:
```javascript
formData.append('folder', 'logos');
```

#### لصور المعرض:
```javascript
formData.append('folder', 'gallery');
```

## الأمان والتحقق

### التحقق من الملفات:
- يتم التحقق من نوع الملف (صور فقط)
- الحد الأقصى لحجم الملف: 5MB
- الحد الأقصى لعدد الملفات في الطلب الواحد: 10

### المصادقة:
- جميع الطلبات تتطلب مصادقة (JWT token)
- التحقق من حالة المستخدم النشط

### الأخطاء المحتملة:

#### 400 Bad Request:
```json
{
  "success": false,
  "error": "No image file provided"
}
```

```json
{
  "success": false,
  "error": "Store ID is required"
}
```

#### 500 Internal Server Error:
```json
{
  "success": false,
  "error": "Failed to upload image",
  "details": "Error details here"
}
```

## اختبار الـ API

### تشغيل الاختبارات:
```bash
node test-upload-api.js
```

### الاختبارات المتاحة:
1. رفع صورة واحدة
2. رفع صور متعددة
3. اختبار رفع بدون storeId (يجب أن يفشل)
4. اختبار رفع بدون صورة (يجب أن يفشل)

## التحديثات في الفرونت إند

### في `useProducts.ts`:
تم تحديث الدوال التالية لاستخدام الـ API الجديد:

```javascript
// رفع صورة واحدة
const uploadProductImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('storeId', STORE_ID);
  formData.append('folder', 'products');

  const response = await axios.post(`${BASE_URL}stores/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.url;
};

// رفع صور متعددة
const uploadProductImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  formData.append('storeId', STORE_ID);
  formData.append('folder', 'products');

  const response = await axios.post(`${BASE_URL}stores/upload-multiple-images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.map((img: any) => img.url);
};
```

## المميزات الجديدة

✅ **تنظيم أفضل**: الملفات منظمة حسب المتجر والمجلد  
✅ **أمان محسن**: تحقق من نوع الملف وحجمه  
✅ **أداء أفضل**: رفع متوازي للصور المتعددة  
✅ **توثيق شامل**: Swagger documentation  
✅ **اختبارات شاملة**: اختبارات تلقائية للـ API  
✅ **معالجة أخطاء**: رسائل خطأ واضحة ومفيدة  

## الاستخدام الموصى به

### للمنتجات:
```javascript
formData.append('folder', 'products');
```

### للمعرض:
```javascript
formData.append('folder', 'gallery');
```

### للشعارات:
```javascript
formData.append('folder', 'logos');
```

### للملفات العامة:
```javascript
// لا حاجة لتحديد folder (سيستخدم 'general' افتراضياً)
``` 