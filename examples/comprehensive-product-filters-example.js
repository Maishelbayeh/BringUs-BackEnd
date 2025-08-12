/**
 * مثال على كيفية استخدام الفلاتر المتعددة معاً
 * 
 * هذا الملف يوضح كيفية:
 * 1. استخدام فلترة واحدة
 * 2. استخدام عدة فلاتر معاً
 * 3. دمج جميع أنواع الفلاتر
 * 4. أمثلة عملية للاستخدام
 */

const axios = require('axios');

// تكوين API
const API_BASE_URL = 'http://localhost:3000/api';
const STORE_ID = '687505893fbf3098648bfe16'; // استبدل بمعرف المتجر الخاص بك

/**
 * 1. فلترة بمعيار واحد
 */
async function filterBySingleCriteria(criteria, value) {
  try {
    const params = { storeId: STORE_ID };
    params[criteria] = value;

    const response = await axios.get(`${API_BASE_URL}/products`, { params });
    
    console.log(`✅ فلترة بـ ${criteria}:`, response.data);
    return response.data.data;
  } catch (error) {
    console.error(`❌ خطأ في فلترة ${criteria}:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * 2. فلترة بمعيارين معاً
 */
async function filterByTwoCriteria(criteria1, value1, criteria2, value2) {
  try {
    const params = { 
      storeId: STORE_ID,
      [criteria1]: value1,
      [criteria2]: value2
    };

    const response = await axios.get(`${API_BASE_URL}/products`, { params });
    
    console.log(`✅ فلترة بـ ${criteria1} و ${criteria2}:`, response.data);
    return response.data.data;
  } catch (error) {
    console.error(`❌ خطأ في فلترة ${criteria1} و ${criteria2}:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * 3. فلترة شاملة بجميع المعايير
 */
async function comprehensiveFilter(options = {}) {
  try {
    const params = { storeId: STORE_ID };

    // إضافة جميع الفلاتر المتاحة
    if (options.category) params.category = options.category;
    if (options.minPrice) params.minPrice = options.minPrice;
    if (options.maxPrice) params.maxPrice = options.maxPrice;
    if (options.search) params.search = options.search;
    if (options.colors) params.colors = options.colors;
    if (options.productLabels) params.productLabels = options.productLabels;
    if (options.sort) params.sort = options.sort;
    if (options.page) params.page = options.page;
    if (options.limit) params.limit = options.limit;

    const response = await axios.get(`${API_BASE_URL}/products`, { params });
    
    console.log('✅ فلترة شاملة:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في الفلترة الشاملة:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 4. فلترة المنتجات بدون variants بمعايير متعددة
 */
async function filterWithoutVariants(options = {}) {
  try {
    const params = {};

    // إضافة جميع الفلاتر المتاحة
    if (options.category) params.category = options.category;
    if (options.minPrice) params.minPrice = options.minPrice;
    if (options.maxPrice) params.maxPrice = options.maxPrice;
    if (options.search) params.search = options.search;
    if (options.colors) params.colors = options.colors;
    if (options.productLabels) params.productLabels = options.productLabels;
    if (options.sort) params.sort = options.sort;
    if (options.page) params.page = options.page;
    if (options.limit) params.limit = options.limit;

    const response = await axios.get(`${API_BASE_URL}/products/${STORE_ID}/without-variants`, { params });
    
    console.log('✅ فلترة بدون variants:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في فلترة بدون variants:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 5. عرض نتائج الفلترة
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
      console.log(`   🎨 الألوان: ${product.colors ? JSON.stringify(product.colors) : 'غير محدد'}`);
      console.log(`   🏷️ العلامات: ${product.productLabels?.map(label => label.nameEn).join(', ') || 'غير محدد'}`);
      console.log('');
    });
  } else {
    console.log('❌ لا توجد منتجات تطابق المعايير');
  }
}

/**
 * 6. أمثلة عملية للاستخدام
 */
async function runExamples() {
  console.log('🚀 بدء أمثلة الفلاتر المتعددة...\n');

  // مثال 1: فلترة بفئة واحدة
  console.log('1️⃣ فلترة بفئة واحدة:');
  const categoryProducts = await filterBySingleCriteria('category', '507f1f77bcf86cd799439011');
  if (categoryProducts) {
    displayFilterResults(categoryProducts, 'فئة واحدة');
  }

  // مثال 2: فلترة بالسعر
  console.log('\n2️⃣ فلترة بالسعر:');
  const priceProducts = await filterBySingleCriteria('minPrice', 100);
  if (priceProducts) {
    displayFilterResults(priceProducts, 'السعر');
  }

  // مثال 3: فلترة بفئة وسعر معاً
  console.log('\n3️⃣ فلترة بفئة وسعر معاً:');
  const categoryPriceProducts = await filterByTwoCriteria('category', '507f1f77bcf86cd799439011', 'minPrice', 100);
  if (categoryPriceProducts) {
    displayFilterResults(categoryPriceProducts, 'فئة + سعر');
  }

  // مثال 4: فلترة شاملة
  console.log('\n4️⃣ فلترة شاملة:');
  const comprehensiveProducts = await comprehensiveFilter({
    category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012', // فئات متعددة
    minPrice: 50,
    maxPrice: 500,
    search: 'phone',
    colors: ['#FF0000', '#000000'],
    productLabels: ['507f1f77bcf86cd799439013'],
    sort: 'price_asc',
    limit: 5
  });
  if (comprehensiveProducts) {
    displayFilterResults(comprehensiveProducts, 'شاملة');
  }

  // مثال 5: فلترة بدون variants
  console.log('\n5️⃣ فلترة بدون variants:');
  const withoutVariantsProducts = await filterWithoutVariants({
    category: '507f1f77bcf86cd799439011',
    minPrice: 100,
    maxPrice: 1000,
    sort: 'newest',
    limit: 10
  });
  if (withoutVariantsProducts) {
    displayFilterResults(withoutVariantsProducts, 'بدون variants');
  }

  console.log('\n✅ تم الانتهاء من الأمثلة بنجاح!');
}

/**
 * 7. أمثلة متقدمة للاستخدام
 */
async function advancedExamples() {
  console.log('\n🚀 أمثلة متقدمة للفلاتر...\n');

  // مثال 1: البحث مع فلترة السعر
  console.log('🔍 البحث مع فلترة السعر:');
  const searchPriceProducts = await comprehensiveFilter({
    search: 'samsung',
    minPrice: 200,
    maxPrice: 1000,
    sort: 'price_desc'
  });
  if (searchPriceProducts) {
    displayFilterResults(searchPriceProducts, 'البحث + السعر');
  }

  // مثال 2: فلترة الألوان مع العلامات
  console.log('\n🎨 فلترة الألوان مع العلامات:');
  const colorLabelProducts = await comprehensiveFilter({
    colors: ['#FF0000', '#00FF00'],
    productLabels: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    sort: 'name_asc'
  });
  if (colorLabelProducts) {
    displayFilterResults(colorLabelProducts, 'الألوان + العلامات');
  }

  // مثال 3: فلترة متعددة الفئات مع السعر
  console.log('\n📂 فلترة متعددة الفئات مع السعر:');
  const multiCategoryPriceProducts = await comprehensiveFilter({
    category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012||507f1f77bcf86cd799439013',
    minPrice: 100,
    maxPrice: 500,
    sort: 'rating_desc',
    limit: 15
  });
  if (multiCategoryPriceProducts) {
    displayFilterResults(multiCategoryPriceProducts, 'فئات متعددة + سعر');
  }

  // مثال 4: فلترة شاملة مع pagination
  console.log('\n📄 فلترة شاملة مع pagination:');
  const paginatedProducts = await comprehensiveFilter({
    category: '507f1f77bcf86cd799439011',
    minPrice: 50,
    search: 'phone',
    sort: 'newest',
    page: 1,
    limit: 3
  });
  if (paginatedProducts) {
    displayFilterResults(paginatedProducts, 'شاملة + pagination');
  }
}

/**
 * 8. أمثلة للاستخدام العملي
 */
async function practicalExamples() {
  console.log('\n🛒 أمثلة للاستخدام العملي...\n');

  // مثال 1: البحث عن هواتف سامسونج حمراء
  console.log('📱 البحث عن هواتف سامسونج حمراء:');
  const samsungRedPhones = await comprehensiveFilter({
    search: 'samsung',
    colors: ['#FF0000'],
    category: '507f1f77bcf86cd799439011', // فئة الهواتف
    sort: 'price_asc'
  });
  if (samsungRedPhones) {
    displayFilterResults(samsungRedPhones, 'هواتف سامسونج حمراء');
  }

  // مثال 2: منتجات جديدة بأسعار معقولة
  console.log('\n🆕 منتجات جديدة بأسعار معقولة:');
  const newAffordableProducts = await comprehensiveFilter({
    minPrice: 50,
    maxPrice: 200,
    sort: 'newest',
    limit: 10
  });
  if (newAffordableProducts) {
    displayFilterResults(newAffordableProducts, 'منتجات جديدة بأسعار معقولة');
  }

  // مثال 3: منتجات مخفضة في فئات محددة
  console.log('\n🏷️ منتجات مخفضة في فئات محددة:');
  const discountedProducts = await comprehensiveFilter({
    category: '507f1f77bcf86cd799439011||507f1f77bcf86cd799439012',
    productLabels: ['507f1f77bcf86cd799439013'], // علامة التخفيض
    sort: 'price_asc',
    limit: 20
  });
  if (discountedProducts) {
    displayFilterResults(discountedProducts, 'منتجات مخفضة');
  }
}

// تشغيل الأمثلة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runExamples()
    .then(() => advancedExamples())
    .then(() => practicalExamples())
    .catch(console.error);
}

module.exports = {
  filterBySingleCriteria,
  filterByTwoCriteria,
  comprehensiveFilter,
  filterWithoutVariants,
  displayFilterResults,
  runExamples,
  advancedExamples,
  practicalExamples
};
