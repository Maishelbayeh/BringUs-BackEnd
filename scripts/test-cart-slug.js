// سكريبت اختبار السلة مع الـ slug
// Test script for cart with slug functionality

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';
const STORE_SLUG = 'updatedstore';

// اختبار إضافة منتج إلى السلة
async function testAddToCart() {
  try {
    console.log('🧪 اختبار إضافة منتج إلى السلة...');
    
    const response = await axios.post(`${API_BASE_URL}/cart`, {
      product: "68760d175c0a31a7ac0965dc",
      quantity: 1,
      storeSlug: STORE_SLUG,
      selectedSpecifications: [
        {
          specificationId: "68760979c8ff002615df12ad",
          valueId: "68760979c8ff002615df12ad",
          value: "قيمة تجريبية",
          title: "صفة تجريبية"
        }
      ],
      selectedColors: ["#000000"],
      specificationsPrice: 10,
      colorsPrice: 5
    });
    
    console.log('✅ تم إضافة المنتج بنجاح:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتج:', error.response?.data || error.message);
    console.error('📋 تفاصيل الخطأ:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
}

// اختبار جلب السلة
async function testGetCart() {
  try {
    console.log('🧪 اختبار جلب السلة...');
    
    const response = await axios.get(`${API_BASE_URL}/cart?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم جلب السلة بنجاح:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في جلب السلة:', error.response?.data || error.message);
    throw error;
  }
}

// اختبار حساب سعر المنتج
async function testCalculatePrice() {
  try {
    console.log('🧪 اختبار حساب سعر المنتج...');
    
    const response = await axios.post(`${API_BASE_URL}/products/68760d175c0a31a7ac0965dc/calculate-price?storeSlug=${STORE_SLUG}`, {
      selectedSpecifications: [
        {
          specificationId: "68760979c8ff002615df12ad",
          valueId: "68760979c8ff002615df12ad",
          value: "قيمة تجريبية"
        }
      ],
      selectedColors: ["#000000"]
    });
    
    console.log('✅ تم حساب السعر بنجاح:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في حساب السعر:', error.response?.data || error.message);
    throw error;
  }
}

// اختبار جلب خيارات المنتج
async function testGetProductOptions() {
  try {
    console.log('🧪 اختبار جلب خيارات المنتج...');
    
    const response = await axios.get(`${API_BASE_URL}/products/68760d175c0a31a7ac0965dc/options?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم جلب خيارات المنتج بنجاح:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في جلب خيارات المنتج:', error.response?.data || error.message);
    throw error;
  }
}

// اختبار إضافة إعجاب
async function testLikeProduct() {
  try {
    console.log('🧪 اختبار إضافة إعجاب...');
    
    const response = await axios.post(`${API_BASE_URL}/likes/68760d175c0a31a7ac0965dc?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم إضافة الإعجاب بنجاح:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في إضافة الإعجاب:', error.response?.data || error.message);
    throw error;
  }
}

// اختبار جلب المنتجات المعجبة
async function testGetLikedProducts() {
  try {
    console.log('🧪 اختبار جلب المنتجات المعجبة...');
    
    const response = await axios.get(`${API_BASE_URL}/likes?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم جلب المنتجات المعجبة بنجاح:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في جلب المنتجات المعجبة:', error.response?.data || error.message);
    throw error;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبارات السلة مع الـ slug...\n');
  
  try {
    // اختبار 1: حساب سعر المنتج
    await testCalculatePrice();
    console.log('');
    
    // اختبار 2: جلب خيارات المنتج
    await testGetProductOptions();
    console.log('');
    
    // اختبار 3: إضافة منتج إلى السلة
    await testAddToCart();
    console.log('');
    
    // اختبار 4: جلب السلة
    await testGetCart();
    console.log('');
    
    // اختبار 5: إضافة إعجاب
    await testLikeProduct();
    console.log('');
    
    // اختبار 6: جلب المنتجات المعجبة
    await testGetLikedProducts();
    console.log('');
    
    console.log('🎉 تم إكمال جميع الاختبارات بنجاح!');
    
  } catch (error) {
    console.error('💥 فشل في أحد الاختبارات:', error.message);
  }
}

// تشغيل الاختبارات إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAddToCart,
  testGetCart,
  testCalculatePrice,
  testGetProductOptions,
  testLikeProduct,
  testGetLikedProducts,
  runAllTests
}; 