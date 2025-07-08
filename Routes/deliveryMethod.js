const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getAllDeliveryMethods,
  getDeliveryMethodById,
  getDeliveryMethodsByStoreId,
  createDeliveryMethod,
  updateDeliveryMethod,
  deleteDeliveryMethod,
  toggleActiveStatus,
  setAsDefault
} = require('../Controllers/DeliveryMethodController');
const { protect, authorize } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');

const router = express.Router();

// Validation middleware for delivery method creation/update
const validateDeliveryMethod = [
  body('locationAr')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Arabic location name must be between 2 and 100 characters'),
  
  body('locationEn')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('English location name must be between 2 and 100 characters'),
  
  body('price')
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be a number between 0 and 10000'),
  
  body('whatsappNumber')
    .trim()
    .notEmpty()
    .withMessage('WhatsApp number is required'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  
  body('estimatedDays')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Estimated days must be between 1 and 30'),
  
  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Arabic description cannot exceed 500 characters'),
  
  body('descriptionEn')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('English description cannot exceed 500 characters'),
  
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer')
];

/**
 * @swagger
 * /api/delivery-methods:
 *   get:
 *     summary: Get all delivery methods
 *     description: Retrieve all delivery methods for the current store
 *     tags: [Delivery Methods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/', protect, authorize('admin', 'superadmin'), getAllDeliveryMethods);

/**
 * @swagger
 * /api/delivery-methods/store/{storeId}:
 *   get:
 *     summary: Get delivery methods by store ID
 *     description: Retrieve all delivery methods for a specific store (public endpoint)
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
 *         description: Filter by active status
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default status
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryMethod'
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/store/:storeId', getDeliveryMethodsByStoreId);

/**
 * @swagger
 * /api/delivery-methods/{id}:
 *   get:
 *     summary: Get delivery method by ID
 *     description: Retrieve a specific delivery method
 *     tags: [Delivery Methods]
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
router.get('/:id', protect, authorize('admin', 'superadmin'), getDeliveryMethodById);

/**
 * @swagger
 * /api/delivery-methods:
 *   post:
 *     summary: Create delivery method
 *     description: Create a new delivery method for the store
 *     tags: [Delivery Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationAr
 *               - locationEn
 *               - price
 *               - whatsappNumber
 *             properties:
 *               locationAr:
 *                 type: string
 *                 example: "الضفة الغربية"
 *               locationEn:
 *                 type: string
 *                 example: "West Bank"
 *               price:
 *                 type: number
 *                 example: 20
 *               whatsappNumber:
 *                 type: string
 *                 example: "+970598516067"
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateDeliveryMethod, createDeliveryMethod);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               locationAr:
 *                 type: string
 *               locationEn:
 *                 type: string
 *               price:
 *                 type: number
 *               whatsappNumber:
 *                 type: string
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
router.put('/:id', protect, authorize('admin', 'superadmin'), validateDeliveryMethod, updateDeliveryMethod);

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
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteDeliveryMethod);

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
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/toggle-active', protect, authorize('admin', 'superadmin'), toggleActiveStatus);

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
 *     responses:
 *       200:
 *         description: Default set successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/set-default', protect, authorize('admin', 'superadmin'), setAsDefault);

module.exports = router; 