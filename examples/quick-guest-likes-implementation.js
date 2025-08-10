// مثال سريع على كيفية تطبيق نظام guest likes المستمر

// ===== الخطوة 1: إعداد أساسي =====

// حفظ Guest ID في localStorage
function saveGuestId(guestId) {
  localStorage.setItem('guestId', guestId);
}

// استرجاع Guest ID من localStorage
function getGuestId() {
  return localStorage.getItem('guestId');
}

// إعداد headers للطلبات
function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const guestId = getGuestId();
  const token = localStorage.getItem('token');
  
  if (guestId) headers['X-Guest-ID'] = guestId;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  return headers;
}

// ===== الخطوة 2: دوال الـ likes =====

// إضافة like
async function likeProduct(productId, storeSlug) {
  try {
    const response = await fetch(`/api/likes/${productId}?storeSlug=${storeSlug}`, {
      method: 'POST',
      headers: getHeaders()
    });
    
    // حفظ Guest ID من response headers
    const guestId = response.headers.get('X-Guest-ID');
    if (guestId) saveGuestId(guestId);
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Product liked successfully');
      updateLikeButton(productId, true);
    } else {
      console.error('❌ Failed to like product:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error liking product:', error);
  }
}

// حذف like
async function unlikeProduct(productId, storeSlug) {
  try {
    const response = await fetch(`/api/likes/${productId}?storeSlug=${storeSlug}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Product unliked successfully');
      updateLikeButton(productId, false);
    } else {
      console.error('❌ Failed to unlike product:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error unliking product:', error);
  }
}

// جلب likes
async function getLikes(storeId) {
  try {
    const response = await fetch(`/api/likes?storeId=${storeId}`, {
      headers: getHeaders()
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('📋 Likes loaded:', result.data.length, 'products');
      return result.data;
    } else {
      console.error('❌ Failed to get likes:', result.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting likes:', error);
    return [];
  }
}

// ===== الخطوة 3: دمج guest likes عند تسجيل الدخول =====

async function mergeLikesAfterLogin(storeId) {
  try {
    const guestId = getGuestId();
    if (!guestId) return;
    
    const response = await fetch('/api/likes/merge-guest', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ guestId, storeId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Likes merged successfully:', result.message);
      localStorage.removeItem('guestId'); // حذف Guest ID بعد الدمج
    } else {
      console.error('❌ Failed to merge likes:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error merging likes:', error);
  }
}

// ===== الخطوة 4: تحديث واجهة المستخدم =====

function updateLikeButton(productId, isLiked) {
  const button = document.querySelector(`[data-product-id="${productId}"]`);
  if (button) {
    button.classList.toggle('liked', isLiked);
    button.textContent = isLiked ? '❤️' : '🤍';
  }
}

function updateLikesCount(count) {
  const counter = document.getElementById('likes-counter');
  if (counter) {
    counter.textContent = count;
  }
}

// ===== الخطوة 5: تهيئة النظام =====

async function initializeLikesSystem(storeId) {
  console.log('🚀 Initializing likes system...');
  
  // جلب likes الحالية
  const likes = await getLikes(storeId);
  
  // تحديث UI
  likes.forEach(product => {
    updateLikeButton(product._id, true);
  });
  
  updateLikesCount(likes.length);
  
  console.log('✅ Likes system initialized');
}

// ===== الخطوة 6: استخدام في HTML =====

/*
<!-- مثال على HTML -->
<div class="product-card" data-product-id="product123">
  <h3>Product Name</h3>
  <p>Product Description</p>
  <button 
    class="like-button" 
    data-product-id="product123"
    onclick="toggleLike('product123', 'my-store')">
    🤍
  </button>
</div>

<div class="header">
  <span>Likes: <span id="likes-counter">0</span></span>
</div>
*/

// ===== الخطوة 7: دالة toggle للـ like =====

async function toggleLike(productId, storeSlug) {
  const button = document.querySelector(`[data-product-id="${productId}"]`);
  const isCurrentlyLiked = button.classList.contains('liked');
  
  if (isCurrentlyLiked) {
    await unlikeProduct(productId, storeSlug);
  } else {
    await likeProduct(productId, storeSlug);
  }
}

// ===== الخطوة 8: دالة تسجيل الدخول مع دمج الـ likes =====

async function loginWithLikesMerge(email, password, storeId) {
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
      await mergeLikesAfterLogin(storeId);
      
      console.log('🎉 Login and merge completed!');
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

// ===== الخطوة 9: مثال على الاستخدام =====

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  const storeId = 'your-store-id'; // استبدل بـ store ID الحقيقي
  initializeLikesSystem(storeId);
});

// مثال على تسجيل الدخول
async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const storeId = 'your-store-id';
  
  await loginWithLikesMerge(email, password, storeId);
}

// ===== الخطوة 10: ملاحظات مهمة =====
/*
1. تأكد من استبدال 'your-store-id' بـ store ID الحقيقي
2. تأكد من استبدال 'my-store' بـ store slug الحقيقي
3. النظام يدعم refresh الصفحة بدون فقدان البيانات
4. عند تسجيل الدخول، يتم دمج guest likes تلقائياً
5. يمكن تطبيق نفس المنطق على الـ cart أيضاً
*/

// تصدير الدوال للاستخدام
window.likesSystem = {
  likeProduct,
  unlikeProduct,
  getLikes,
  toggleLike,
  loginWithLikesMerge,
  initializeLikesSystem
};
