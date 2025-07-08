const PaymentMethod = require('../Models/PaymentMethod');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentMethod:
 *       type: object
 *       required:
 *         - titleAr
 *         - titleEn
 *         - methodType
 *       properties:
 *         titleAr:
 *           type: string
 *           description: Arabic title
 *           example: "الدفع عند الاستلام"
 *         titleEn:
 *           type: string
 *           description: English title
 *           example: "Cash on Delivery"
 *         descriptionAr:
 *           type: string
 *           description: Arabic description
 *           example: "ادفع عند استلام طلبك"
 *         descriptionEn:
 *           type: string
 *           description: English description
 *           example: "Pay when you receive your order"
 *         methodType:
 *           type: string
 *           enum: [cash, card, digital_wallet, bank_transfer, other]
 *           description: Type of payment method
 *           example: "cash"
 *         isActive:
 *           type: boolean
 *           description: Whether the method is active
 *           example: true
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default method
 *           example: false
 *         processingFee:
 *           type: number
 *           description: Processing fee percentage
 *           example: 0
 *         minimumAmount:
 *           type: number
 *           description: Minimum amount for this method
 *           example: 0
 *         maximumAmount:
 *           type: number
 *           description: Maximum amount for this method
 *           example: 10000
 *         supportedCurrencies:
 *           type: array
 *           items:
 *             type: string
 *           description: Supported currency codes
 *           example: ["ILS", "USD"]
 *         logoUrl:
 *           type: string
 *           description: URL to payment method logo
 *           example: "https://example.com/logo.png"
 *         priority:
 *           type: number
 *           description: Priority for sorting
 *           example: 1
 */

/**
 * @swagger
 * /api/payment-methods:
 *   get:
 *     summary: Get all payment methods for the store
 *     description: Retrieve a list of all payment methods for the current store
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of methods per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default status
 *       - in: query
 *         name: methodType
 *         schema:
 *           type: string
 *           enum: [cash, card, digital_wallet, bank_transfer, other]
 *         description: Filter by method type
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (required for testing, optional if user has default store)
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: List of payment methods retrieved successfully
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
 *                     $ref: '#/components/schemas/PaymentMethod'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     totalItems:
 *                       type: integer
 *                       example: 3
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
const getAllPaymentMethods = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, isDefault, methodType, storeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    
    // Handle store filtering
    if (storeId && req.user.role === 'superadmin') {
      // Superadmin can specify storeId for testing
      filter.store = storeId;
    } else if (req.store) {
      // Use store from middleware
      filter.store = req.store._id;
    } else {
      // Try to get user's default store
      const Owner = require('../Models/Owner');
      const owner = await Owner.findOne({ 
        userId: req.user.id,
        status: 'active'
      }).populate('storeId');
      
      if (owner && owner.storeId) {
        filter.store = owner.storeId._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required or user must have a default store',
          error: 'No store context available'
        });
      }
    }
    
    // Add additional filters
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isDefault !== undefined) filter.isDefault = isDefault === 'true';
    if (methodType) filter.methodType = methodType;

    const paymentMethods = await PaymentMethod.find(filter)
      .populate('store', 'name domain')
      .sort({ priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PaymentMethod.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: paymentMethods,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment methods',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payment-methods/{id}:
 *   get:
 *     summary: Get payment method by ID
 *     description: Retrieve a specific payment method by its ID
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (required for testing, optional if user has default store)
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Payment method retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
const getPaymentMethodById = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    let filter = { _id: req.params.id };
    
    // Handle store filtering
    if (storeId && req.user.role === 'superadmin') {
      // Superadmin can specify storeId for testing
      filter.store = storeId;
    } else if (req.store) {
      // Use store from middleware
      filter.store = req.store._id;
    } else {
      // Try to get user's default store
      const Owner = require('../Models/Owner');
      const owner = await Owner.findOne({ 
        userId: req.user.id,
        status: 'active'
      }).populate('storeId');
      
      if (owner && owner.storeId) {
        filter.store = owner.storeId._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required or user must have a default store',
          error: 'No store context available'
        });
      }
    }
    
    const paymentMethod = await PaymentMethod.findOne(filter)
      .populate('store', 'name domain');

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error('Get payment method by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payment-methods:
 *   post:
 *     summary: Create a new payment method
 *     description: Create a new payment method for the store
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethod'
 *     responses:
 *       201:
 *         description: Payment method created successfully
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
 *                   example: "Payment method created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const createPaymentMethod = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add store to the request body
    const paymentMethodData = {
      ...req.body,
      store: req.store._id
    };

    const paymentMethod = await PaymentMethod.create(paymentMethodData);

    res.status(201).json({
      success: true,
      message: 'Payment method created successfully',
      data: paymentMethod
    });
  } catch (error) {
    console.error('Create payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payment-methods/{id}:
 *   put:
 *     summary: Update payment method
 *     description: Update an existing payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (required for testing, optional if user has default store)
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethod'
 *     responses:
 *       200:
 *         description: Payment method updated successfully
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
 *                   example: "Payment method updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
const updatePaymentMethod = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const paymentMethod = await PaymentMethod.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    ).populate('store', 'name domain');

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment method updated successfully',
      data: paymentMethod
    });
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payment-methods/{id}:
 *   delete:
 *     summary: Delete payment method
 *     description: Delete a payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
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
 *                   example: "Payment method deleted successfully"
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
const deletePaymentMethod = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const paymentMethod = await PaymentMethod.findOneAndDelete(filter);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting payment method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payment-methods/{id}/toggle-active:
 *   patch:
 *     summary: Toggle payment method active status
 *     description: Toggle the active status of a payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method status toggled successfully
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
 *                   example: "Payment method status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
const toggleActiveStatus = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const paymentMethod = await PaymentMethod.findOne(filter);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    paymentMethod.isActive = !paymentMethod.isActive;
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'Payment method status updated successfully',
      data: paymentMethod
    });
  } catch (error) {
    console.error('Toggle payment method status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment method status',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payment-methods/{id}/set-default:
 *   patch:
 *     summary: Set payment method as default
 *     description: Set a payment method as the default for the store
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Default payment method set successfully
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
 *                   example: "Default payment method set successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
const setAsDefault = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const paymentMethod = await PaymentMethod.findOne(filter);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    paymentMethod.isDefault = true;
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'Default payment method set successfully',
      data: paymentMethod
    });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default payment method',
      error: error.message
    });
  }
};

module.exports = {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  toggleActiveStatus,
  setAsDefault
}; 