const Like = require('../Models/Like');
const Product = require('../Models/Product');
const { addStoreFilter } = require('../middleware/storeIsolation');

// دالة مساعدة للحصول على استعلام المستخدم
function getLikeQuery(req) {
  if (req.user) return { user: req.user._id, store: req.store._id };
  if (req.guestId) return { guestId: req.guestId, store: req.store._id };
  throw new Error('No user or guestId found');
}

// دالة جديدة لدمج guest likes مع user likes عند تسجيل الدخول
exports.mergeGuestLikesToUser = async (req, res) => {
  try {
    const { guestId, storeId } = req.body;
    
    if (!guestId || !storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Guest ID and Store ID are required' 
      });
    }

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User must be authenticated to merge likes' 
      });
    }

    // البحث عن جميع الـ likes للـ guest
    const guestLikes = await Like.find({ 
      guestId: guestId, 
      store: storeId 
    });

    if (guestLikes.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No guest likes found to merge',
        mergedCount: 0
      });
    }

    let mergedCount = 0;
    let skippedCount = 0;

    // دمج كل like
    for (const guestLike of guestLikes) {
      // التحقق من وجود like للمستخدم لنفس المنتج
      const existingUserLike = await Like.findOne({
        user: req.user._id,
        product: guestLike.product,
        store: storeId
      });

      if (existingUserLike) {
        // إذا كان المستخدم قد أعجب بالمنتج مسبقاً، نحذف الـ guest like
        await Like.findByIdAndDelete(guestLike._id);
        skippedCount++;
      } else {
        // إذا لم يكن المستخدم قد أعجب بالمنتج، نحول الـ guest like إلى user like
        await Like.findByIdAndUpdate(guestLike._id, {
          $set: { user: req.user._id },
          $unset: { guestId: 1 }
        });
        mergedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Successfully merged ${mergedCount} likes, skipped ${skippedCount} duplicates`,
      mergedCount,
      skippedCount,
      totalProcessed: guestLikes.length
    });

  } catch (error) {
    console.error('Merge guest likes error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error merging guest likes' 
    });
  }
};

// دالة للحصول على likes بواسطة guestId (لأغراض الهجرة)
exports.getLikesByGuestId = async (req, res) => {
  try {
    const { guestId, storeId } = req.params;
    
    if (!guestId || !storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Guest ID and Store ID are required' 
      });
    }

    const likes = await Like.find({ 
      guestId: guestId, 
      store: storeId 
    }).populate('product');

    const products = likes.map(like => like.product).filter(Boolean);

    return res.json({
      success: true,
      data: products,
      count: products.length
    });

  } catch (error) {
    console.error('Get likes by guestId error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching guest likes' 
    });
  }
};

// دالة جديدة لجلب جميع wishlists للمستخدم
exports.getUserWishlists = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User must be authenticated to get wishlists' 
      });
    }

    const { storeId } = req.query;
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required' 
      });
    }

    // البحث عن جميع الـ likes للمستخدم في المتجر
    const allLikes = await Like.find({ 
      user: req.user._id, 
      store: storeId 
    }).populate('product');

    // تجميع الـ likes حسب wishlistUserId
    const wishlists = {};
    
    allLikes.forEach(like => {
      const wishlistKey = like.wishlistUserId || 'default';
      
      if (!wishlists[wishlistKey]) {
        wishlists[wishlistKey] = {
          wishlistUserId: like.wishlistUserId || null,
          wishlistName: like.wishlistUserId ? `Wishlist for ${like.wishlistUserId}` : 'My Wishlist',
          products: [],
          count: 0
        };
      }
      
      if (like.product) {
        wishlists[wishlistKey].products.push(like.product);
        wishlists[wishlistKey].count++;
      }
    });

    // تحويل إلى array
    const wishlistsArray = Object.values(wishlists);

    return res.json({
      success: true,
      data: wishlistsArray,
      totalWishlists: wishlistsArray.length,
      totalProducts: allLikes.length
    });

  } catch (error) {
    console.error('Get user wishlists error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching user wishlists' 
    });
  }
};

// دالة جديدة لإنشاء wishlist جديد
exports.createWishlist = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User must be authenticated to create wishlist' 
      });
    }

    const { wishlistName, wishlistUserId, storeId } = req.body;
    
    if (!wishlistName || !storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wishlist name and store ID are required' 
      });
    }

    // التحقق من عدم وجود wishlist بنفس الاسم للمستخدم
    const existingWishlist = await Like.findOne({
      user: req.user._id,
      store: storeId,
      wishlistUserId: wishlistUserId || null
    });

    if (existingWishlist) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wishlist with this name already exists' 
      });
    }

    // إنشاء wishlist فارغ (بدون منتجات)
    const wishlistData = {
      user: req.user._id,
      store: storeId,
      wishlistName: wishlistName,
      wishlistUserId: wishlistUserId || null,
      isWishlistHeader: true // علامة خاصة لتمييز header الـ wishlist
    };

    await Like.create(wishlistData);

    return res.json({
      success: true,
      message: 'Wishlist created successfully',
      data: {
        wishlistName,
        wishlistUserId: wishlistUserId || null,
        products: [],
        count: 0
      }
    });

  } catch (error) {
    console.error('Create wishlist error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error creating wishlist' 
    });
  }
};

exports.getLikedProducts = async (req, res) => {
  try {
    const { wishlistUserId } = req.query; // إضافة wishlistUserId كـ optional query parameter
    const query = getLikeQuery(req);
    
    // إضافة تصفية حسب wishlistUserId إذا تم تمريره
    if (wishlistUserId) {
      query.wishlistUserId = wishlistUserId;
    }
    
    const likes = await Like.find(query).populate('product');
    const products = likes.map(like => like.product).filter(Boolean);
    
    return res.json({ 
      success: true, 
      data: products,
      wishlistUserId: wishlistUserId || null,
      count: products.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.likeProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId } = req.body; // إضافة userId كـ optional parameter
    
    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Enforce store isolation
    if (product.store.toString() !== req.store._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot like products from another store' });
    }
    
    // إنشاء بيانات الإعجاب
    const likeData = {
      product: productId,
      store: req.store._id
    };
    
    // إضافة معرف المستخدم أو الضيف
    if (req.user) {
      likeData.user = req.user._id;
      // إذا تم تمرير userId في body، استخدمه لتمييز wishlist مختلف
      if (userId && userId !== req.user._id.toString()) {
        likeData.wishlistUserId = userId;
      }
    } else if (req.guestId) {
      likeData.guestId = req.guestId;
      // للضيوف، يمكن استخدام userId كـ wishlist identifier
      if (userId) {
        likeData.wishlistUserId = userId;
      }
    } else {
      return res.status(400).json({ success: false, message: 'No user or guest identification found' });
    }
    
    // Check for existing like
    const existingQuery = req.user 
      ? { 
          user: req.user._id, 
          product: productId, 
          store: req.store._id,
          // إذا كان هناك wishlistUserId، أضفه للاستعلام
          ...(userId && userId !== req.user._id.toString() ? { wishlistUserId: userId } : {})
        }
      : { 
          guestId: req.guestId, 
          product: productId, 
          store: req.store._id,
          // للضيوف، أضف wishlistUserId إذا كان موجود
          ...(userId ? { wishlistUserId: userId } : {})
        };
      
    const existing = await Like.findOne(existingQuery);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Product already liked in this wishlist' });
    }
    
    // Create like
    await Like.create(likeData);
    return res.json({ 
      success: true, 
      message: 'Product liked successfully',
      wishlistUserId: likeData.wishlistUserId || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.unlikeProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId } = req.body; // إضافة userId كـ optional parameter
    
    // إنشاء استعلام الحذف
    const deleteQuery = req.user 
      ? { 
          user: req.user._id, 
          product: productId, 
          store: req.store._id,
          // إذا كان هناك wishlistUserId، أضفه للاستعلام
          ...(userId && userId !== req.user._id.toString() ? { wishlistUserId: userId } : {})
        }
      : { 
          guestId: req.guestId, 
          product: productId, 
          store: req.store._id,
          // للضيوف، أضف wishlistUserId إذا كان موجود
          ...(userId ? { wishlistUserId: userId } : {})
        };
      
    const like = await Like.findOneAndDelete(deleteQuery);
    if (!like) {
      return res.status(404).json({ success: false, message: 'Like not found in this wishlist' });
    }
    return res.json({ 
      success: true, 
      message: 'Product unliked successfully',
      wishlistUserId: userId || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}; 