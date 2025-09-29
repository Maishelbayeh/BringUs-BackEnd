const express = require('express');
const { body, query } = require('express-validator');
const ConnectPlusController = require('../Controllers/ConnectPlusController');

const router = express.Router();

/**
 * @swagger
 * /api/connect-plus/add-orders:
 *   post:
 *     summary: Add orders to Connect Plus
 *     description: Send orders to Connect Plus delivery service
 *     tags: [Connect Plus]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orders_list
 *             properties:
 *               orders_list:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - address
 *                     - customer_mobile
 *                     - customer_name
 *                     - area
 *                     - connection
 *                     - sub_area
 *                     - country
 *                     - country_code
 *                     - order_reference
 *                     - package_cost
 *                     - total_cod
 *                     - order_lines
 *                   properties:
 *                     address:
 *                       type: string
 *                       example: "test address"
 *                       description: Delivery address
 *                     customer_mobile:
 *                       type: string
 *                       example: "0595215291"
 *                       description: Customer mobile number
 *                     customer_name:
 *                       type: string
 *                       example: "Customer Name"
 *                       description: Customer name
 *                     area:
 *                       type: string
 *                       example: "الخليل"
 *                       description: Delivery area
 *                     connection:
 *                       type: integer
 *                       example: 245
 *                       description: Connection ID
 *                     sub_area:
 *                       type: string
 *                       example: "الظاهرية"
 *                       description: Delivery sub area
 *                     country:
 *                       type: string
 *                       example: "PS"
 *                       description: Country code
 *                     country_code:
 *                       type: string
 *                       example: "+972"
 *                       description: Country phone code
 *                     note:
 *                       type: string
 *                       example: "note"
 *                       description: Order notes
 *                     order_reference:
 *                       type: string
 *                       example: "abcd1241"
 *                       description: Order reference number
 *                     product_info:
 *                       type: string
 *                       example: "product_info"
 *                       description: Product information
 *                     package_cost:
 *                       type: number
 *                       example: 598
 *                       description: Package cost
 *                     total_cod:
 *                       type: string
 *                       example: "638"
 *                       description: Total cash on delivery amount
 *                     payment_method:
 *                       type: string
 *                       example: ""
 *                       description: Payment method
 *                     order_lines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: ""
 *                             description: Order line ID
 *                           product_variant:
 *                             type: integer
 *                             example: 458
 *                             description: Product variant ID
 *                           quantity:
 *                             type: integer
 *                             example: 1
 *                             description: Quantity
 *                           price:
 *                             type: string
 *                             example: "15.00"
 *                             description: Unit price
 *                           total_price:
 *                             type: string
 *                             example: "15.00"
 *                             description: Total line price
 *     responses:
 *       200:
 *         description: Orders added successfully
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
 *                   example: "Orders added to Connect Plus successfully"
 *                 data:
 *                   type: object
 *                   description: Connect Plus response
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/add-orders', [
  body('orders_list').isArray({ min: 1 }).withMessage('Orders list must be a non-empty array'),
  body('orders_list.*.address').isString().notEmpty().withMessage('Address is required'),
  body('orders_list.*.customer_mobile').isString().notEmpty().withMessage('Customer mobile is required'),
  body('orders_list.*.customer_name').isString().notEmpty().withMessage('Customer name is required'),
  body('orders_list.*.area').isString().notEmpty().withMessage('Area is required'),
  body('orders_list.*.connection').isInt().withMessage('Connection must be an integer'),
  body('orders_list.*.sub_area').isString().notEmpty().withMessage('Sub area is required'),
  body('orders_list.*.country').isString().notEmpty().withMessage('Country is required'),
  body('orders_list.*.country_code').isString().notEmpty().withMessage('Country code is required'),
  body('orders_list.*.order_reference').isString().notEmpty().withMessage('Order reference is required'),
  body('orders_list.*.package_cost').isNumeric().withMessage('Package cost must be a number'),
  body('orders_list.*.total_cod').isString().notEmpty().withMessage('Total COD is required'),
  body('orders_list.*.order_lines').isArray({ min: 1 }).withMessage('Order lines must be a non-empty array'),
  body('orders_list.*.order_lines.*.product_variant').isInt().withMessage('Product variant must be an integer'),
  body('orders_list.*.order_lines.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('orders_list.*.order_lines.*.price').isString().notEmpty().withMessage('Price is required'),
  body('orders_list.*.order_lines.*.total_price').isString().notEmpty().withMessage('Total price is required')
], ConnectPlusController.addOrders);

/**
 * @swagger
 * /api/connect-plus/get-products:
 *   post:
 *     summary: Get products from Connect Plus
 *     description: Retrieve products from Connect Plus service
 *     tags: [Connect Plus]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: integer
 *                 default: 30
 *                 example: 30
 *                 description: Number of products to retrieve
 *               filters:
 *                 type: array
 *                 default: []
 *                 example: []
 *                 description: Filters to apply
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully"
 *                 data:
 *                   type: object
 *                   description: Connect Plus products response
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/get-products', [
  body('size').optional().isInt({ min: 1, max: 1000 }).withMessage('Size must be between 1 and 1000'),
  body('filters').optional().isArray().withMessage('Filters must be an array')
], ConnectPlusController.getProducts);

/**
 * @swagger
 * /api/connect-plus/get-variants:
 *   post:
 *     summary: Get product variants from Connect Plus
 *     description: Retrieve product variants from Connect Plus service
 *     tags: [Connect Plus]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: integer
 *                 default: 30
 *                 example: 30
 *                 description: Number of variants to retrieve
 *               filters:
 *                 type: array
 *                 default: []
 *                 example: []
 *                 description: Filters to apply
 *     responses:
 *       200:
 *         description: Product variants retrieved successfully
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
 *                   example: "Product variants retrieved successfully"
 *                 data:
 *                   type: object
 *                   description: Connect Plus variants response
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/get-variants', [
  body('size').optional().isInt({ min: 1, max: 1000 }).withMessage('Size must be between 1 and 1000'),
  body('filters').optional().isArray().withMessage('Filters must be an array')
], ConnectPlusController.getVariants);

/**
 * @swagger
 * /api/connect-plus/get-delivery-companies:
 *   post:
 *     summary: Get delivery companies from Connect Plus
 *     description: Retrieve connected delivery companies from Connect Plus service
 *     tags: [Connect Plus]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: integer
 *                 default: 30
 *                 example: 30
 *                 description: Number of companies to retrieve
 *               filters:
 *                 type: array
 *                 default: []
 *                 example: []
 *                 description: Filters to apply
 *     responses:
 *       200:
 *         description: Delivery companies retrieved successfully
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
 *                   example: "Delivery companies retrieved successfully"
 *                 data:
 *                   type: object
 *                   description: Connect Plus delivery companies response
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/get-delivery-companies', [
  body('size').optional().isInt({ min: 1, max: 1000 }).withMessage('Size must be between 1 and 1000'),
  body('filters').optional().isArray().withMessage('Filters must be an array')
], ConnectPlusController.getDeliveryCompanies);

/**
 * @swagger
 * /api/connect-plus/get-delivery-fee:
 *   post:
 *     summary: Get delivery fee from Connect Plus
 *     description: Calculate delivery fee for a specific connection and area
 *     tags: [Connect Plus]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connection
 *               - area
 *             properties:
 *               connection:
 *                 type: integer
 *                 example: 245
 *                 description: Connection ID
 *               area:
 *                 type: integer
 *                 example: 10
 *                 description: Area ID
 *     responses:
 *       200:
 *         description: Delivery fee retrieved successfully
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
 *                   example: "Delivery fee retrieved successfully"
 *                 data:
 *                   type: object
 *                   description: Connect Plus delivery fee response
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/get-delivery-fee', [
  body('connection').isInt().withMessage('Connection must be an integer'),
  body('area').isInt().withMessage('Area must be an integer')
], ConnectPlusController.getDeliveryFee);

/**
 * @swagger
 * /api/connect-plus/get-area-sub-area:
 *   get:
 *     summary: Get area and sub area from Connect Plus
 *     description: Retrieve area and sub area information for a specific country
 *     tags: [Connect Plus]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *           default: "PS"
 *           example: "PS"
 *         description: Country code
 *     responses:
 *       200:
 *         description: Area and sub area retrieved successfully
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
 *                   example: "Area and sub area retrieved successfully"
 *                 data:
 *                   type: object
 *                   description: Connect Plus area and sub area response
 *       500:
 *         description: Internal server error
 */
router.get('/get-area-sub-area', [
  query('code').optional().isString().withMessage('Code must be a string')
], ConnectPlusController.getAreaSubArea);

/**
 * @swagger
 * /api/connect-plus/test-connection:
 *   get:
 *     summary: Test Connect Plus connection
 *     description: Test the connection to Connect Plus service
 *     tags: [Connect Plus]
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
 *                   example: "Connect Plus connection test successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "connected"
 *                     token:
 *                       type: string
 *                       example: "configured"
 *                     response:
 *                       type: object
 *                       description: Test response from Connect Plus
 *       500:
 *         description: Internal server error
 */
router.get('/test-connection', ConnectPlusController.testConnection);

module.exports = router;
