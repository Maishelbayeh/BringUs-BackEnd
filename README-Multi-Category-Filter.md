# فلترة الفئات المتعددة (Multi-Category Filter)

## نظرة عامة

تم تطوير ميزة فلترة الفئات المتعددة التي تتيح لك فلترة المنتجات بعدة فئات معاً باستخدام `||` (OR) بين معرفات الفئات. هذا يعني أن المنتجات ستظهر إذا كانت تنتمي لأي من الفئات المحددة.

## الميزات الجديدة

### 1. فلترة فئة واحدة (كما كان سابقاً)

```http
GET /api/products?storeId={storeId}&category={categoryId}
```

### 2. فلترة فئات متعددة (ميزة جديدة)

```http
GET /api/products?storeId={storeId}&category={categoryId1}||{categoryId2}||{categoryId3}
```

## كيفية الاستخدام

### 1. فلترة بفئة واحدة

```javascript
// فلترة المنتجات بفئة واحدة
const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: '507f1f77bcf86cd799439011'
  }
});
```

### 2. فلترة بفئتين معاً

```javascript
// فلترة المنتجات بفئتين (الهواتف أو الحواسيب)
const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012'
  }
});
```

### 3. فلترة بثلاث فئات معاً

```javascript
// فلترة المنتجات بثلاث فئات (الهواتف أو الحواسيب أو الملابس)
const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012||507f1f77bcf86cd799439013'
  }
});
```

## API Endpoints المدعومة

### 1. المنتجات العامة

```http
GET /api/products?category={categoryFilter}
```

### 2. المنتجات بدون variants

```http
GET /api/products/{storeId}/without-variants?category={categoryFilter}
```

## أمثلة عملية

### مثال 1: فلترة بفئتين

```javascript
// الحصول على المنتجات من فئة "الهواتف" أو "الحواسيب"
const categoryIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
const categoryFilter = categoryIds.join('||');

const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: categoryFilter,
    limit: 20
  }
});
```

### مثال 2: فلترة مع شروط أخرى

```javascript
// فلترة بفئات متعددة مع السعر والترتيب
const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012',
    minPrice: 100,
    maxPrice: 1000,
    sort: 'price_asc',
    limit: 10
  }
});
```

### مثال 3: فلترة بدون variants

```javascript
// فلترة المنتجات بدون variants بفئات متعددة
const response = await axios.get('/api/products/687505893fbf3098648bfe16/without-variants', {
  params: {
    category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012',
    sort: 'newest',
    limit: 15
  }
});
```

## تنسيق المعرفات

### صحيح ✅

```javascript
// فئة واحدة
category: '507f1f77bcf86cd799439011'

// فئتين
category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012'

// ثلاث فئات
category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012||507f1f77bcf86cd799439013'
```

### خطأ ❌

```javascript
// معرف غير صحيح
category: 'invalid-id||507f1f77bcf86cd799439012'

// تنسيق خاطئ
category: '507f1f77bcf86cd799439011,507f1f77bcf86cd799439012'

// معرفات فارغة
category: '||507f1f77bcf86cd799439012'
```

## الاستجابة

### مثال على الاستجابة

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "nameAr": "سامسونج جالاكسي S22",
      "nameEn": "Samsung Galaxy S22",
      "price": 2500,
      "category": {
        "_id": "507f1f77bcf86cd799439011",
        "nameAr": "الهواتف",
        "nameEn": "Phones"
      },
      "store": {
        "_id": "687505893fbf3098648bfe16",
        "name": "متجر الإلكترونيات"
      }
    },
    {
      "_id": "507f1f77bcf86cd799439022",
      "nameAr": "لابتوب ديل",
      "nameEn": "Dell Laptop",
      "price": 3500,
      "category": {
        "_id": "507f1f77bcf86cd799439012",
        "nameAr": "الحواسيب",
        "nameEn": "Computers"
      },
      "store": {
        "_id": "687505893fbf3098648bfe16",
        "name": "متجر الإلكترونيات"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 2,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

## معلومات تقنية

### 1. Validation

تم إضافة validation مخصص للتحقق من صحة معرفات الفئات:

```javascript
query('category').optional().custom((value) => {
  if (typeof value === 'string') {
    const categories = value.split('||');
    return categories.every(cat => /^[a-fA-F0-9]{24}$/.test(cat.trim()));
  }
  return true;
}).withMessage('Invalid category ID(s). Use format: categoryId1||categoryId2||categoryId3')
```

### 2. منطق الفلترة

```javascript
if (category) {
  if (category.includes('||')) {
    const categoryIds = category.split('||').map(cat => cat.trim());
    filter.category = { $in: categoryIds };
  } else {
    filter.category = category;
  }
}
```

### 3. MongoDB Query

عند استخدام فئات متعددة، يتم تحويل الفلتر إلى:

```javascript
// بدلاً من
{ category: "507f1f77bcf86cd799439011" }

// يصبح
{ category: { $in: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"] } }
```

## تشغيل المثال

يمكنك تشغيل المثال الموجود في `examples/multi-category-filter-example.js`:

```bash
node examples/multi-category-filter-example.js
```

## ملاحظات مهمة

1. **الترتيب**: معرفات الفئات في الاستجابة تحافظ على ترتيبها الأصلي
2. **الأداء**: الفلترة المتعددة تستخدم `$in` operator وهو محسن في MongoDB
3. **التوافق**: الميزة متوافقة مع جميع الفلاتر الأخرى (السعر، البحث، إلخ)
4. **التحقق**: يتم التحقق من صحة جميع معرفات الفئات قبل تنفيذ الاستعلام

## استكشاف الأخطاء

### مشكلة: معرف فئة غير صحيح
```json
{
  "success": false,
  "errors": [
    {
      "value": "invalid-id||507f1f77bcf86cd799439012",
      "msg": "Invalid category ID(s). Use format: categoryId1||categoryId2||categoryId3",
      "param": "category",
      "location": "query"
    }
  ]
}
```

### مشكلة: فئة غير موجودة
- المنتجات من الفئات غير الموجودة لن تظهر في النتائج
- لا يتم إرجاع خطأ إذا كانت بعض الفئات غير موجودة

### مشكلة: لا توجد نتائج
- تحقق من وجود منتجات في الفئات المحددة
- تأكد من أن المنتجات نشطة (`isActive: true`)
- تحقق من أن الفئات نشطة أيضاً
