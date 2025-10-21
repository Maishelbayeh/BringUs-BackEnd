const express = require('express');
const { param, body } = require('express-validator');
const CustomerLahzaPaymentController = require('../Controllers/CustomerLahzaPaymentController');

const router = express.Router();

/**
 * @swagger
 * /api/customer-payment/{storeId}/initialize:
 *   post:
 *     summary: Initialize Lahza payment for customer checkout
 *     description: Initialize a payment transaction for end-user customer checkout (not admin POS)
 *     tags: [Customer Payment]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - email
 *               - first_name
 *               - last_name
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 100.50
 *                 description: Payment amount (will be converted to smallest unit)
 *               currency:
 *                 type: string
 *                 default: "ILS"
 *                 example: "ILS"
 *                 description: Currency code (ILS, USD, JOD)
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "customer@example.com"
 *                 description: Customer email address
 *               first_name:
 *                 type: string
 *                 example: "أحمد"
 *                 description: Customer first name
 *               last_name:
 *                 type: string
 *                 example: "محمد"
 *                 description: Customer last name
 *               phone:
 *                 type: string
 *                 example: "+972501234567"
 *                 description: Customer phone number
 *               callback_url:
 *                 type: string
 *                 example: "https://example.com/checkout"
 *                 description: URL to redirect customer after payment
 *               metadata:
 *                 type: object
 *                 example: {"order_number": "ORD-12345"}
 *                 description: Additional metadata for the payment
 *     responses:
 *       200:
 *         description: Payment initialized successfully
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
 *                   example: "Payment initialized successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction_id:
 *                       type: string
 *                     reference:
 *                       type: string
 *                     authorization_url:
 *                       type: string
 *                     payment_url:
 *                       type: string
 *       400:
 *         description: Bad request or store not configured
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.post('/:storeId/initialize', [
  param('storeId').isMongoId().withMessage('Invalid store ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('callback_url').optional().custom((value) => {
    // Custom validator to allow localhost URLs
    if (!value) return true; // Optional field
    
    try {
      const url = new URL(value);
      // Allow http and https protocols
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Protocol must be http or https');
      }
      return true;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }).withMessage('Callback URL must be valid'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
], CustomerLahzaPaymentController.initializeCustomerPayment);

/**
 * @swagger
 * /api/customer-payment/{storeId}/verify/{reference}:
 *   get:
 *     summary: Verify Lahza payment for customer
 *     description: Verify a customer payment transaction using the reference code
 *     tags: [Customer Payment]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference code
 *     responses:
 *       200:
 *         description: Payment verified successfully
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
 *                   example: "Payment verified successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Verification failed
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/verify/:reference', [
  param('storeId').isMongoId().withMessage('Invalid store ID'),
  param('reference').isString().notEmpty().withMessage('Reference is required')
], CustomerLahzaPaymentController.verifyCustomerPayment);

/**
 * @swagger
 * /api/customer-payment/{storeId}/status/{reference}:
 *   get:
 *     summary: Get customer payment status
 *     description: Get the current status of a customer payment transaction
 *     tags: [Customer Payment]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference code
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/status/:reference', [
  param('storeId').isMongoId().withMessage('Invalid store ID'),
  param('reference').isString().notEmpty().withMessage('Reference is required')
], CustomerLahzaPaymentController.getCustomerPaymentStatus);

/**
 * @swagger
 * /api/customer-payment/{storeId}/webhook:
 *   post:
 *     summary: Handle Lahza payment webhook for customer orders
 *     description: Webhook endpoint to receive payment notifications from Lahza and update order status to paid
 *     tags: [Customer Payment]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: "charge.success"
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook data
 *       500:
 *         description: Internal server error
 */
router.post('/:storeId/webhook', [
  param('storeId').isMongoId().withMessage('Invalid store ID')
], CustomerLahzaPaymentController.handleCustomerWebhook);

/**
 * @swagger
 * /api/customer-payment/{storeId}/update-order-status/{reference}:
 *   patch:
 *     summary: Update order status after payment (frontend fallback)
 *     description: Update order payment status to paid after successful payment verification (used as fallback when webhook doesn't fire)
 *     tags: [Customer Payment]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference code
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/customer-payment/{storeId}/poll/{reference}:
 *   get:
 *     summary: Poll payment status (checks every 10 seconds)
 *     description: Automatically checks payment status and updates order when payment succeeds or fails
 *     tags: [Customer Payment]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference code
 *     responses:
 *       200:
 *         description: Polling status response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 shouldContinuePolling:
 *                   type: boolean
 *                   description: If true, continue polling. If false, stop.
 *                 paymentStatus:
 *                   type: string
 *                   enum: [pending, paid, failed]
 *                 order:
 *                   type: object
 *       404:
 *         description: Order or store not found
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/poll/:reference', [
  param('storeId').isMongoId().withMessage('Invalid store ID'),
  param('reference').isString().notEmpty().withMessage('Reference is required')
], CustomerLahzaPaymentController.startPaymentPolling);

/**
 * @swagger
 * /api/customer-payment/polling-status:
 *   get:
 *     summary: Get active polling status
 *     description: Get list of all currently active payment polls
 *     tags: [Customer Payment]
 *     responses:
 *       200:
 *         description: Polling status retrieved successfully
 */
router.get('/polling-status', CustomerLahzaPaymentController.getPollingStatus);

router.patch('/:storeId/update-order-status/:reference', [
  param('storeId').isMongoId().withMessage('Invalid store ID'),
  param('reference').isString().notEmpty().withMessage('Reference is required')
], CustomerLahzaPaymentController.updateOrderStatusByReference);

module.exports = router;

