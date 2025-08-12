/**
 * مثال على كيفية استخدام النظام الهرمي للفئات
 * 
 * هذا الملف يوضح كيفية:
 * 1. الحصول على قائمة الفئات الهرمية
 * 2. الحصول على الفئات الفرعية لفئة معينة
 * 3. إنشاء فئات هرمية
 */

const axios = require('axios');

// تكوين API
const API_BASE_URL = 'http://localhost:3000/api';
const STORE_ID = '687505893fbf3098648bfe16'; // استبدل بمعرف المتجر الخاص بك

/**
 * 1. الحصول على قائمة الفئات الهرمية (رابط القائمة)
 */
async function getCategoryList() {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories/list`, {
      params: { storeId: STORE_ID }
    });
    
    console.log('✅ قائمة الفئات الهرمية:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في الحصول على قائمة الفئات:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 2. الحصول على الفئات الفرعية لفئة معينة
 */
async function getCategoriesByParent(parentId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories/by-parent`, {
      params: { 
        storeId: STORE_ID,
        parentId: parentId
      }
    });
    
    console.log('✅ الفئات الفرعية:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في الحصول على الفئات الفرعية:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 3. إنشاء فئة جديدة
 */
async function createCategory(categoryData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/categories`, categoryData);
    
    console.log('✅ تم إنشاء الفئة بنجاح:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في إنشاء الفئة:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 4. إنشاء فئات هرمية مثال
 */
async function createHierarchicalCategories() {
  console.log('🌳 إنشاء فئات هرمية مثال...\n');

  // 1. إنشاء الفئة الرئيسية - الإلكترونيات
  const electronics = await createCategory({
    nameAr: 'الإلكترونيات',
    nameEn: 'Electronics',
    descriptionAr: 'جميع المنتجات الإلكترونية',
    descriptionEn: 'All electronic products',
    store: STORE_ID,
    isActive: true,
    sortOrder: 1
  });

  if (!electronics) {
    console.log('❌ فشل في إنشاء فئة الإلكترونيات');
    return;
  }

  // 2. إنشاء فئات فرعية للإلكترونيات
  const phones = await createCategory({
    nameAr: 'الهواتف',
    nameEn: 'Phones',
    descriptionAr: 'الهواتف الذكية والجوالة',
    descriptionEn: 'Smartphones and mobile phones',
    parent: electronics._id,
    store: STORE_ID,
    isActive: true,
    sortOrder: 1
  });

  const laptops = await createCategory({
    nameAr: 'الحواسيب المحمولة',
    nameEn: 'Laptops',
    descriptionAr: 'الحواسيب المحمولة واللابتوب',
    descriptionEn: 'Laptops and notebooks',
    parent: electronics._id,
    store: STORE_ID,
    isActive: true,
    sortOrder: 2
  });

  // 3. إنشاء فئات فرعية للهواتف
  const smartphones = await createCategory({
    nameAr: 'الهواتف الذكية',
    nameEn: 'Smartphones',
    descriptionAr: 'الهواتف الذكية الحديثة',
    descriptionEn: 'Modern smartphones',
    parent: phones._id,
    store: STORE_ID,
    isActive: true,
    sortOrder: 1
  });

  const accessories = await createCategory({
    nameAr: 'ملحقات الهواتف',
    nameEn: 'Phone Accessories',
    descriptionAr: 'ملحقات وقطع غيار الهواتف',
    descriptionEn: 'Phone accessories and spare parts',
    parent: phones._id,
    store: STORE_ID,
    isActive: true,
    sortOrder: 2
  });

  // 4. إنشاء فئة رئيسية أخرى - الملابس
  const clothing = await createCategory({
    nameAr: 'الملابس',
    nameEn: 'Clothing',
    descriptionAr: 'جميع أنواع الملابس',
    descriptionEn: 'All types of clothing',
    store: STORE_ID,
    isActive: true,
    sortOrder: 2
  });

  // 5. إنشاء فئات فرعية للملابس
  const mensClothing = await createCategory({
    nameAr: 'ملابس الرجال',
    nameEn: 'Men\'s Clothing',
    descriptionAr: 'ملابس خاصة بالرجال',
    descriptionEn: 'Clothing for men',
    parent: clothing._id,
    store: STORE_ID,
    isActive: true,
    sortOrder: 1
  });

  const womensClothing = await createCategory({
    nameAr: 'ملابس النساء',
    nameEn: 'Women\'s Clothing',
    descriptionAr: 'ملابس خاصة بالنساء',
    descriptionEn: 'Clothing for women',
    parent: clothing._id,
    store: STORE_ID,
    isActive: true,
    sortOrder: 2
  });

  console.log('✅ تم إنشاء الفئات الهرمية بنجاح!');
  
  return {
    electronics,
    phones,
    laptops,
    smartphones,
    accessories,
    clothing,
    mensClothing,
    womensClothing
  };
}

/**
 * 5. عرض الفئات الهرمية
 */
function displayHierarchicalCategories(categories) {
  console.log('\n📋 عرض الفئات الهرمية:');
  console.log('========================');
  
  categories.forEach(category => {
    const indent = '  '.repeat(category.level);
    const hasChildren = category.hasChildren ? ' (📁)' : ' (📄)';
    console.log(`${indent}${category.nameEn}${hasChildren}`);
  });
}

/**
 * 6. عرض الفئات الفرعية
 */
function displaySubcategories(data) {
  console.log(`\n📁 الفئات الفرعية لـ: ${data.parent.nameEn}`);
  console.log('=====================================');
  console.log(`📊 عدد الفئات الفرعية المباشرة: ${data.directChildren}`);
  console.log(`📊 إجمالي الفئات الفرعية: ${data.totalSubcategories}`);
  console.log('');
  
  data.categories.forEach(category => {
    const indent = '  '.repeat(category.level);
    const type = category.isDirectChild ? '📁' : '📄';
    console.log(`${indent}${type} ${category.nameEn} (مستوى: ${category.level})`);
  });
}

/**
 * مثال على الاستخدام
 */
async function runExample() {
  console.log('🚀 بدء مثال الفئات الهرمية...\n');

  // 1. إنشاء فئات هرمية مثال
  console.log('1️⃣ إنشاء فئات هرمية مثال:');
  const createdCategories = await createHierarchicalCategories();
  
  if (!createdCategories) {
    console.log('❌ فشل في إنشاء الفئات، توقف المثال');
    return;
  }

  // انتظار قليلاً للتأكد من حفظ الفئات
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 2. الحصول على قائمة الفئات الهرمية
  console.log('\n2️⃣ الحصول على قائمة الفئات الهرمية:');
  const categoryList = await getCategoryList();
  
  if (categoryList) {
    displayHierarchicalCategories(categoryList);
  }

  // 3. الحصول على الفئات الفرعية للإلكترونيات
  console.log('\n3️⃣ الحصول على الفئات الفرعية للإلكترونيات:');
  const electronicsSubcategories = await getCategoriesByParent(createdCategories.electronics._id);
  
  if (electronicsSubcategories) {
    displaySubcategories(electronicsSubcategories);
  }

  // 4. الحصول على الفئات الفرعية للهواتف
  console.log('\n4️⃣ الحصول على الفئات الفرعية للهواتف:');
  const phonesSubcategories = await getCategoriesByParent(createdCategories.phones._id);
  
  if (phonesSubcategories) {
    displaySubcategories(phonesSubcategories);
  }

  console.log('\n✅ تم الانتهاء من المثال بنجاح!');
}

// تشغيل المثال إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runExample().catch(console.error);
}

module.exports = {
  getCategoryList,
  getCategoriesByParent,
  createCategory,
  createHierarchicalCategories,
  displayHierarchicalCategories,
  displaySubcategories
};

