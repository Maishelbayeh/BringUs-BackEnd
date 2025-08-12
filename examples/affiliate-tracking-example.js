/**
 * مثال على كيفية تتبع الطلبات التي تأتي من رابط الأفلييت
 * 
 * هذا الملف يوضح كيفية:
 * 1. الحصول على معلومات الأفلييت من الكود
 * 2. إنشاء طلب مع تتبع معلومات الأفلييت
 * 3. الحصول على الطلبات التي تأتي من رابط الأفلييت
 * 4. الحصول على إحصائيات الطلبات
 */

const axios = require('axios');

// تكوين API
const API_BASE_URL = 'http://localhost:3000/api';
const STORE_ID = '687505893fbf3098648bfe16'; // استبدل بمعرف المتجر الخاص بك

/**
 * 1. الحصول على معلومات الأفلييت من الكود
 */
async function getAffiliateByCode(affiliateCode) {
  try {
    const response = await axios.get(`${API_BASE_URL}/affiliations/code/${affiliateCode}`, {
      params: { storeId: STORE_ID }
    });
    
    console.log('✅ معلومات الأفلييت:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في الحصول على معلومات الأفلييت:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 2. إنشاء طلب مع تتبع معلومات الأفلييت
 */
async function createOrderWithAffiliateTracking(affiliateId, userData) {
  try {
    const orderData = {
      user: userData.userId, // معرف المستخدم (اختياري للضيوف)
      guestId: userData.guestId, // معرف الضيف (للضيوف)
      items: [
        {
          product: '507f1f77bcf86cd799439011', // استبدل بمعرف المنتج
          quantity: 2
        }
      ],
      cartItems: [
        {
          product: '507f1f77bcf86cd799439011',
          quantity: 2,
          selectedSpecifications: [],
          selectedColors: []
        }
      ],
      shippingAddress: {
        firstName: 'أحمد',
        lastName: 'محمد',
        email: 'ahmed@example.com',
        phone: '+970599123456',
        address: 'الخليل، فلسطين'
      },
      billingAddress: {
        firstName: 'أحمد',
        lastName: 'محمد',
        email: 'ahmed@example.com',
        phone: '+970599123456',
        address: 'الخليل، فلسطين'
      },
      paymentInfo: {
        method: 'cash_on_delivery'
      },
      shippingInfo: {
        method: 'standard'
      },
      affiliate: affiliateId, // معرف الأفلييت
      deliveryArea: '507f1f77bcf86cd799439012', // معرف منطقة التوصيل
      
      // معلومات التتبع الإضافية
      referralSource: 'direct_link', // مصدر الإحالة
      utmSource: 'facebook', // مصدر UTM
      utmMedium: 'social', // وسيلة UTM
      utmCampaign: 'summer_sale', // حملة UTM
      clickTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() // وقت النقر (قبل 30 دقيقة)
    };

    const response = await axios.post(`${API_BASE_URL}/orders/store/${STORE_ID}`, orderData);
    
    console.log('✅ تم إنشاء الطلب بنجاح:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في إنشاء الطلب:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 3. الحصول على الطلبات التي تأتي من رابط الأفلييت
 */
async function getAffiliateOrders(affiliateId = null, startDate = null, endDate = null) {
  try {
    const params = {};
    if (affiliateId) params.affiliateId = affiliateId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_BASE_URL}/orders/store/${STORE_ID}/affiliate-orders`, {
      params
    });
    
    console.log('✅ الطلبات التي تأتي من رابط الأفلييت:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في الحصول على الطلبات:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 4. الحصول على إحصائيات الطلبات
 */
async function getAffiliateOrderStats(startDate = null, endDate = null) {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_BASE_URL}/orders/store/${STORE_ID}/affiliate-stats`, {
      params
    });
    
    console.log('✅ إحصائيات الطلبات:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ خطأ في الحصول على الإحصائيات:', error.response?.data || error.message);
    return null;
  }
}

/**
 * مثال على الاستخدام
 */
async function runExample() {
  console.log('🚀 بدء مثال تتبع الأفلييت...\n');

  // 1. الحصول على معلومات الأفلييت من الكود
  console.log('1️⃣ الحصول على معلومات الأفلييت من الكود:');
  const affiliateInfo = await getAffiliateByCode('DYQFQCV');
  if (!affiliateInfo) {
    console.log('❌ لم يتم العثور على الأفلييت، توقف المثال');
    return;
  }

  // 2. إنشاء طلب مع تتبع معلومات الأفلييت
  console.log('\n2️⃣ إنشاء طلب مع تتبع معلومات الأفلييت:');
  const userData = {
    userId: '507f1f77bcf86cd799439013', // استبدل بمعرف المستخدم
    guestId: null
  };
  
  const order = await createOrderWithAffiliateTracking(affiliateInfo.id, userData);
  if (!order) {
    console.log('❌ فشل في إنشاء الطلب، توقف المثال');
    return;
  }

  // انتظار قليلاً للتأكد من حفظ الطلب
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. الحصول على الطلبات التي تأتي من رابط الأفلييت
  console.log('\n3️⃣ الحصول على الطلبات التي تأتي من رابط الأفلييت:');
  const affiliateOrders = await getAffiliateOrders(affiliateInfo.id);
  
  // 4. الحصول على إحصائيات الطلبات
  console.log('\n4️⃣ الحصول على إحصائيات الطلبات:');
  const stats = await getAffiliateOrderStats();

  console.log('\n✅ تم الانتهاء من المثال بنجاح!');
}

// تشغيل المثال إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runExample().catch(console.error);
}

module.exports = {
  getAffiliateByCode,
  createOrderWithAffiliateTracking,
  getAffiliateOrders,
  getAffiliateOrderStats
};

