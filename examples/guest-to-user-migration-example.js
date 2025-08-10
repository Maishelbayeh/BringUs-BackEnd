// مثال على كيفية تنفيذ دمج guest likes مع user likes في Frontend

// ===== الخطوة 1: حفظ Guest ID في localStorage =====
function saveGuestId(guestId) {
  localStorage.setItem('guestId', guestId);
  console.log('Guest ID saved:', guestId);
}

// ===== الخطوة 2: استخراج Guest ID من response headers =====
async function handleApiResponse(response) {
  const guestId = response.headers.get('X-Guest-ID');
  if (guestId) {
    saveGuestId(guestId);
  }
  return response.json();
}

// ===== الخطوة 3: إضافة Guest ID إلى كل طلب =====
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const guestId = localStorage.getItem('guestId');
  if (guestId) {
    headers['X-Guest-ID'] = guestId;
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// ===== الخطوة 4: دمج Guest Likes عند تسجيل الدخول =====
async function mergeGuestLikesAfterLogin(storeId) {
  try {
    const guestId = localStorage.getItem('guestId');
    if (!guestId) {
      console.log('No guest ID found, nothing to merge');
      return;
    }

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
      
      // حذف Guest ID من localStorage بعد الدمج
      localStorage.removeItem('guestId');
      
      // تحديث واجهة المستخدم
      updateLikesUI();
    } else {
      console.error('❌ Failed to merge guest likes:', result.message);
    }
  } catch (error) {
    console.error('❌ Error merging guest likes:', error);
  }
}

// ===== الخطوة 5: مثال على تسجيل الدخول مع دمج الـ likes =====
async function loginAndMergeLikes(email, password, storeId) {
  try {
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
      
      // دمج guest likes
      await mergeGuestLikesAfterLogin(storeId);
      
      console.log('🎉 Login successful and likes merged!');
    } else {
      console.error('❌ Login failed:', loginResult.message);
    }
  } catch (error) {
    console.error('❌ Login error:', error);
  }
}

// ===== الخطوة 6: مثال على إضافة like كضيف =====
async function likeProductAsGuest(productId, storeSlug) {
  try {
    const response = await fetch(`/api/likes/${productId}?storeSlug=${storeSlug}`, {
      method: 'POST',
      headers: getHeaders()
    });

    const result = await handleApiResponse(response);
    
    if (result.success) {
      console.log('👍 Product liked as guest');
      updateLikesUI();
    } else {
      console.error('❌ Failed to like product:', result.message);
    }
  } catch (error) {
    console.error('❌ Error liking product:', error);
  }
}

// ===== الخطوة 7: مثال على جلب likes للمستخدم المسجل =====
async function getLikedProducts(storeId) {
  try {
    const response = await fetch(`/api/likes?storeId=${storeId}`, {
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('📋 User liked products:', result.data);
      return result.data;
    } else {
      console.error('❌ Failed to get liked products:', result.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting liked products:', error);
    return [];
  }
}

// ===== الخطوة 8: مثال على جلب likes للضيف =====
async function getGuestLikes(guestId, storeId) {
  try {
    const response = await fetch(`/api/likes/guest/${guestId}/${storeId}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('📋 Guest liked products:', result.data);
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

// ===== الخطوة 9: تحديث واجهة المستخدم =====
function updateLikesUI() {
  // تحديث عداد الـ likes
  // تحديث قائمة المنتجات المحبوبة
  // إزالة علامات "liked" من المنتجات غير المحبوبة
  console.log('🔄 UI updated with new likes');
}

// ===== الخطوة 10: مثال على الاستخدام الكامل =====
async function completeExample() {
  const storeId = 'your-store-id';
  const storeSlug = 'your-store-slug';
  
  // 1. المستخدم كضيف يضيف like
  await likeProductAsGuest('product123', storeSlug);
  
  // 2. المستخدم يسجل دخول
  await loginAndMergeLikes('user@example.com', 'password123', storeId);
  
  // 3. جلب likes للمستخدم المسجل
  const userLikes = await getLikedProducts(storeId);
  
  console.log('✅ Complete example finished!');
}

// ===== استخدام في React/Vue/Angular =====

// React Hook Example
/*
import { useEffect, useState } from 'react';

function useGuestToUserMigration() {
  const [isMerging, setIsMerging] = useState(false);

  const mergeLikesAfterLogin = async (storeId) => {
    setIsMerging(true);
    try {
      await mergeGuestLikesAfterLogin(storeId);
    } finally {
      setIsMerging(false);
    }
  };

  return { mergeLikesAfterLogin, isMerging };
}
*/

// Vue Composition API Example
/*
import { ref } from 'vue';

export function useGuestToUserMigration() {
  const isMerging = ref(false);

  const mergeLikesAfterLogin = async (storeId) => {
    isMerging.value = true;
    try {
      await mergeGuestLikesAfterLogin(storeId);
    } finally {
      isMerging.value = false;
    }
  };

  return { mergeLikesAfterLogin, isMerging };
}
*/

// ===== ملاحظات مهمة =====
/*
1. Guest ID يتم حفظه في localStorage أو sessionStorage
2. يتم إرسال Guest ID في header X-Guest-ID مع كل طلب
3. عند تسجيل الدخول، يتم استدعاء /api/likes/merge-guest
4. بعد الدمج الناجح، يتم حذف Guest ID من localStorage
5. النظام يتعامل مع الـ duplicates تلقائياً
6. يمكن تطبيق نفس المنطق على الـ cart أيضاً
*/

module.exports = {
  saveGuestId,
  handleApiResponse,
  getHeaders,
  mergeGuestLikesAfterLogin,
  loginAndMergeLikes,
  likeProductAsGuest,
  getLikedProducts,
  getGuestLikes,
  updateLikesUI,
  completeExample
};
