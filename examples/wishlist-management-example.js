// مثال على كيفية استخدام نظام Wishlist مع userId

// ===== الخطوة 1: إضافة منتج إلى wishlist افتراضي =====
async function addToDefaultWishlist(productId, storeSlug) {
  try {
    const response = await fetch(`/api/likes/${productId}?storeSlug=${storeSlug}`, {
      method: 'POST',
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Product added to default wishlist');
      return result;
    } else {
      console.error('❌ Failed to add to wishlist:', result.message);
    }
  } catch (error) {
    console.error('❌ Error adding to wishlist:', error);
  }
}

// ===== الخطوة 2: إضافة منتج إلى wishlist محدد =====
async function addToSpecificWishlist(productId, storeSlug, wishlistUserId) {
  try {
    const response = await fetch(`/api/likes/${productId}?storeSlug=${storeSlug}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        userId: wishlistUserId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Product added to wishlist: ${wishlistUserId}`);
      return result;
    } else {
      console.error('❌ Failed to add to wishlist:', result.message);
    }
  } catch (error) {
    console.error('❌ Error adding to wishlist:', error);
  }
}

// ===== الخطوة 3: جلب منتجات من wishlist افتراضي =====
async function getDefaultWishlist(storeId) {
  try {
    const response = await fetch(`/api/likes?storeId=${storeId}`, {
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('📋 Default wishlist products:', result.data);
      return result.data;
    } else {
      console.error('❌ Failed to get default wishlist:', result.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting default wishlist:', error);
    return [];
  }
}

// ===== الخطوة 4: جلب منتجات من wishlist محدد =====
async function getSpecificWishlist(storeId, wishlistUserId) {
  try {
    const response = await fetch(`/api/likes?storeId=${storeId}&wishlistUserId=${wishlistUserId}`, {
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`📋 Wishlist ${wishlistUserId} products:`, result.data);
      return result.data;
    } else {
      console.error('❌ Failed to get specific wishlist:', result.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting specific wishlist:', error);
    return [];
  }
}

// ===== الخطوة 5: جلب جميع wishlists للمستخدم =====
async function getAllWishlists(storeId) {
  try {
    const response = await fetch(`/api/likes/wishlists?storeId=${storeId}`, {
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('📋 All user wishlists:', result.data);
      return result.data;
    } else {
      console.error('❌ Failed to get wishlists:', result.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting wishlists:', error);
    return [];
  }
}

// ===== الخطوة 6: إنشاء wishlist جديد =====
async function createNewWishlist(wishlistName, storeId, wishlistUserId = null) {
  try {
    const response = await fetch('/api/likes/wishlists', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        wishlistName,
        storeId,
        wishlistUserId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Wishlist created successfully:', result.data);
      return result.data;
    } else {
      console.error('❌ Failed to create wishlist:', result.message);
    }
  } catch (error) {
    console.error('❌ Error creating wishlist:', error);
  }
}

// ===== الخطوة 7: حذف منتج من wishlist افتراضي =====
async function removeFromDefaultWishlist(productId, storeSlug) {
  try {
    const response = await fetch(`/api/likes/${productId}?storeSlug=${storeSlug}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Product removed from default wishlist');
      return result;
    } else {
      console.error('❌ Failed to remove from wishlist:', result.message);
    }
  } catch (error) {
    console.error('❌ Error removing from wishlist:', error);
  }
}

// ===== الخطوة 8: حذف منتج من wishlist محدد =====
async function removeFromSpecificWishlist(productId, storeSlug, wishlistUserId) {
  try {
    const response = await fetch(`/api/likes/${productId}?storeSlug=${storeSlug}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({
        userId: wishlistUserId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Product removed from wishlist: ${wishlistUserId}`);
      return result;
    } else {
      console.error('❌ Failed to remove from wishlist:', result.message);
    }
  } catch (error) {
    console.error('❌ Error removing from wishlist:', error);
  }
}

// ===== الخطوة 9: مثال على الاستخدام الكامل =====
async function completeWishlistExample() {
  const storeId = 'your-store-id';
  const storeSlug = 'your-store-slug';
  const productId = 'product123';
  const wishlistUserId = 'birthday-wishlist';
  
  console.log('🎯 Starting wishlist management example...');
  
  // 1. إنشاء wishlist جديد
  await createNewWishlist('Birthday Wishlist', storeId, wishlistUserId);
  
  // 2. إضافة منتج إلى wishlist افتراضي
  await addToDefaultWishlist(productId, storeSlug);
  
  // 3. إضافة منتج إلى wishlist محدد
  await addToSpecificWishlist(productId, storeSlug, wishlistUserId);
  
  // 4. جلب جميع wishlists
  const allWishlists = await getAllWishlists(storeId);
  
  // 5. جلب منتجات من wishlist محدد
  const specificWishlist = await getSpecificWishlist(storeId, wishlistUserId);
  
  // 6. حذف منتج من wishlist محدد
  await removeFromSpecificWishlist(productId, storeSlug, wishlistUserId);
  
  console.log('✅ Wishlist management example completed!');
}

// ===== الخطوة 10: استخدام في React/Vue =====

// React Hook Example
/*
import { useState, useEffect } from 'react';

function useWishlistManagement(storeId) {
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlists = async () => {
    setLoading(true);
    try {
      const data = await getAllWishlists(storeId);
      setWishlists(data);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId, wishlistUserId = null) => {
    if (wishlistUserId) {
      await addToSpecificWishlist(productId, storeSlug, wishlistUserId);
    } else {
      await addToDefaultWishlist(productId, storeSlug);
    }
    fetchWishlists(); // تحديث القائمة
  };

  useEffect(() => {
    fetchWishlists();
  }, [storeId]);

  return { wishlists, loading, addToWishlist, fetchWishlists };
}
*/

// Vue Composition API Example
/*
import { ref, onMounted } from 'vue';

export function useWishlistManagement(storeId) {
  const wishlists = ref([]);
  const loading = ref(false);

  const fetchWishlists = async () => {
    loading.value = true;
    try {
      const data = await getAllWishlists(storeId);
      wishlists.value = data;
    } finally {
      loading.value = false;
    }
  };

  const addToWishlist = async (productId, wishlistUserId = null) => {
    if (wishlistUserId) {
      await addToSpecificWishlist(productId, storeSlug, wishlistUserId);
    } else {
      await addToDefaultWishlist(productId, storeSlug);
    }
    fetchWishlists(); // تحديث القائمة
  };

  onMounted(() => {
    fetchWishlists();
  });

  return { wishlists, loading, addToWishlist, fetchWishlists };
}
*/

// ===== أمثلة على حالات الاستخدام =====

// 1. Wishlist للعيد
async function createBirthdayWishlist() {
  await createNewWishlist('Birthday Wishlist', storeId, 'birthday-2024');
  await addToSpecificWishlist('product1', storeSlug, 'birthday-2024');
  await addToSpecificWishlist('product2', storeSlug, 'birthday-2024');
}

// 2. Wishlist للهدايا
async function createGiftWishlist() {
  await createNewWishlist('Gift Ideas', storeId, 'gift-ideas');
  await addToSpecificWishlist('product3', storeSlug, 'gift-ideas');
  await addToSpecificWishlist('product4', storeSlug, 'gift-ideas');
}

// 3. Wishlist للمناسبات
async function createEventWishlist(eventName) {
  const eventId = `${eventName}-${Date.now()}`;
  await createNewWishlist(`${eventName} Wishlist`, storeId, eventId);
  return eventId;
}

// ===== ملاحظات مهمة =====
/*
1. userId في body هو optional - إذا لم يتم تمريره، يتم استخدام wishlist افتراضي
2. يمكن للمستخدم إنشاء عدة wishlists مختلفة
3. كل wishlist له wishlistUserId فريد
4. يمكن تصفية المنتجات حسب wishlist محدد
5. النظام يدعم الضيوف والمستخدمين المسجلين
6. يمكن مشاركة wishlist مع مستخدمين آخرين عبر wishlistUserId
*/

module.exports = {
  addToDefaultWishlist,
  addToSpecificWishlist,
  getDefaultWishlist,
  getSpecificWishlist,
  getAllWishlists,
  createNewWishlist,
  removeFromDefaultWishlist,
  removeFromSpecificWishlist,
  completeWishlistExample,
  createBirthdayWishlist,
  createGiftWishlist,
  createEventWishlist
};
