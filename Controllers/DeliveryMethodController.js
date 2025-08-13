const DeliveryMethod = require('../Models/DeliveryMethod');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');

/**
 * @swagger
 * components:
 *   schemas:
 *     DeliveryMethod:
 *       type: object
 *       required:
 *         - locationAr
 *         - locationEn
 *         - price
 *         - whatsappNumber
 *       properties:
 *         locationAr:
 *           type: string
 *           description: Arabic location name
 *           example: "الضفة الغربية"
 *         locationEn:
 *           type: string
 *           description: English location name
 *           example: "West Bank"
 *         price:
 *           type: number
 *           description: Delivery price
 *           example: 20
 *         whatsappNumber:
 *           type: string
 *           description: WhatsApp contact number
 *           example: "+970598516067"
 *         isActive:
 *           type: boolean
 *           description: Whether the method is active
 *           example: true
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default method
 *           example: false
 *         estimatedDays:
 *           type: number
 *           description: Estimated delivery days
 *           example: 1
 *         descriptionAr:
 *           type: string
 *           description: Arabic description
 *           example: "توصيل سريع للضفة الغربية"
 *         descriptionEn:
 *           type: string
 *           description: English description
 *           example: "Fast delivery to West Bank"
 *         priority:
 *           type: number
 *           description: Priority for sorting
 *           example: 1
 */

/**
 * @swagger
 * /api/delivery-methods:
 *   get:
 *     summary: Get all delivery methods for the store
 *     description: Retrieve a list of all delivery methods for the current store
 *     tags: [Delivery Methods]
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
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (required for testing, optional if user has default store)
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: List of delivery methods retrieved successfully
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
 *                     $ref: '#/components/schemas/DeliveryMethod'
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
 *       400:
 *         description: Bad request - Store ID required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Internal server error
 */
const getAllDeliveryMethods = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, isDefault, storeId } = req.query;
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
        userId: req.user._id,
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

    const deliveryMethods = await DeliveryMethod.find(filter)
      .populate('store', 'name domain')
      .sort({ priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DeliveryMethod.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: deliveryMethods,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    //CONSOLE.error('Get all delivery methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery methods',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/delivery-methods/{id}:
 *   get:
 *     summary: Get delivery method by ID
 *     description: Retrieve a specific delivery method by its ID
 *     tags: [Delivery Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery method ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (required for testing, optional if user has default store)
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Delivery method retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryMethod'
 *       404:
 *         description: Delivery method not found
 *       500:
 *         description: Internal server error
 */
const getDeliveryMethodById = async (req, res) => {
  try {
    // Since delivery method ID is unique across the entire table,
    // we don't need store filtering - just find by ID
    const deliveryMethod = await DeliveryMethod.findById(req.params.id)
      .populate('store', 'name domain');

    if (!deliveryMethod) {
      return res.status(404).json({
        success: false,
        message: 'Delivery method not found'
      });
    }

    res.status(200).json({
      success: true,
      data: deliveryMethod
    });
  } catch (error) {
    //CONSOLE.error('Get delivery method by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/delivery-methods:
 *   post:
 *     summary: Create a new delivery method
 *     description: Create a new delivery method for the store
 *     tags: [Delivery Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryMethod'
 *     responses:
 *       201:
 *         description: Delivery method created successfully
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
 *                   example: "Delivery method created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryMethod'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const createDeliveryMethod = async (req, res) => {
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
        message: 'Cannot create a default delivery method as inactive. Default methods must be active.',
        error: 'Default method cannot be inactive'
      });
    }

    let storeId;
    
    // Handle store context
    if (req.store) {
      storeId = req.store._id;
    } else {
      // Try to get user's default store
      const Owner = require('../Models/Owner');
      const owner = await Owner.findOne({ 
        userId: req.user._id,
        status: 'active'
      }).populate('storeId');
      
      if (owner && owner.storeId) {
        storeId = owner.storeId._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required or user must have a default store',
          error: 'No store context available'
        });
      }
    }

    // Add store to the request body
    const deliveryMethodData = {
      ...req.body,
      store: storeId
    };

    const deliveryMethod = await DeliveryMethod.create(deliveryMethodData);

    res.status(201).json({
      success: true,
      message: 'Delivery method created successfully',
      data: deliveryMethod
    });
  } catch (error) {
    //CONSOLE.error('Create delivery method error:', error);
    
    // Handle model validation errors
    if (error.message === 'Default delivery method cannot be inactive') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a default delivery method as inactive. Default methods must be active.',
        error: 'Default method cannot be inactive'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating delivery method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/delivery-methods/{id}:
 *   put:
 *     summary: Update delivery method
 *     description: Update an existing delivery method
 *     tags: [Delivery Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery method ID
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
 *             $ref: '#/components/schemas/DeliveryMethod'
 *     responses:
 *       200:
 *         description: Delivery method updated successfully
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
 *                   example: "Delivery method updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryMethod'
 *       404:
 *         description: Delivery method not found
 *       500:
 *         description: Internal server error
 */
const updateDeliveryMethod = async (req, res) => {
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
      const existingMethod = await DeliveryMethod.findById(req.params.id);
      if (existingMethod && existingMethod.isDefault) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the default delivery method. Please set another method as default first.',
          error: 'Default method cannot be inactive'
        });
      }
    }

    // Since delivery method ID is unique across the entire table,
    // we don't need store filtering - just find by ID
    const deliveryMethod = await DeliveryMethod.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('store', 'name domain');

    if (!deliveryMethod) {
      return res.status(404).json({
        success: false,
        message: 'Delivery method not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery method updated successfully',
      data: deliveryMethod
    });
  } catch (error) {
    //CONSOLE.error('Update delivery method error:', error);
    
    // Handle model validation errors
    if (error.message === 'Default delivery method cannot be inactive') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate the default delivery method. Please set another method as default first.',
        error: 'Default method cannot be inactive'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating delivery method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/delivery-methods/{id}:
 *   delete:
 *     summary: Delete delivery method
 *     description: Delete a delivery method
 *     tags: [Delivery Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery method ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (required for testing, optional if user has default store)
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Delivery method deleted successfully
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
 *                   example: "Delivery method deleted successfully"
 *       404:
 *         description: Delivery method not found
 *       500:
 *         description: Internal server error
 */
const deleteDeliveryMethod = async (req, res) => {
  try {
    // Since delivery method ID is unique across the entire table,
    // we don't need store filtering - just find by ID
    const deliveryMethod = await DeliveryMethod.findById(req.params.id);

    if (!deliveryMethod) {
      return res.status(404).json({
        success: false,
        message: 'Delivery method not found'
      });
    }

    // Prevent deleting the default method
    if (deliveryMethod.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the default delivery method. Please set another method as default first.',
        error: 'Default method cannot be deleted'
      });
    }

    // Delete the method
    await DeliveryMethod.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Delivery method deleted successfully'
    });
  } catch (error) {
    //CONSOLE.error('Delete delivery method error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting delivery method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/delivery-methods/{id}/toggle-active:
 *   patch:
 *     summary: Toggle delivery method active status
 *     description: Toggle the active status of a delivery method
 *     tags: [Delivery Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery method ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (required for testing, optional if user has default store)
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Delivery method status toggled successfully
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
 *                   example: "Delivery method status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryMethod'
 *       404:
 *         description: Delivery method not found
 *       500:
 *         description: Internal server error
 */
const toggleActiveStatus = async (req, res) => {
  try {
    // Since delivery method ID is unique across the entire table,
    // we don't need store filtering - just find by ID
    const deliveryMethod = await DeliveryMethod.findById(req.params.id);
    
    if (!deliveryMethod) {
      return res.status(404).json({
        success: false,
        message: 'Delivery method not found'
      });
    }

    // Prevent deactivating the default method
    if (deliveryMethod.isDefault && deliveryMethod.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate the default delivery method. Please set another method as default first.',
        error: 'Default method cannot be inactive'
      });
    }

    deliveryMethod.isActive = !deliveryMethod.isActive;
    await deliveryMethod.save();

    res.status(200).json({
      success: true,
      message: 'Delivery method status updated successfully',
      data: deliveryMethod
    });
  } catch (error) {
    //CONSOLE.error('Toggle delivery method status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery method status',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/delivery-methods/{id}/set-default:
 *   patch:
 *     summary: Set delivery method as default
 *     description: Set a delivery method as the default for the store
 *     tags: [Delivery Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery method ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (required for testing, optional if user has default store)
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Default delivery method set successfully
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
 *                   example: "Default delivery method set successfully"
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryMethod'
 *       404:
 *         description: Delivery method not found
 *       500:
 *         description: Internal server error
 */
const setAsDefault = async (req, res) => {
  try {
    // Since delivery method ID is unique across the entire table,
    // we don't need store filtering - just find by ID
    const deliveryMethod = await DeliveryMethod.findById(req.params.id);
    
    if (!deliveryMethod) {
      return res.status(404).json({
        success: false,
        message: 'Delivery method not found'
      });
    }

    // Prevent setting inactive method as default
    if (!deliveryMethod.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set an inactive delivery method as default. Please activate it first.',
        error: 'Inactive method cannot be default'
      });
    }

    // Set this method as default
    deliveryMethod.isDefault = true;
    await deliveryMethod.save();

    // Remove default from other methods in the same store
    await DeliveryMethod.updateMany(
      { 
        store: deliveryMethod.store, 
        _id: { $ne: deliveryMethod._id } 
      },
      { isDefault: false }
    );

    res.status(200).json({
      success: true,
      message: 'Default delivery method set successfully',
      data: deliveryMethod
    });
  } catch (error) {
    //CONSOLE.error('Set default delivery method error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default delivery method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/delivery-methods/store/{storeId}:
 *   get:
 *     summary: Get delivery methods by store ID (Public)
 *     description: Retrieve all delivery methods for a specific store (public endpoint, no authentication required)
 *     tags: [Delivery Methods]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439012"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (defaults to true for public access)
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default status
 *     responses:
 *       200:
 *         description: Delivery methods retrieved successfully
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
 *                     $ref: '#/components/schemas/DeliveryMethod'
 *                 store:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439012"
 *                     name:
 *                       type: string
 *                       example: "My Store"
 *                     domain:
 *                       type: string
 *                       example: "mystore.com"
 *       400:
 *         description: Bad request - storeId required
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
const getDeliveryMethodsByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { isActive, isDefault } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'storeId is required' 
      });
    }

    // Validate store exists
    const Store = require('../Models/Store');
    const store = await Store.findById(storeId).select('name domain');
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        error: 'Invalid store ID'
      });
    }

    // Build filter - only show active delivery methods by default for public access
    let filter = { store: storeId };
    
    // Add additional filters
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    } else {
      // For public access, only show active methods by default
      filter.isActive = true;
    }
    
    if (isDefault !== undefined) filter.isDefault = isDefault === 'true';

    const deliveryMethods = await DeliveryMethod.find(filter)
      .populate('store', 'name domain')
      .sort({ priority: 1, createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: deliveryMethods,
      store: {
        _id: store._id,
        name: store.name,
        domain: store.domain
      }
    });
  } catch (error) {
    console.error('Get delivery methods by store ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching delivery methods for store',
      error: error.message 
    });
  }
};

module.exports = {
  getAllDeliveryMethods,
  getDeliveryMethodById,
  getDeliveryMethodsByStoreId,
  createDeliveryMethod,
  updateDeliveryMethod,
  deleteDeliveryMethod,
  toggleActiveStatus,
  setAsDefault
}; 