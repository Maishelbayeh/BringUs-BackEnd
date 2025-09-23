const express = require('express');
const { body, param } = require('express-validator');
const LahzaPaymentController = require('../Controllers/LahzaPaymentController');

const router = express.Router();

/**
 * @swagger
 * /api/lahza-payment/{storeId}/initialize:
 *   post:
 *     summary: Initialize Lahza payment
 *     description: Initialize a new payment transaction with Lahza payment gateway
 *     tags: [Lahza Payment]
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
 *               - customerName
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 100.50
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 default: "ILS"
 *                 example: "ILS"
 *                 description: Currency code
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "customer@example.com"
 *                 description: Customer email address
 *               customerName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "أحمد محمد"
 *                 description: Customer full name
 *               customerPhone:
 *                 type: string
 *                 example: "+972501234567"
 *                 description: Customer phone number
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "دفع مقابل طلب #12345"
 *                 description: Payment description
 *               metadata:
 *                 type: object
 *                 example: {"order_id": "12345", "product_ids": ["abc123", "def456"]}
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
 *                       example: "txn_123456789"
 *                     reference:
 *                       type: string
 *                       example: "ref_987654321"
 *                     amount:
 *                       type: string
 *                       example: "10050"
 *                     currency:
 *                       type: string
 *                       example: "ILS"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     payment_url:
 *                       type: string
 *                       example: "https://pay.lahza.io/pay/ref_987654321"
 *                     authorization_url:
 *                       type: string
 *                       example: "https://pay.lahza.io/auth/ref_987654321"
 *                     customer:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "أحمد محمد"
 *                         email:
 *                           type: string
 *                           example: "customer@example.com"
 *                         phone:
 *                           type: string
 *                           example: "+972501234567"
 *                     metadata:
 *                       type: object
 *                       example: {"order_id": "12345"}
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation error or store not configured
 *       500:
 *         description: Internal server error
 */
router.post('/:storeId/initialize', [
  param('storeId').isMongoId().withMessage('Invalid store ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('customerName').isLength({ min: 2, max: 100 }).withMessage('Customer name must be between 2 and 100 characters'),
  body('customerPhone').optional().isString().withMessage('Customer phone must be a string'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
], LahzaPaymentController.initializePayment);

/**
 * @swagger
 * /api/lahza-payment/{storeId}/verify:
 *   post:
 *     summary: Verify Lahza payment
 *     description: Verify a payment transaction using the reference code
 *     tags: [Lahza Payment]
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
 *               - reference
 *             properties:
 *               reference:
 *                 type: string
 *                 example: "ref_987654321"
 *                 description: Payment reference code
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
 *                   properties:
 *                     transaction_id:
 *                       type: string
 *                       example: "txn_123456789"
 *                     reference:
 *                       type: string
 *                       example: "ref_987654321"
 *                     amount:
 *                       type: string
 *                       example: "10050"
 *                     currency:
 *                       type: string
 *                       example: "ILS"
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     gateway_response:
 *                       type: object
 *                       description: Gateway response details
 *                     customer:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "أحمد محمد"
 *                         email:
 *                           type: string
 *                           example: "customer@example.com"
 *                         phone:
 *                           type: string
 *                           example: "+972501234567"
 *                     metadata:
 *                       type: object
 *                       example: {"order_id": "12345"}
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     paid_at:
 *                       type: string
 *                       format: date-time
 *                     authorization:
 *                       type: object
 *                       description: Authorization details
 *       400:
 *         description: Bad request - validation error or store not configured
 *       500:
 *         description: Internal server error
 */
router.post('/:storeId/verify', [
  param('storeId').isMongoId().withMessage('Invalid store ID'),
  body('reference').isString().notEmpty().withMessage('Reference is required')
], LahzaPaymentController.verifyPayment);

/**
 * @swagger
 * /api/lahza-payment/{storeId}/status/{reference}:
 *   get:
 *     summary: Get payment status
 *     description: Get the current status of a payment transaction
 *     tags: [Lahza Payment]
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
 *                   example: "Payment status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction_id:
 *                       type: string
 *                       example: "txn_123456789"
 *                     reference:
 *                       type: string
 *                       example: "ref_987654321"
 *                     amount:
 *                       type: string
 *                       example: "10050"
 *                     currency:
 *                       type: string
 *                       example: "ILS"
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     gateway_response:
 *                       type: object
 *                       description: Gateway response details
 *                     customer:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "أحمد محمد"
 *                         email:
 *                           type: string
 *                           example: "customer@example.com"
 *                         phone:
 *                           type: string
 *                           example: "+972501234567"
 *                     metadata:
 *                       type: object
 *                       example: {"order_id": "12345"}
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     paid_at:
 *                       type: string
 *                       format: date-time
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - store not configured
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/status/:reference', [
  param('storeId').isMongoId().withMessage('Invalid store ID'),
  param('reference').isString().notEmpty().withMessage('Reference is required')
], LahzaPaymentController.getPaymentStatus);

/**
 * @swagger
 * /api/lahza-payment/{storeId}/test-connection:
 *   get:
 *     summary: Test Lahza connection
 *     description: Test the connection to Lahza payment gateway for a store
 *     tags: [Lahza Payment]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Connection test successful
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
 *                   example: "Lahza connection test successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Connection successful"
 *                     store_id:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     configured:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - store not configured
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/test-connection', [
  param('storeId').isMongoId().withMessage('Invalid store ID')
], LahzaPaymentController.testConnection);

module.exports = router;
