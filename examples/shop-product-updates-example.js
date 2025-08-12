/**
 * Shop Product Updates Example
 * 
 * This example demonstrates the improved product update functionality
 * that ensures products update continuously when filters change.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useProducts } from '../src/hooks/useProducts';
import { useAppData } from '../src/contexts/AppDataContext';

/**
 * Enhanced Shop Component with Improved Product Updates
 * 
 * Key improvements:
 * 1. Immediate product clearing when filters change
 * 2. Better state synchronization between API and context products
 * 3. Improved loading states and error handling
 * 4. Reduced caching conflicts
 * 5. Better debugging and logging
 */
const EnhancedShopComponent = () => {
  const { store } = useAppData();
  const { 
    products, 
    loading: productsLoading, 
    error: productsError,
    fetchProductsWithComprehensiveFilters 
  } = useProducts();

  // API-based products state for filtered results
  const [apiProducts, setApiProducts] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiPagination, setApiPagination] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 1000 },
    categories: [],
    colors: [],
    productLabels: [],
    sortBy: 'newest'
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Calculate max price from all products
  const getMaxProductPrice = useCallback(() => {
    const allAvailableProducts = products || [];
    if (!allAvailableProducts || !allAvailableProducts.length) return 1000;
    return Math.max(...allAvailableProducts.map(product => 
      Math.max(product.originalPrice || 0, product.salePrice || 0, product.price || 0)
    ));
  }, [products]);

  const initialMaxPrice = useMemo(() => getMaxProductPrice(), [getMaxProductPrice]);

  // Apply API filters with comprehensive support
  const applyAPIFilters = useCallback(async () => {
    if (!store?._id) return;

    setApiLoading(true);
    setApiError(null);

    try {
      console.log('🚀 Applying comprehensive filters...');

      const apiFilters = {
        page: currentPage,
        limit: itemsPerPage,
        sort: filters.sortBy
      };

      // Add category filters
      if (filters.categories.length > 0) {
        if (filters.categories.length === 1) {
          apiFilters.category = filters.categories[0];
        } else {
          apiFilters.categories = filters.categories;
        }
      }

      // Add price filters
      if (filters.priceRange.min > 0) {
        apiFilters.minPrice = filters.priceRange.min;
      }
      if (filters.priceRange.max < initialMaxPrice) {
        apiFilters.maxPrice = filters.priceRange.max;
      }

      // Add color filters
      if (filters.colors.length > 0) {
        apiFilters.colors = filters.colors;
      }

      // Add product label filters
      if (filters.productLabels.length > 0) {
        apiFilters.productLabels = filters.productLabels;
      }

      console.log('✅ Final API filters:', apiFilters);

      const result = await fetchProductsWithComprehensiveFilters(apiFilters);
      
      if (result && result.products) {
        setApiProducts(result.products);
        setApiPagination(result.pagination);
        console.log('✅ Products fetched successfully:', result.products.length, 'products');
      } else {
        setApiProducts([]);
        setApiPagination(null);
        console.log('⚠️ No products found with current filters');
      }
    } catch (error) {
      console.error('❌ API filter error:', error);
      setApiError(error.message);
      setApiProducts([]);
    } finally {
      setApiLoading(false);
    }
  }, [store?._id, currentPage, itemsPerPage, filters, initialMaxPrice, fetchProductsWithComprehensiveFilters]);

  // Apply filters when dependencies change - IMPROVED VERSION
  useEffect(() => {
    console.log('🔄 Filter dependencies changed, applying API filters...');
    console.log('📊 Current filters state:', filters);
    console.log('📄 Current page:', currentPage);
    console.log('📦 Items per page:', itemsPerPage);
    
    // Clear previous results immediately when filters change
    setApiProducts([]);
    setApiPagination(null);
    
    // Apply filters with a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      applyAPIFilters();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [applyAPIFilters]);

  // Products to display - IMPROVED VERSION
  const displayProducts = useMemo(() => {
    console.log('🔄 Calculating display products...');
    console.log('📦 API Products count:', apiProducts.length);
    console.log('📦 Context Products count:', products?.length || 0);
    console.log('📦 API Loading:', apiLoading);
    console.log('📦 Products Loading:', productsLoading);
    
    // If we have API products (from filtering), use them
    if (apiProducts.length > 0) {
      console.log('✅ Using API products for display');
      return apiProducts;
    }
    
    // If we're loading API products, show empty array to prevent showing old data
    if (apiLoading) {
      console.log('⏳ API loading, showing empty products');
      return [];
    }
    
    // If we have context products and no API loading, use them as fallback
    if (products && products.length > 0 && !apiLoading) {
      console.log('✅ Using context products as fallback');
      return products;
    }
    
    // Default to empty array
    console.log('⚠️ No products available, showing empty array');
    return [];
  }, [apiProducts, products, apiLoading, productsLoading]);

  // Handle filter changes - IMPROVED VERSION
  const handleFilterChange = (filterType, value, checked = null) => {
    setCurrentPage(1); // Reset to first page when filters change

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
    } else if (filterType === 'color') {
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
    } else if (filterType === 'productLabel') {
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
    } else if (filterType === 'priceRange') {
      setFilters(prev => ({
        ...prev,
        priceRange: value
      }));
    }

    // Force immediate refresh of products
    console.log('🔄 Forcing immediate product refresh...');
    setApiProducts([]); // Clear current products immediately
    setApiPagination(null);
  };

  // Clear all filters - IMPROVED VERSION
  const clearFilters = () => {
    console.log('🧹 Clearing all filters...');
    setFilters({
      priceRange: { min: 0, max: initialMaxPrice },
      categories: [],
      colors: [],
      productLabels: [],
      sortBy: 'newest'
    });
    setCurrentPage(1);
    
    // Force immediate refresh
    setApiProducts([]);
    setApiPagination(null);
  };

  // Loading state
  const isLoading = productsLoading || apiLoading;

  // Error state
  const hasError = productsError || apiError;

  return (
    <div className="enhanced-shop">
      <div className="shop-header">
        <h1>Enhanced Shop with Improved Product Updates</h1>
        <p>Products update continuously when filters change</p>
      </div>

      <div className="shop-content">
        {/* Filter Controls */}
        <div className="filter-controls">
          <h3>Filters</h3>
          
          {/* Category Filter */}
          <div className="filter-group">
            <label>Categories:</label>
            <div className="filter-options">
              {['Electronics', 'Clothing', 'Books'].map(category => (
                <label key={category}>
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={(e) => handleFilterChange('category', category, e.target.checked)}
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div className="filter-group">
            <label>Colors:</label>
            <div className="filter-options">
              {['Red', 'Blue', 'Green', 'Black'].map(color => (
                <label key={color}>
                  <input
                    type="checkbox"
                    checked={filters.colors.includes(color)}
                    onChange={(e) => handleFilterChange('color', color, e.target.checked)}
                  />
                  {color}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-group">
            <label>Price Range:</label>
            <input
              type="range"
              min="0"
              max={initialMaxPrice}
              value={filters.priceRange.max}
              onChange={(e) => handleFilterChange('priceRange', { 
                min: filters.priceRange.min, 
                max: parseInt(e.target.value) 
              })}
            />
            <span>${filters.priceRange.min} - ${filters.priceRange.max}</span>
          </div>

          {/* Clear Filters Button */}
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear All Filters
          </button>
        </div>

        {/* Products Display */}
        <div className="products-section">
          <div className="products-header">
            <h3>Products ({displayProducts.length})</h3>
            {isLoading && <span className="loading-indicator">Loading...</span>}
            {hasError && <span className="error-indicator">Error: {hasError}</span>}
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : hasError ? (
            <div className="error-container">
              <p>Error: {hasError}</p>
              <button onClick={applyAPIFilters}>Retry</button>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try adjusting your filters or clearing them to see all products.</p>
              <button onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className="products-grid">
              {displayProducts.map(product => (
                <div key={product._id} className="product-card">
                  <h4>{product.nameEn || product.nameAr}</h4>
                  <p>Price: ${product.price}</p>
                  <p>Category: {product.category?.nameEn || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Information */}
        <div className="debug-info">
          <h3>Debug Information</h3>
          <div className="debug-grid">
            <div>
              <strong>API Products:</strong> {apiProducts.length}
            </div>
            <div>
              <strong>Context Products:</strong> {products?.length || 0}
            </div>
            <div>
              <strong>Display Products:</strong> {displayProducts.length}
            </div>
            <div>
              <strong>API Loading:</strong> {apiLoading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Products Loading:</strong> {productsLoading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Current Page:</strong> {currentPage}
            </div>
            <div>
              <strong>Items Per Page:</strong> {itemsPerPage}
            </div>
            <div>
              <strong>Active Filters:</strong> {JSON.stringify(filters)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Quick Filter Component
 * Demonstrates immediate filter application
 */
const QuickFilterComponent = () => {
  const [filters, setFilters] = useState({
    categories: [],
    colors: [],
    priceRange: { min: 0, max: 1000 }
  });

  const handleQuickFilter = (filterType, value) => {
    console.log('⚡ Quick filter applied:', filterType, value);
    
    // Immediately clear current products and apply new filter
    setFilters(prev => ({
      ...prev,
      [filterType]: Array.isArray(prev[filterType]) 
        ? [...prev[filterType], value]
        : value
    }));
  };

  return (
    <div className="quick-filters">
      <h3>Quick Filters</h3>
      <div className="quick-filter-buttons">
        <button onClick={() => handleQuickFilter('categories', 'Electronics')}>
          Electronics Only
        </button>
        <button onClick={() => handleQuickFilter('colors', 'Red')}>
          Red Products Only
        </button>
        <button onClick={() => handleQuickFilter('priceRange', { min: 0, max: 100 })}>
          Under $100
        </button>
      </div>
    </div>
  );
};

/**
 * Dynamic Filter Component
 * Shows how filters update in real-time
 */
const DynamicFilterComponent = () => {
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterHistory, setFilterHistory] = useState([]);

  const addFilter = (filter) => {
    const newFilters = [...activeFilters, filter];
    setActiveFilters(newFilters);
    setFilterHistory(prev => [...prev, { 
      timestamp: new Date().toISOString(), 
      action: 'added', 
      filter 
    }]);
  };

  const removeFilter = (filterId) => {
    const newFilters = activeFilters.filter(f => f.id !== filterId);
    setActiveFilters(newFilters);
    setFilterHistory(prev => [...prev, { 
      timestamp: new Date().toISOString(), 
      action: 'removed', 
      filterId 
    }]);
  };

  return (
    <div className="dynamic-filters">
      <h3>Dynamic Filters</h3>
      
      <div className="active-filters">
        <h4>Active Filters:</h4>
        {activeFilters.map(filter => (
          <span key={filter.id} className="filter-tag">
            {filter.label}
            <button onClick={() => removeFilter(filter.id)}>×</button>
          </span>
        ))}
      </div>

      <div className="filter-history">
        <h4>Filter History:</h4>
        {filterHistory.slice(-5).map((entry, index) => (
          <div key={index} className="history-entry">
            <span className="timestamp">{new Date(entry.timestamp).toLocaleTimeString()}</span>
            <span className="action">{entry.action}</span>
            <span className="details">{JSON.stringify(entry.filter || entry.filterId)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export {
  EnhancedShopComponent,
  QuickFilterComponent,
  DynamicFilterComponent
};

export default EnhancedShopComponent;
