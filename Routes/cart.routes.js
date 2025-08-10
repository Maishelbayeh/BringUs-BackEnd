// monjed update start
const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const guestCart = require('../middleware/guestCart');
const { verifyStoreAccess } = require('../middleware/storeAuth');
const { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeCartItem, 
  clearCart, 
  getCartTotals,
  mergeGuestCartToUser,
  getCartByGuestId
} = require('../Controllers/cart.controller');
const router = express.Router();
/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Retrieve current cart (authenticated or guest user)
 *     tags: [Cart]
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
 *       400:
 *         description: Store information required
 */
router.get('/', optionalAuth, guestCart, verifyStoreAccess, getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart with specifications and colors (authenticated or guest user)
 *     tags: [Cart]
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
 *         description: Validation error or store information required
 */
router.post('/', optionalAuth, guestCart, verifyStoreAccess, addToCart);

/**
 * @swagger
 * /api/cart/{productId}:
 *   put:
 *     summary: Update item in cart with specifications and colors (authenticated or guest user)
 *     tags: [Cart]
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
 *         description: Validation error or store information required
 *       404:
 *         description: Product not found in cart
 */
router.put('/:productId', optionalAuth, guestCart, verifyStoreAccess, updateCartItem);

/**
 * @swagger
 * /api/cart/{productId}:
 *   delete:
 *     summary: Remove item from cart (authenticated or guest user)
 *     tags: [Cart]
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
 *       400:
 *         description: Store information required
 *       404:
 *         description: Product not found in cart
 */
router.delete('/:productId', optionalAuth, guestCart, verifyStoreAccess, removeCartItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear entire cart (authenticated or guest user)
 *     tags: [Cart]
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
 *       400:
 *         description: Store information required
 */
router.delete('/', optionalAuth, guestCart, verifyStoreAccess, clearCart);

/**
 * @swagger
 * /api/cart/merge-guest:
 *   post:
 *     summary: Merge guest cart to authenticated user (call after login)
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
 *               - guestId
 *               - storeId
 *             properties:
 *               guestId:
 *                 type: string
 *                 description: Guest ID from previous session
 *               storeId:
 *                 type: string
 *                 description: Store ID
 *     responses:
 *       200:
 *         description: Guest cart merged successfully
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
 *                   example: "Successfully merged 3 items, updated 2 items, skipped 0 duplicates"
 *                 mergedCount:
 *                   type: integer
 *                   example: 3
 *                 updatedCount:
 *                   type: integer
 *                   example: 2
 *                 skippedCount:
 *                   type: integer
 *                   example: 0
 *                 totalProcessed:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Guest ID or Store ID missing
 *       401:
 *         description: User must be authenticated
 */
router.post('/merge-guest', protect, mergeGuestCartToUser);

/**
 * @swagger
 * /api/cart/guest/{guestId}/{storeId}:
 *   get:
 *     summary: Get cart by guest ID and store ID
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: guestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Guest ID
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Guest cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CartItem'
 *                 count:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Guest ID or Store ID missing
 */
router.get('/guest/:guestId/:storeId', getCartByGuestId);

module.exports = router;
// monjed update end

