const express = require('express');
const { body, validationResult } = require('express-validator');
const {
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
} = require('../Controllers/StockPreviewController');
const { protect, authorize } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');

const router = express.Router();

// Validation middleware for stock preview creation/update
const validateStockPreview = [
  body('product')
    .isMongoId()
    .withMessage('Product must be a valid MongoDB ID'),
  
  body('availableQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available quantity must be a non-negative integer'),
  
  body('reservedQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reserved quantity must be a non-negative integer'),
  
  body('soldQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sold quantity must be a non-negative integer'),
  
  body('damagedQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Damaged quantity must be a non-negative integer'),
  
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),
  
  body('outOfStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Out of stock threshold must be a non-negative integer'),
  
  body('stockStatus')
    .optional()
    .isIn(['in_stock', 'low_stock', 'out_of_stock', 'discontinued'])
    .withMessage('Invalid stock status'),
  
  body('isVisible')
    .optional()
    .isBoolean()
    .withMessage('isVisible must be a boolean')
];

// Validation middleware for stock quantity updates
const validateStockQuantities = [
  body('availableQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available quantity must be a non-negative integer'),
  
  body('reservedQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reserved quantity must be a non-negative integer'),
  
  body('soldQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sold quantity must be a non-negative integer'),
  
  body('damagedQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Damaged quantity must be a non-negative integer'),
  
  body('movementType')
    .optional()
    .isIn(['purchase', 'sale', 'return', 'damage', 'adjustment', 'reservation'])
    .withMessage('Invalid movement type'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  body('reference')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference cannot exceed 100 characters')
];

/**
 * @swagger
 * /api/stock-preview:
 *   get:
 *     summary: Get all stock preview data
 *     description: Retrieve all stock preview data for the current store
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getAllStockPreview);

/**
 * @swagger
 * /api/stock-preview/summary:
 *   get:
 *     summary: Get stock summary
 *     description: Retrieve stock summary statistics for the store
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/summary', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getStockSummary);

/**
 * @swagger
 * /api/stock-preview/low-stock:
 *   get:
 *     summary: Get low stock products
 *     description: Retrieve products with low or out of stock status
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/low-stock', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getLowStockProducts);

/**
 * @swagger
 * /api/stock-preview/alerts:
 *   get:
 *     summary: Get stock alerts
 *     description: Retrieve stock alerts for the store
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/alerts', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getStockAlerts);

/**
 * @swagger
 * /api/stock-preview/{id}:
 *   get:
 *     summary: Get stock preview by ID
 *     description: Retrieve a specific stock preview record
 *     tags: [Stock Preview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.get('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getStockPreviewById);

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
 *             type: object
 *             required:
 *               - product
 *             properties:
 *               product:
 *                 type: string
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *               availableQuantity:
 *                 type: integer
 *                 example: 50
 *               reservedQuantity:
 *                 type: integer
 *                 example: 5
 *               soldQuantity:
 *                 type: integer
 *                 example: 100
 *               damagedQuantity:
 *                 type: integer
 *                 example: 2
 *               lowStockThreshold:
 *                 type: integer
 *                 example: 10
 *               outOfStockThreshold:
 *                 type: integer
 *                 example: 0
 *               isVisible:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateStockPreview, createStockPreview);

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
 *               lowStockThreshold:
 *                 type: integer
 *               outOfStockThreshold:
 *                 type: integer
 *               stockStatus:
 *                 type: string
 *                 enum: [in_stock, low_stock, out_of_stock, discontinued]
 *               isVisible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated successfully
 *       404:
 *         description: Not found
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.put('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateStockPreview, updateStockPreview);

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
 *       404:
 *         description: Not found
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.patch('/:id/update-stock', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateStockQuantities, updateStockQuantities);

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
 *     responses:
 *       200:
 *         description: Visibility toggled successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/toggle-visibility', protect, authorize('admin', 'superadmin'), verifyStoreAccess, toggleVisibility);

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
 *     responses:
 *       200:
 *         description: Alerts marked as read successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/mark-alerts-read', protect, authorize('admin', 'superadmin'), verifyStoreAccess, markAlertsAsRead);

module.exports = router; 