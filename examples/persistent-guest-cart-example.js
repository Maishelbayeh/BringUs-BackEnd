// مثال على كيفية ضمان استمرارية guest cart بعد refresh الصفحة

// ===== الخطوة 1: إعداد أساسي =====

// حفظ Guest ID في localStorage
function saveGuestId(guestId) {
  if (guestId) {
    localStorage.setItem('guestId', guestId);
    console.log('💾 Guest ID saved to localStorage:', guestId);
  }
}

// استرجاع Guest ID من localStorage
function getStoredGuestId() {
  const guestId = localStorage.getItem('guestId');
  if (guestId) {
    console.log('📂 Retrieved Guest ID from localStorage:', guestId);
  }
  return guestId;
}

// حذف Guest ID من localStorage (عند تسجيل الدخول)
function clearGuestId() {
  localStorage.removeItem('guestId');
  console.log('🗑️ Guest ID cleared from localStorage');
}

// ===== الخطوة 2: إعداد Headers للطلبات =====

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // إضافة Guest ID من localStorage إذا كان موجود
  const guestId = getStoredGuestId();
  if (guestId) {
    headers['X-Guest-ID'] = guestId;
  }
  
  // إضافة token إذا كان المستخدم مسجل دخول
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// ===== الخطوة 3: معالجة الاستجابة وحفظ Guest ID =====

async function handleApiResponse(response) {
  // استخراج Guest ID من response headers
  const guestId = response.headers.get('X-Guest-ID');
  if (guestId) {
    saveGuestId(guestId);
  }
  
  return response.json();
}

// ===== الخطوة 4: دوال الكارت =====

// إضافة منتج للكارت
async function addToCart(productData, storeSlug) {
  try {
    console.log('🛒 Adding product to cart as guest...');
    
    const response = await fetch(`/api/cart?storeSlug=${storeSlug}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });

    const result = await handleApiResponse(response);
    
    if (result.success) {
      console.log('✅ Product added to cart successfully');
      updateCartUI(result.data);
      return result;
    } else {
      console.error('❌ Failed to add product to cart:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error adding product to cart:', error);
    return null;
  }
}

// جلب الكارت
async function getCart(storeId) {
  try {
    const response = await fetch(`/api/cart?storeId=${storeId}`, {
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('📋 Cart loaded:', result.data.items.length, 'items');
      return result.data;
    } else {
      console.error('❌ Failed to get cart:', result.message);
      return { items: [] };
    }
  } catch (error) {
    console.error('❌ Error getting cart:', error);
    return { items: [] };
  }
}

// تحديث كمية منتج في الكارت
async function updateCartItem(productId, quantity, storeSlug) {
  try {
    console.log('🔄 Updating cart item...');
    
    const response = await fetch(`/api/cart/${productId}?storeSlug=${storeSlug}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ quantity })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cart item updated successfully');
      updateCartUI(result.data);
      return result;
    } else {
      console.error('❌ Failed to update cart item:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error updating cart item:', error);
    return null;
  }
}

// حذف منتج من الكارت
async function removeFromCart(productId, storeSlug) {
  try {
    console.log('🗑️ Removing item from cart...');
    
    const response = await fetch(`/api/cart/${productId}?storeSlug=${storeSlug}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Item removed from cart successfully');
      updateCartUI(result.data);
      return result;
    } else {
      console.error('❌ Failed to remove item from cart:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error removing item from cart:', error);
    return null;
  }
}

// تفريغ الكارت
async function clearCart(storeSlug) {
  try {
    console.log('🧹 Clearing cart...');
    
    const response = await fetch(`/api/cart?storeSlug=${storeSlug}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cart cleared successfully');
      updateCartUI(result.data);
      return result;
    } else {
      console.error('❌ Failed to clear cart:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    return null;
  }
}

// جلب إجماليات الكارت
async function getCartTotals(storeId) {
  try {
    const response = await fetch(`/api/cart/totals?storeId=${storeId}`, {
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('💰 Cart totals loaded:', result.data);
      return result.data;
    } else {
      console.error('❌ Failed to get cart totals:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting cart totals:', error);
    return null;
  }
}

// ===== الخطوة 5: دمج guest cart مع user cart =====

async function mergeGuestCartAfterLogin(storeId) {
  try {
    const guestId = getStoredGuestId();
    if (!guestId) {
      console.log('ℹ️ No guest ID found, nothing to merge');
      return;
    }

    console.log('🔄 Merging guest cart to user account...');

    const response = await fetch('/api/cart/merge-guest', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        guestId: guestId,
        storeId: storeId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Guest cart merged successfully:', result.message);
      console.log(`📊 Merged: ${result.mergedCount}, Updated: ${result.updatedCount}`);
      
      // حذف Guest ID من localStorage بعد الدمج الناجح
      clearGuestId();
      
      // تحديث واجهة المستخدم
      updateCartUI(result.data);
      
      return result;
    } else {
      console.error('❌ Failed to merge guest cart:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error merging guest cart:', error);
    return null;
  }
}

// ===== الخطوة 6: دالة تسجيل الدخول مع دمج الكارت =====

async function loginAndMergeCart(email, password, storeId) {
  try {
    console.log('🔐 Logging in and merging cart...');
    
    // تسجيل الدخول
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const loginResult = await loginResponse.json();
    
    if (loginResult.success) {
      // حفظ token
      localStorage.setItem('token', loginResult.data.token);
      console.log('✅ Login successful');
      
      // دمج guest cart
      await mergeGuestCartAfterLogin(storeId);
      
      console.log('🎉 Login and cart merge completed successfully!');
      return loginResult;
    } else {
      console.error('❌ Login failed:', loginResult.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

// ===== الخطوة 7: تحديث واجهة المستخدم =====

function updateCartUI(cart) {
  // تحديث عداد الكارت
  const cartCounter = document.getElementById('cart-counter');
  if (cartCounter) {
    cartCounter.textContent = cart.items.length;
  }
  
  // تحديث قائمة المنتجات في الكارت
  const cartItems = document.getElementById('cart-items');
  if (cartItems) {
    cartItems.innerHTML = '';
    cart.items.forEach(item => {
      const itemElement = createCartItemElement(item);
      cartItems.appendChild(itemElement);
    });
  }
  
  // تحديث إجمالي السعر
  updateCartTotal(cart);
  
  console.log('🔄 Cart UI updated');
}

function createCartItemElement(item) {
  const div = document.createElement('div');
  div.className = 'cart-item';
  div.innerHTML = `
    <h4>${item.product.nameEn || item.product.nameAr}</h4>
    <p>Quantity: ${item.quantity}</p>
    <p>Price: $${item.priceAtAdd}</p>
    <button onclick="removeFromCart('${item.product._id}', 'my-store')">Remove</button>
  `;
  return div;
}

function updateCartTotal(cart) {
  const totalElement = document.getElementById('cart-total');
  if (totalElement) {
    const total = cart.items.reduce((sum, item) => sum + (item.priceAtAdd * item.quantity), 0);
    totalElement.textContent = `$${total.toFixed(2)}`;
  }
}

// ===== الخطوة 8: تهيئة النظام =====

async function initializeCartSystem(storeId) {
  console.log('🚀 Initializing cart system...');
  
  // التحقق من وجود Guest ID
  const guestId = getStoredGuestId();
  if (guestId) {
    console.log('👤 Guest session found:', guestId);
    
    // جلب الكارت للضيف وعرضه
    const cart = await getCart(storeId);
    console.log('📋 Loaded guest cart:', cart.items.length, 'items');
    
    // تحديث UI
    updateCartUI(cart);
  } else {
    console.log('🆕 No guest session found, will create new one on first cart action');
  }
}

// ===== الخطوة 9: مثال على الاستخدام =====

async function completeCartExample() {
  const storeId = 'your-store-id';
  const storeSlug = 'my-store';
  const productId = 'product123';
  
  console.log('🎯 Starting persistent guest cart example...');
  
  // 1. تهيئة النظام
  await initializeCartSystem(storeId);
  
  // 2. إضافة منتج للكارت كضيف
  const productData = {
    product: productId,
    quantity: 2,
    variant: 'large',
    selectedSpecifications: [
      {
        specificationId: 'spec1',
        valueId: 'value1',
        value: 'Red',
        title: 'Color'
      }
    ],
    selectedColors: ['#ff0000', '#00ff00']
  };
  
  await addToCart(productData, storeSlug);
  
  // 3. محاكاة refresh الصفحة
  console.log('🔄 Simulating page refresh...');
  
  // 4. إعادة تهيئة النظام (بعد refresh)
  await initializeCartSystem(storeId);
  
  // 5. التحقق من أن المنتج ما زال في الكارت
  const cart = await getCart(storeId);
  console.log('✅ Cart after refresh:', cart.items.length, 'items');
  
  // 6. تسجيل دخول ودمج الكارت
  await loginAndMergeCart('user@example.com', 'password123', storeId);
  
  console.log('✅ Persistent guest cart example completed!');
}

// ===== الخطوة 10: استخدام في React/Vue =====

// React Hook Example
/*
import { useState, useEffect } from 'react';

function usePersistentCart(storeId) {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeCartSystem(storeId);
  }, [storeId]);

  const addProduct = async (productData, storeSlug) => {
    setLoading(true);
    try {
      const result = await addToCart(productData, storeSlug);
      if (result) {
        setCart(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return { cart, loading, addProduct };
}
*/

// Vue Composition API Example
/*
import { ref, onMounted } from 'vue';

export function usePersistentCart(storeId) {
  const cart = ref({ items: [] });
  const loading = ref(false);

  onMounted(async () => {
    await initializeCartSystem(storeId);
    const cartData = await getCart(storeId);
    cart.value = cartData;
  });

  const addProduct = async (productData, storeSlug) => {
    loading.value = true;
    try {
      const result = await addToCart(productData, storeSlug);
      if (result) {
        cart.value = result.data;
      }
    } finally {
      loading.value = false;
    }
  };

  return { cart, loading, addProduct };
}
*/

// ===== ملاحظات مهمة =====
/*
1. Guest ID يتم حفظه في localStorage وcookies للضمان
2. عند كل طلب، يتم إرسال Guest ID في header X-Guest-ID
3. عند تسجيل الدخول، يتم دمج guest cart مع user cart
4. بعد الدمج الناجح، يتم حذف Guest ID من localStorage
5. النظام يدعم refresh الصفحة بدون فقدان البيانات
6. يتم دمج الكميات للمنتجات المتطابقة
7. يدعم المواصفات والألوان المختارة
*/

module.exports = {
  saveGuestId,
  getStoredGuestId,
  clearGuestId,
  getHeaders,
  handleApiResponse,
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartTotals,
  mergeGuestCartAfterLogin,
  loginAndMergeCart,
  updateCartUI,
  initializeCartSystem,
  completeCartExample
};
