const Like = require('../Models/Like');
const Product = require('../Models/Product');
const { addStoreFilter } = require('../middleware/storeIsolation');

// دالة مساعدة للحصول على استعلام المستخدم
function getLikeQuery(req) {
  if (req.user) return { user: req.user._id, store: req.store._id };
  if (req.guestId) return { guestId: req.guestId, store: req.store._id };
  throw new Error('No user or guestId found');
}

exports.getLikedProducts = async (req, res) => {
  try {
    const query = getLikeQuery(req);
    const likes = await Like.find(query).populate('product');
    const products = likes.map(like => like.product).filter(Boolean);
    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.likeProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
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
    } else if (req.guestId) {
      likeData.guestId = req.guestId;
    } else {
      return res.status(400).json({ success: false, message: 'No user or guest identification found' });
    }
    
    // Check for existing like
    const existingQuery = req.user 
      ? { user: req.user._id, product: productId, store: req.store._id }
      : { guestId: req.guestId, product: productId, store: req.store._id };
      
    const existing = await Like.findOne(existingQuery);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Product already liked' });
    }
    
    // Create like
    await Like.create(likeData);
    return res.json({ success: true, message: 'Product liked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.unlikeProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // إنشاء استعلام الحذف
    const deleteQuery = req.user 
      ? { user: req.user._id, product: productId, store: req.store._id }
      : { guestId: req.guestId, product: productId, store: req.store._id };
      
    const like = await Like.findOneAndDelete(deleteQuery);
    if (!like) {
      return res.status(404).json({ success: false, message: 'Like not found' });
    }
    return res.json({ success: true, message: 'Product unliked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}; 