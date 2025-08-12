# الفلاتر الشاملة في الواجهة الأمامية (Frontend Comprehensive Filters)

## نظرة عامة

تم تطوير نظام فلترة شامل في الواجهة الأمامية يتيح لك استخدام جميع أنواع الفلاتر معاً في React components. هذا النظام يدعم الفلاتر المتعددة والفئات المتعددة مع تحسين الأداء.

## الميزات الجديدة

### 1. **دعم الفئات المتعددة** ✅
- دعم مصفوفة فئات: `['category1', 'category2']`
- دعم سلسلة نصية: `'category1||category2'`
- دعم فئة واحدة: `'category1'`

### 2. **الفلاتر الشاملة** ✅
- دعم جميع الفلاتر معاً
- فلترة السعر (حد أدنى وأعلى)
- البحث النصي
- فلترة الألوان
- فلترة العلامات
- الترتيب
- Pagination

### 3. **دوال جديدة** ✅
- `fetchProductsWithComprehensiveFilters`: دالة شاملة للفلترة
- `fetchProductsWithFilters`: دالة محسنة للفلترة
- `fetchProducts`: دالة محسنة تدعم الفئات المتعددة

## كيفية الاستخدام

### 1. استخدام الفئات المتعددة

```javascript
import useProducts from '../hooks/useProducts';

const MyComponent = () => {
  const { fetchProductsWithComprehensiveFilters } = useProducts();

  // استخدام مصفوفة فئات
  const filterByMultipleCategories = async () => {
    const result = await fetchProductsWithComprehensiveFilters({
      categories: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      minPrice: 100,
      maxPrice: 500
    });
    
    if (result && result.products) {
      console.log('Products:', result.products);
    }
  };

  // استخدام سلسلة نصية
  const filterByStringCategories = async () => {
    const result = await fetchProductsWithComprehensiveFilters({
      category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012',
      sort: 'price_asc'
    });
    
    if (result && result.products) {
      console.log('Products:', result.products);
    }
  };
};
```

### 2. فلترة شاملة

```javascript
const comprehensiveFilter = async () => {
  const result = await fetchProductsWithComprehensiveFilters({
    // فئات متعددة
    categories: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    
    // نطاق السعر
    priceRange: { min: 50, max: 1000 },
    
    // البحث
    search: 'samsung phone',
    
    // الألوان
    colors: ['#FF0000', '#000000'],
    
    // العلامات
    productLabels: ['507f1f77bcf86cd799439013'],
    
    // الترتيب
    sort: 'price_asc',
    
    // Pagination
    page: 1,
    limit: 20
  });
  
  if (result && result.products) {
    console.log('Filtered products:', result.products);
    console.log('Pagination:', result.pagination);
  }
};
```

### 3. مكون البحث المتقدم

```javascript
import React, { useState } from 'react';
import useProducts from '../hooks/useProducts';

const AdvancedSearch = () => {
  const { fetchProductsWithComprehensiveFilters, loading } = useProducts();
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    search: '',
    colors: [],
    productLabels: [],
    sort: 'newest'
  });
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const result = await fetchProductsWithComprehensiveFilters(filters);
    if (result && result.products) {
      setResults(result.products);
    }
  };

  return (
    <div>
      {/* فلاتر الفئات */}
      <select 
        multiple 
        value={filters.categories}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, option => option.value);
          setFilters(prev => ({ ...prev, categories: selected }));
        }}
      >
        <option value="507f1f77bcf86cd799439011">الهواتف</option>
        <option value="507f1f77bcf86cd799439012">الحواسيب</option>
        <option value="507f1f77bcf86cd799439013">الملابس</option>
      </select>

      {/* فلترة السعر */}
      <input
        type="number"
        placeholder="الحد الأدنى"
        value={filters.priceRange.min}
        onChange={(e) => setFilters(prev => ({
          ...prev,
          priceRange: { ...prev.priceRange, min: Number(e.target.value) }
        }))}
      />
      <input
        type="number"
        placeholder="الحد الأقصى"
        value={filters.priceRange.max}
        onChange={(e) => setFilters(prev => ({
          ...prev,
          priceRange: { ...prev.priceRange, max: Number(e.target.value) }
        }))}
      />

      {/* البحث */}
      <input
        type="text"
        placeholder="ابحث عن منتج..."
        value={filters.search}
        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
      />

      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'جاري البحث...' : 'بحث'}
      </button>

      {/* النتائج */}
      <div>
        {results.map(product => (
          <div key={product._id}>
            <h3>{product.nameAr}</h3>
            <p>{product.nameEn}</p>
            <p>السعر: {product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## أمثلة عملية

### مثال 1: البحث عن هواتف سامسونج حمراء

```javascript
const searchSamsungRedPhones = async () => {
  const result = await fetchProductsWithComprehensiveFilters({
    search: 'samsung',
    colors: ['#FF0000'],
    category: '507f1f77bcf86cd799439011', // فئة الهواتف
    sort: 'price_asc',
    limit: 20
  });
  
  if (result && result.products) {
    console.log('Samsung red phones:', result.products);
  }
};
```

### مثال 2: منتجات جديدة بأسعار معقولة

```javascript
const loadAffordableProducts = async () => {
  const result = await fetchProductsWithComprehensiveFilters({
    priceRange: { min: 50, max: 200 },
    sort: 'newest',
    limit: 15
  });
  
  if (result && result.products) {
    console.log('Affordable products:', result.products);
  }
};
```

### مثال 3: فلترة ديناميكية

```javascript
const applyDynamicFilters = async (newFilters) => {
  const result = await fetchProductsWithComprehensiveFilters({
    ...newFilters,
    page: 1,
    limit: 10
  });
  
  if (result && result.products) {
    console.log('Dynamic filtered products:', result.products);
  }
};

// استخدام
applyDynamicFilters({
  categories: ['507f1f77bcf86cd799439011'],
  priceRange: { min: 100, max: 500 },
  colors: ['#FF0000']
});
```

## المعايير المدعومة

### `fetchProductsWithComprehensiveFilters`

| المعيار | النوع | الوصف | مثال |
|----------|-------|--------|-------|
| `categories` | array | مصفوفة معرفات الفئات | `['id1', 'id2']` |
| `category` | string | فئة واحدة أو عدة فئات | `'id1'` أو `'id1\|\|id2'` |
| `priceRange` | object | نطاق السعر | `{ min: 100, max: 500 }` |
| `minPrice` | number | الحد الأدنى للسعر | `100` |
| `maxPrice` | number | الحد الأقصى للسعر | `500` |
| `search` | string | نص البحث | `'samsung phone'` |
| `colors` | array | مصفوفة الألوان | `['#FF0000', '#000000']` |
| `productLabels` | array | مصفوفة معرفات العلامات | `['id1', 'id2']` |
| `sort` | string | نوع الترتيب | `'price_asc'`, `'newest'` |
| `page` | number | رقم الصفحة | `1` |
| `limit` | number | عدد العناصر في الصفحة | `20` |

### `fetchProductsWithFilters`

| المعيار | النوع | الوصف | مثال |
|----------|-------|--------|-------|
| `category` | string/array | فئة واحدة أو عدة فئات | `'id1'` أو `['id1', 'id2']` |
| `categories` | array | مصفوفة معرفات الفئات | `['id1', 'id2']` |
| `minPrice` | number | الحد الأدنى للسعر | `100` |
| `maxPrice` | number | الحد الأقصى للسعر | `500` |
| `search` | string | نص البحث | `'samsung'` |
| `colors` | array | مصفوفة الألوان | `['#FF0000']` |
| `productLabels` | array | مصفوفة معرفات العلامات | `['id1']` |
| `sort` | string | نوع الترتيب | `'price_asc'` |
| `page` | number | رقم الصفحة | `1` |
| `limit` | number | عدد العناصر في الصفحة | `20` |

## أمثلة للاستخدام العملي

### 1. صفحة البحث المتقدمة

```javascript
const AdvancedSearchPage = () => {
  const { fetchProductsWithComprehensiveFilters, loading } = useProducts();
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    search: '',
    colors: [],
    productLabels: [],
    sort: 'newest',
    page: 1,
    limit: 20
  });
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const result = await fetchProductsWithComprehensiveFilters(filters);
    if (result && result.products) {
      setResults(result.products);
    }
  };

  return (
    <div className="advanced-search-page">
      {/* واجهة الفلاتر */}
      <FilterInterface filters={filters} setFilters={setFilters} />
      
      {/* زر البحث */}
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'جاري البحث...' : 'بحث'}
      </button>
      
      {/* عرض النتائج */}
      <ProductGrid products={results} />
    </div>
  );
};
```

### 2. فلترة ديناميكية

```javascript
const DynamicFilterComponent = () => {
  const { fetchProductsWithComprehensiveFilters } = useProducts();
  const [products, setProducts] = useState([]);

  const applyFilter = async (filterType) => {
    let filters = {};
    
    switch (filterType) {
      case 'phones':
        filters = {
          categories: ['507f1f77bcf86cd799439011'],
          priceRange: { min: 100, max: 500 }
        };
        break;
      case 'laptops':
        filters = {
          search: 'laptop',
          sort: 'price_desc'
        };
        break;
      case 'redProducts':
        filters = {
          colors: ['#FF0000'],
          sort: 'newest'
        };
        break;
    }
    
    const result = await fetchProductsWithComprehensiveFilters(filters);
    if (result && result.products) {
      setProducts(result.products);
    }
  };

  return (
    <div>
      <button onClick={() => applyFilter('phones')}>هواتف</button>
      <button onClick={() => applyFilter('laptops')}>لابتوبات</button>
      <button onClick={() => applyFilter('redProducts')}>منتجات حمراء</button>
      
      <ProductGrid products={products} />
    </div>
  );
};
```

### 3. فلترة متقدمة مع Pagination

```javascript
const AdvancedFilterWithPagination = () => {
  const { fetchProductsWithComprehensiveFilters, loading } = useProducts();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const loadProducts = async (page = 1) => {
    const result = await fetchProductsWithComprehensiveFilters({
      categories: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      priceRange: { min: 50, max: 1000 },
      search: 'phone',
      sort: 'price_asc',
      page: page,
      limit: 10
    });
    
    if (result) {
      setProducts(result.products);
      setPagination(result.pagination);
    }
  };

  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div>
      <ProductGrid products={products} />
      
      <Pagination 
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
```

## تشغيل الأمثلة

يمكنك تشغيل الأمثلة الموجودة في `examples/frontend-comprehensive-filters-example.js`:

```bash
# في مجلد الواجهة الأمامية
npm start
```

ثم استيراد المكونات في ملف React:

```javascript
import { 
  AdvancedSearchComponent,
  QuickFilterComponent,
  SamsungRedPhonesComponent,
  NewAffordableProductsComponent,
  DynamicFilterComponent 
} from './examples/frontend-comprehensive-filters-example';
```

## ملاحظات مهمة

1. **الأداء**: جميع الفلاتر تطبق على مستوى قاعدة البيانات
2. **المرونة**: يمكن استخدام أي مجموعة من الفلاتر معاً
3. **التوافق**: النظام متوافق مع جميع الفلاتر الموجودة مسبقاً
4. **Logging**: تم إضافة logs مفصلة لتتبع تطبيق الفلاتر
5. **Error Handling**: معالجة شاملة للأخطاء

## استكشاف الأخطاء

### مشكلة: لا توجد نتائج
- تحقق من صحة معرفات الفئات
- تأكد من أن نطاق السعر منطقي
- تحقق من وجود البيانات المطلوبة

### مشكلة: فلاتر لا تعمل
- تحقق من صحة تنسيق المعايير
- راجع console logs للتأكد من تطبيق الفلاتر
- تأكد من أن API يعمل بشكل صحيح

### مشكلة: أداء بطيء
- استخدم `limit` لتقليل عدد النتائج
- تجنب استخدام فلاتر غير ضرورية
- استخدم `page` للتنقل بين النتائج
