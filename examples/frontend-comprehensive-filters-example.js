/**
 * مثال على كيفية استخدام الفلاتر الشاملة في الواجهة الأمامية
 * 
 * هذا الملف يوضح كيفية:
 * 1. استخدام الفلاتر الشاملة مع useProducts hook
 * 2. تطبيق عدة فئات معاً
 * 3. دمج جميع أنواع الفلاتر
 * 4. أمثلة عملية للاستخدام في React components
 */

import React, { useState, useEffect } from 'react';
import useProducts from '../src/hooks/useProducts';

/**
 * مثال 1: مكون البحث المتقدم مع الفلاتر الشاملة
 */
const AdvancedSearchComponent = () => {
  const { fetchProductsWithComprehensiveFilters, loading, error } = useProducts();
  const [searchResults, setSearchResults] = useState([]);
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

  const handleSearch = async () => {
    try {
      const result = await fetchProductsWithComprehensiveFilters(filters);
      if (result && result.products) {
        setSearchResults(result.products);
      }
    } catch (error) {
      console.error('Error in advanced search:', error);
    }
  };

  return (
    <div className="advanced-search">
      <h2>البحث المتقدم</h2>
      
      {/* فلاتر الفئات */}
      <div className="filter-section">
        <h3>الفئات</h3>
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
      </div>

      {/* فلترة السعر */}
      <div className="filter-section">
        <h3>نطاق السعر</h3>
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
      </div>

      {/* البحث النصي */}
      <div className="filter-section">
        <h3>البحث</h3>
        <input
          type="text"
          placeholder="ابحث عن منتج..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>

      {/* فلترة الألوان */}
      <div className="filter-section">
        <h3>الألوان</h3>
        <div className="color-options">
          {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(color => (
            <label key={color}>
              <input
                type="checkbox"
                checked={filters.colors.includes(color)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilters(prev => ({
                      ...prev,
                      colors: [...prev.colors, color]
                    }));
                  } else {
                    setFilters(prev => ({
                      ...prev,
                      colors: prev.colors.filter(c => c !== color)
                    }));
                  }
                }}
              />
              <span style={{ backgroundColor: color, width: 20, height: 20, display: 'inline-block' }}></span>
            </label>
          ))}
        </div>
      </div>

      {/* الترتيب */}
      <div className="filter-section">
        <h3>الترتيب</h3>
        <select
          value={filters.sort}
          onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
        >
          <option value="newest">الأحدث</option>
          <option value="price_asc">السعر: من الأقل إلى الأعلى</option>
          <option value="price_desc">السعر: من الأعلى إلى الأقل</option>
          <option value="name_asc">الاسم: أ-ي</option>
          <option value="name_desc">الاسم: ي-أ</option>
        </select>
      </div>

      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'جاري البحث...' : 'بحث'}
      </button>

      {error && <div className="error">{error}</div>}

      <div className="results">
        <h3>النتائج ({searchResults.length})</h3>
        {searchResults.map(product => (
          <div key={product._id} className="product-card">
            <h4>{product.nameAr}</h4>
            <p>{product.nameEn}</p>
            <p>السعر: {product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * مثال 2: مكون فلترة سريعة
 */
const QuickFilterComponent = () => {
  const { fetchProductsWithFilters, loading } = useProducts();
  const [products, setProducts] = useState([]);

  // فلترة بفئات متعددة
  const filterByMultipleCategories = async () => {
    const result = await fetchProductsWithFilters({
      category: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'], // فئات متعددة
      minPrice: 100,
      maxPrice: 500,
      sort: 'price_asc'
    });
    
    if (result && result.products) {
      setProducts(result.products);
    }
  };

  // فلترة شاملة
  const comprehensiveFilter = async () => {
    const result = await fetchProductsWithFilters({
      category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012', // فئات متعددة كسلسلة نصية
      minPrice: 50,
      maxPrice: 1000,
      search: 'samsung',
      colors: ['#FF0000', '#000000'],
      sort: 'newest',
      limit: 10
    });
    
    if (result && result.products) {
      setProducts(result.products);
    }
  };

  return (
    <div className="quick-filters">
      <h2>فلاتر سريعة</h2>
      
      <button onClick={filterByMultipleCategories} disabled={loading}>
        فلترة بفئات متعددة
      </button>
      
      <button onClick={comprehensiveFilter} disabled={loading}>
        فلترة شاملة
      </button>

      <div className="products-grid">
        {products.map(product => (
          <div key={product._id} className="product-item">
            <h4>{product.nameAr}</h4>
            <p>{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * مثال 3: مكون البحث عن هواتف سامسونج حمراء
 */
const SamsungRedPhonesComponent = () => {
  const { fetchProductsWithComprehensiveFilters, loading } = useProducts();
  const [phones, setPhones] = useState([]);

  useEffect(() => {
    const searchSamsungRedPhones = async () => {
      const result = await fetchProductsWithComprehensiveFilters({
        search: 'samsung',
        colors: ['#FF0000'],
        category: '507f1f77bcf86cd799439011', // فئة الهواتف
        sort: 'price_asc',
        limit: 20
      });
      
      if (result && result.products) {
        setPhones(result.products);
      }
    };

    searchSamsungRedPhones();
  }, []);

  return (
    <div className="samsung-red-phones">
      <h2>هواتف سامسونج حمراء</h2>
      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="phones-grid">
          {phones.map(phone => (
            <div key={phone._id} className="phone-card">
              <h3>{phone.nameAr}</h3>
              <p>{phone.nameEn}</p>
              <p>السعر: {phone.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * مثال 4: مكون منتجات جديدة بأسعار معقولة
 */
const NewAffordableProductsComponent = () => {
  const { fetchProductsWithComprehensiveFilters, loading } = useProducts();
  const [affordableProducts, setAffordableProducts] = useState([]);

  useEffect(() => {
    const loadAffordableProducts = async () => {
      const result = await fetchProductsWithComprehensiveFilters({
        priceRange: { min: 50, max: 200 },
        sort: 'newest',
        limit: 15
      });
      
      if (result && result.products) {
        setAffordableProducts(result.products);
      }
    };

    loadAffordableProducts();
  }, []);

  return (
    <div className="affordable-products">
      <h2>منتجات جديدة بأسعار معقولة</h2>
      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="products-grid">
          {affordableProducts.map(product => (
            <div key={product._id} className="product-card">
              <h3>{product.nameAr}</h3>
              <p>{product.nameEn}</p>
              <p>السعر: {product.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * مثال 5: مكون فلترة ديناميكية
 */
const DynamicFilterComponent = () => {
  const { fetchProductsWithComprehensiveFilters, loading } = useProducts();
  const [products, setProducts] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});

  const applyDynamicFilters = async (newFilters) => {
    const updatedFilters = { ...activeFilters, ...newFilters };
    setActiveFilters(updatedFilters);

    const result = await fetchProductsWithComprehensiveFilters(updatedFilters);
    if (result && result.products) {
      setProducts(result.products);
    }
  };

  return (
    <div className="dynamic-filters">
      <h2>فلاتر ديناميكية</h2>
      
      <div className="filter-buttons">
        <button onClick={() => applyDynamicFilters({ 
          categories: ['507f1f77bcf86cd799439011'],
          priceRange: { min: 100, max: 500 }
        })}>
          هواتف بأسعار متوسطة
        </button>
        
        <button onClick={() => applyDynamicFilters({ 
          search: 'laptop',
          sort: 'price_desc'
        })}>
          لابتوبات بترتيب السعر
        </button>
        
        <button onClick={() => applyDynamicFilters({ 
          colors: ['#FF0000', '#000000'],
          sort: 'newest'
        })}>
          منتجات حمراء وسوداء جديدة
        </button>
      </div>

      <div className="active-filters">
        <h3>الفلاتر النشطة:</h3>
        <pre>{JSON.stringify(activeFilters, null, 2)}</pre>
      </div>

      <div className="products-results">
        <h3>النتائج ({products.length})</h3>
        {loading ? (
          <p>جاري التحميل...</p>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product._id} className="product-item">
                <h4>{product.nameAr}</h4>
                <p>{product.nameEn}</p>
                <p>السعر: {product.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// تصدير المكونات للاستخدام
export {
  AdvancedSearchComponent,
  QuickFilterComponent,
  SamsungRedPhonesComponent,
  NewAffordableProductsComponent,
  DynamicFilterComponent
};

// مثال على الاستخدام في ملف آخر
export const ExampleUsage = () => {
  return (
    <div>
      <h1>أمثلة الفلاتر الشاملة</h1>
      
      <AdvancedSearchComponent />
      <QuickFilterComponent />
      <SamsungRedPhonesComponent />
      <NewAffordableProductsComponent />
      <DynamicFilterComponent />
    </div>
  );
};
