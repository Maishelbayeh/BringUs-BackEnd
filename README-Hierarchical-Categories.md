# النظام الهرمي للفئات (Hierarchical Categories)

## نظرة عامة

تم تطوير نظام هرمي متكامل للفئات يتيح لك إنشاء فئات رئيسية وفئات فرعية بلا حدود. هذا النظام يدعم:

1. **الفئات الهرمية**: فئات رئيسية وفئات فرعية
2. **قائمة الفئات**: عرض جميع الفئات مع مستوياتها
3. **فلتر حسب الفئة الأب**: جلب الفئات الفرعية المباشرة والمتداخلة
4. **ترتيب وتنظيم**: ترتيب الفئات حسب المستوى والترتيب

## الميزات الجديدة

### 1. نموذج الفئة المحسن

نموذج `Category` يدعم بالفعل النظام الهرمي:

```javascript
{
  nameAr: String,        // الاسم بالعربية
  nameEn: String,        // الاسم بالإنجليزية
  slug: String,          // الرابط المختصر
  parent: ObjectId,      // معرف الفئة الأب (اختياري)
  store: ObjectId,       // معرف المتجر
  level: Number,         // مستوى الفئة (0 للفئات الرئيسية)
  sortOrder: Number,     // ترتيب الفئة
  isActive: Boolean,     // حالة الفئة
  // ... باقي الحقول
}
```

### 2. Virtual Fields

تم إضافة حقول افتراضية مفيدة:

```javascript
// المسار الكامل للفئة
fullPath: "Electronics > Phones > Smartphones"

// المسار الكامل بالعربية
fullPathAr: "الإلكترونيات > الهواتف > الهواتف الذكية"

// الفئات الفرعية
children: [Array of Category objects]
```

## API Endpoints الجديدة

### 1. الحصول على قائمة الفئات الهرمية

```http
GET /api/categories/list?storeId={storeId}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nameAr": "الإلكترونيات",
      "nameEn": "Electronics",
      "slug": "electronics",
      "level": 0,
      "indent": "",
      "hasChildren": true,
      "parent": null
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "nameAr": "الهواتف",
      "nameEn": "Phones",
      "slug": "phones",
      "level": 1,
      "indent": "  ",
      "hasChildren": true,
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "nameAr": "الإلكترونيات",
        "nameEn": "Electronics"
      }
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "nameAr": "الهواتف الذكية",
      "nameEn": "Smartphones",
      "slug": "smartphones",
      "level": 2,
      "indent": "    ",
      "hasChildren": false,
      "parent": {
        "_id": "507f1f77bcf86cd799439012",
        "nameAr": "الهواتف",
        "nameEn": "Phones"
      }
    }
  ],
  "count": 3
}
```

### 2. الحصول على الفئات الفرعية لفئة معينة

```http
GET /api/categories/by-parent?storeId={storeId}&parentId={parentId}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "parent": {
      "_id": "507f1f77bcf86cd799439011",
      "nameAr": "الإلكترونيات",
      "nameEn": "Electronics",
      "slug": "electronics"
    },
    "directChildren": 2,
    "totalSubcategories": 4,
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "nameAr": "الهواتف",
        "nameEn": "Phones",
        "level": 1,
        "isDirectChild": true
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "nameAr": "الهواتف الذكية",
        "nameEn": "Smartphones",
        "level": 2,
        "isDirectChild": false
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "nameAr": "الحواسيب المحمولة",
        "nameEn": "Laptops",
        "level": 1,
        "isDirectChild": true
      }
    ]
  }
}
```

### 3. الحصول على شجرة الفئات

```http
GET /api/categories/tree?storeId={storeId}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nameAr": "الإلكترونيات",
      "nameEn": "Electronics",
      "children": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "nameAr": "الهواتف",
          "nameEn": "Phones",
          "children": [
            {
              "_id": "507f1f77bcf86cd799439013",
              "nameAr": "الهواتف الذكية",
              "nameEn": "Smartphones",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

## كيفية إنشاء فئات هرمية

### 1. إنشاء فئة رئيسية

```javascript
const categoryData = {
  nameAr: "الإلكترونيات",
  nameEn: "Electronics",
  descriptionAr: "جميع المنتجات الإلكترونية",
  descriptionEn: "All electronic products",
  store: "687505893fbf3098648bfe16",
  isActive: true,
  sortOrder: 1
  // لا يوجد parent - فئة رئيسية
};

const response = await axios.post('/api/categories', categoryData);
```

### 2. إنشاء فئة فرعية

```javascript
const subcategoryData = {
  nameAr: "الهواتف",
  nameEn: "Phones",
  descriptionAr: "الهواتف الذكية والجوالة",
  descriptionEn: "Smartphones and mobile phones",
  parent: "507f1f77bcf86cd799439011", // معرف الفئة الأب
  store: "687505893fbf3098648bfe16",
  isActive: true,
  sortOrder: 1
};

const response = await axios.post('/api/categories', subcategoryData);
```

### 3. إنشاء فئة فرعية للفئة الفرعية

```javascript
const subSubcategoryData = {
  nameAr: "الهواتف الذكية",
  nameEn: "Smartphones",
  descriptionAr: "الهواتف الذكية الحديثة",
  descriptionEn: "Modern smartphones",
  parent: "507f1f77bcf86cd799439012", // معرف فئة الهواتف
  store: "687505893fbf3098648bfe16",
  isActive: true,
  sortOrder: 1
};

const response = await axios.post('/api/categories', subSubcategoryData);
```

## مثال عملي

### الخطوة 1: إنشاء هيكل الفئات

```javascript
// 1. إنشاء الفئة الرئيسية
const electronics = await createCategory({
  nameAr: "الإلكترونيات",
  nameEn: "Electronics",
  store: STORE_ID
});

// 2. إنشاء فئات فرعية
const phones = await createCategory({
  nameAr: "الهواتف",
  nameEn: "Phones",
  parent: electronics._id,
  store: STORE_ID
});

const laptops = await createCategory({
  nameAr: "الحواسيب المحمولة",
  nameEn: "Laptops",
  parent: electronics._id,
  store: STORE_ID
});

// 3. إنشاء فئات فرعية للفئات الفرعية
const smartphones = await createCategory({
  nameAr: "الهواتف الذكية",
  nameEn: "Smartphones",
  parent: phones._id,
  store: STORE_ID
});
```

### الخطوة 2: الحصول على قائمة الفئات

```javascript
// الحصول على قائمة الفئات الهرمية
const categoryList = await axios.get('/api/categories/list', {
  params: { storeId: STORE_ID }
});

console.log('قائمة الفئات:', categoryList.data);
```

### الخطوة 3: الحصول على الفئات الفرعية

```javascript
// الحصول على جميع الفئات الفرعية للإلكترونيات
const subcategories = await axios.get('/api/categories/by-parent', {
  params: { 
    storeId: STORE_ID,
    parentId: electronics._id
  }
});

console.log('الفئات الفرعية:', subcategories.data);
```

## معلومات إضافية

### ترتيب الفئات

الفئات يتم ترتيبها حسب:
1. **المستوى** (level) - الفئات الرئيسية أولاً
2. **الترتيب** (sortOrder) - حسب الترتيب المحدد
3. **الاسم** (nameEn) - ترتيب أبجدي

### مستويات الفئات

- **المستوى 0**: الفئات الرئيسية (لا يوجد parent)
- **المستوى 1**: الفئات الفرعية المباشرة
- **المستوى 2**: الفئات الفرعية للفئات الفرعية
- وهكذا...

### الفلترة حسب الفئة الأب

عند استخدام `/api/categories/by-parent`:
- **directChildren**: عدد الفئات الفرعية المباشرة
- **totalSubcategories**: إجمالي الفئات الفرعية (مباشرة + متداخلة)
- **isDirectChild**: هل الفئة فرعية مباشرة أم متداخلة

## تشغيل المثال

يمكنك تشغيل المثال الموجود في `examples/hierarchical-categories-example.js`:

```bash
node examples/hierarchical-categories-example.js
```

## ملاحظات مهمة

1. **التحقق من صحة الفئة الأب**: تأكد من وجود الفئة الأب قبل إنشاء الفئة الفرعية
2. **تجنب الحلقات**: لا يمكن إنشاء فئة فرعية لنفسها
3. **حذف الفئات**: عند حذف فئة، يتم حذف جميع فئاتها الفرعية
4. **الأداء**: النظام محسن للاستعلامات المتكررة مع الفهارس المناسبة

## استكشاف الأخطاء

### مشكلة: لا يتم العثور على الفئة الأب
- تأكد من وجود الفئة الأب في نفس المتجر
- تأكد من صحة معرف الفئة الأب

### مشكلة: الفئات لا تظهر بالترتيب الصحيح
- تحقق من قيم `sortOrder`
- تأكد من أن `level` محسوب بشكل صحيح

### مشكلة: الفئات الفرعية لا تظهر
- تأكد من أن `parent` محدد بشكل صحيح
- تحقق من أن الفئة الأب موجودة ونشطة

