// مثال على استخدام السلة مع الـ slug للمستخدمين غير المسجلين
// Cart with Store Slug Example for Guest Users

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
const STORE_SLUG = 'my-store'; // استبدل بslug المتجر الفعلي

// مثال 1: إضافة منتج إلى السلة باستخدام الـ slug (للمستخدمين غير المسجلين)
async function addToCartWithSlug() {
  try {
    const productId = '507f1f77bcf86cd799439011'; // استبدل بمعرف المنتج الفعلي
    
    const response = await axios.post(`${API_BASE_URL}/cart?storeSlug=${STORE_SLUG}`, {
      product: productId,
      quantity: 2,
      selectedSpecifications: [
        {
          specificationId: '507f1f77bcf86cd799439013',
          valueId: '507f1f77bcf86cd799439014',
          value: 'أحمر',
          title: 'اللون'
        }
      ],
      selectedColors: ['#FF0000'],
      specificationsPrice: 10,
      colorsPrice: 5
    });
    
    console.log('✅ تم إضافة المنتج إلى السلة باستخدام الـ slug:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتج إلى السلة:', error.response?.data || error.message);
  }
}

// مثال 2: جلب السلة باستخدام الـ slug
async function getCartWithSlug() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cart?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ محتويات السلة باستخدام الـ slug:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في جلب السلة:', error.response?.data || error.message);
  }
}

// مثال 3: تحديث عنصر في السلة باستخدام الـ slug
async function updateCartItemWithSlug() {
  try {
    const productId = '507f1f77bcf86cd799439011';
    
    const response = await axios.put(`${API_BASE_URL}/cart/${productId}?storeSlug=${STORE_SLUG}`, {
      quantity: 3,
      selectedSpecifications: [
        {
          specificationId: '507f1f77bcf86cd799439013',
          valueId: '507f1f77bcf86cd799439017',
          value: 'أزرق',
          title: 'اللون'
        }
      ],
      selectedColors: ['#0000FF'],
      specificationsPrice: 15,
      colorsPrice: 8
    });
    
    console.log('✅ تم تحديث العنصر في السلة باستخدام الـ slug:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في تحديث العنصر في السلة:', error.response?.data || error.message);
  }
}

// مثال 4: حذف عنصر من السلة باستخدام الـ slug
async function removeCartItemWithSlug() {
  try {
    const productId = '507f1f77bcf86cd799439011';
    
    const response = await axios.delete(`${API_BASE_URL}/cart/${productId}?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم حذف العنصر من السلة باستخدام الـ slug:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في حذف العنصر من السلة:', error.response?.data || error.message);
  }
}

// مثال 5: مسح السلة بالكامل باستخدام الـ slug
async function clearCartWithSlug() {
  try {
    const response = await axios.delete(`${API_BASE_URL}/cart?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم مسح السلة بالكامل باستخدام الـ slug:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في مسح السلة:', error.response?.data || error.message);
  }
}

// مثال 6: إضافة إعجاب لمنتج باستخدام الـ slug
async function likeProductWithSlug() {
  try {
    const productId = '507f1f77bcf86cd799439011';
    
    const response = await axios.post(`${API_BASE_URL}/likes/${productId}?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم إضافة الإعجاب للمنتج باستخدام الـ slug:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في إضافة الإعجاب:', error.response?.data || error.message);
  }
}

// مثال 7: جلب المنتجات المعجبة باستخدام الـ slug
async function getLikedProductsWithSlug() {
  try {
    const response = await axios.get(`${API_BASE_URL}/likes?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ المنتجات المعجبة باستخدام الـ slug:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في جلب المنتجات المعجبة:', error.response?.data || error.message);
  }
}

// مثال 8: حساب سعر المنتج مع الصفات والألوان باستخدام الـ slug
async function calculateProductPriceWithSlug() {
  try {
    const productId = '507f1f77bcf86cd799439011';
    
    const response = await axios.post(`${API_BASE_URL}/products/${productId}/calculate-price?storeSlug=${STORE_SLUG}`, {
      selectedSpecifications: [
        {
          specificationId: '507f1f77bcf86cd799439013',
          valueId: '507f1f77bcf86cd799439014',
          value: 'أحمر'
        }
      ],
      selectedColors: ['#FF0000']
    });
    
    console.log('✅ السعر المحسوب باستخدام الـ slug:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في حساب السعر:', error.response?.data || error.message);
  }
}

// مثال 9: جلب خيارات المنتج باستخدام الـ slug
async function getProductOptionsWithSlug() {
  try {
    const productId = '507f1f77bcf86cd799439011';
    
    const response = await axios.get(`${API_BASE_URL}/products/${productId}/options?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ خيارات المنتج باستخدام الـ slug:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في جلب خيارات المنتج:', error.response?.data || error.message);
  }
}

// مثال 10: مقارنة استخدام الـ slug مع الـ storeId
async function compareSlugVsStoreId() {
  try {
    const productId = '507f1f77bcf86cd799439011';
    const storeId = '507f1f77bcf86cd799439012'; // استبدل بمعرف المتجر الفعلي
    
    console.log('🔍 مقارنة استخدام الـ slug مع الـ storeId:');
    
    // استخدام الـ slug
    const slugResponse = await axios.get(`${API_BASE_URL}/cart?storeSlug=${STORE_SLUG}`);
    console.log('✅ السلة باستخدام الـ slug:', slugResponse.data.success);
    
    // استخدام الـ storeId
    const storeIdResponse = await axios.get(`${API_BASE_URL}/cart?storeId=${storeId}`);
    console.log('✅ السلة باستخدام الـ storeId:', storeIdResponse.data.success);
    
    // التحقق من أن النتائج متطابقة
    const isSame = JSON.stringify(slugResponse.data) === JSON.stringify(storeIdResponse.data);
    console.log('🔍 النتائج متطابقة:', isSame);
    
  } catch (error) {
    console.error('❌ خطأ في المقارنة:', error.response?.data || error.message);
  }
}

// تشغيل الأمثلة
async function runExamples() {
  console.log('=== أمثلة على استخدام السلة مع الـ slug للمستخدمين غير المسجلين ===\n');
  
  console.log('1. إضافة منتج إلى السلة باستخدام الـ slug:');
  await addToCartWithSlug();
  
  console.log('\n2. جلب السلة باستخدام الـ slug:');
  await getCartWithSlug();
  
  console.log('\n3. تحديث عنصر في السلة باستخدام الـ slug:');
  await updateCartItemWithSlug();
  
  console.log('\n4. حذف عنصر من السلة باستخدام الـ slug:');
  await removeCartItemWithSlug();
  
  console.log('\n5. مسح السلة بالكامل باستخدام الـ slug:');
  await clearCartWithSlug();
  
  console.log('\n6. إضافة إعجاب لمنتج باستخدام الـ slug:');
  await likeProductWithSlug();
  
  console.log('\n7. جلب المنتجات المعجبة باستخدام الـ slug:');
  await getLikedProductsWithSlug();
  
  console.log('\n8. حساب سعر المنتج مع الصفات والألوان باستخدام الـ slug:');
  await calculateProductPriceWithSlug();
  
  console.log('\n9. جلب خيارات المنتج باستخدام الـ slug:');
  await getProductOptionsWithSlug();
  
  console.log('\n10. مقارنة استخدام الـ slug مع الـ storeId:');
  await compareSlugVsStoreId();
}

// تشغيل الأمثلة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runExamples();
}

module.exports = {
  addToCartWithSlug,
  getCartWithSlug,
  updateCartItemWithSlug,
  removeCartItemWithSlug,
  clearCartWithSlug,
  likeProductWithSlug,
  getLikedProductsWithSlug,
  calculateProductPriceWithSlug,
  getProductOptionsWithSlug,
  compareSlugVsStoreId
}; 