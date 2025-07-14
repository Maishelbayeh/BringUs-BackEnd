// monjed update start
const express = require('express');
const { protect } = require('../middleware/auth');
const guestCart = require('../middleware/guestCart');
const { addStoreFilter } = require('../middleware/storeIsolation');
const CartController = require('../controllers/cart.controller');

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Retrieve current cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved
 *       401:
 *         description: Unauthorized (if required)
 */
router.get('/api/cart', protect, guestCart, addStoreFilter, CartController.getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
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
 *               quantity:
 *                 type: integer
 *               variant:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/api/cart', protect, guestCart, addStoreFilter, CartController.addToCart);

/**
 * @swagger
 * /api/cart/{productId}:
 *   put:
 *     summary: Update item in cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *               variant:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/api/cart/:productId', protect, guestCart, addStoreFilter, CartController.updateCartItem);

/**
 * @swagger
 * /api/cart/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed
 *       401:
 *         description: Unauthorized
 */
router.delete('/api/cart/:productId', protect, guestCart, addStoreFilter, CartController.removeCartItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 *       401:
 *         description: Unauthorized
 */
router.delete('/api/cart', protect, guestCart, addStoreFilter, CartController.clearCart);

module.exports = router;
// monjed update end

