const POSCart = require('../Models/POSCart');
const Product = require('../Models/Product');
const Order = require('../Models/Order');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Generate unique session ID
const generateSessionId = () => {
  return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get all active POS carts for admin
exports.getPOSCarts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status = 'active' } = req.query;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const filter = {
      admin: req.user._id,
      store: storeId,
      status: status
    };

    const carts = await POSCart.find(filter)
      .populate('items.product', 'nameEn nameAr price images mainImage')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: carts,
      count: carts.length
    });

  } catch (error) {
    console.error('Get POS carts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching POS carts',
      error: error.message
    });
  }
};

// Create new POS cart
exports.createPOSCart = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const sessionId = generateSessionId();

    const posCart = new POSCart({
      admin: req.user._id,
      store: storeId,
      sessionId: sessionId,
      cartName: 'Market POS Cart',
      customer: {}
    });

    await posCart.save();

    res.status(201).json({
      success: true,
      message: 'POS cart created successfully',
      data: {
        cartId: posCart._id,
        sessionId: posCart.sessionId,
        cartName: posCart.cartName
      }
    });

  } catch (error) {
    console.error('Create POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating POS cart',
      error: error.message
    });
  }
};

// Get specific POS cart
exports.getPOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    })
    .populate('items.product', 'nameEn nameAr price images mainImage stock availableQuantity')
    .populate('store', 'nameEn nameAr domain');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Get POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching POS cart',
      error: error.message
    });
  }
};

// Add item to POS cart
exports.addToPOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { product, quantity, variant, selectedSpecifications, selectedColors } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Validate input
    if (!product || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product and quantity are required'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Get product details
    const productData = await Product.findById(product);
    if (!productData) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock availability
    if (productData.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${productData.stock}`
      });
    }

    // Prepare item data
    const itemData = {
      product: product,
      quantity: quantity,
      variant: variant || null,
      priceAtAdd: productData.price,
      selectedSpecifications: selectedSpecifications || [],
      selectedColors: selectedColors || []
    };

    // Add item to cart
    await cart.addItem(itemData);

    // Populate the updated cart
    await cart.populate('items.product', 'nameEn nameAr price images mainImage');

    res.json({
      success: true,
      message: 'Item added to POS cart successfully',
      data: cart
    });

  } catch (error) {
    console.error('Add to POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to POS cart',
      error: error.message
    });
  }
};

// Update item in POS cart
exports.updatePOSCartItem = async (req, res) => {
  try {
    const { cartId, itemId } = req.params;
    const { quantity } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Update item quantity
    await cart.updateItemQuantity(itemId, quantity);

    // Populate the updated cart
    await cart.populate('items.product', 'nameEn nameAr price images mainImage');

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: cart
    });

  } catch (error) {
    console.error('Update POS cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating POS cart item',
      error: error.message
    });
  }
};

// Remove item from POS cart
exports.removeFromPOSCart = async (req, res) => {
  try {
    const { cartId, itemId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Remove item
    await cart.removeItem(itemId);

    // Populate the updated cart
    await cart.populate('items.product', 'nameEn nameAr price images mainImage');

    res.json({
      success: true,
      message: 'Item removed successfully',
      data: cart
    });

  } catch (error) {
    console.error('Remove from POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from POS cart',
      error: error.message
    });
  }
};

// Update POS cart customer info
exports.updatePOSCartCustomer = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { customer } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Update customer info
    cart.customer = { ...cart.customer, ...customer };
    await cart.save();

    res.json({
      success: true,
      message: 'Customer information updated successfully',
      data: cart
    });

  } catch (error) {
    console.error('Update POS cart customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer information',
      error: error.message
    });
  }
};

// Apply discount to POS cart
exports.applyDiscount = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { type, value, reason } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Validate discount
    if (!type || !value) {
      return res.status(400).json({
        success: false,
        message: 'Discount type and value are required'
      });
    }

    if (type === 'percentage' && (value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 0 and 100'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Apply discount
    cart.discount = { type, value, reason };
    await cart.save();

    res.json({
      success: true,
      message: 'Discount applied successfully',
      data: cart
    });

  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying discount',
      error: error.message
    });
  }
};

// Complete POS cart (convert to order with paid status)
exports.completePOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { notes } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    }).populate('items.product', 'nameEn nameAr price images mainImage');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete empty cart'
      });
    }

    // Update cart with payment info (always cash, no change)
    cart.payment = {
      method: 'cash',
      amount: cart.total,
      change: 0,
      notes: 'POS cash payment - no change'
    };

    if (notes) {
      cart.notes = { ...cart.notes, admin: notes };
    }

    // Complete the cart
    await cart.completeCart();

    // Create order from POS cart (consistent with existing order structure)
    const orderData = {
      orderNumber: `POS-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      store: {
        id: cart.store,
        nameAr: 'Market POS Store',
        nameEn: 'Market POS Store',
        phone: '',
        slug: 'pos'
      },
      user: {
        firstName: 'Market',
        lastName: 'Customer',
        email: 'market@customer.com',
        phone: '',
        address: {}
      },
      items: cart.items.map(item => ({
        productId: item.product._id.toString(),
        productSnapshot: {
          nameAr: item.product.nameAr || item.product.nameEn,
          nameEn: item.product.nameEn,
          images: item.product.images || [item.product.mainImage],
          price: item.priceAtAdd,
          unit: item.product.unit,
          color: item.product.color,
          sku: item.product.sku || ''
        },
        name: item.product.nameEn,
        sku: item.product.sku || '',
        quantity: item.quantity,
        price: item.priceAtAdd,
        totalPrice: item.priceAtAdd * item.quantity,
        variant: item.variant || {},
        selectedSpecifications: item.selectedSpecifications || [],
        selectedColors: item.selectedColors || []
      })),
      shippingAddress: {},
      billingAddress: {},
      paymentInfo: {
        method: 'cash',
        status: 'completed',
        transactionId: `POS-${Date.now()}`,
        amount: cart.total
      },
      shippingInfo: {
        method: 'pickup',
        cost: 0,
        estimatedDays: 0
      },
      pricing: {
        subtotal: cart.subtotal,
        tax: cart.tax?.amount || 0,
        shipping: 0,
        discount: cart.discount?.type === 'percentage' ? (cart.subtotal * cart.discount.value / 100) : (cart.discount?.value || 0),
        total: cart.total
      },
      paymentStatus: 'paid', // Automatically set as paid for POS orders
      status: 'delivered',
      notes: {
        admin: `Market POS Order - ${cart.notes?.admin || ''}`,
        customer: ''
      }
    };

    const order = new Order(orderData);
    await order.save();

    // Update product stock (consistent with existing order system)
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        // Import the stock reduction function from OrderController
        const { reduceProductStock } = require('./OrderController');
        await reduceProductStock(product, item.quantity, item.selectedSpecifications || []);
      }
    }

    res.json({
      success: true,
      message: 'POS cart completed and order created successfully',
      data: {
        cartId: cart._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error) {
    console.error('Complete POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing POS cart',
      error: error.message
    });
  }
};

// Clear POS cart
exports.clearPOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Clear cart
    await cart.clearCart();

    res.json({
      success: true,
      message: 'POS cart cleared successfully',
      data: cart
    });

  } catch (error) {
    console.error('Clear POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing POS cart',
      error: error.message
    });
  }
};

// Delete POS cart
exports.deletePOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find and delete the cart
    const cart = await POSCart.findOneAndDelete({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    res.json({
      success: true,
      message: 'POS cart deleted successfully'
    });

  } catch (error) {
    console.error('Delete POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting POS cart',
      error: error.message
    });
  }
};
