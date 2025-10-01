const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');
const guestCart = require('../middleware/guestCart');
const { 
  getLikedProducts, 
  likeProduct, 
  unlikeProduct, 
  mergeGuestLikesToUser, 
  getLikesByGuestId,
  getUserWishlists,
  createWishlist
} = require('../Controllers/like.controller');

const router = express.Router();

/**
 * @swagger
 * 
 * 
 * /api/likes:
 *   get:
 *     summary: Get all liked products for the current user (authenticated or guest)
 *     tags: [Likes]
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
 *       - in: query
 *         name: wishlistUserId
 *         schema:
 *           type: string
 *         description: Filter by specific wishlist (optional)
 *     responses:
 *       200:
 *         description: Returns array of liked products
 *       400:
 *         description: Store information required
 */
router.get('/', optionalAuth, guestCart, verifyStoreAccess, getLikedProducts);

/**
 * @swagger
 * /api/likes/{productId}:
 *   post:
 *     summary: Like a product (authenticated or guest user)
 *     tags: [Likes]
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID for specific wishlist (optional)
 *     responses:
 *       200:
 *         description: Product liked successfully
 *       400:
 *         description: Already liked or store information required
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID for specific wishlist (optional)
 *     responses:
 *       200:
 *         description: Product unliked successfully
 *       400:
 *         description: Store information required
 *       404:
 *         description: Like not found
 */
router.delete('/:productId', optionalAuth, guestCart, verifyStoreAccess, unlikeProduct);

/**
 * @swagger
 * /api/likes/merge-guest:
 *   post:
 *     summary: Merge guest likes to authenticated user (call after login)
 *     tags: [Likes]
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
 *         description: Guest likes merged successfully
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
 *                   example: "Successfully merged 5 likes, skipped 2 duplicates"
 *                 mergedCount:
 *                   type: integer
 *                   example: 5
 *                 skippedCount:
 *                   type: integer
 *                   example: 2
 *                 totalProcessed:
 *                   type: integer
 *                   example: 7
 *       400:
 *         description: Guest ID or Store ID missing
 *       401:
 *         description: User must be authenticated
 */
router.post('/merge-guest', protect, mergeGuestLikesToUser);

/**
 * @swagger
 * /api/likes/guest/{guestId}/{storeId}:
 *   get:
 *     summary: Get likes by guest ID and store ID
 *     tags: [Likes]
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
 *         description: Guest likes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 count:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Guest ID or Store ID missing
 */
router.get('/guest/:guestId/:storeId', getLikesByGuestId);

/**
 * @swagger
 * /api/likes/wishlists:
 *   get:
 *     summary: Get all wishlists for authenticated user
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: User wishlists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wishlistUserId:
 *                         type: string
 *                         nullable: true
 *                         example: "user123"
 *                       wishlistName:
 *                         type: string
 *                         example: "My Wishlist"
 *                       products:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Product'
 *                       count:
 *                         type: integer
 *                         example: 5
 *                 totalWishlists:
 *                   type: integer
 *                   example: 3
 *                 totalProducts:
 *                   type: integer
 *                   example: 15
 *       400:
 *         description: Store ID missing
 *       401:
 *         description: User must be authenticated
 */
router.get('/wishlists', protect, getUserWishlists);

/**
 * @swagger
 * /api/likes/wishlists:
 *   post:
 *     summary: Create a new wishlist for authenticated user
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wishlistName
 *               - storeId
 *             properties:
 *               wishlistName:
 *                 type: string
 *                 example: "Birthday Wishlist"
 *                 description: Name of the wishlist
 *               wishlistUserId:
 *                 type: string
 *                 example: "user123"
 *                 description: User ID for specific wishlist (optional)
 *               storeId:
 *                 type: string
 *                 description: Store ID
 *     responses:
 *       200:
 *         description: Wishlist created successfully
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
 *                   example: "Wishlist created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlistName:
 *                       type: string
 *                       example: "Birthday Wishlist"
 *                     wishlistUserId:
 *                       type: string
 *                       nullable: true
 *                       example: "user123"
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     count:
 *                       type: integer
 *                       example: 0
 *       400:
 *         description: Wishlist name or store ID missing
 *       401:
 *         description: User must be authenticated
 */
router.post('/wishlists', protect, createWishlist);

module.exports = router; 