const StockPreview = require('../Models/StockPreview');
const Product = require('../Models/Product');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');

/**
 * @swagger
 * components:
 *   schemas:
 *     StockPreview:
 *       type: object
 *       required:
 *         - product
 *         - store
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID reference
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         availableQuantity:
 *           type: integer
 *           description: Available stock quantity
 *           example: 50
 *         reservedQuantity:
 *           type: integer
 *           description: Reserved stock quantity
 *           example: 5
 *         soldQuantity:
 *           type: integer
 *           description: Sold stock quantity
 *           example: 100
 *         damagedQuantity:
 *           type: integer
 *           description: Damaged stock quantity
 *           example: 2
 *         lowStockThreshold:
 *           type: integer
 *           description: Low stock alert threshold
 *           example: 10
 *         outOfStockThreshold:
 *           type: integer
 *           description: Out of stock threshold
 *           example: 0
 *         stockStatus:
 *           type: string
 *           enum: [in_stock, low_stock, out_of_stock, discontinued]
 *           description: Current stock status
 *           example: "in_stock"
 *         isVisible:
 *           type: boolean
 *           description: Product visibility status
 *           example: true
 */

/**
 * @swagger
 * /api/stock-preview:
 *   get:
 *     summary: Get all stock preview data
 *     description: Retrieve a list of all stock preview data for the current store
 *     tags: [Stock Preview]
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
 *         description: Number of items per page
 *       - in: query
 *         name: stockStatus
 *         schema:
 *           type: string
 *           enum: [in_stock, low_stock, out_of_stock, discontinued]
 *         description: Filter by stock status
 *       - in: query
 *         name: isVisible
 *         schema:
 *           type: boolean
 *         description: Filter by visibility status
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: List of stock preview data retrieved successfully
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
 *                     $ref: '#/components/schemas/StockPreview'
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
const getAllStockPreview = async (req, res) => {
  try {
    const { page = 1, limit = 10, stockStatus, isVisible, categoryId, storeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add store filter for isolation
    let filter = addStoreFilter(req);
    
    // Override store filter if storeId is provided (for testing)
    if (storeId && req.user.role === 'superadmin') {
      filter = { store: storeId };
    }
    
    // Add additional filters
    if (stockStatus) filter.stockStatus = stockStatus;
    if (isVisible !== undefined) filter.isVisible = isVisible === 'true';

    const stockData = await StockPreview.find(filter)
      .populate('product', 'nameAr nameEn image category price descriptionAr descriptionEn')
      .populate('store', 'name domain')
      .sort({ lastStockUpdate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StockPreview.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: stockData,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all stock preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock preview data',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/stock-preview/summary:
 *   get:
 *     summary: Get stock summary
 *     description: Retrieve stock summary statistics for the store
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Stock summary retrieved successfully
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
 *                     totalProducts:
 *                       type: integer
 *                       example: 100
 *                     totalAvailableQuantity:
 *                       type: integer
 *                       example: 5000
 *                     totalReservedQuantity:
 *                       type: integer
 *                       example: 200
 *                     totalSoldQuantity:
 *                       type: integer
 *                       example: 10000
 *                     totalDamagedQuantity:
 *                       type: integer
 *                       example: 50
 *                     inStockProducts:
 *                       type: integer
 *                       example: 80
 *                     lowStockProducts:
 *                       type: integer
 *                       example: 15
 *                     outOfStockProducts:
 *                       type: integer
 *                       example: 5
 *                     visibleProducts:
 *                       type: integer
 *                       example: 95
 *       500:
 *         description: Internal server error
 */
const getStockSummary = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    // Determine store ID
    let targetStoreId = req.store._id;
    if (storeId && req.user.role === 'superadmin') {
      targetStoreId = storeId;
    }

    const summary = await StockPreview.getStockSummary(targetStoreId);
    
    res.status(200).json({
      success: true,
      data: summary[0] || {
        totalProducts: 0,
        totalAvailableQuantity: 0,
        totalReservedQuantity: 0,
        totalSoldQuantity: 0,
        totalDamagedQuantity: 0,
        inStockProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        visibleProducts: 0
      }
    });
  } catch (error) {
    console.error('Get stock summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock summary',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/stock-preview/low-stock:
 *   get:
 *     summary: Get low stock products
 *     description: Retrieve products with low or out of stock status
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products to return
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
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
 *                     $ref: '#/components/schemas/StockPreview'
 *       500:
 *         description: Internal server error
 */
const getLowStockProducts = async (req, res) => {
  try {
    const { limit = 10, storeId } = req.query;
    
    // Determine store ID
    let targetStoreId = req.store._id;
    if (storeId && req.user.role === 'superadmin') {
      targetStoreId = storeId;
    }

    const lowStockProducts = await StockPreview.getLowStockProducts(targetStoreId, parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: lowStockProducts
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/stock-preview/alerts:
 *   get:
 *     summary: Get stock alerts
 *     description: Retrieve stock alerts for the store
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only unread alerts
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Stock alerts retrieved successfully
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
 *                     $ref: '#/components/schemas/StockPreview'
 *       500:
 *         description: Internal server error
 */
const getStockAlerts = async (req, res) => {
  try {
    const { unreadOnly = false, storeId } = req.query;
    
    // Determine store ID
    let targetStoreId = req.store._id;
    if (storeId && req.user.role === 'superadmin') {
      targetStoreId = storeId;
    }

    const alerts = await StockPreview.getStockAlerts(targetStoreId, unreadOnly === 'true');
    
    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock alerts',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/stock-preview/{id}:
 *   get:
 *     summary: Get stock preview by ID
 *     description: Retrieve a specific stock preview record by its ID
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock preview ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Stock preview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StockPreview'
 *       404:
 *         description: Stock preview not found
 *       500:
 *         description: Internal server error
 */
const getStockPreviewById = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    // Add store filter for isolation
    let filter = addStoreFilter(req, { _id: req.params.id });
    
    // Override store filter if storeId is provided (for testing)
    if (storeId && req.user.role === 'superadmin') {
      filter = { _id: req.params.id, store: storeId };
    }
    
    const stockData = await StockPreview.findOne(filter)
      .populate('product', 'nameAr nameEn image category price descriptionAr descriptionEn')
      .populate('store', 'name domain');

    if (!stockData) {
      return res.status(404).json({
        success: false,
        message: 'Stock preview not found'
      });
    }

    res.status(200).json({
      success: true,
      data: stockData
    });
  } catch (error) {
    console.error('Get stock preview by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock preview',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/stock-preview:
 *   post:
 *     summary: Create stock preview record
 *     description: Create a new stock preview record for a product
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StockPreview'
 *     responses:
 *       201:
 *         description: Stock preview created successfully
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
 *                   example: "Stock preview created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StockPreview'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const createStockPreview = async (req, res) => {
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

    // Check if product exists and belongs to the store
    const product = await Product.findOne({
      _id: req.body.product,
      store: req.store._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to this store'
      });
    }

    // Check if stock preview already exists for this product
    const existingStock = await StockPreview.findOne({
      product: req.body.product,
      store: req.store._id
    });

    if (existingStock) {
      return res.status(400).json({
        success: false,
        message: 'Stock preview already exists for this product'
      });
    }

    // Add store to the request body
    const stockData = {
      ...req.body,
      store: req.store._id
    };

    const stockPreview = await StockPreview.create(stockData);

    res.status(201).json({
      success: true,
      message: 'Stock preview created successfully',
      data: stockPreview
    });
  } catch (error) {
    console.error('Create stock preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating stock preview',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/stock-preview/{id}:
 *   put:
 *     summary: Update stock preview
 *     description: Update an existing stock preview record
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock preview ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StockPreview'
 *     responses:
 *       200:
 *         description: Stock preview updated successfully
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
 *                   example: "Stock preview updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StockPreview'
 *       404:
 *         description: Stock preview not found
 *       500:
 *         description: Internal server error
 */
const updateStockPreview = async (req, res) => {
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
    
    const stockPreview = await StockPreview.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    ).populate('product', 'nameAr nameEn image category price descriptionAr descriptionEn')
     .populate('store', 'name domain');

    if (!stockPreview) {
      return res.status(404).json({
        success: false,
        message: 'Stock preview not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock preview updated successfully',
      data: stockPreview
    });
  } catch (error) {
    console.error('Update stock preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock preview',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/stock-preview/{id}/update-stock:
 *   patch:
 *     summary: Update stock quantities
 *     description: Update stock quantities for a specific product
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock preview ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               availableQuantity:
 *                 type: integer
 *               reservedQuantity:
 *                 type: integer
 *               soldQuantity:
 *                 type: integer
 *               damagedQuantity:
 *                 type: integer
 *               movementType:
 *                 type: string
 *                 enum: [purchase, sale, return, damage, adjustment, reservation]
 *               reason:
 *                 type: string
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock quantities updated successfully
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
 *                   example: "Stock quantities updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StockPreview'
 *       404:
 *         description: Stock preview not found
 *       500:
 *         description: Internal server error
 */
const updateStockQuantities = async (req, res) => {
  try {
    const { availableQuantity, reservedQuantity, soldQuantity, damagedQuantity, movementType, reason, reference } = req.body;
    
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const stockPreview = await StockPreview.findOne(filter);
    
    if (!stockPreview) {
      return res.status(404).json({
        success: false,
        message: 'Stock preview not found'
      });
    }

    // Store previous quantities for movement tracking
    const previousQuantities = {
      availableQuantity: stockPreview.availableQuantity,
      reservedQuantity: stockPreview.reservedQuantity,
      soldQuantity: stockPreview.soldQuantity,
      damagedQuantity: stockPreview.damagedQuantity
    };

    // Update quantities
    const updates = {};
    if (availableQuantity !== undefined) updates.availableQuantity = availableQuantity;
    if (reservedQuantity !== undefined) updates.reservedQuantity = reservedQuantity;
    if (soldQuantity !== undefined) updates.soldQuantity = soldQuantity;
    if (damagedQuantity !== undefined) updates.damagedQuantity = damagedQuantity;

    await stockPreview.updateStock(updates);

    // Add stock movement if movement type is provided
    if (movementType) {
      const quantity = Math.abs(
        (availableQuantity || 0) - previousQuantities.availableQuantity +
        (reservedQuantity || 0) - previousQuantities.reservedQuantity +
        (soldQuantity || 0) - previousQuantities.soldQuantity +
        (damagedQuantity || 0) - previousQuantities.damagedQuantity
      );

      await stockPreview.addStockMovement({
        type: movementType,
        quantity: quantity,
        previousQuantity: previousQuantities.availableQuantity,
        newQuantity: stockPreview.availableQuantity,
        reason: reason || '',
        reference: reference || '',
        performedBy: req.user._id
      });
    }

    // Refresh the document
    await stockPreview.populate('product', 'nameAr nameEn image category price descriptionAr descriptionEn');
    await stockPreview.populate('store', 'name domain');

    res.status(200).json({
      success: true,
      message: 'Stock quantities updated successfully',
      data: stockPreview
    });
  } catch (error) {
    console.error('Update stock quantities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock quantities',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/stock-preview/{id}/toggle-visibility:
 *   patch:
 *     summary: Toggle product visibility
 *     description: Toggle the visibility status of a product in stock
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock preview ID
 *     responses:
 *       200:
 *         description: Visibility toggled successfully
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
 *                   example: "Visibility toggled successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StockPreview'
 *       404:
 *         description: Stock preview not found
 *       500:
 *         description: Internal server error
 */
const toggleVisibility = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const stockPreview = await StockPreview.findOne(filter);
    
    if (!stockPreview) {
      return res.status(404).json({
        success: false,
        message: 'Stock preview not found'
      });
    }

    stockPreview.isVisible = !stockPreview.isVisible;
    await stockPreview.save();

    await stockPreview.populate('product', 'nameAr nameEn image category price descriptionAr descriptionEn');
    await stockPreview.populate('store', 'name domain');

    res.status(200).json({
      success: true,
      message: 'Visibility toggled successfully',
      data: stockPreview
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling visibility',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/stock-preview/{id}/mark-alerts-read:
 *   patch:
 *     summary: Mark alerts as read
 *     description: Mark all alerts for a stock preview as read
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock preview ID
 *     responses:
 *       200:
 *         description: Alerts marked as read successfully
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
 *                   example: "Alerts marked as read successfully"
 *       404:
 *         description: Stock preview not found
 *       500:
 *         description: Internal server error
 */
const markAlertsAsRead = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const stockPreview = await StockPreview.findOne(filter);
    
    if (!stockPreview) {
      return res.status(404).json({
        success: false,
        message: 'Stock preview not found'
      });
    }

    await stockPreview.markAlertsAsRead();

    res.status(200).json({
      success: true,
      message: 'Alerts marked as read successfully'
    });
  } catch (error) {
    console.error('Mark alerts as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking alerts as read',
      error: error.message
    });
  }
};

module.exports = {
  getAllStockPreview,
  getStockSummary,
  getLowStockProducts,
  getStockAlerts,
  getStockPreviewById,
  createStockPreview,
  updateStockPreview,
  updateStockQuantities,
  toggleVisibility,
  markAlertsAsRead
}; 