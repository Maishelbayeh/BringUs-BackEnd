const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');
const guestCart = require('../middleware/guestCart');
const { getLikedProducts, likeProduct, unlikeProduct } = require('../controllers/like.controller');

const router = express.Router();

/**
 * @swagger
 * /api/likes:
 *   get:
 *     summary: Get all liked products for the current user (authenticated or guest)
 *     tags: [Likes]
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
 *         description: Returns array of liked products
 *       401:
 *         description: Unauthorized access
 */
router.get('/', optionalAuth, guestCart, verifyStoreAccess, getLikedProducts);

/**
 * @swagger
 * /api/likes/{productId}:
 *   post:
 *     summary: Like a product (authenticated or guest user)
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to like
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
 *         description: Product liked successfully
 *       400:
 *         description: Already liked
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cross-store like attempt
 *       404:
 *         description: Product not found
 */
router.post('/:productId', optionalAuth, guestCart, verifyStoreAccess, likeProduct);

/**
 * 
 * @swagger
 * /api/likes/{productId}:
 *   delete:
 *     summary: Unlike a product (authenticated or guest user)
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to unlike
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
 *         description: Product unliked successfully
 *       404:
 *         description: Like not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:productId', optionalAuth, guestCart, verifyStoreAccess, unlikeProduct);

module.exports = router; 