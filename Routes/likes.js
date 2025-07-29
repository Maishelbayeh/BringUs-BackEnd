const express = require('express');
const { protect } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');
const { getLikedProducts, likeProduct, unlikeProduct } = require('../controllers/like.controller');

const router = express.Router();

/**
 * @swagger
 * /api/likes:
 *   get:
 *     summary: Get all liked products for the current user
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns array of liked products
 *       401:
 *         description: Unauthorized access
 */
router.get('/', protect, getLikedProducts);

/**
 * @swagger
 * /api/likes/{productId}:
 *   post:
 *     summary: Like a product
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
router.post('/:productId', protect, verifyStoreAccess, likeProduct);

/**
 * 
 * @swagger
 * /api/likes/{productId}:
 *   delete:
 *     summary: Unlike a product
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
 *     responses:
 *       200:
 *         description: Product unliked successfully
 *       404:
 *         description: Like not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:productId', protect, verifyStoreAccess, unlikeProduct);

module.exports = router; 