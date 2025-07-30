// سكريبت اختبار السلة مع الـ slug (بدون axios)
// Test script for cart with slug functionality (without axios)

const http = require('http');

const API_BASE_URL = 'localhost';
const API_PORT = 5001;
const STORE_SLUG = 'updatedstore';

// دالة مساعدة لإرسال طلبات HTTP
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE_URL,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// اختبار إضافة منتج إلى السلة
async function testAddToCart() {
  try {
    console.log('🧪 اختبار إضافة منتج إلى السلة...');
    
    const response = await makeRequest('POST', '/api/cart', {
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
    return response;
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتج:', error.message);
    throw error;
  }
}

// اختبار جلب السلة
async function testGetCart() {
  try {
    console.log('🧪 اختبار جلب السلة...');
    
    const response = await makeRequest('GET', `/api/cart?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم جلب السلة بنجاح:', response.data);
    return response;
  } catch (error) {
    console.error('❌ خطأ في جلب السلة:', error.message);
    throw error;
  }
}

// اختبار حساب سعر المنتج
async function testCalculatePrice() {
  try {
    console.log('🧪 اختبار حساب سعر المنتج...');
    
    const response = await makeRequest('POST', `/api/products/68760d175c0a31a7ac0965dc/calculate-price?storeSlug=${STORE_SLUG}`, {
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
    return response;
  } catch (error) {
    console.error('❌ خطأ في حساب السعر:', error.message);
    throw error;
  }
}

// اختبار جلب خيارات المنتج
async function testGetProductOptions() {
  try {
    console.log('🧪 اختبار جلب خيارات المنتج...');
    
    const response = await makeRequest('GET', `/api/products/68760d175c0a31a7ac0965dc/options?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم جلب خيارات المنتج بنجاح:', response.data);
    return response;
  } catch (error) {
    console.error('❌ خطأ في جلب خيارات المنتج:', error.message);
    throw error;
  }
}

// اختبار إضافة إعجاب
async function testLikeProduct() {
  try {
    console.log('🧪 اختبار إضافة إعجاب...');
    
    const response = await makeRequest('POST', `/api/likes/68760d175c0a31a7ac0965dc?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم إضافة الإعجاب بنجاح:', response.data);
    return response;
  } catch (error) {
    console.error('❌ خطأ في إضافة الإعجاب:', error.message);
    throw error;
  }
}

// اختبار جلب المنتجات المعجبة
async function testGetLikedProducts() {
  try {
    console.log('🧪 اختبار جلب المنتجات المعجبة...');
    
    const response = await makeRequest('GET', `/api/likes?storeSlug=${STORE_SLUG}`);
    
    console.log('✅ تم جلب المنتجات المعجبة بنجاح:', response.data);
    return response;
  } catch (error) {
    console.error('❌ خطأ في جلب المنتجات المعجبة:', error.message);
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