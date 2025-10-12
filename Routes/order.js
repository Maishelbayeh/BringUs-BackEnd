const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../Models/Order');
const Product = require('../Models/Product');
const jwt = require('jsonwebtoken');
const OrderController = require('../Controllers/OrderController');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: "Enter your JWT token in the format: Bearer <token>"
 */

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        messageAr: 'الوصول مرفوض. لم يتم توفير رمز'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const decoded = jwt.verify(token, jwtSecret);
    const User = require('../Models/User');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        messageAr: 'رمز غير صالح'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        messageAr: 'الحساب معطل'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', [
  authenticateToken,
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('billingAddress').isObject().withMessage('Billing address is required'),
  body('paymentInfo.method').isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery','store']).withMessage('Valid payment method is required'),
  body('shippingInfo.method').notEmpty().withMessage('Shipping method is required'),
  body('shippingInfo.cost').isFloat({ min: 0 }).withMessage('Shipping cost must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    const {
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

    // Validate and process items
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.product} not found`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      // Calculate the current price (considering any discounts)
      const currentPrice = product.isOnSale && product.salePercentage > 0 ? 
        product.price - (product.price * product.salePercentage / 100) : product.price;
      
      const itemTotal = currentPrice * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        name: product.name,

        quantity: item.quantity,
        price: currentPrice,
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
      user: req.user._id,
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
      .populate('user', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      messageAr: 'تم إنشاء الطلب بنجاح',
      data: populatedOrder
    });
  } catch (error) {
    //CONSOLE.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      messageAr: 'خطأ في إنشاء الطلب',
      error: error.message
    });
  }
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    //CONSOLE.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      messageAr: 'خطأ في جلب الطلبات',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     description: Retrieve all orders for the currently authenticated user with pagination support
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of orders per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       orderNumber:
 *                         type: string
 *                       storeName:
 *                         type: string
 *                       storeId:
 *                         type: string
 *                       currency:
 *                         type: string
 *                       price:
 *                         type: number
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       paid:
 *                         type: boolean
 *                       status:
 *                         type: string
 *                       itemsCount:
 *                         type: number
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             image:
 *                               type: string
 *                             name:
 *                               type: string
 *                             quantity:
 *                               type: number
 *                             pricePerUnit:
 *                               type: number
 *                             total:
 *                               type: number
 *                 count:
 *                   type: number
 *                   description: Number of orders in current page
 *                 total:
 *                   type: number
 *                   description: Total number of orders
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Access denied. No token provided.
 *       500:
 *         description: Server error
 */
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    await OrderController.getMyOrders(req, res);
  } catch (error) {
    console.error('Get my orders route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders',
      messageAr: 'خطأ في جلب طلبات المستخدم',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/my-orders/{orderId}:
 *   get:
 *     summary: Get a specific order for the authenticated user
 *     description: Retrieve details of a specific order for the currently authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID or order number
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     storeName:
 *                       type: string
 *                     storeId:
 *                       type: string
 *                     currency:
 *                       type: string
 *                     price:
 *                       type: number
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     paid:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                     itemsCount:
 *                       type: number
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           image:
 *                             type: string
 *                           name:
 *                             type: string
 *                           sku:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           pricePerUnit:
 *                             type: number
 *                           total:
 *                             type: number
 *                           selectedSpecifications:
 *                             type: array
 *                           selectedColors:
 *                             type: array
 *                     pricing:
 *                       type: object
 *                       properties:
 *                         subtotal:
 *                           type: number
 *                         tax:
 *                           type: number
 *                         shipping:
 *                           type: number
 *                         discount:
 *                           type: number
 *                         total:
 *                           type: number
 *                     shippingAddress:
 *                       type: object
 *                     billingAddress:
 *                       type: object
 *                     paymentInfo:
 *                       type: object
 *                     shippingInfo:
 *                       type: object
 *                     estimatedDeliveryDate:
 *                       type: string
 *                       format: date-time
 *                     actualDeliveryDate:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Access denied. No token provided.
 *       404:
 *         description: Order not found or access denied
 *       500:
 *         description: Server error
 */
router.get('/my-orders/:orderId', authenticateToken, async (req, res) => {
  try {
    await OrderController.getMyOrderById(req, res);
  } catch (error) {
    console.error('Get my order by ID route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      messageAr: 'خطأ في جلب تفاصيل الطلب',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}:
 *   delete:
 *     summary: Delete an order
 *     description: Delete an order (Admin only or order owner)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID or order number
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request or order cannot be deleted
 *       401:
 *         description: Access denied. No token provided.
 *       403:
 *         description: Access denied. Insufficient permissions.
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.delete('/:orderId', authenticateToken, async (req, res) => {
  try {
    await OrderController.deleteOrder(req, res);
  } catch (error) {
    console.error('Delete order route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      messageAr: 'خطأ في حذف الطلب',
      error: error.message
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if id is a valid ObjectId or orderNumber
    let order;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      // If it's a valid ObjectId, search by _id
      order = await Order.findById(req.params.id)
        .populate('user', 'firstName lastName email');
    } else {
      // If it's not a valid ObjectId, search by orderNumber
      order = await Order.findOne({ orderNumber: req.params.id })
        .populate('user', 'firstName lastName email');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        messageAr: 'الوصول مرفوض'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    //CONSOLE.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      messageAr: 'خطأ في جلب الطلب',
      error: error.message
    });
  }
});

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
router.put('/:id/status', [
  authenticateToken,
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Valid status is required'),
  body('trackingNumber').optional().isString().withMessage('Tracking number must be a string'),
  body('carrier').optional().isString().withMessage('Carrier must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    // Check if id is a valid ObjectId or orderNumber
    let order;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      // If it's a valid ObjectId, search by _id
      order = await Order.findById(req.params.id);
    } else {
      // If it's not a valid ObjectId, search by orderNumber
      order = await Order.findOne({ orderNumber: req.params.id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    const { status, trackingNumber, carrier, notes } = req.body;

    // Update order
    order.status = status;
    if (trackingNumber) order.shippingInfo.trackingNumber = trackingNumber;
    if (carrier) order.shippingInfo.carrier = carrier;
    if (notes) order.notes.admin = notes;

    // Set delivery date if status is delivered
    if (status === 'delivered') {
      order.actualDeliveryDate = new Date();
    }

    // Handle cancellation - restore stock to inventory
    if (status === 'cancelled' && order.status !== 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelledBy = req.user._id;

      // Restore product stock properly including specifications
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          // Use the proper restore function that handles both stock and availableQuantity and specifications
          await OrderController.restoreProductStock(
            product, 
            item.quantity, 
            item.selectedSpecifications || []
          );
        } else {
          console.warn(`Product ${item.productId} not found for stock restoration`);
        }
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      messageAr: 'تم تحديث حالة الطلب بنجاح',
      data: updatedOrder
    });
  } catch (error) {
    //CONSOLE.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      messageAr: 'خطأ في تحديث حالة الطلب',
      error: error.message
    });
  }
});

// @desc    Cancel order (User)
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', [
  authenticateToken,
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    // Check if id is a valid ObjectId or orderNumber
    let order;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      // If it's a valid ObjectId, search by _id
      order = await Order.findById(req.params.id);
    } else {
      // If it's not a valid ObjectId, search by orderNumber
      order = await Order.findOne({ orderNumber: req.params.id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        messageAr: 'الوصول مرفوض'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
        messageAr: 'لا يمكن إلغاء الطلب في هذه المرحلة'
      });
    }

    // Prevent double cancellation and stock restoration
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
        messageAr: 'الطلب ملغي بالفعل'
      });
    }

    // Cancel order
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    order.cancellationReason = req.body.reason;

    // Restore product stock properly including specifications
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        // Use the proper restore function that handles both stock and availableQuantity and specifications
        await OrderController.restoreProductStock(
          product, 
          item.quantity, 
          item.selectedSpecifications || []
        );
      } else {
        console.warn(`Product ${item.productId} not found for stock restoration`);
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      messageAr: 'تم إلغاء الطلب بنجاح'
    });
  } catch (error) {
    //CONSOLE.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      messageAr: 'خطأ في إلغاء الطلب',
      error: error.message
    });
  }
});

// @desc    Get order by order number
// @route   GET /api/orders/number/:orderNumber
// @access  Private
router.get('/number/:orderNumber', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('user', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        messageAr: 'الوصول مرفوض'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    //CONSOLE.error('Get order by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      messageAr: 'خطأ في جلب الطلب',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/store/{storeId}:
 *   get:
 *     summary: Get all orders for a specific store (admin or store owner)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     responses:
 *       200:
 *         description: List of orders
 *       400:
 *         description: storeId is required
 *       401:
 *         description: Access denied. No token provided.
 *       403:
 *         description: Access denied. Invalid token or insufficient permissions.
 */
router.get('/store/:storeId', OrderController.getOrdersByStore);

/**
 * @swagger
 * /api/orders/store/{storeId}:
 *   post:
 *     summary: Create a new order for a specific store
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *               paymentInfo:
 *                 type: object
 *               shippingInfo:
 *                 type: object
 *               notes:
 *                 type: string
 *               isGift:
 *                 type: boolean
 *               giftMessage:
 *                 type: string
 *               coupon:
 *                 type: object
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: storeId is required or validation error
 *       401:
 *         description: Access denied. No token provided.
 *       403:
 *         description: Access denied. Invalid token or insufficient permissions.
 */
router.post('/store/:storeId', OrderController.createOrder);

/**
 * @swagger
 * /api/orders/store/{storeId}/from-cart:
 *   post:
 *     summary: Create an order directly from a cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - cartId
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID
 *               cartId:
 *                 type: string
 *                 description: Cart ID to create order from
 *               shippingAddress:
 *                 type: object
 *                 description: Shipping address
 *               billingAddress:
 *                 type: object
 *                 description: Billing address
 *               paymentInfo:
 *                 type: object
 *                 description: Payment information
 *               shippingInfo:
 *                 type: object
 *                 description: Shipping information
 *               notes:
 *                 type: object
 *                 description: Order notes
 *               isGift:
 *                 type: boolean
 *                 description: Whether this is a gift order
 *               giftMessage:
 *                 type: string
 *                 description: Gift message
 *               coupon:
 *                 type: object
 *                 description: Coupon information
 *               affiliate:
 *                 type: string
 *                 description: Affiliate ID
 *               deliveryArea:
 *                 type: string
 *                 description: Delivery area ID
 *               currency:
 *                 type: string
 *                 description: Currency code
 *     responses:
 *       201:
 *         description: Order created successfully from cart
 *       400:
 *         description: storeId is required or validation error
 *       401:
 *         description: Access denied. No token provided.
 *       403:
 *         description: Access denied. Invalid token or insufficient permissions.
 */
router.post('/store/:storeId/from-cart', OrderController.createOrderFromCart);

/**
 * @swagger
 * /api/orders/store/{storeId}/guest:
 *   post:
 *     summary: Create a guest order (for non-authenticated users)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guestId
 *               - items
 *               - shippingAddress
 *             properties:
 *               guestId:
 *                 type: string
 *                 description: Guest ID (required for guest orders)
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               cartItems:
 *                 type: array
 *                 description: Cart items with specifications and colors
 *               shippingAddress:
 *                 type: object
 *                 required: true
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     required: true
 *                   lastName:
 *                     type: string
 *                     required: true
 *                   email:
 *                     type: string
 *                     required: true
 *                   phone:
 *                     type: string
 *               billingAddress:
 *                 type: object
 *               paymentInfo:
 *                 type: object
 *               shippingInfo:
 *                 type: object
 *               notes:
 *                 type: string
 *               isGift:
 *                 type: boolean
 *               giftMessage:
 *                 type: string
 *               coupon:
 *                 type: object
 *               affiliate:
 *                 type: string
 *               deliveryArea:
 *                 type: string
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Guest order created successfully
 *       400:
 *         description: storeId is required or validation error
 *       500:
 *         description: Server error
 */
router.post('/store/:storeId/guest', OrderController.createGuestOrder);

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, shipped, delivered, cancelled]
 *                 description: New order status
 *               notes:
 *                 type: string
 *                 description: Admin notes (optional)
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Access denied. No token provided.
 *       403:
 *         description: Access denied. Admin or store owner only.
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.put('/:orderId/status', [
  authenticateToken,
  body('status').isIn(['pending', 'shipped', 'delivered', 'cancelled']).withMessage('Valid status is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    // Check if user is admin or store owner
    if (req.user.role !== 'admin' && req.user.role !== 'store_owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or store owner only.',
        messageAr: 'الوصول مرفوض. للمسؤولين أو أصحاب المتاجر فقط'
      });
    }

    await OrderController.updateOrderStatus(req, res);
  } catch (error) {
    console.error('Update order status route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      messageAr: 'خطأ في تحديث حالة الطلب',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}/payment-status:
 *   put:
 *     summary: Update payment status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, refunded]
 *                 description: New payment status
 *               notes:
 *                 type: string
 *                 description: Admin notes (optional)
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     paymentStatus:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Access denied. No token provided.
 *       403:
 *         description: Access denied. Admin or store owner only.
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.put('/:orderId/payment-status', [
  authenticateToken,
  body('paymentStatus').isIn(['unpaid', 'paid']).withMessage('Valid payment status is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    // Check if user is admin or store owner
    if (req.user.role !== 'admin' && req.user.role !== 'store_owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or store owner only.',
        messageAr: 'الوصول مرفوض. للمسؤولين أو أصحاب المتاجر فقط'
      });
    }

    await OrderController.updatePaymentStatus(req, res);
  } catch (error) {
    console.error('Update payment status route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      messageAr: 'خطأ في تحديث حالة الدفع',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/customer/{customerId}:
 *   get:
 *     summary: Get all orders for a specific customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter orders by status (pending, shipped, delivered, cancelled)
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter orders by store ID
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       orderNumber:
 *                         type: string
 *                       storeName:
 *                         type: string
 *                       storeId:
 *                         type: string
 *                       currency:
 *                         type: string
 *                       price:
 *                         type: number
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       paid:
 *                         type: boolean
 *                       status:
 *                         type: string
 *                       itemsCount:
 *                         type: number
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             image:
 *                               type: string
 *                             name:
 *                               type: string
 *                             quantity:
 *                               type: number
 *                             pricePerUnit:
 *                               type: number
 *                             total:
 *                               type: number
 *                 count:
 *                   type: number
 *                 total:
 *                   type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                     totalItems:
 *                       type: number
 *                     itemsPerPage:
 *                       type: number
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       400:
 *         description: Invalid customer ID or request data
 *       401:
 *         description: Access denied. No token provided.
 *       500:
 *         description: Server error
 */
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    await OrderController.getOrdersByCustomerId(req, res);
  } catch (error) {
    console.error('Get orders by customer ID route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders by customer ID',
      messageAr: 'خطأ في جلب الطلبات حسب معرف العميل',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/details/{identifier}:
 *   get:
 *     summary: Get detailed order information by ID or order number
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID or order number
 *       - in: query
 *         name: includeItems
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include order items in response
 *       - in: query
 *         name: includeUser
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include user information in response
 *       - in: query
 *         name: includeStore
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include store information in response
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                     paymentStatus:
 *                       type: string
 *                     pricing:
 *                       type: object
 *                       properties:
 *                         subtotal:
 *                           type: number
 *                         tax:
 *                           type: number
 *                         shipping:
 *                           type: number
 *                         discount:
 *                           type: number
 *                         total:
 *                           type: number
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           price:
 *                             type: number
 *                           totalPrice:
 *                             type: number
 *                     user:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     store:
 *                       type: object
 *                       properties:
 *                         nameEn:
 *                           type: string
 *                         nameAr:
 *                           type: string
 *                         phone:
 *                           type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Access denied. No token provided.
 *       403:
 *         description: Access denied. Insufficient permissions.
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/details/:identifier', authenticateToken, async (req, res) => {
  try {
    await OrderController.getOrderDetails(req, res);
  } catch (error) {
    console.error('Get order details route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      messageAr: 'خطأ في جلب تفاصيل الطلب',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/store/{storeId}/product/{productId}/stock-status:
 *   get:
 *     summary: Get detailed stock status for a product
 *     description: Retrieve comprehensive stock information including general stock and specification quantities
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Stock status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     generalStock:
 *                       type: object
 *                       properties:
 *                         available:
 *                           type: number
 *                         sold:
 *                           type: number
 *                         lowStockThreshold:
 *                           type: number
 *                         status:
 *                           type: string
 *                           enum: [in_stock, low_stock, out_of_stock]
 *                     specifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           specificationId:
 *                             type: string
 *                           title:
 *                             type: string
 *                           value:
 *                             type: string
 *                           valueId:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           price:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [in_stock, low_stock, out_of_stock]
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Product does not belong to this store
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/store/:storeId/product/:productId/stock-status', async (req, res) => {
  try {
    await OrderController.getProductStockStatus(req, res);
  } catch (error) {
    console.error('Get product stock status route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product stock status',
      messageAr: 'خطأ في جلب حالة مخزون المنتج',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/store/{storeId}/wholesaler-discount/{userId}:
 *   get:
 *     summary: Get wholesaler discount for a user
 *     description: Retrieve wholesaler discount information for a specific user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Wholesaler discount retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     discount:
 *                       type: number
 *                     wholesalerId:
 *                       type: string
 *                     businessName:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *                     discountRate:
 *                       type: string
 *       404:
 *         description: No active wholesaler found for this user
 *       500:
 *         description: Server error
 */
router.get('/store/:storeId/wholesaler-discount/:userId', async (req, res) => {
  try {
    await OrderController.getWholesalerDiscount(req, res);
  } catch (error) {
    console.error('Get wholesaler discount route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wholesaler discount',
      messageAr: 'خطأ في جلب خصم تاجر الجملة',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/store/{storeId}/calculate-price:
 *   post:
 *     summary: Calculate final price with wholesaler discount
 *     description: Calculate the final price for items considering wholesaler discounts
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID (optional for guest users)
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: Product ID
 *                     quantity:
 *                       type: number
 *                       description: Quantity
 *                       default: 1
 *     responses:
 *       200:
 *         description: Price calculation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           productName:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           unitPrice:
 *                             type: number
 *                           totalPrice:
 *                             type: number
 *                           priceType:
 *                             type: string
 *                             enum: [regular, wholesaler]
 *                           discountInfo:
 *                             type: object
 *                             nullable: true
 *                     subtotal:
 *                       type: number
 *                     wholesalerDiscount:
 *                       type: object
 *                       nullable: true
 *                     summary:
 *                       type: object
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/store/:storeId/calculate-price', async (req, res) => {
  try {
    await OrderController.calculateFinalPrice(req, res);
  } catch (error) {
    console.error('Calculate final price route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating final price',
      messageAr: 'خطأ في حساب السعر النهائي',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/store/{storeId}/wholesaler-status/{userId}:
 *   get:
 *     summary: Check wholesaler status for a user
 *     description: Check if a user is a verified wholesaler and get their status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Wholesaler status checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     isWholesaler:
 *                       type: boolean
 *                     reason:
 *                       type: string
 *                     wholesaler:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         discount:
 *                           type: number
 *                         businessName:
 *                           type: string
 *                         status:
 *                           type: string
 *                         isVerified:
 *                           type: boolean
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.get('/store/:storeId/wholesaler-status/:userId', async (req, res) => {
  try {
    await OrderController.checkWholesalerStatus(req, res);
  } catch (error) {
    console.error('Check wholesaler status route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking wholesaler status',
      messageAr: 'خطأ في التحقق من حالة تاجر الجملة',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/store/{storeId}/affiliate-orders:
 *   get:
 *     summary: Get orders that came through affiliate links
 *     description: Retrieve all orders that were created through affiliate referral links
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: query
 *         name: affiliateId
 *         schema:
 *           type: string
 *         description: Filter by specific affiliate ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Affiliate orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalOrders:
 *                       type: number
 *                     totalCommission:
 *                       type: number
 *                     averageConversionTime:
 *                       type: number
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.get('/store/:storeId/affiliate-orders', async (req, res) => {
  try {
    await OrderController.getAffiliateOrders(req, res);
  } catch (error) {
    console.error('Get affiliate orders route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting affiliate orders',
      messageAr: 'خطأ في جلب طلبات التسويق بالعمولة',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/store/{storeId}/affiliate-stats:
 *   get:
 *     summary: Get affiliate order statistics
 *     description: Retrieve statistics about orders that came through affiliate links
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date for filtering (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Affiliate order statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                     topAffiliates:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.get('/store/:storeId/affiliate-stats', async (req, res) => {
  try {
    await OrderController.getAffiliateOrderStats(req, res);
  } catch (error) {
    console.error('Get affiliate order stats route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting affiliate order statistics',
      messageAr: 'خطأ في جلب إحصائيات طلبات التسويق بالعمولة',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/guest/{guestId}:
 *   get:
 *     summary: Get orders by guest ID
 *     description: Retrieve all orders for a specific guest user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: guestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Guest ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, shipped, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Orders retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Order number
 *                           orderNumber:
 *                             type: string
 *                           storeName:
 *                             type: string
 *                           storeId:
 *                             type: string
 *                           storePhone:
 *                             type: string
 *                           storeUrl:
 *                             type: string
 *                           currency:
 *                             type: string
 *                           price:
 *                             type: number
 *                           status:
 *                             type: string
 *                           statusAr:
 *                             type: string
 *                           paymentStatus:
 *                             type: string
 *                           paymentStatusAr:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                           deliveryArea:
 *                             type: object
 *                           notes:
 *                             type: object
 *                           isGift:
 *                             type: boolean
 *                           affiliateTracking:
 *                             type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalOrders:
 *                           type: integer
 *                         totalSpending:
 *                           type: number
 *                         averageSpending:
 *                           type: number
 *                         lastOrderDate:
 *                           type: string
 *                           format: date-time
 *                         guestId:
 *                           type: string
 *       400:
 *         description: Bad request - guest ID is required
 *       500:
 *         description: Server error
 */
router.get('/guest/:guestId', async (req, res) => {
  try {
    await OrderController.getOrdersByGuestId(req, res);
  } catch (error) {
    console.error('Get orders by guest ID route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting orders by guest ID',
      messageAr: 'خطأ في جلب الطلبات حسب معرف الضيف',
      error: error.message
    });
  }
});

// Analytics Routes

/**
 * @swagger
 * /api/orders/analytics/order-percentage:
 *   get:
 *     summary: Get order percentage (guest vs logged users)
 *     description: Get the percentage of orders from guest users vs logged users
 *     tags: [Orders, Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order percentage retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                       example: 150
 *                     guestOrders:
 *                       type: integer
 *                       example: 45
 *                     loggedUserOrders:
 *                       type: integer
 *                       example: 105
 *                     percentages:
 *                       type: object
 *                       properties:
 *                         guest:
 *                           type: number
 *                           example: 30.0
 *                         loggedUsers:
 *                           type: number
 *                           example: 70.0
 *       401:
 *         description: Access denied. No token provided.
 *       500:
 *         description: Server error
 */
router.get('/analytics/order-percentage', authenticateToken, async (req, res) => {
  try {
    await OrderController.getOrderPercentage(req, res);
  } catch (error) {
    console.error('Get order percentage route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order percentage',
      messageAr: 'خطأ في جلب نسبة الطلبات',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/analytics/top-users:
 *   get:
 *     summary: Get top 10 users by products sold
 *     description: Get the top 10 users who have sold the most products
 *     tags: [Orders, Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       totalProductsSold:
 *                         type: integer
 *                         example: 150
 *                       orderCount:
 *                         type: integer
 *                         example: 25
 *                       totalRevenue:
 *                         type: number
 *                         example: 5000.50
 *       401:
 *         description: Access denied. No token provided.
 *       500:
 *         description: Server error
 */
router.get('/analytics/top-users', authenticateToken, async (req, res) => {
  try {
    await OrderController.getTopUsersByProductsSold(req, res);
  } catch (error) {
    console.error('Get top users route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top users',
      messageAr: 'خطأ في جلب أفضل المستخدمين',
      error: error.message
    });
  }
});
/**
 * @swagger
 * /api/orders/analytics/categories-revenue:
 *   get:
 *     summary: Get categories with money earned
 *     description: Get revenue statistics by product categories
 *     tags: [Orders, Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories revenue retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       categoryNameAr:
 *                         type: string
 *                       categoryNameEn:
 *                         type: string
 *                       totalRevenue:
 *                         type: number
 *                         example: 2500.75
 *                       totalQuantity:
 *                         type: integer
 *                         example: 100
 *                       orderCount:
 *                         type: integer
 *                         example: 15
 *       401:
 *         description: Access denied. No token provided.
 *       500:
 *         description: Server error
 */
router.get('/analytics/categories-revenue', authenticateToken, async (req, res) => {
  try {
    await OrderController.getCategoriesRevenue(req, res);
  } catch (error) {
    console.error('Get categories revenue route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories revenue',
      messageAr: 'خطأ في جلب إيرادات الفئات',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orders/analytics/top-products:
 *   get:
 *     summary: Get top 10 sold products
 *     description: Get the top 10 products by quantity sold
 *     tags: [Orders, Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       productName:
 *                         type: string
 *                       productNameAr:
 *                         type: string
 *                       productSku:
 *                         type: string
 *                       mainImage:
 *                         type: string
 *                       totalQuantitySold:
 *                         type: integer
 *                         example: 150
 *                       totalRevenue:
 *                         type: number
 *                         example: 5000.50
 *                       averagePrice:
 *                         type: number
 *                         example: 33.33
 *                       orderCount:
 *                         type: integer
 *                         example: 25
 *                       categories:
 *                         type: array
 *                         items:
 *                           type: object
 *       401:
 *         description: Access denied. No token provided.
 *       500:
 *         description: Server error
 */
router.get('/analytics/top-products', authenticateToken, async (req, res) => {
  try {
    await OrderController.getTopProducts(req, res);
  } catch (error) {
    console.error('Get top products route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top products',
      messageAr: 'خطأ في جلب أفضل المنتجات',
      error: error.message
    });
  }
});

module.exports = router; 