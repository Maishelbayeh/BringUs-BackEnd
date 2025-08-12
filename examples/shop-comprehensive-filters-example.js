/**
 * مثال على كيفية استخدام الفلاتر الشاملة في صفحة Shop
 * 
 * هذا الملف يوضح كيفية:
 * 1. تطبيق الفلاتر الشاملة في Shop.jsx
 * 2. دعم الفئات المتعددة
 * 3. دمج جميع أنواع الفلاتر
 * 4. أمثلة عملية للاستخدام
 */

import React, { useState, useEffect } from 'react';
import useProducts from '../src/hooks/useProducts';

/**
 * مثال 1: مكون Shop محسن مع الفلاتر الشاملة
 */
const EnhancedShopComponent = () => {
  const { fetchProductsWithComprehensiveFilters, loading } = useProducts();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    colors: [],
    productLabels: [],
    features: [],
    status: [],
    sortBy: 'newest',
    page: 1,
    limit: 20
  });

  // تطبيق الفلاتر الشاملة
  const applyComprehensiveFilters = async (newFilters) => {
    try {
      console.log('🚀 Applying comprehensive filters in Shop:', newFilters);
      
      const result = await fetchProductsWithComprehensiveFilters(newFilters);
      
      if (result && result.products) {
        setProducts(result.products);
        setPagination(result.pagination);
        console.log('✅ Products fetched successfully:', result.products.length, 'products');
      } else {
        setProducts([]);
        setPagination(null);
        console.log('⚠️ No products found');
      }
    } catch (error) {
      console.error('❌ Error applying filters:', error);
      setProducts([]);
    }
  };

  // تطبيق الفلاتر عند تغييرها
  useEffect(() => {
    applyComprehensiveFilters(filters);
  }, [filters]);

  // معالجة تغيير الفلاتر
  const handleFilterChange = (filterType, value, checked = null) => {
    console.log('🔍 Filter change:', filterType, value, checked);

    if (filterType === 'category') {
      if (checked) {
        setFilters(prev => ({
          ...prev,
          categories: [...prev.categories, value]
        }));
      } else {
        setFilters(prev => ({
          ...prev,
          categories: prev.categories.filter(cat => cat !== value)
        }));
      }
    }
    
    else if (filterType === 'priceRange') {
      setFilters(prev => ({
        ...prev,
        priceRange: value
      }));
    }
    
    else if (filterType === 'color') {
      if (checked) {
        setFilters(prev => ({
          ...prev,
          colors: [...prev.colors, value]
        }));
      } else {
        setFilters(prev => ({
          ...prev,
          colors: prev.colors.filter(color => color !== value)
        }));
      }
    }
    
    else if (filterType === 'productLabel') {
      if (checked) {
        setFilters(prev => ({
          ...prev,
          productLabels: [...prev.productLabels, value]
        }));
      } else {
        setFilters(prev => ({
          ...prev,
          productLabels: prev.productLabels.filter(id => id !== value)
        }));
      }
    }
  };

  // مسح جميع الفلاتر
  const clearAllFilters = () => {
    console.log('🧹 Clearing all filters');
    setFilters({
      categories: [],
      priceRange: { min: 0, max: 1000 },
      colors: [],
      productLabels: [],
      features: [],
      status: [],
      sortBy: 'newest',
      page: 1,
      limit: 20
    });
  };

  return (
    <div className="enhanced-shop">
      <h2>متجر محسن مع الفلاتر الشاملة</h2>
      
      {/* واجهة الفلاتر */}
      <div className="filters-panel">
        <h3>الفلاتر</h3>
        
        {/* فلاتر الفئات */}
        <div className="filter-section">
          <h4>الفئات</h4>
          <label>
            <input
              type="checkbox"
              checked={filters.categories.includes('507f1f77bcf86cd799439011')}
              onChange={(e) => handleFilterChange('category', '507f1f77bcf86cd799439011', e.target.checked)}
            />
            الهواتف
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.categories.includes('507f1f77bcf86cd799439012')}
              onChange={(e) => handleFilterChange('category', '507f1f77bcf86cd799439012', e.target.checked)}
            />
            الحواسيب
          </label>
        </div>

        {/* فلترة السعر */}
        <div className="filter-section">
          <h4>نطاق السعر</h4>
          <input
            type="number"
            placeholder="الحد الأدنى"
            value={filters.priceRange.min}
            onChange={(e) => handleFilterChange('priceRange', { 
              ...filters.priceRange, 
              min: Number(e.target.value) 
            })}
          />
          <input
            type="number"
            placeholder="الحد الأقصى"
            value={filters.priceRange.max}
            onChange={(e) => handleFilterChange('priceRange', { 
              ...filters.priceRange, 
              max: Number(e.target.value) 
            })}
          />
        </div>

        {/* فلترة الألوان */}
        <div className="filter-section">
          <h4>الألوان</h4>
          <label>
            <input
              type="checkbox"
              checked={filters.colors.includes('#FF0000')}
              onChange={(e) => handleFilterChange('color', '#FF0000', e.target.checked)}
            />
            أحمر
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.colors.includes('#000000')}
              onChange={(e) => handleFilterChange('color', '#000000', e.target.checked)}
            />
            أسود
          </label>
        </div>

        <button onClick={clearAllFilters}>مسح جميع الفلاتر</button>
      </div>

      {/* عرض النتائج */}
      <div className="results-panel">
        <h3>النتائج ({products.length})</h3>
        
        {loading ? (
          <p>جاري التحميل...</p>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                <h4>{product.nameAr}</h4>
                <p>{product.nameEn}</p>
                <p>السعر: {product.price}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              disabled={filters.page === 1}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              السابق
            </button>
            <span>صفحة {filters.page} من {pagination.totalPages}</span>
            <button 
              disabled={filters.page === pagination.totalPages}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * مثال 2: مكون فلترة سريعة
 */
const QuickFilterComponent = () => {
  const { fetchProductsWithComprehensiveFilters } = useProducts();
  const [products, setProducts] = useState([]);

  // فلترة بفئات متعددة
  const filterByMultipleCategories = async () => {
    const result = await fetchProductsWithComprehensiveFilters({
      categories: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      priceRange: { min: 100, max: 500 },
      sort: 'price_asc',
      limit: 10
    });
    
    if (result && result.products) {
      setProducts(result.products);
    }
  };

  // فلترة شاملة
  const comprehensiveFilter = async () => {
    const result = await fetchProductsWithComprehensiveFilters({
      categories: ['507f1f77bcf86cd799439011'],
      colors: ['#FF0000', '#000000'],
      productLabels: ['507f1f77bcf86cd799439013'],
      priceRange: { min: 50, max: 1000 },
      sort: 'newest',
      limit: 15
    });
    
    if (result && result.products) {
      setProducts(result.products);
    }
  };

  return (
    <div className="quick-filters">
      <h2>فلاتر سريعة</h2>
      
      <button onClick={filterByMultipleCategories}>
        فلترة بفئات متعددة
      </button>
      
      <button onClick={comprehensiveFilter}>
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
 * مثال 3: مكون فلترة ديناميكية
 */
const DynamicFilterComponent = () => {
  const { fetchProductsWithComprehensiveFilters } = useProducts();
  const [products, setProducts] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});

  const applyDynamicFilters = async (newFilters) => {
    const updatedFilters = { ...activeFilters, ...newFilters };
    setActiveFilters(updatedFilters);

    const result = await fetchProductsWithComprehensiveFilters({
      ...updatedFilters,
      page: 1,
      limit: 10
    });
    
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
          colors: ['#FF0000'],
          sort: 'newest'
        })}>
          منتجات حمراء جديدة
        </button>
        
        <button onClick={() => applyDynamicFilters({ 
          productLabels: ['507f1f77bcf86cd799439013'],
          sort: 'price_asc'
        })}>
          منتجات مخفضة
        </button>
      </div>

      <div className="active-filters">
        <h3>الفلاتر النشطة:</h3>
        <pre>{JSON.stringify(activeFilters, null, 2)}</pre>
      </div>

      <div className="products-results">
        <h3>النتائج ({products.length})</h3>
        <div className="products-grid">
          {products.map(product => (
            <div key={product._id} className="product-item">
              <h4>{product.nameAr}</h4>
              <p>{product.nameEn}</p>
              <p>السعر: {product.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * مثال 4: مكون فلترة متقدمة مع Pagination
 */
const AdvancedFilterWithPagination = () => {
  const { fetchProductsWithComprehensiveFilters, loading } = useProducts();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const loadProducts = async (page = 1) => {
    const result = await fetchProductsWithComprehensiveFilters({
      categories: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      priceRange: { min: 50, max: 1000 },
      colors: ['#FF0000', '#000000'],
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
    <div className="advanced-filter">
      <h2>فلترة متقدمة مع Pagination</h2>
      
      <div className="products-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            <h3>{product.nameAr}</h3>
            <p>{product.nameEn}</p>
            <p>السعر: {product.price}</p>
          </div>
        ))}
      </div>
      
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            السابق
          </button>
          <span>صفحة {currentPage} من {pagination.totalPages}</span>
          <button 
            disabled={currentPage === pagination.totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};

// تصدير المكونات للاستخدام
export {
  EnhancedShopComponent,
  QuickFilterComponent,
  DynamicFilterComponent,
  AdvancedFilterWithPagination
};

// مثال على الاستخدام في ملف آخر
export const ShopExampleUsage = () => {
  return (
    <div>
      <h1>أمثلة الفلاتر الشاملة في Shop</h1>
      
      <EnhancedShopComponent />
      <QuickFilterComponent />
      <DynamicFilterComponent />
      <AdvancedFilterWithPagination />
    </div>
  );
};
