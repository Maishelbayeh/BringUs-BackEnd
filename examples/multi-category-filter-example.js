/**
 * مثال على كيفية استخدام فلترة الفئات المتعددة
 * 
 * هذا الملف يوضح كيفية:
 * 1. فلترة المنتجات بفئة واحدة
 * 2. فلترة المنتجات بعدة فئات معاً (OR)
 * 3. دمج فلترة الفئات مع فلاتر أخرى
 */

const axios = require('axios');

// تكوين API
const API_BASE_URL = 'http://localhost:3000/api';
const STORE_ID = '687505893fbf3098648bfe16'; // استبدل بمعرف المتجر الخاص بك

/**
 * 1. فلترة المنتجات بفئة واحدة
 */
async function filterBySingleCategory(categoryId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`, {
      params: { 
        storeId: STORE_ID,
        category: categoryId,
        limit: 10
      }
    });
    
    console.log('✅ المنتجات في الفئة الواحدة:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في فلترة الفئة الواحدة:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 2. فلترة المنتجات بعدة فئات معاً (OR)
 */
async function filterByMultipleCategories(categoryIds) {
  try {
    // دمج معرفات الفئات بـ ||
    const categoryFilter = categoryIds.join('||');
    
    const response = await axios.get(`${API_BASE_URL}/products`, {
      params: { 
        storeId: STORE_ID,
        category: categoryFilter,
        limit: 10
      }
    });
    
    console.log('✅ المنتجات في الفئات المتعددة:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في فلترة الفئات المتعددة:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 3. فلترة المنتجات بدون variants بفئات متعددة
 */
async function filterWithoutVariantsByMultipleCategories(categoryIds) {
  try {
    // دمج معرفات الفئات بـ ||
    const categoryFilter = categoryIds.join('||');
    
    const response = await axios.get(`${API_BASE_URL}/products/${STORE_ID}/without-variants`, {
      params: { 
        category: categoryFilter,
        limit: 10
      }
    });
    
    console.log('✅ المنتجات بدون variants في الفئات المتعددة:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في فلترة المنتجات بدون variants:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 4. دمج فلترة الفئات مع فلاتر أخرى
 */
async function filterWithMultipleConditions(categoryIds, options = {}) {
  try {
    const params = {
      storeId: STORE_ID,
      limit: options.limit || 10,
      page: options.page || 1
    };

    // إضافة فلترة الفئات
    if (categoryIds && categoryIds.length > 0) {
      params.category = categoryIds.join('||');
    }

    // إضافة فلاتر أخرى
    if (options.minPrice) params.minPrice = options.minPrice;
    if (options.maxPrice) params.maxPrice = options.maxPrice;
    if (options.sort) params.sort = options.sort;
    if (options.search) params.search = options.search;
    if (options.colors) params.colors = options.colors;
    if (options.productLabels) params.productLabels = options.productLabels;

    const response = await axios.get(`${API_BASE_URL}/products`, { params });
    
    console.log('✅ المنتجات مع الفلاتر المتعددة:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في الفلترة المتعددة:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 5. الحصول على معرفات الفئات للاختبار
 */
async function getCategoryIds() {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`, {
      params: { storeId: STORE_ID }
    });
    
    const categories = response.data.data;
    console.log('📋 الفئات المتاحة:', categories.map(cat => ({
      id: cat._id,
      nameAr: cat.nameAr,
      nameEn: cat.nameEn
    })));
    
    return categories.map(cat => cat._id);
  } catch (error) {
    console.error('❌ خطأ في الحصول على الفئات:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 6. عرض نتائج الفلترة
 */
function displayFilterResults(products, filterType) {
  console.log(`\n📊 نتائج فلترة: ${filterType}`);
  console.log('=====================================');
  console.log(`📦 عدد المنتجات: ${products.length}`);
  
  if (products.length > 0) {
    console.log('\n🏷️ المنتجات:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.nameEn} - ${product.nameAr}`);
      console.log(`   💰 السعر: ${product.price || product.finalPrice}`);
      console.log(`   📂 الفئة: ${product.category?.nameEn || 'غير محدد'}`);
      console.log(`   🏪 المتجر: ${product.store?.name || 'غير محدد'}`);
      console.log('');
    });
  } else {
    console.log('❌ لا توجد منتجات تطابق المعايير');
  }
}

/**
 * مثال على الاستخدام
 */
async function runExample() {
  console.log('🚀 بدء مثال فلترة الفئات المتعددة...\n');

  // 1. الحصول على معرفات الفئات
  console.log('1️⃣ الحصول على معرفات الفئات:');
  const categoryIds = await getCategoryIds();
  
  if (categoryIds.length < 2) {
    console.log('❌ نحتاج إلى فئتين على الأقل للاختبار');
    return;
  }

  // استخدام أول فئتين للاختبار
  const category1 = categoryIds[0];
  const category2 = categoryIds[1];

  // 2. فلترة بفئة واحدة
  console.log('\n2️⃣ فلترة بفئة واحدة:');
  const singleCategoryProducts = await filterBySingleCategory(category1);
  if (singleCategoryProducts) {
    displayFilterResults(singleCategoryProducts, 'فئة واحدة');
  }

  // 3. فلترة بفئتين معاً
  console.log('\n3️⃣ فلترة بفئتين معاً:');
  const multipleCategoryProducts = await filterByMultipleCategories([category1, category2]);
  if (multipleCategoryProducts) {
    displayFilterResults(multipleCategoryProducts, 'فئتين معاً');
  }

  // 4. فلترة بدون variants بفئات متعددة
  console.log('\n4️⃣ فلترة بدون variants بفئات متعددة:');
  const withoutVariantsProducts = await filterWithoutVariantsByMultipleCategories([category1, category2]);
  if (withoutVariantsProducts) {
    displayFilterResults(withoutVariantsProducts, 'بدون variants - فئات متعددة');
  }

  // 5. فلترة مع شروط متعددة
  console.log('\n5️⃣ فلترة مع شروط متعددة:');
  const complexFilterProducts = await filterWithMultipleConditions([category1, category2], {
    minPrice: 10,
    maxPrice: 1000,
    sort: 'price_asc',
    limit: 5
  });
  if (complexFilterProducts) {
    displayFilterResults(complexFilterProducts, 'شروط متعددة');
  }

  console.log('\n✅ تم الانتهاء من المثال بنجاح!');
}

// تشغيل المثال إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runExample().catch(console.error);
}

module.exports = {
  filterBySingleCategory,
  filterByMultipleCategories,
  filterWithoutVariantsByMultipleCategories,
  filterWithMultipleConditions,
  getCategoryIds,
  displayFilterResults
};
