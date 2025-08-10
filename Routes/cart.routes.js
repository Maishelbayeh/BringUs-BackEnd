// monjed update start
const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const guestCart = require('../middleware/guestCart');
const { verifyStoreAccess } = require('../middleware/storeAuth');
const CartController = require('../Controllers/cart.controller');
const router = express.Router();
/**
 * 
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Retrieve current cart (authenticated or guest user)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeSlug
 *         schema:
 *           type: string
 *         description: Store slug (for guest users)
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (alternative to storeSlug)
 *     responses:
 *       200:
 *         description: Cart retrieved
 *       401:
 *         description: Unauthorized (if required)
 */
router.get('/', optionalAuth, guestCart, verifyStoreAccess, CartController.getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart with specifications and colors (authenticated or guest user)
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
 *                 description: Product ID
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to add
 *               variant:
 *                 type: string
 *                 description: Product variant (optional)
 *               storeSlug:
 *                 type: string
 *                 description: Store slug (for guest users)
 *               storeId:
 *                 type: string
 *                 description: Store ID (alternative to storeSlug)
 *               selectedSpecifications:
 *                 type: array
 *                 description: Selected product specifications
 *                 items:
 *                   type: object
 *                   properties:
 *                     specificationId:
 *                       type: string
 *                       description: Specification ID
 *                     valueId:
 *                       type: string
 *                       description: Specification value ID
 *                     value:
 *                       type: string
 *                       description: Selected value
 *                     title:
 *                       type: string
 *                       description: Specification title
 *               selectedColors:
 *                 type: array
 *                 description: Selected product colors
 *                 items:
 *                   type: string
 *                   description: Color code (hex, rgb, rgba)
 *     responses:
 *       200:
 *         description: Item added to cart
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', optionalAuth, guestCart, verifyStoreAccess, CartController.addToCart);

/**
 * @swagger
 * /api/cart/{productId}:
 *   put:
 *     summary: Update item in cart with specifications and colors (authenticated or guest user)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to update
 *       - in: query
 *         name: storeSlug
 *         schema:
 *           type: string
 *         description: Store slug (for guest users)
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (alternative to storeSlug)
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
 *               variant:
 *                 type: string
 *                 description: Product variant (optional)
 *               selectedSpecifications:
 *                 type: array
 *                 description: Updated product specifications
 *                 items:
 *                   type: object
 *                   properties:
 *                     specificationId:
 *                       type: string
 *                       description: Specification ID
 *                     valueId:
 *                       type: string
 *                       description: Specification value ID
 *                     value:
 *                       type: string
 *                       description: Selected value
 *                     title:
 *                       type: string
 *                       description: Specification title
 *               selectedColors:
 *                 type: array
 *                 description: Updated product colors
 *                 items:
 *                   type: string
 *                   description: Color code (hex, rgb, rgba)
 *     responses:
 *       200:
 *         description: Item updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found in cart
 */
router.put('/:productId', optionalAuth, guestCart, verifyStoreAccess, CartController.updateCartItem);

/**
 * @swagger
 * /api/cart/{productId}:
 *   delete:
 *     summary: Remove item from cart (authenticated or guest user)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to remove
 *       - in: query
 *         name: storeSlug
 *         schema:
 *           type: string
 *         description: Store slug (for guest users)
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (alternative to storeSlug)
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found in cart
 */
router.delete('/:productId', optionalAuth, guestCart, verifyStoreAccess, CartController.removeCartItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear entire cart (authenticated or guest user)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeSlug
 *         schema:
 *           type: string
 *         description: Store slug (for guest users)
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (alternative to storeSlug)
 *     responses:
 *       200:
 *         description: Cart cleared
 *       401:
 *         description: Unauthorized
 */
router.delete('/', optionalAuth, guestCart, verifyStoreAccess, CartController.clearCart);

module.exports = router;
// monjed update end

