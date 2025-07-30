// مثال على استخدام النظام الجديد للمستخدمين غير المسجلين
// Guest User Example

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
const STORE_ID = '507f1f77bcf86cd799439012'; // استبدل بمعرف المتجر الفعلي

// مثال 1: إضافة منتج إلى السلة (مستخدم غير مسجل)
async function addToCartAsGuest() {
  try {
    const response = await axios.post(`${API_BASE_URL}/cart`, {
      product: '507f1f77bcf86cd799439011', // معرف المنتج
      quantity: 2,
      store: STORE_ID // مطلوب للمستخدمين غير المسجلين
    });
    
    console.log('تم إضافة المنتج إلى السلة:', response.data);
    return response.data;
  } catch (error) {
    console.error('خطأ في إضافة المنتج إلى السلة:', error.response?.data || error.message);
  }
}

// مثال 2: الإعجاب بمنتج (مستخدم غير مسجل)
async function likeProductAsGuest() {
  try {
    const response = await axios.post(`${API_BASE_URL}/likes/507f1f77bcf86cd799439011`, {
      store: STORE_ID // مطلوب للمستخدمين غير المسجلين
    });
    
    console.log('تم الإعجاب بالمنتج:', response.data);
    return response.data;
  } catch (error) {
    console.error('خطأ في الإعجاب بالمنتج:', error.response?.data || error.message);
  }
}

// مثال 3: عرض السلة (مستخدم غير مسجل)
async function getCartAsGuest() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cart?storeId=${STORE_ID}`);
    
    console.log('محتويات السلة:', response.data);
    return response.data;
  } catch (error) {
    console.error('خطأ في جلب السلة:', error.response?.data || error.message);
  }
}

// مثال 4: عرض المنتجات المعجبة (مستخدم غير مسجل)
async function getLikedProductsAsGuest() {
  try {
    const response = await axios.get(`${API_BASE_URL}/likes?storeId=${STORE_ID}`);
    
    console.log('المنتجات المعجبة:', response.data);
    return response.data;
  } catch (error) {
    console.error('خطأ في جلب المنتجات المعجبة:', error.response?.data || error.message);
  }
}

// مثال 5: إضافة منتج إلى السلة (مستخدم مسجل)
async function addToCartAsUser(token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/cart`, {
      product: '507f1f77bcf86cd799439011',
      quantity: 1
      // لا حاجة لـ store لأن التوكن يحتوي على هذه المعلومات
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('تم إضافة المنتج إلى السلة:', response.data);
    return response.data;
  } catch (error) {
    console.error('خطأ في إضافة المنتج إلى السلة:', error.response?.data || error.message);
  }
}

// مثال 6: الإعجاب بمنتج (مستخدم مسجل)
async function likeProductAsUser(token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/likes/507f1f77bcf86cd799439011`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('تم الإعجاب بالمنتج:', response.data);
    return response.data;
  } catch (error) {
    console.error('خطأ في الإعجاب بالمنتج:', error.response?.data || error.message);
  }
}

// مثال 7: تسجيل الدخول ودمج السلة
async function loginAndMergeCart(email, password) {
  try {
    // تسجيل الدخول
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    
    const token = loginResponse.data.token;
    console.log('تم تسجيل الدخول بنجاح');
    console.log('سيتم دمج سلة الضيف مع سلة المستخدم تلقائياً');
    
    return token;
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error.response?.data || error.message);
  }
}

// تشغيل الأمثلة
async function runExamples() {
  console.log('=== أمثلة على استخدام النظام الجديد ===\n');
  
  // مثال المستخدم غير المسجل
  console.log('1. إضافة منتج إلى السلة (مستخدم غير مسجل):');
  await addToCartAsGuest();
  
  console.log('\n2. الإعجاب بمنتج (مستخدم غير مسجل):');
  await likeProductAsGuest();
  
  console.log('\n3. عرض السلة (مستخدم غير مسجل):');
  await getCartAsGuest();
  
  console.log('\n4. عرض المنتجات المعجبة (مستخدم غير مسجل):');
  await getLikedProductsAsGuest();
  
  // مثال المستخدم المسجل (تحتاج توكن صحيح)
  console.log('\n5. تسجيل الدخول ودمج السلة:');
  // const token = await loginAndMergeCart('user@example.com', 'password');
  // if (token) {
  //   console.log('\n6. إضافة منتج إلى السلة (مستخدم مسجل):');
  //   await addToCartAsUser(token);
  //   
  //   console.log('\n7. الإعجاب بمنتج (مستخدم مسجل):');
  //   await likeProductAsUser(token);
  // }
}

// تشغيل الأمثلة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runExamples();
}

module.exports = {
  addToCartAsGuest,
  likeProductAsGuest,
  getCartAsGuest,
  getLikedProductsAsGuest,
  addToCartAsUser,
  likeProductAsUser,
  loginAndMergeCart
}; 