const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superadminAuth');
const {
    getAllStores,
    getStoreById,
    updateStoreStatus,
    getSystemStatistics
} = require('../Controllers/SuperAdminController');

/**
 * @swagger
 * /api/superadmin/stores:
 *   get:
 *     summary: Get all stores with their owners
 *     description: Retrieve all stores in the system along with their associated owners
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all stores
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
 *                     $ref: '#/components/schemas/StoreWithOwners'
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.get('/stores', protect, requireSuperAdmin, getAllStores);

/**
 * @swagger
 * /api/superadmin/stores/{storeId}:
 *   get:
 *     summary: Get store by ID with owners
 *     description: Retrieve a specific store by its ID along with its associated owners
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The store ID
 *     responses:
 *       200:
 *         description: Successfully retrieved store
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StoreWithOwners'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/stores/:storeId', protect, requireSuperAdmin, getStoreById);

/**
 * @swagger
 * /api/superadmin/stores/{storeId}/status:
 *   put:
 *     summary: Update store status
 *     description: Update the status of a specific store (active, inactive, suspended)
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 description: The new status for the store
 *     responses:
 *       200:
 *         description: Store status updated successfully
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
 *                   example: Store status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.put('/stores/:storeId/status', protect, requireSuperAdmin, updateStoreStatus);

/**
 * @swagger
 * /api/superadmin/statistics:
 *   get:
 *     summary: Get system-wide statistics
 *     description: Retrieve comprehensive statistics about the entire system including stores, users, products, orders, and revenue
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved system statistics
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
 *                     stores:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         active:
 *                           type: integer
 *                           example: 35
 *                         inactive:
 *                           type: integer
 *                           example: 10
 *                         suspended:
 *                           type: integer
 *                           example: 5
 *                         subscribed:
 *                           type: integer
 *                           example: 25
 *                         trial:
 *                           type: integer
 *                           example: 8
 *                         expired:
 *                           type: integer
 *                           example: 7
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 1500
 *                     products:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 5000
 *                     orders:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 2500
 *                         recent:
 *                           type: integer
 *                           example: 150
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 75000.50
 *                     activity:
 *                       type: object
 *                       properties:
 *                         newStores:
 *                           type: integer
 *                           example: 12
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', protect, requireSuperAdmin, getSystemStatistics);

module.exports = router;
