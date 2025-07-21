const Order = require('../Models/Order');
const User = require('../Models/User');
const Product = require('../Models/Product');

/**
 * Get all orders for a specific store, including customer info
 * @route GET /api/orders/store/:storeId
 */
exports.getOrdersByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }
    const orders = await Order.find({ store: storeId })
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images');
    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new order for a store
 * @route POST /api/orders/store/:storeId
 */
exports.createOrder = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }
    const {
      user, // user id
      items,
      shippingAddress,
      billingAddress,
      paymentInfo,
      shippingInfo,
      notes,
      isGift,
      giftMessage,
      coupon
    } = req.body;

    // Validate user
    const foundUser = await User.findById(user);
    if (!foundUser) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Validate and process items
    let subtotal = 0;
    const processedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product with ID ${item.product} not found` });
      }
      if (!product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${product.name} is not available` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      processedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        totalPrice: itemTotal,
        variant: item.variant || {}
      });
      // Update product stock
      product.stock -= item.quantity;
      product.soldCount += item.quantity;
      await product.save();
    }

    // Calculate pricing
    const tax = subtotal * 0.1; // 10% tax (adjust as needed)
    const discount = coupon ? (subtotal * coupon.discount / 100) : 0;
    const total = subtotal + tax + shippingInfo.cost - discount;

    const order = await Order.create({
      store: storeId,
      user,
      items: processedItems,
      shippingAddress,
      billingAddress,
      paymentInfo,
      shippingInfo,
      pricing: {
        subtotal,
        tax,
        shipping: shippingInfo.cost,
        discount,
        total
      },
      notes,
      isGift,
      giftMessage,
      coupon
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 