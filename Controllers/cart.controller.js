// monjed update start
// Unified Cart Controller for Authenticated & Guest Users
const Cart = require('../Models/Cart');
const Product = require('../Models/Product');
const { addStoreFilter } = require('../middleware/storeIsolation');

function getCartQuery(req) {
  console.log('getCartQuery - req.user:', req.user);
  console.log('getCartQuery - req.store:', req.store);
  console.log('getCartQuery - req.guestId:', req.guestId);
  
  if (req.user) return { user: req.user._id, store: req.store._id };
  if (req.guestId) return { guestId: req.guestId, store: req.store._id };
  throw new Error('No user or guestId found');
}

 // Remove out-of-stock products from cart when loading
exports.getCart = async (req, res) => {
  try {
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query).populate('items.product');
    if (!cart) cart = await Cart.create({ ...query, items: [] });
    // Remove items where product is out of stock
    const originalLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product && item.product.stock > 0);
    if (cart.items.length !== originalLength) {
      await cart.save();
      await cart.populate('items.product');
    }
    return res.json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
 
exports.addToCart = async (req, res) => {
  try {
    console.log('addToCart - req.body:', req.body);
    console.log('addToCart - req.user:', req.user);
    console.log('addToCart - req.store:', req.store);
    
    const { product, quantity, variant } = req.body;
    if (!product || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Product and quantity are required' });
    }
    const prod = await Product.findOne({ _id: product, store: req.store._id });
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found in this store' });
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) cart = await Cart.create({ ...query, items: [] });
    const itemIndex = cart.items.findIndex(i => i.product.toString() === product && i.variant === variant);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product, quantity, variant, priceAtAdd: prod.price });
    }
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success: true, data: cart });
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, variant } = req.body;
    if (!quantity || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be 0 or greater' });
    }
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Product not in cart' });
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
      if (variant !== undefined) cart.items[itemIndex].variant = variant;
    }
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Product not in cart' });
    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items = [];
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// monjed update end

