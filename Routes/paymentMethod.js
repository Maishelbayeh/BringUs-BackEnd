const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  toggleActiveStatus,
  setAsDefault
} = require('../Controllers/PaymentMethodController');
const { protect, authorize } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');

const router = express.Router();

// Validation middleware for payment method creation/update
const validatePaymentMethod = [
  body('titleAr')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Arabic title must be between 2 and 100 characters'),
  
  body('titleEn')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('English title must be between 2 and 100 characters'),
  
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
  
  body('methodType')
    .isIn(['cash', 'card', 'digital_wallet', 'bank_transfer', 'other'])
    .withMessage('Method type must be one of: cash, card, digital_wallet, bank_transfer, other'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  
  body('processingFee')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Processing fee must be between 0 and 100'),
  
  body('minimumAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be non-negative'),
  
  body('maximumAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be non-negative'),
  
  body('supportedCurrencies')
    .optional()
    .isArray()
    .withMessage('Supported currencies must be an array'),
  
  body('supportedCurrencies.*')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency codes must be exactly 3 characters'),
  
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
  
  body('requiresCardNumber')
    .optional()
    .isBoolean()
    .withMessage('requiresCardNumber must be a boolean'),
  
  body('requiresExpiryDate')
    .optional()
    .isBoolean()
    .withMessage('requiresExpiryDate must be a boolean'),
  
  body('requiresCVV')
    .optional()
    .isBoolean()
    .withMessage('requiresCVV must be a boolean'),
  
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer')
];

/**
 * @swagger
 * /api/payment-methods:
 *   get:
 *     summary: Get all payment methods
 *     description: Retrieve all payment methods for the current store
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getAllPaymentMethods);

/**
 * @swagger
 * /api/payment-methods/{id}:
 *   get:
 *     summary: Get payment method by ID
 *     description: Retrieve a specific payment method
 *     tags: [Payment Methods]
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
router.get('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getPaymentMethodById);

/**
 * @swagger
 * /api/payment-methods:
 *   post:
 *     summary: Create payment method
 *     description: Create a new payment method for the store
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titleAr
 *               - titleEn
 *               - methodType
 *             properties:
 *               titleAr:
 *                 type: string
 *                 example: "الدفع عند الاستلام"
 *               titleEn:
 *                 type: string
 *                 example: "Cash on Delivery"
 *               methodType:
 *                 type: string
 *                 enum: [cash, card, digital_wallet, bank_transfer, other]
 *                 example: "cash"
 *               processingFee:
 *                 type: number
 *                 example: 0
 *               minimumAmount:
 *                 type: number
 *                 example: 0
 *               maximumAmount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validatePaymentMethod, createPaymentMethod);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titleAr:
 *                 type: string
 *               titleEn:
 *                 type: string
 *               methodType:
 *                 type: string
 *               processingFee:
 *                 type: number
 *               minimumAmount:
 *                 type: number
 *               maximumAmount:
 *                 type: number
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
router.put('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validatePaymentMethod, updatePaymentMethod);

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
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, deletePaymentMethod);

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
 *     responses:
 *       200:
 *         description: Default set successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/set-default', protect, authorize('admin', 'superadmin'), verifyStoreAccess, setAsDefault);

module.exports = router; 