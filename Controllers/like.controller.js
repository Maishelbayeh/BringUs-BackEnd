const Like = require('../Models/Like');
const Product = require('../Models/Product');
const { addStoreFilter } = require('../middleware/storeIsolation');

exports.getLikedProducts = async (req, res) => {
  try {
    const storeFilter = addStoreFilter(req, { user: req.user._id });
    const likes = await Like.find(storeFilter).populate('product');
    const products = likes.map(like => like.product).filter(Boolean);
    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.likeProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    // Enforce store isolation
    if (product.store.toString() !== req.store._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot like products from another store' });
    }
    // Check for existing like
    const existing = await Like.findOne({ user: userId, product: productId, store: req.store._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Product already liked' });
    }
    // Create like
    await Like.create({ user: userId, product: productId, store: req.store._id });
    return res.json({ success: true, message: 'Product liked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.unlikeProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const like = await Like.findOneAndDelete({ user: userId, product: productId, store: req.store._id });
    if (!like) {
      return res.status(404).json({ success: false, message: 'Like not found' });
    }
    return res.json({ success: true, message: 'Product unliked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}; 