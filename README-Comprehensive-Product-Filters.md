# الفلاتر الشاملة للمنتجات (Comprehensive Product Filters)

## نظرة عامة

تم تطوير نظام فلترة شامل للمنتجات يتيح لك استخدام جميع أنواع الفلاتر معاً في نفس الوقت. هذا النظام محسن للأداء ويطبق جميع الفلاتر على مستوى قاعدة البيانات بدلاً من تطبيقها بعد الاستعلام.

## الميزات الجديدة

### 1. **فلترة شاملة** ✅
- دعم استخدام جميع الفلاتر معاً
- تطبيق الفلاتر على مستوى قاعدة البيانات
- تحسين الأداء والسرعة

### 2. **الفلاتر المدعومة** ✅
- **الفئات**: فئة واحدة أو عدة فئات (`||`)
- **السعر**: حد أدنى وأعلى
- **البحث**: بحث نصي في الأسماء والوصف
- **الألوان**: فلترة بالألوان
- **العلامات**: فلترة بعلامات المنتجات
- **الترتيب**: ترتيب حسب السعر، الاسم، التقييم، التاريخ
- **Pagination**: ترقيم الصفحات

## كيفية الاستخدام

### 1. فلترة بمعيار واحد

```javascript
// فلترة بفئة واحدة
const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: '507f1f77bcf86cd799439011'
  }
});

// فلترة بالسعر
const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    minPrice: 100,
    maxPrice: 500
  }
});
```

### 2. فلترة بمعيارين معاً

```javascript
// فلترة بفئة وسعر
const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: '507f1f77bcf86cd799439011',
    minPrice: 100,
    maxPrice: 500
  }
});

// فلترة بالبحث والألوان
const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    search: 'samsung',
    colors: ['#FF0000', '#000000']
  }
});
```

### 3. فلترة شاملة بجميع المعايير

```javascript
// فلترة شاملة
const response = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012', // فئات متعددة
    minPrice: 50,
    maxPrice: 500,
    search: 'phone',
    colors: ['#FF0000', '#000000'],
    productLabels: ['507f1f77bcf86cd799439013'],
    sort: 'price_asc',
    page: 1,
    limit: 10
  }
});
```

## أمثلة عملية

### مثال 1: البحث عن هواتف سامسونج حمراء

```javascript
const samsungRedPhones = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    search: 'samsung',
    colors: ['#FF0000'],
    category: '507f1f77bcf86cd799439011', // فئة الهواتف
    sort: 'price_asc'
  }
});
```

### مثال 2: منتجات جديدة بأسعار معقولة

```javascript
const newAffordableProducts = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    minPrice: 50,
    maxPrice: 200,
    sort: 'newest',
    limit: 10
  }
});
```

### مثال 3: منتجات مخفضة في فئات محددة

```javascript
const discountedProducts = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012',
    productLabels: ['507f1f77bcf86cd799439013'], // علامة التخفيض
    sort: 'price_asc',
    limit: 20
  }
});
```

### مثال 4: فلترة شاملة مع pagination

```javascript
const comprehensiveProducts = await axios.get('/api/products', {
  params: {
    storeId: '687505893fbf3098648bfe16',
    category: '507f1f77bcf86cd799439011',
    minPrice: 50,
    search: 'phone',
    colors: ['#FF0000', '#00FF00'],
    productLabels: ['507f1f77bcf86cd799439013'],
    sort: 'newest',
    page: 1,
    limit: 5
  }
});
```

## API Endpoints المدعومة

### 1. المنتجات العامة

```http
GET /api/products?storeId={storeId}&category={category}&minPrice={minPrice}&maxPrice={maxPrice}&search={search}&colors={colors}&productLabels={productLabels}&sort={sort}&page={page}&limit={limit}
```

### 2. المنتجات بدون variants

```http
GET /api/products/{storeId}/without-variants?category={category}&minPrice={minPrice}&maxPrice={maxPrice}&search={search}&colors={colors}&productLabels={productLabels}&sort={sort}&page={page}&limit={limit}
```

## المعايير المدعومة

| المعيار | النوع | الوصف | مثال |
|----------|-------|--------|-------|
| `storeId` | string | معرف المتجر | `687505893fbf3098648bfe16` |
| `category` | string | فئة واحدة أو عدة فئات | `507f1f77bcf86cd799439011` أو `507f1f77bcf86cd799439011\|\|507f1f77bcf86cd799439012` |
| `minPrice` | number | الحد الأدنى للسعر | `100` |
| `maxPrice` | number | الحد الأقصى للسعر | `500` |
| `search` | string | نص البحث | `samsung phone` |
| `colors` | array | مصفوفة الألوان | `['#FF0000', '#000000']` |
| `productLabels` | array | مصفوفة معرفات العلامات | `['507f1f77bcf86cd799439013']` |
| `sort` | string | نوع الترتيب | `price_asc`, `price_desc`, `name_asc`, `name_desc`, `rating_desc`, `newest`, `oldest` |
| `page` | number | رقم الصفحة | `1` |
| `limit` | number | عدد العناصر في الصفحة | `10` |

## أمثلة cURL

### مثال 1: فلترة بفئة وسعر

```bash
curl -X GET "http://localhost:3000/api/products?storeId=687505893fbf3098648bfe16&category=507f1f77bcf86cd799439011&minPrice=100&maxPrice=500"
```

### مثال 2: فلترة شاملة

```bash
curl -X GET "http://localhost:3000/api/products?storeId=687505893fbf3098648bfe16&category=507f1f77bcf86cd799439011||507f1f77bcf86cd799439012&minPrice=50&maxPrice=500&search=phone&colors=%5B%22%23FF0000%22%2C%22%23000000%22%5D&productLabels=%5B%22507f1f77bcf86cd799439013%22%5D&sort=price_asc&page=1&limit=10"
```

### مثال 3: فلترة بدون variants

```bash
curl -X GET "http://localhost:3000/api/products/687505893fbf3098648bfe16/without-variants?category=507f1f77bcf86cd799439011&minPrice=100&maxPrice=1000&sort=newest&limit=10"
```

## التحسينات التقنية

### 1. **تطبيق الفلاتر على مستوى قاعدة البيانات**
- جميع الفلاتر تطبق في MongoDB query
- تحسين الأداء والسرعة
- تقليل استهلاك الذاكرة

### 2. **دعم الفئات المتعددة**
- استخدام `$in` operator للفئات المتعددة
- دعم `||` separator بين معرفات الفئات

### 3. **فلترة الألوان المحسنة**
- استخدام regex patterns للبحث في الألوان
- دعم البحث case-insensitive

### 4. **فلترة العلامات المحسنة**
- استخدام `$in` operator للعلامات المتعددة
- تطبيق الفلترة مباشرة في قاعدة البيانات

## أمثلة للاستخدام العملي

### 1. صفحة البحث المتقدمة

```javascript
// تطبيق جميع فلاتر البحث
const advancedSearch = async (searchParams) => {
  const response = await axios.get('/api/products', {
    params: {
      storeId: searchParams.storeId,
      category: searchParams.categories?.join('||'),
      minPrice: searchParams.minPrice,
      maxPrice: searchParams.maxPrice,
      search: searchParams.searchTerm,
      colors: searchParams.selectedColors,
      productLabels: searchParams.selectedLabels,
      sort: searchParams.sortBy,
      page: searchParams.page,
      limit: searchParams.itemsPerPage
    }
  });
  
  return response.data;
};
```

### 2. فلترة ديناميكية

```javascript
// تطبيق فلاتر ديناميكية بناءً على اختيار المستخدم
const applyDynamicFilters = async (selectedFilters) => {
  const params = { storeId: STORE_ID };
  
  // إضافة الفلاتر المحددة فقط
  if (selectedFilters.category) params.category = selectedFilters.category;
  if (selectedFilters.priceRange) {
    params.minPrice = selectedFilters.priceRange.min;
    params.maxPrice = selectedFilters.priceRange.max;
  }
  if (selectedFilters.colors?.length > 0) params.colors = selectedFilters.colors;
  if (selectedFilters.labels?.length > 0) params.productLabels = selectedFilters.labels;
  if (selectedFilters.sort) params.sort = selectedFilters.sort;
  
  const response = await axios.get('/api/products', { params });
  return response.data;
};
```

### 3. فلترة متقدمة للواجهة الأمامية

```javascript
// فلترة متقدمة مع pagination
const advancedProductFilter = async (filters) => {
  const params = {
    storeId: filters.storeId,
    page: filters.page || 1,
    limit: filters.limit || 10
  };

  // إضافة الفلاتر المحددة
  if (filters.categories?.length > 0) {
    params.category = filters.categories.join('||');
  }
  
  if (filters.priceRange) {
    if (filters.priceRange.min) params.minPrice = filters.priceRange.min;
    if (filters.priceRange.max) params.maxPrice = filters.priceRange.max;
  }
  
  if (filters.searchTerm) params.search = filters.searchTerm;
  if (filters.colors?.length > 0) params.colors = filters.colors;
  if (filters.labels?.length > 0) params.productLabels = filters.labels;
  if (filters.sortBy) params.sort = filters.sortBy;

  const response = await axios.get('/api/products', { params });
  return response.data;
};
```

## تشغيل المثال

يمكنك تشغيل المثال الموجود في `examples/comprehensive-product-filters-example.js`:

```bash
node examples/comprehensive-product-filters-example.js
```

## ملاحظات مهمة

1. **الأداء**: جميع الفلاتر تطبق على مستوى قاعدة البيانات لتحسين الأداء
2. **المرونة**: يمكن استخدام أي مجموعة من الفلاتر معاً
3. **التوافق**: النظام متوافق مع جميع الفلاتر الموجودة مسبقاً
4. **التوسع**: يمكن إضافة فلاتر جديدة بسهولة
5. **Pagination**: يدعم ترقيم الصفحات مع جميع الفلاتر

## استكشاف الأخطاء

### مشكلة: لا توجد نتائج
- تحقق من صحة معرفات الفئات والعلامات
- تأكد من أن نطاق السعر منطقي
- تحقق من صحة تنسيق الألوان

### مشكلة: أداء بطيء
- استخدم `limit` لتقليل عدد النتائج
- تجنب استخدام فلاتر غير ضرورية
- استخدم `page` للتنقل بين النتائج

### مشكلة: فلاتر لا تعمل
- تحقق من صحة تنسيق المعايير
- تأكد من وجود البيانات المطلوبة في قاعدة البيانات
- راجع logs للتأكد من تطبيق الفلاتر
