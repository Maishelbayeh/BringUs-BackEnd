const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getAllAffiliates,
  getAffiliateStats,
  getTopPerformers,
  getAffiliateById,
  getAffiliatesByStoreId,
  createAffiliate,
  updateAffiliate,
  verifyAffiliate,
  getAffiliatePayments,
  createAffiliatePayment,
  deleteAffiliate,
  getAffiliateByCode,
  updateAffiliationById,
} = require('../Controllers/AffiliationController');
const { protect, authorize } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');

const router = express.Router();

// Validation middleware for affiliate creation/update
const validateAffiliate = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('mobile')
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid mobile number'),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  
  body('percent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percentage must be between 0 and 100'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Suspended', 'Pending'])
    .withMessage('Invalid status value'),
  
  body('bankInfo.bankName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bank name cannot exceed 100 characters'),
  
  body('bankInfo.accountNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Account number cannot exceed 50 characters'),
  
  body('bankInfo.iban')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('IBAN cannot exceed 50 characters'),
  
  body('bankInfo.swiftCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('SWIFT code cannot exceed 20 characters'),
  
  body('settings.autoPayment')
    .optional()
    .isBoolean()
    .withMessage('Auto payment must be a boolean'),
  
  body('settings.paymentThreshold')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Payment threshold must be a positive number'),
  
  body('settings.paymentMethod')
    .optional()
    .isIn(['bank_transfer', 'paypal', 'cash', 'check'])
    .withMessage('Invalid payment method'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Validation middleware for affiliate payment
const validateAffiliatePayment = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),
  
  body('paymentMethod')
    .isIn(['bank_transfer', 'paypal', 'cash', 'check', 'credit_card'])
    .withMessage('Invalid payment method'),
  
  body('paymentDate')
    .isISO8601()
    .withMessage('Please enter a valid payment date'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('bankTransfer.bankName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bank name cannot exceed 100 characters'),
  
  body('bankTransfer.accountNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Account number cannot exceed 50 characters'),
  
  body('bankTransfer.iban')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('IBAN cannot exceed 50 characters'),
  
  body('bankTransfer.swiftCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('SWIFT code cannot exceed 20 characters'),
  
  body('bankTransfer.beneficiaryName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Beneficiary name cannot exceed 100 characters'),
  
  body('paypal.paypalEmail')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid PayPal email'),
  
  body('paypal.paypalTransactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('PayPal transaction ID cannot exceed 100 characters')
];

/**
 * @swagger
 * /api/affiliations:
 *   get:
 *     summary: Get all affiliates
 *     description: Retrieve all affiliates for the current store
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getAllAffiliates);

/**
 * @swagger
 * /api/affiliations/stats:
 *   get:
 *     summary: Get affiliate statistics
 *     description: Retrieve affiliate statistics for the store
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/stats', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getAffiliateStats);

/**
 * @swagger
 * /api/affiliations/store/{storeId}:
 *   get:
 *     summary: Get affiliates by store ID
 *     description: Retrieve all affiliates for a specific store (public endpoint)
 *     tags: [Affiliation]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439012"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Suspended, Pending]
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of affiliates to return
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/store/:storeId', getAffiliatesByStoreId);

/**
 * @swagger
 * /api/affiliations/code/{affiliateCode}:
 *   get:
 *     summary: Get affiliate by code
 *     description: Get affiliate information by affiliate code (public endpoint)
 *     tags: [Affiliation]
 *     parameters:
 *       - in: path
 *         name: affiliateCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliate code
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Affiliate found successfully
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
router.get('/code/:affiliateCode', getAffiliateByCode);

/**
 * @swagger
 * /api/affiliations/public/{id}:
 *   patch:
 *     summary: Update affiliation by ID (Public API - No Auth Required)
 *     description: Update specific fields of an affiliation by ID without authentication
 *     tags: [Affiliation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliation ID
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID for validation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Omar"
 *               lastName:
 *                 type: string
 *                 example: "Khaled"
 *               mobile:
 *                 type: string
 *                 example: "+970599888888"
 *               address:
 *                 type: string
 *                 example: "Hebron, Palestine"
 *               bankInfo:
 *                 type: object
 *                 properties:
 *                   bankName:
 *                     type: string
 *                     example: "Bank of Palestine"
 *                   accountNumber:
 *                     type: string
 *                     example: "1234567890"
 *                   iban:
 *                     type: string
 *                     example: "PS12PALS123456789012345678901"
 *                   swiftCode:
 *                     type: string
 *                     example: "PALSPS22"
 *               notes:
 *                 type: string
 *                 example: "Updated information"
 *     responses:
 *       200:
 *         description: Affiliation updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Affiliation not found
 *       500:
 *         description: Internal server error
 */
router.patch('/public/:id', updateAffiliationById);

/**
 * @swagger
 * /api/affiliations/top-performers:
 *   get:
 *     summary: Get top performing affiliates
 *     description: Retrieve top performing affiliates by sales
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/top-performers', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getTopPerformers);

/**
 * @swagger
 * /api/affiliations/{id}:
 *   get:
 *     summary: Get affiliate by ID
 *     description: Retrieve a specific affiliate by their ID
 *     tags: [Affiliation]
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
router.get('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getAffiliateById);

/**
 * @swagger
 * /api/affiliations:
 *   post:
 *     summary: Create new affiliate
 *     description: Create a new affiliate partner
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - mobile
 *               - address
 *               - percent
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Omar"
 *               lastName:
 *                 type: string
 *                 example: "Khaled"
 *               email:
 *                 type: string
 *                 example: "omar@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               mobile:
 *                 type: string
 *                 example: "+970599888888"
 *               address:
 *                 type: string
 *                 example: "Hebron, Palestine"
 *               percent:
 *                 type: number
 *                 example: 8
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Suspended, Pending]
 *                 example: "Active"
 *               bankInfo:
 *                 type: object
 *                 properties:
 *                   bankName:
 *                     type: string
 *                     example: "Bank of Palestine"
 *                   accountNumber:
 *                     type: string
 *                     example: "1234567890"
 *                   iban:
 *                     type: string
 *                     example: "PS12PALS123456789012345678901"
 *                   swiftCode:
 *                     type: string
 *                     example: "PALSPS22"
 *               settings:
 *                 type: object
 *                 properties:
 *                   autoPayment:
 *                     type: boolean
 *                     example: false
 *                   paymentThreshold:
 *                     type: number
 *                     example: 100
 *                   paymentMethod:
 *                     type: string
 *                     enum: [bank_transfer, paypal, cash, check]
 *                     example: "bank_transfer"
 *               notes:
 *                 type: string
 *                 example: "New affiliate partner"
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateAffiliate, createAffiliate);

/**
 * @swagger
 * /api/affiliations/{id}:
 *   put:
 *     summary: Update affiliate
 *     description: Update an existing affiliate
 *     tags: [Affiliation]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               mobile:
 *                 type: string
 *               address:
 *                 type: string
 *               percent:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Suspended, Pending]
 *               bankInfo:
 *                 type: object
 *               settings:
 *                 type: object
 *               notes:
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
router.put('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateAffiliate, updateAffiliate);

/**
 * @swagger
 * /api/affiliations/{id}/verify:
 *   patch:
 *     summary: Verify affiliate
 *     description: Verify an affiliate account
 *     tags: [Affiliation]
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
 *         description: Verified successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/verify', protect, authorize('admin', 'superadmin'), verifyStoreAccess, verifyAffiliate);

/**
 * @swagger
 * /api/affiliations/{id}/payments:
 *   get:
 *     summary: Get affiliate payments
 *     description: Retrieve payment history for a specific affiliate
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.get('/:id/payments', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getAffiliatePayments);

/**
 * @swagger
 * /api/affiliations/{id}/payments:
 *   post:
 *     summary: Create affiliate payment
 *     description: Create a new payment for an affiliate
 *     tags: [Affiliation]
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
 *             required:
 *               - amount
 *               - paymentMethod
 *               - paymentDate
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, paypal, cash, check, credit_card]
 *                 example: "bank_transfer"
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               description:
 *                 type: string
 *                 example: "Monthly commission payment"
 *               notes:
 *                 type: string
 *                 example: "Payment for January 2024"
 *               bankTransfer:
 *                 type: object
 *                 properties:
 *                   bankName:
 *                     type: string
 *                     example: "Bank of Palestine"
 *                   accountNumber:
 *                     type: string
 *                     example: "1234567890"
 *                   iban:
 *                     type: string
 *                     example: "PS12PALS123456789012345678901"
 *                   swiftCode:
 *                     type: string
 *                     example: "PALSPS22"
 *                   beneficiaryName:
 *                     type: string
 *                     example: "Omar Khaled"
 *               paypal:
 *                 type: object
 *                 properties:
 *                   paypalEmail:
 *                     type: string
 *                     example: "omar@paypal.com"
 *                   paypalTransactionId:
 *                     type: string
 *                     example: "TXN123456789"
 *     responses:
 *       201:
 *         description: Created successfully
 *       404:
 *         description: Not found
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/:id/payments', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateAffiliatePayment, createAffiliatePayment);

/**
 * @swagger
 * /api/affiliations/{id}:
 *   delete:
 *     summary: Delete affiliate
 *     description: Delete an affiliate by ID
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliate ID
 *     responses:
 *       200:
 *         description: Affiliate deleted successfully
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, deleteAffiliate);

module.exports = router; 