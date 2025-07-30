const PaymentMethod = require('../Models/PaymentMethod');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

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
 *           enum: [cash, card, digital_wallet, bank_transfer, qr_code, other]
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
 *         logoUrl:
 *           type: string
 *           description: URL to payment method logo
 *           example: "https://example.com/logo.png"
 *         qrCode:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *               description: Whether QR code is enabled
 *             qrCodeUrl:
 *               type: string
 *               description: URL for QR code
 *             qrCodeImage:
 *               type: string
 *               description: QR code image URL
 *             qrCodeData:
 *               type: string
 *               description: QR code data
 *         paymentImages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: Image URL
 *               imageType:
 *                 type: string
 *                 enum: [logo, banner, qr_code, payment_screenshot, other]
 *               altText:
 *                 type: string
 *                 description: Alt text for image
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
 *           enum: [cash, card, digital_wallet, bank_transfer, qr_code, other]
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
      .sort({ createdAt: -1 })
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

    // Prevent creating default method as inactive
    if (req.body.isDefault && req.body.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a default payment method as inactive. Default methods must be active.',
        error: 'Default method cannot be inactive'
      });
    }

    // Validate QR code settings
    if (req.body.qrCode && req.body.qrCode.enabled) {
      if (!req.body.qrCode.qrCodeUrl && !req.body.qrCode.qrCodeData) {
        return res.status(400).json({
          success: false,
          message: 'QR Code URL or data is required when QR code is enabled',
          error: 'QR code validation failed'
        });
      }
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
    
    // Handle model validation errors
    if (error.message === 'Default payment method cannot be inactive') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a default payment method as inactive. Default methods must be active.',
        error: 'Default method cannot be inactive'
      });
    }
    
    if (error.message === 'QR Code URL or data is required when QR code is enabled') {
      return res.status(400).json({
        success: false,
        message: 'QR Code URL or data is required when QR code is enabled',
        error: 'QR code validation failed'
      });
    }
    
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

    // Check if trying to deactivate a default method
    if (req.body.isActive === false) {
      const existingMethod = await PaymentMethod.findById(req.params.id);
      if (existingMethod && existingMethod.isDefault) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the default payment method. Please set another method as default first.',
          error: 'Default method cannot be inactive'
        });
      }
    }

    // Validate QR code settings
    if (req.body.qrCode && req.body.qrCode.enabled) {
      if (!req.body.qrCode.qrCodeUrl && !req.body.qrCode.qrCodeData) {
        return res.status(400).json({
          success: false,
          message: 'QR Code URL or data is required when QR code is enabled',
          error: 'QR code validation failed'
        });
      }
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
    
    // Handle model validation errors
    if (error.message === 'Default payment method cannot be inactive') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate the default payment method. Please set another method as default first.',
        error: 'Default method cannot be inactive'
      });
    }
    
    if (error.message === 'QR Code URL or data is required when QR code is enabled') {
      return res.status(400).json({
        success: false,
        message: 'QR Code URL or data is required when QR code is enabled',
        error: 'QR code validation failed'
      });
    }
    
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
    
    const paymentMethod = await PaymentMethod.findOne(filter);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Prevent deleting the default method
    if (paymentMethod.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the default payment method. Please set another method as default first.',
        error: 'Default method cannot be deleted'
      });
    }

    // Delete the method
    await PaymentMethod.findByIdAndDelete(req.params.id);

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

    // Prevent deactivating the default method
    if (paymentMethod.isDefault && paymentMethod.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate the default payment method. Please set another method as default first.',
        error: 'Default method cannot be inactive'
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

    // Prevent setting inactive method as default
    if (!paymentMethod.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set an inactive payment method as default. Please activate it first.',
        error: 'Inactive method cannot be default'
      });
    }

    // Set this method as default
    paymentMethod.isDefault = true;
    await paymentMethod.save();

    // Remove default from other methods in the same store
    await PaymentMethod.updateMany(
      { 
        store: paymentMethod.store, 
        _id: { $ne: paymentMethod._id } 
      },
      { isDefault: false }
    );

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

/**
 * @swagger
 * /api/payment-methods/{id}/upload-logo:
 *   post:
 *     summary: Upload payment method logo
 *     description: Upload a logo image for a payment method
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
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
 *                   example: "Logo uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     logoUrl:
 *                       type: string
 *                       example: "https://example.com/logo.png"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const paymentMethod = await PaymentMethod.findOne(filter);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Upload to Cloudflare
    const { url } = await uploadToCloudflare(
      req.file.buffer,
      req.file.originalname,
      'payment-methods/logos'
    );

    // Update payment method with new logo URL
    paymentMethod.logoUrl = url;
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logoUrl: url
      }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading logo',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payment-methods/{id}/upload-qr-code:
 *   post:
 *     summary: Upload QR code image
 *     description: Upload a QR code image for a payment method
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               qrCodeImage:
 *                 type: string
 *                 format: binary
 *                 description: QR code image file
 *               qrCodeData:
 *                 type: string
 *                 description: QR code data (optional)
 *     responses:
 *       200:
 *         description: QR code uploaded successfully
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
 *                   example: "QR code uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     qrCodeImage:
 *                       type: string
 *                       example: "https://example.com/qr-code.png"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
const uploadQrCode = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const paymentMethod = await PaymentMethod.findOne(filter);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Upload to Cloudflare
    const { url } = await uploadToCloudflare(
      req.file.buffer,
      req.file.originalname,
      'payment-methods/qr-codes'
    );

    // Update payment method QR code settings
    if (!paymentMethod.qrCode) {
      paymentMethod.qrCode = {};
    }
    
    paymentMethod.qrCode.enabled = true;
    paymentMethod.qrCode.qrCodeImage = url;
    paymentMethod.qrCode.qrCodeData = req.body.qrCodeData || '';
    
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'QR code uploaded successfully',
      data: {
        qrCodeImage: url,
        qrCodeData: paymentMethod.qrCode.qrCodeData
      }
    });
  } catch (error) {
    console.error('Upload QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading QR code',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payment-methods/{id}/upload-payment-image:
 *   post:
 *     summary: Upload payment image
 *     description: Upload a payment image (screenshot, banner, etc.) for a payment method
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Payment image file
 *               imageType:
 *                 type: string
 *                 enum: [logo, banner, qr_code, payment_screenshot, other]
 *                 description: Type of image
 *               altText:
 *                 type: string
 *                 description: Alt text for the image
 *     responses:
 *       200:
 *         description: Payment image uploaded successfully
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
 *                   example: "Payment image uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentImage:
 *                       type: object
 *                       properties:
 *                         imageUrl:
 *                           type: string
 *                           example: "https://example.com/payment-image.png"
 *                         imageType:
 *                           type: string
 *                           example: "payment_screenshot"
 *                         altText:
 *                           type: string
 *                           example: "Payment method screenshot"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
const uploadPaymentImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { imageType = 'other', altText = '' } = req.body;

    // Validate image type
    const validImageTypes = ['logo', 'banner', 'qr_code', 'payment_screenshot', 'other'];
    if (!validImageTypes.includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image type'
      });
    }

    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const paymentMethod = await PaymentMethod.findOne(filter);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Upload to Cloudflare
    const { url } = await uploadToCloudflare(
      req.file.buffer,
      req.file.originalname,
      'payment-methods/images'
    );

    // Add to payment images array
    const newPaymentImage = {
      imageUrl: url,
      imageType,
      altText
    };

    if (!paymentMethod.paymentImages) {
      paymentMethod.paymentImages = [];
    }

    paymentMethod.paymentImages.push(newPaymentImage);
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'Payment image uploaded successfully',
      data: {
        paymentImage: newPaymentImage
      }
    });
  } catch (error) {
    console.error('Upload payment image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading payment image',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payment-methods/{id}/remove-payment-image/{imageIndex}:
 *   delete:
 *     summary: Remove payment image
 *     description: Remove a specific payment image from a payment method
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
 *       - in: path
 *         name: imageIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Index of the image to remove
 *     responses:
 *       200:
 *         description: Payment image removed successfully
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
 *                   example: "Payment image removed successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment method or image not found
 *       500:
 *         description: Internal server error
 */
const removePaymentImage = async (req, res) => {
  try {
    const imageIndex = parseInt(req.params.imageIndex);

    if (isNaN(imageIndex) || imageIndex < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const paymentMethod = await PaymentMethod.findOne(filter);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    if (!paymentMethod.paymentImages || imageIndex >= paymentMethod.paymentImages.length) {
      return res.status(404).json({
        success: false,
        message: 'Payment image not found'
      });
    }

    // Remove the image at the specified index
    paymentMethod.paymentImages.splice(imageIndex, 1);
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'Payment image removed successfully'
    });
  } catch (error) {
    console.error('Remove payment image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing payment image',
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
  setAsDefault,
  uploadLogo,
  uploadQrCode,
  uploadPaymentImage,
  removePaymentImage,
  upload // Export multer upload for use in routes
}; 