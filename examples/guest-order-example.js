/**
 * مثال على إنشاء طلبات للضيوف (Guest Orders)
 * 
 * هذا الملف يوضح كيفية إنشاء طلبات للضيوف غير المسجلين
 * باستخدام API الجديد
 */

const API_BASE_URL = 'http://localhost:5001/api';

// دالة لإنشاء طلب ضيف
async function createGuestOrder(storeId, guestId, orderData) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/store/${storeId}/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestId // إضافة guest ID في headers
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Guest order created successfully:', result.data.orderNumber);
      return result.data;
    } else {
      console.error('❌ Failed to create guest order:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating guest order:', error);
    return null;
  }
}

// دالة لإنشاء طلب ضيف من السلة
async function createGuestOrderFromCart(storeId, guestId, cartItems, shippingData) {
  try {
    // تحويل عناصر السلة إلى تنسيق الطلب
    const items = cartItems.map(item => ({
      product: item.product,
      quantity: item.quantity
    }));

    const orderData = {
      guestId: guestId,
      items: items,
      cartItems: cartItems, // للحصول على المواصفات والألوان
      shippingAddress: {
        firstName: shippingData.firstName,
        lastName: shippingData.lastName,
        email: shippingData.email,
        phone: shippingData.phone,
        address: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        zipCode: shippingData.zipCode,
        country: shippingData.country
      },
      billingAddress: {
        firstName: shippingData.firstName,
        lastName: shippingData.lastName,
        email: shippingData.email,
        phone: shippingData.phone,
        address: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        zipCode: shippingData.zipCode,
        country: shippingData.country
      },
      paymentInfo: {
        method: 'cash_on_delivery',
        status: 'pending'
      },
      shippingInfo: {
        method: 'standard',
        cost: 0,
        estimatedDays: 3
      },
      notes: {
        customer: shippingData.notes || ''
      },
      currency: 'ILS'
    };

    return await createGuestOrder(storeId, guestId, orderData);
  } catch (error) {
    console.error('❌ Error creating guest order from cart:', error);
    return null;
  }
}

// مثال على الاستخدام
async function exampleGuestOrder() {
  const storeId = '687c9bb0a7b3f2a0831c4675'; // استبدل بـ store ID الخاص بك
  const guestId = 'guest-12345'; // يمكن أن يكون من cookie أو localStorage

  // بيانات الشحن
  const shippingData = {
    firstName: 'أحمد',
    lastName: 'محمد',
    email: 'ahmed@example.com',
    phone: '+970599123456',
    address: 'شارع الرئيسي 123',
    city: 'غزة',
    state: 'غزة',
    zipCode: '12345',
    country: 'فلسطين',
    notes: 'اتصل بي قبل التوصيل'
  };

  // عناصر السلة (مثال)
  const cartItems = [
    {
      product: '68932a585c971e7fb9832186', // product ID
      quantity: 2,
      priceAtAdd: 150,
      selectedSpecifications: [
        {
          specificationId: 'spec123',
          valueId: 'val456',
          valueAr: 'أحمر',
          valueEn: 'Red',
          titleAr: 'اللون',
          titleEn: 'Color'
        }
      ],
      selectedColors: [['#FF0000']]
    }
  ];

  console.log('🛒 Creating guest order...');
  const order = await createGuestOrderFromCart(storeId, guestId, cartItems, shippingData);
  
  if (order) {
    console.log('📦 Order details:', {
      orderNumber: order.orderNumber,
      total: order.pricing?.total,
      status: order.status,
      itemsCount: order.items?.length
    });
  }
}

// دالة لإنشاء طلب ضيف بسيط
async function createSimpleGuestOrder(storeId, guestId, productId, quantity, customerInfo) {
  const orderData = {
    guestId: guestId,
    items: [
      {
        product: productId,
        quantity: quantity
      }
    ],
    shippingAddress: {
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: customerInfo.address,
      city: customerInfo.city,
      country: customerInfo.country
    },
    billingAddress: {
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: customerInfo.address,
      city: customerInfo.city,
      country: customerInfo.country
    },
    paymentInfo: {
      method: 'cash_on_delivery',
      status: 'pending'
    },
    shippingInfo: {
      method: 'standard',
      cost: 0,
      estimatedDays: 3
    },
    currency: 'ILS'
  };

  return await createGuestOrder(storeId, guestId, orderData);
}

// مثال على الطلب البسيط
async function simpleGuestOrderExample() {
  const storeId = '687c9bb0a7b3f2a0831c4675';
  const guestId = 'guest-simple-123';
  const productId = '68932a585c971e7fb9832186';
  
  const customerInfo = {
    firstName: 'فاطمة',
    lastName: 'علي',
    email: 'fatima@example.com',
    phone: '+970599654321',
    address: 'شارع السلام 456',
    city: 'رام الله',
    country: 'فلسطين'
  };

  console.log('🛒 Creating simple guest order...');
  const order = await createSimpleGuestOrder(storeId, guestId, productId, 1, customerInfo);
  
  if (order) {
    console.log('✅ Simple guest order created:', order.orderNumber);
  }
}

// دالة لدمج طلبات الضيف مع حساب المستخدم عند التسجيل
async function mergeGuestOrdersToUser(guestId, userId, storeId) {
  try {
    // البحث عن جميع طلبات الضيف
    const response = await fetch(`${API_BASE_URL}/orders/store/${storeId}?guestId=${guestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getUserToken()}` // token المستخدم المسجل
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Found ${result.data.length} guest orders to merge`);
      
      // تحديث الطلبات لتخص المستخدم الجديد
      for (const order of result.data) {
        await updateOrderUser(order._id, userId);
      }
      
      console.log('✅ All guest orders merged to user account');
    }
  } catch (error) {
    console.error('❌ Error merging guest orders:', error);
  }
}

// دالة مساعدة لتحديث مستخدم الطلب
async function updateOrderUser(orderId, userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/update-user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getUserToken()}`
      },
      body: JSON.stringify({ userId: userId })
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('❌ Error updating order user:', error);
    return false;
  }
}

// دالة مساعدة للحصول على token المستخدم (يجب تنفيذها حسب نظامك)
function getUserToken() {
  // استرجاع token من localStorage أو مكان آخر
  return localStorage.getItem('userToken') || '';
}

// تشغيل الأمثلة
if (typeof window !== 'undefined') {
  // في المتصفح
  window.guestOrderExample = exampleGuestOrder;
  window.simpleGuestOrderExample = simpleGuestOrderExample;
  window.mergeGuestOrdersToUser = mergeGuestOrdersToUser;
} else {
  // في Node.js
  console.log('🔄 Guest order examples ready to run');
  console.log('📝 Usage:');
  console.log('  - exampleGuestOrder() - إنشاء طلب ضيف من السلة');
  console.log('  - simpleGuestOrderExample() - إنشاء طلب ضيف بسيط');
  console.log('  - mergeGuestOrdersToUser(guestId, userId, storeId) - دمج طلبات الضيف مع حساب المستخدم');
}

module.exports = {
  createGuestOrder,
  createGuestOrderFromCart,
  createSimpleGuestOrder,
  mergeGuestOrdersToUser,
  exampleGuestOrder,
  simpleGuestOrderExample
};
