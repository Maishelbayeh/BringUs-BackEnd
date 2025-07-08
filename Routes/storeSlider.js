const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getAllStoreSliders,
  getStoreSliderById,
  createStoreSlider,
  updateStoreSlider,
  deleteStoreSlider,
  toggleActiveStatus,
  incrementViews,
  incrementClicks,
  getActiveByType
} = require('../Controllers/StoreSliderController');
const { protect, authorize } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');

const router = express.Router();

// Validation middleware for store slider creation/update
const validateStoreSlider = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('type')
    .isIn(['slider', 'video'])
    .withMessage('Type must be either "slider" or "video"'),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Custom validation for slider type
const validateSliderType = (req, res, next) => {
  if (req.body.type === 'slider' && !req.body.imageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Image URL is required for slider type'
    });
  }
  if (req.body.type === 'video' && !req.body.videoUrl) {
    return res.status(400).json({
      success: false,
      message: 'Video URL is required for video type'
    });
  }
  next();
};

/**
 * @swagger
 * /api/store-sliders:
 *   get:
 *     summary: Get all store sliders
 *     description: Retrieve all store sliders for the current store
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getAllStoreSliders);

/**
 * @swagger
 * /api/store-sliders/active/{type}:
 *   get:
 *     summary: Get active store sliders by type
 *     description: Retrieve active store sliders filtered by type
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [slider, video]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid type
 *       403:
 *         description: Access denied
 */
router.get('/active/:type', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getActiveByType);

/**
 * @swagger
 * /api/store-sliders/{id}:
 *   get:
 *     summary: Get store slider by ID
 *     description: Retrieve a specific store slider
 *     tags: [Store Sliders]
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
router.get('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getStoreSliderById);

/**
 * @swagger
 * /api/store-sliders:
 *   post:
 *     summary: Create store slider
 *     description: Create a new store slider for the store
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Product Launch"
 *               description:
 *                 type: string
 *                 example: "Check out our latest products"
 *               type:
 *                 type: string
 *                 enum: [slider, video]
 *                 example: "slider"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               videoUrl:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *               order:
 *                 type: integer
 *                 example: 1
 *               isActive:
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
router.post('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateStoreSlider, validateSliderType, createStoreSlider);

/**
 * @swagger
 * /api/store-sliders/{id}:
 *   put:
 *     summary: Update store slider
 *     description: Update an existing store slider
 *     tags: [Store Sliders]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [slider, video]
 *               imageUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               order:
 *                 type: integer
 *               isActive:
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
router.put('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateStoreSlider, validateSliderType, updateStoreSlider);

/**
 * @swagger
 * /api/store-sliders/{id}:
 *   delete:
 *     summary: Delete store slider
 *     description: Delete a store slider
 *     tags: [Store Sliders]
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
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, deleteStoreSlider);

/**
 * @swagger
 * /api/store-sliders/{id}/toggle-active:
 *   patch:
 *     summary: Toggle store slider active status
 *     description: Toggle the active status of a store slider
 *     tags: [Store Sliders]
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
 *         description: Status toggled successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/toggle-active', protect, authorize('admin', 'superadmin'), verifyStoreAccess, toggleActiveStatus);

/**
 * @swagger
 * /api/store-sliders/{id}/increment-views:
 *   patch:
 *     summary: Increment store slider views
 *     description: Increment the view count of a store slider
 *     tags: [Store Sliders]
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
 *         description: Views incremented successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/increment-views', protect, authorize('admin', 'superadmin'), verifyStoreAccess, incrementViews);

/**
 * @swagger
 * /api/store-sliders/{id}/increment-clicks:
 *   patch:
 *     summary: Increment store slider clicks
 *     description: Increment the click count of a store slider
 *     tags: [Store Sliders]
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
 *         description: Clicks incremented successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/increment-clicks', protect, authorize('admin', 'superadmin'), verifyStoreAccess, incrementClicks);

module.exports = router; 