// مثال على كيفية ضمان استمرارية guest likes بعد refresh الصفحة

// ===== الخطوة 1: إعداد نظام حفظ واسترجاع Guest ID =====

// دالة لحفظ Guest ID في localStorage
function saveGuestId(guestId) {
  if (guestId) {
    localStorage.setItem('guestId', guestId);
    console.log('💾 Guest ID saved to localStorage:', guestId);
  }
}

// دالة لاسترجاع Guest ID من localStorage
function getStoredGuestId() {
  const guestId = localStorage.getItem('guestId');
  if (guestId) {
    console.log('📂 Retrieved Guest ID from localStorage:', guestId);
  }
  return guestId;
}

// دالة لحذف Guest ID من localStorage (عند تسجيل الدخول)
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

// ===== الخطوة 4: دالة إضافة like للضيف =====

async function likeProductAsGuest(productId, storeSlug) {
  try {
    console.log('👍 Attempting to like product as guest...');
    
    const response = await fetch(`/api/likes/${productId}?storeSlug=${storeSlug}`, {
      method: 'POST',
      headers: getHeaders()
    });

    const result = await handleApiResponse(response);
    
    if (result.success) {
      console.log('✅ Product liked successfully as guest');
      updateLikesUI();
      return result;
    } else {
      console.error('❌ Failed to like product:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error liking product:', error);
    return null;
  }
}

// ===== الخطوة 5: دالة جلب likes للضيف =====

async function getGuestLikes(storeId) {
  try {
    const guestId = getStoredGuestId();
    if (!guestId) {
      console.log('⚠️ No guest ID found, returning empty likes');
      return [];
    }

    const response = await fetch(`/api/likes?storeId=${storeId}`, {
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('📋 Guest likes retrieved:', result.data.length, 'products');
      return result.data;
    } else {
      console.error('❌ Failed to get guest likes:', result.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting guest likes:', error);
    return [];
  }
}

// ===== الخطوة 6: دالة حذف like للضيف =====

async function unlikeProductAsGuest(productId, storeSlug) {
  try {
    console.log('👎 Attempting to unlike product as guest...');
    
    const response = await fetch(`/api/likes/${productId}?storeSlug=${storeSlug}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Product unliked successfully as guest');
      updateLikesUI();
      return result;
    } else {
      console.error('❌ Failed to unlike product:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error unliking product:', error);
    return null;
  }
}

// ===== الخطوة 7: دالة دمج guest likes مع user likes =====

async function mergeGuestLikesAfterLogin(storeId) {
  try {
    const guestId = getStoredGuestId();
    if (!guestId) {
      console.log('ℹ️ No guest ID found, nothing to merge');
      return;
    }

    console.log('🔄 Merging guest likes to user account...');

    const response = await fetch('/api/likes/merge-guest', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        guestId: guestId,
        storeId: storeId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Guest likes merged successfully:', result.message);
      console.log(`📊 Merged: ${result.mergedCount}, Skipped: ${result.skippedCount}`);
      
      // حذف Guest ID من localStorage بعد الدمج الناجح
      clearGuestId();
      
      // تحديث واجهة المستخدم
      updateLikesUI();
      
      return result;
    } else {
      console.error('❌ Failed to merge guest likes:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error merging guest likes:', error);
    return null;
  }
}

// ===== الخطوة 8: دالة تسجيل الدخول مع دمج الـ likes =====

async function loginAndMergeLikes(email, password, storeId) {
  try {
    console.log('🔐 Logging in and merging likes...');
    
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
      
      // دمج guest likes
      await mergeGuestLikesAfterLogin(storeId);
      
      console.log('🎉 Login and merge completed successfully!');
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

// ===== الخطوة 9: دالة تحديث واجهة المستخدم =====

function updateLikesUI() {
  // تحديث عداد الـ likes
  // تحديث قائمة المنتجات المحبوبة
  // إزالة علامات "liked" من المنتجات غير المحبوبة
  console.log('🔄 UI updated with new likes');
  
  // يمكن إضافة منطق تحديث UI هنا
  // مثلاً: تحديث عدد الـ likes في header
  // أو تحديث قائمة المنتجات المحبوبة
}

// ===== الخطوة 10: دالة تهيئة النظام عند تحميل الصفحة =====

async function initializeGuestSystem(storeId) {
  console.log('🚀 Initializing guest system...');
  
  // التحقق من وجود Guest ID
  const guestId = getStoredGuestId();
  if (guestId) {
    console.log('👤 Guest session found:', guestId);
    
    // جلب likes للضيف وعرضها
    const guestLikes = await getGuestLikes(storeId);
    console.log('📋 Loaded guest likes:', guestLikes.length, 'products');
    
    // تحديث UI
    updateLikesUI();
  } else {
    console.log('🆕 No guest session found, will create new one on first like');
  }
}

// ===== الخطوة 11: دالة تسجيل الخروج =====

function logout() {
  console.log('🚪 Logging out...');
  
  // حذف token
  localStorage.removeItem('token');
  
  // الاحتفاظ بـ Guest ID للضيوف
  // (لا نحذفه لأنه قد يحتوي على likes مهمة)
  
  console.log('✅ Logout completed');
}

// ===== الخطوة 12: مثال على الاستخدام الكامل =====

async function completePersistentExample() {
  const storeId = 'your-store-id';
  const storeSlug = 'your-store-slug';
  const productId = 'product123';
  
  console.log('🎯 Starting persistent guest likes example...');
  
  // 1. تهيئة النظام
  await initializeGuestSystem(storeId);
  
  // 2. إضافة like كضيف
  await likeProductAsGuest(productId, storeSlug);
  
  // 3. محاكاة refresh الصفحة
  console.log('🔄 Simulating page refresh...');
  
  // 4. إعادة تهيئة النظام (بعد refresh)
  await initializeGuestSystem(storeId);
  
  // 5. التحقق من أن الـ like ما زال موجود
  const guestLikes = await getGuestLikes(storeId);
  console.log('✅ Guest likes after refresh:', guestLikes.length, 'products');
  
  // 6. تسجيل دخول ودمج الـ likes
  await loginAndMergeLikes('user@example.com', 'password123', storeId);
  
  console.log('✅ Persistent guest likes example completed!');
}

// ===== الخطوة 13: استخدام في React/Vue =====

// React Hook Example
/*
import { useEffect, useState } from 'react';

function usePersistentGuestLikes(storeId) {
  const [guestLikes, setGuestLikes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeGuestSystem(storeId);
  }, [storeId]);

  const likeProduct = async (productId, storeSlug) => {
    setLoading(true);
    try {
      const result = await likeProductAsGuest(productId, storeSlug);
      if (result) {
        const updatedLikes = await getGuestLikes(storeId);
        setGuestLikes(updatedLikes);
      }
    } finally {
      setLoading(false);
    }
  };

  return { guestLikes, loading, likeProduct };
}
*/

// Vue Composition API Example
/*
import { ref, onMounted } from 'vue';

export function usePersistentGuestLikes(storeId) {
  const guestLikes = ref([]);
  const loading = ref(false);

  onMounted(async () => {
    await initializeGuestSystem(storeId);
    const likes = await getGuestLikes(storeId);
    guestLikes.value = likes;
  });

  const likeProduct = async (productId, storeSlug) => {
    loading.value = true;
    try {
      const result = await likeProductAsGuest(productId, storeSlug);
      if (result) {
        const updatedLikes = await getGuestLikes(storeId);
        guestLikes.value = updatedLikes;
      }
    } finally {
      loading.value = false;
    }
  };

  return { guestLikes, loading, likeProduct };
}
*/

// ===== ملاحظات مهمة =====
/*
1. Guest ID يتم حفظه في localStorage وcookies للضمان
2. عند كل طلب، يتم إرسال Guest ID في header X-Guest-ID
3. عند تسجيل الدخول، يتم دمج guest likes مع user likes
4. بعد الدمج الناجح، يتم حذف Guest ID من localStorage
5. النظام يدعم refresh الصفحة بدون فقدان البيانات
6. يمكن استخدام نفس المنطق للـ cart أيضاً
*/

module.exports = {
  saveGuestId,
  getStoredGuestId,
  clearGuestId,
  getHeaders,
  handleApiResponse,
  likeProductAsGuest,
  getGuestLikes,
  unlikeProductAsGuest,
  mergeGuestLikesAfterLogin,
  loginAndMergeLikes,
  updateLikesUI,
  initializeGuestSystem,
  logout,
  completePersistentExample
};
