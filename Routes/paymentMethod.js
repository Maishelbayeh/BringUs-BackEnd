const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getAllPaymentMethods,
  getPaymentMethodById,
  getPaymentMethodsByStoreId,
  createPaymentMethod,
  createPaymentMethodWithFiles,
  updatePaymentMethod,
  updatePaymentMethodWithFiles,
  deletePaymentMethod,
  toggleActiveStatus,
  setAsDefault,
  uploadLogo,
  uploadQrCode,
  uploadPaymentImage,
  removePaymentImage,
  upload
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
    .isIn(['cash', 'card', 'digital_wallet', 'bank_transfer', 'qr_code', 'other'])
    .withMessage('Method type must be one of: cash, card, digital_wallet, bank_transfer, qr_code, other'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
  
  // QR Code validation
  body('qrCode.enabled')
    .optional()
    .isBoolean()
    .withMessage('qrCode.enabled must be a boolean'),
  
  body('qrCode.qrCodeUrl')
    .optional()
    .isURL()
    .withMessage('QR Code URL must be a valid URL'),
  
  body('qrCode.qrCodeImage')
    .optional()
    .isURL()
    .withMessage('QR Code image URL must be a valid URL'),
  
  body('qrCode.qrCodeData')
    .optional()
    .isString()
    .withMessage('QR Code data must be a string'),
  
  // Payment Images validation
  body('paymentImages')
    .optional()
    .isArray()
    .withMessage('Payment images must be an array'),
  
  body('paymentImages.*.imageUrl')
    .optional()
    .isURL()
    .withMessage('Payment image URL must be a valid URL'),
  
  body('paymentImages.*.imageType')
    .optional()
    .isIn(['logo', 'banner', 'qr_code', 'payment_screenshot', 'other'])
    .withMessage('Image type must be one of: logo, banner, qr_code, payment_screenshot, other'),
  
  body('paymentImages.*.altText')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Alt text cannot exceed 200 characters')
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
 * /api/payment-methods/store/{storeId}:
 *   get:
 *     summary: Get payment methods by store ID
 *     description: Retrieve payment methods for a specific store (admin and superadmin users)
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439012"
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
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied (admin/superadmin required or insufficient store access)
 *       404:
 *         description: Store not found
 */
router.get('/store/:storeId', protect, authorize('admin', 'superadmin'), getPaymentMethodsByStoreId);

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
 * /api/payment-methods/with-files:
 *   post:
 *     summary: Create payment method with files
 *     description: Create a new payment method for the store with file uploads
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *                 enum: [cash, card, digital_wallet, bank_transfer, qr_code, other]
 *                 example: "cash"
 *               descriptionAr:
 *                 type: string
 *                 example: "ادفع عند استلام طلبك"
 *               descriptionEn:
 *                 type: string
 *                 example: "Pay when you receive your order"
 *               isActive:
 *                 type: string
 *                 example: "true"
 *               isDefault:
 *                 type: string
 *                 example: "false"
 *               logoUrl:
 *                 type: string
 *                 example: "https://example.com/logo.png"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file
 *               qrCodeImage:
 *                 type: string
 *                 format: binary
 *                 description: QR code image file
 *               qrCode[enabled]:
 *                 type: string
 *                 example: "true"
 *               qrCode[qrCodeUrl]:
 *                 type: string
 *                 example: "https://example.com/qr.png"
 *               qrCode[qrCodeData]:
 *                 type: string
 *                 example: "payment://qr-data"
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/with-files', protect, authorize('admin', 'superadmin'), verifyStoreAccess, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'qrCodeImage', maxCount: 1 },
  { name: 'paymentImages', maxCount: 10 }
]), createPaymentMethodWithFiles);

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
 *                 enum: [cash, card, digital_wallet, bank_transfer, qr_code, other]
 *                 example: "cash"
 *               descriptionAr:
 *                 type: string
 *                 example: "ادفع عند استلام طلبك"
 *               descriptionEn:
 *                 type: string
 *                 example: "Pay when you receive your order"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *               logoUrl:
 *                 type: string
 *                 example: "https://example.com/logo.png"
 *               qrCode:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: false
 *                   qrCodeUrl:
 *                     type: string
 *                     example: "https://example.com/qr.png"
 *                   qrCodeImage:
 *                     type: string
 *                     example: "https://example.com/qr-image.png"
 *                   qrCodeData:
 *                     type: string
 *                     example: "payment://qr-data"
 *               paymentImages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       example: "https://example.com/payment-image.png"
 *                     imageType:
 *                       type: string
 *                       enum: [logo, banner, qr_code, payment_screenshot, other]
 *                       example: "payment_screenshot"
 *                     altText:
 *                       type: string
 *                       example: "Payment method screenshot"
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
 * /api/payment-methods/{id}/with-files:
 *   put:
 *     summary: Update payment method with files
 *     description: Update an existing payment method with file uploads
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titleAr:
 *                 type: string
 *                 example: "الدفع عند الاستلام"
 *               titleEn:
 *                 type: string
 *                 example: "Cash on Delivery"
 *               methodType:
 *                 type: string
 *                 enum: [cash, card, digital_wallet, bank_transfer, qr_code, other]
 *                 example: "cash"
 *               descriptionAr:
 *                 type: string
 *                 example: "ادفع عند استلام طلبك"
 *               descriptionEn:
 *                 type: string
 *                 example: "Pay when you receive your order"
 *               isActive:
 *                 type: string
 *                 example: "true"
 *               isDefault:
 *                 type: string
 *                 example: "false"
 *               logoUrl:
 *                 type: string
 *                 example: "https://example.com/logo.png"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file
 *               qrCodeImage:
 *                 type: string
 *                 format: binary
 *                 description: QR code image file
 *               qrCode[enabled]:
 *                 type: string
 *                 example: "true"
 *               qrCode[qrCodeUrl]:
 *                 type: string
 *                 example: "https://example.com/qr.png"
 *               qrCode[qrCodeData]:
 *                 type: string
 *                 example: "payment://qr-data"
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
router.put('/:id/with-files', protect, authorize('admin', 'superadmin'), verifyStoreAccess, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'qrCodeImage', maxCount: 1 },
  { name: 'paymentImages', maxCount: 10 }
]), updatePaymentMethodWithFiles);

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
 *               descriptionAr:
 *                 type: string
 *               descriptionEn:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *               logoUrl:
 *                 type: string
 *               qrCode:
 *                 type: object
 *               paymentImages:
 *                 type: array
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
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment method not found
 *       403:
 *         description: Access denied
 */
router.post('/:id/upload-logo', protect, authorize('admin', 'superadmin'), verifyStoreAccess, upload.single('logo'), uploadLogo);

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
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment method not found
 *       403:
 *         description: Access denied
 */
router.post('/:id/upload-qr-code', protect, authorize('admin', 'superadmin'), verifyStoreAccess, upload.single('qrCodeImage'), uploadQrCode);

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
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment method not found
 *       403:
 *         description: Access denied
 */
router.post('/:id/upload-payment-image', protect, authorize('admin', 'superadmin'), verifyStoreAccess, upload.single('image'), uploadPaymentImage);

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
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment method or image not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id/remove-payment-image/:imageIndex', protect, authorize('admin', 'superadmin'), verifyStoreAccess, removePaymentImage);

module.exports = router; 