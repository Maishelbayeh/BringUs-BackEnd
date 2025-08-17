const express = require('express');
const { body } = require('express-validator');
const {
  getAllAdvertisements,
  getActiveAdvertisement,
  getAdvertisementById,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  toggleActiveStatus,
  incrementClick,
  getAdvertisementStats,
  uploadImage
} = require('../Controllers/AdvertisementController');
const { protect } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');
const multer = require('multer');
const upload = multer(); // In-memory storage

const router = express.Router();

/**
 * @swagger
 * /api/advertisements/stores/{storeId}/advertisements/active:
 *   get:
 *     summary: Get active advertisement for a store (Public)
 *     description: Retrieve the currently active advertisement for a store - No authentication required
 *     tags: [Advertisements]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Advertisement'
 *                 message:
 *                   type: string
 *                   example: "Active advertisement retrieved successfully"
 *       404:
 *         description: No active advertisement found
 */
// Public route for active advertisement (no authentication required)
router.get('/stores/:storeId/advertisements/active', getActiveAdvertisement);

// Apply authentication and store access middleware to all other routes
router.use(protect);
router.use('/stores/:storeId', verifyStoreAccess);

// Validation middleware for advertisement creation/update
const validateAdvertisement = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('htmlContent')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('HTML content is required and cannot exceed 5000 characters'),
  
  body('backgroundImageUrl')
    .optional()
    .isURL()
    .withMessage('Background image URL must be a valid URL'),
  
  body('position')
    .optional()
    .isIn(['top', 'bottom', 'sidebar', 'popup', 'banner'])
    .withMessage('Position must be one of: top, bottom, sidebar, popup, banner'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  body('priority')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Priority must be between 1 and 10')
];

/**
 * @swagger
 * /api/advertisements/stores/{storeId}/advertisements:
 *   get:
 *     summary: Get all advertisements for a store
 *     description: Retrieve all advertisements for a specific store
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
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
 *         description: Number of advertisements per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *           enum: [top, bottom, sidebar, popup, banner]
 *         description: Filter by position
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/stores/:storeId/advertisements', getAllAdvertisements);



/**
 * @swagger
 * /api/advertisements/stores/{storeId}/advertisements/stats:
 *   get:
 *     summary: Get advertisement statistics for a store
 *     description: Retrieve statistics for all advertisements in a store
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/stores/:storeId/advertisements/stats', getAdvertisementStats);

/**
 * @swagger
 * /api/advertisements/stores/{storeId}/advertisements/{id}:
 *   get:
 *     summary: Get advertisement by ID
 *     description: Retrieve a specific advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */
router.get('/stores/:storeId/advertisements/:advertisementId', getAdvertisementById);

/**
 * @swagger
 * /api/advertisements/stores/{storeId}/advertisements:
 *   post:
 *     summary: Create advertisement
 *     description: Create a new advertisement for a store
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
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
 *             required:
 *               - title
 *               - htmlContent
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Offer"
 *               description:
 *                 type: string
 *                 example: "Special discount for Ramadan"
 *               htmlContent:
 *                 type: string
 *                 example: "<div style='background: red; color: white; padding: 20px;'>Special Offer!</div>"
 *               backgroundImageUrl:
 *                 type: string
 *                 example: "https://example.com/bg.jpg"
 *               position:
 *                 type: string
 *                 enum: [top, bottom, sidebar, popup, banner]
 *                 example: "top"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               priority:
 *                 type: number
 *                 example: 5
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 */
router.post('/stores/:storeId/advertisements', validateAdvertisement, createAdvertisement);

/**
 * @swagger
 * /api/advertisements/stores/{storeId}/advertisements/{id}:
 *   put:
 *     summary: Update advertisement
 *     description: Update an existing advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
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
 *               htmlContent:
 *                 type: string
 *               backgroundImageUrl:
 *                 type: string
 *               position:
 *                 type: string
 *                 enum: [top, bottom, sidebar, popup, banner]
 *               isActive:
 *                 type: boolean
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               priority:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated successfully
 *       404:
 *         description: Not found
 *       400:
 *         description: Validation error
 */
router.put('/stores/:storeId/advertisements/:advertisementId', validateAdvertisement, updateAdvertisement);

/**
 * @swagger
 * /api/advertisements/stores/{storeId}/advertisements/{id}:
 *   delete:
 *     summary: Delete advertisement
 *     description: Delete an advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 */
router.delete('/stores/:storeId/advertisements/:advertisementId', deleteAdvertisement);

/**
 * @swagger
 * /api/advertisements/stores/{storeId}/advertisements/{id}/toggle-active:
 *   patch:
 *     summary: Toggle advertisement active status
 *     description: Toggle the active status of an advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *       404:
 *         description: Not found
 */
router.patch('/stores/:storeId/advertisements/:advertisementId/toggle-active', toggleActiveStatus);

/**
 * @swagger
 * /api/advertisements/stores/{storeId}/advertisements/{id}/click:
 *   post:
 *     summary: Increment advertisement click count
 *     description: Increment the click count for an advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     responses:
 *       200:
 *         description: Click count updated successfully
 *       404:
 *         description: Not found
 */
router.post('/stores/:storeId/advertisements/:advertisementId/click', incrementClick);

/**
 * @swagger
 * /api/advertisements/upload-image:
 *   post:
 *     summary: Upload an image
 *     description: Upload a new image file.
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Validation error
 */
router.post('/upload-image', upload.single('file'), uploadImage);

module.exports = router; 