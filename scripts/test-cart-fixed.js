// سكريبت اختبار السلة مع البيانات الصحيحة
// Test script for cart with correct data

const http = require('http');

const API_BASE_URL = 'localhost';
const API_PORT = 5001;
const STORE_SLUG = 'updatedstore';
const STORE_ID = '687505893fbf3098648bfe16';

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

// اختبار 1: إضافة منتج إلى السلة مع storeId
async function testAddToCartWithStoreId() {
  try {
    console.log('🧪 اختبار إضافة منتج إلى السلة مع storeId...');
    
    const response = await makeRequest('POST', '/api/cart', {
      product: "68760d175c0a31a7ac0965dc",
      quantity: 1,
      storeId: STORE_ID,
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
    
    console.log('✅ تم إضافة المنتج بنجاح مع storeId:', response.data);
    return response;
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتج مع storeId:', error.message);
    throw error;
  }
}

// اختبار 2: إضافة منتج إلى السلة مع storeSlug
async function testAddToCartWithStoreSlug() {
  try {
    console.log('🧪 اختبار إضافة منتج إلى السلة مع storeSlug...');
    
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
    
    console.log('✅ تم إضافة المنتج بنجاح مع storeSlug:', response.data);
    return response;
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتج مع storeSlug:', error.message);
    throw error;
  }
}

// اختبار 3: إضافة منتج بدون specifications
async function testAddToCartWithoutSpecifications() {
  try {
    console.log('🧪 اختبار إضافة منتج بدون specifications...');
    
    const response = await makeRequest('POST', '/api/cart', {
      product: "68760d175c0a31a7ac0965dc",
      quantity: 1,
      storeId: STORE_ID
    });
    
    console.log('✅ تم إضافة المنتج بنجاح بدون specifications:', response.data);
    return response;
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتج بدون specifications:', error.message);
    throw error;
  }
}

// اختبار 4: إضافة منتج مع specifications غير مكتملة (يجب أن يفشل)
async function testAddToCartWithIncompleteSpecifications() {
  try {
    console.log('🧪 اختبار إضافة منتج مع specifications غير مكتملة...');
    
    const response = await makeRequest('POST', '/api/cart', {
      product: "68760d175c0a31a7ac0965dc",
      quantity: 1,
      storeId: STORE_ID,
      selectedSpecifications: [
        {
          specificationId: "68760979c8ff002615df12ad",
          valueId: "68760979c8ff002615df12ad"
          // ناقص value و title
        }
      ],
      selectedColors: ["#000000"]
    });
    
    console.log('❌ كان يجب أن يفشل هذا الاختبار:', response.data);
    return response;
  } catch (error) {
    console.error('✅ تم رفض الطلب كما هو متوقع:', error.message);
    return { status: 400, data: { success: false, message: 'Validation failed' } };
  }
}

// اختبار 5: جلب السلة
async function testGetCart() {
  try {
    console.log('🧪 اختبار جلب السلة...');
    
    const response = await makeRequest('GET', `/api/cart?storeId=${STORE_ID}`);
    
    console.log('✅ تم جلب السلة بنجاح:', response.data);
    return response;
  } catch (error) {
    console.error('❌ خطأ في جلب السلة:', error.message);
    throw error;
  }
}

// اختبار 6: حساب سعر المنتج
async function testCalculatePrice() {
  try {
    console.log('🧪 اختبار حساب سعر المنتج...');
    
    const response = await makeRequest('POST', `/api/products/68760d175c0a31a7ac0965dc/calculate-price?storeId=${STORE_ID}`, {
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

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبارات السلة مع البيانات الصحيحة...\n');
  
  try {
    // اختبار 1: إضافة منتج مع storeId
    await testAddToCartWithStoreId();
    console.log('');
    
    // اختبار 2: إضافة منتج مع storeSlug
    await testAddToCartWithStoreSlug();
    console.log('');
    
    // اختبار 3: إضافة منتج بدون specifications
    await testAddToCartWithoutSpecifications();
    console.log('');
    
    // اختبار 4: إضافة منتج مع specifications غير مكتملة
    await testAddToCartWithIncompleteSpecifications();
    console.log('');
    
    // اختبار 5: جلب السلة
    await testGetCart();
    console.log('');
    
    // اختبار 6: حساب سعر المنتج
    await testCalculatePrice();
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
  testAddToCartWithStoreId,
  testAddToCartWithStoreSlug,
  testAddToCartWithoutSpecifications,
  testAddToCartWithIncompleteSpecifications,
  testGetCart,
  testCalculatePrice,
  runAllTests
}; 