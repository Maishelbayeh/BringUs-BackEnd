const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getPOSCarts,
  createPOSCart,
  getPOSCart,
  addToPOSCart,
  updatePOSCartItem,
  removeFromPOSCart,
  updatePOSCartCustomer,
  applyDiscount,
  completePOSCart,
  clearPOSCart,
  deletePOSCart
} = require('../Controllers/POSCartController');

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/pos-cart/{storeId}:
 *   get:
 *     summary: Get all POS carts for admin
 *     description: Retrieve all POS carts for the authenticated admin in a specific store
 *     tags: [POS Cart]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           default: active
 *         description: Filter carts by status
 *     responses:
 *       200:
 *         description: POS carts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/POSCart'
 *                 count:
 *                   type: number
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.get('/:storeId', getPOSCarts);

/**
 * @swagger
 * /api/pos-cart/{storeId}:
 *   post:
 *     summary: Create new POS cart
 *     description: Create a new POS cart for admin multi-tab functionality
 *     tags: [POS Cart]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartName:
 *                 type: string
 *                 description: Name for the cart (optional)
 *                 example: "Customer 1"
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   email:
 *                     type: string
 *                     example: "john@example.com"
 *                   address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: "123 Main St"
 *                       city:
 *                         type: string
 *                         example: "New York"
 *                       state:
 *                         type: string
 *                         example: "NY"
 *                       zipCode:
 *                         type: string
 *                         example: "10001"
 *                       country:
 *                         type: string
 *                         example: "United States"
 *     responses:
 *       201:
 *         description: POS cart created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     cartId:
 *                       type: string
 *                     sessionId:
 *                       type: string
 *                     cartName:
 *                       type: string
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.post('/:storeId', [
  body('cartName').optional().isString().withMessage('Cart name must be a string'),
  body('customer.name').optional().isString().withMessage('Customer name must be a string'),
  body('customer.phone').optional().isString().withMessage('Customer phone must be a string'),
  body('customer.email').optional().isEmail().withMessage('Customer email must be valid')
], createPOSCart);

/**
 * @swagger
 * /api/pos-cart/cart/{cartId}:
 *   get:
 *     summary: Get specific POS cart
 *     description: Retrieve details of a specific POS cart
 *     tags: [POS Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: POS Cart ID
 *     responses:
 *       200:
 *         description: POS cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/POSCart'
 *       404:
 *         description: POS cart not found
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.get('/cart/:cartId', getPOSCart);

/**
 * @swagger
 * /api/pos-cart/{cartId}/add:
 *   post:
 *     summary: Add item to POS cart
 *     description: Add a product to the POS cart with specifications and colors
 *     tags: [POS Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: POS Cart ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - quantity
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to add
 *               variant:
 *                 type: string
 *                 description: Product variant (optional)
 *               selectedSpecifications:
 *                 type: array
 *                 description: Selected product specifications
 *                 items:
 *                   type: object
 *                   properties:
 *                     specificationId:
 *                       type: string
 *                     valueId:
 *                       type: string
 *                     valueAr:
 *                       type: string
 *                     valueEn:
 *                       type: string
 *                     titleAr:
 *                       type: string
 *                     titleEn:
 *                       type: string
 *               selectedColors:
 *                 type: array
 *                 description: Selected product colors
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Item added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/POSCart'
 *       400:
 *         description: Validation error or insufficient stock
 *       404:
 *         description: POS cart or product not found
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.post('/:cartId/add', [
  body('product').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('variant').optional().isString().withMessage('Variant must be a string'),
  body('selectedSpecifications').optional().isArray().withMessage('Selected specifications must be an array'),
  body('selectedColors').optional().isArray().withMessage('Selected colors must be an array')
], addToPOSCart);

/**
 * @swagger
 * /api/pos-cart/{cartId}/item/{itemId}:
 *   put:
 *     summary: Update item in POS cart
 *     description: Update quantity of an item in the POS cart
 *     tags: [POS Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: POS Cart ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: New quantity (0 to remove item)
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/POSCart'
 *       400:
 *         description: Validation error
 *       404:
 *         description: POS cart or item not found
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.put('/:cartId/item/:itemId', [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or greater')
], updatePOSCartItem);

/**
 * @swagger
 * /api/pos-cart/{cartId}/item/{itemId}:
 *   delete:
 *     summary: Remove item from POS cart
 *     description: Remove an item from the POS cart
 *     tags: [POS Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: POS Cart ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart Item ID
 *     responses:
 *       200:
 *         description: Item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/POSCart'
 *       404:
 *         description: POS cart or item not found
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.delete('/:cartId/item/:itemId', removeFromPOSCart);

/**
 * @swagger
 * /api/pos-cart/{cartId}/customer:
 *   put:
 *     summary: Update customer information
 *     description: Update customer information for the POS cart
 *     tags: [POS Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: POS Cart ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   email:
 *                     type: string
 *                     example: "john@example.com"
 *                   address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: "123 Main St"
 *                       city:
 *                         type: string
 *                         example: "New York"
 *                       state:
 *                         type: string
 *                         example: "NY"
 *                       zipCode:
 *                         type: string
 *                         example: "10001"
 *                       country:
 *                         type: string
 *                         example: "United States"
 *     responses:
 *       200:
 *         description: Customer information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/POSCart'
 *       404:
 *         description: POS cart not found
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.put('/:cartId/customer', [
  body('customer.name').optional().isString().withMessage('Customer name must be a string'),
  body('customer.phone').optional().isString().withMessage('Customer phone must be a string'),
  body('customer.email').optional().isEmail().withMessage('Customer email must be valid')
], updatePOSCartCustomer);

/**
 * @swagger
 * /api/pos-cart/{cartId}/discount:
 *   post:
 *     summary: Apply discount to POS cart
 *     description: Apply a discount to the POS cart
 *     tags: [POS Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: POS Cart ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - value
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed, none]
 *                 description: Discount type
 *               value:
 *                 type: number
 *                 minimum: 0
 *                 description: Discount value
 *               reason:
 *                 type: string
 *                 description: Reason for discount
 *     responses:
 *       200:
 *         description: Discount applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/POSCart'
 *       400:
 *         description: Validation error
 *       404:
 *         description: POS cart not found
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.post('/:cartId/discount', [
  body('type').isIn(['percentage', 'fixed', 'none']).withMessage('Invalid discount type'),
  body('value').isFloat({ min: 0 }).withMessage('Discount value must be 0 or greater'),
  body('reason').optional().isString().withMessage('Discount reason must be a string')
], applyDiscount);

/**
 * @swagger
 * /api/pos-cart/{cartId}/complete:
 *   post:
 *     summary: Complete POS cart (convert to order)
 *     description: Complete the POS cart and convert it to an order with paid status
 *     tags: [POS Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: POS Cart ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Admin notes (payment is always cash, no change)
 *     responses:
 *       200:
 *         description: POS cart completed and order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     cartId:
 *                       type: string
 *                     orderId:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     total:
 *                       type: number
 *                     paymentStatus:
 *                       type: string
 *                       example: "paid"
 *                     paymentMethod:
 *                       type: string
 *                       example: "cash"
 *       400:
 *         description: Cannot complete empty cart
 *       404:
 *         description: POS cart not found
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.post('/:cartId/complete', [
  body('notes').optional().isString().withMessage('Notes must be a string')
], completePOSCart);

/**
 * @swagger
 * /api/pos-cart/{cartId}/clear:
 *   post:
 *     summary: Clear POS cart
 *     description: Remove all items from the POS cart
 *     tags: [POS Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: POS Cart ID
 *     responses:
 *       200:
 *         description: POS cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/POSCart'
 *       404:
 *         description: POS cart not found
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.post('/:cartId/clear', clearPOSCart);

/**
 * @swagger
 * /api/pos-cart/{cartId}:
 *   delete:
 *     summary: Delete POS cart
 *     description: Delete a POS cart permanently
 *     tags: [POS Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: POS Cart ID
 *     responses:
 *       200:
 *         description: POS cart deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: POS cart not found
 *       403:
 *         description: Access denied. Admin only.
 *       500:
 *         description: Server error
 */
router.delete('/:cartId', deletePOSCart);

module.exports = router;
