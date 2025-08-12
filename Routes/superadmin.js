const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superadminAuth');
const SuperAdminController = require('../Controllers/SuperAdminController');

// All routes require authentication and superadmin role
router.use(protect);
router.use(requireSuperAdmin);

/**
 * @swagger
 * /api/superadmin/stores:
 *   get:
 *     summary: Get all stores with owners information (Superadmin only)
 *     description: Retrieve all stores with their owners information. Only accessible by superadmin users.
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stores retrieved successfully
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
 *                   type: number
 *                   example: 5
 *       403:
 *         description: Access denied - Superadmin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stores', SuperAdminController.getAllStores);

/**
 * @swagger
 * /api/superadmin/stores/{storeId}:
 *   get:
 *     summary: Get store by ID with owners information (Superadmin only)
 *     description: Retrieve a specific store with its owners information by store ID. Only accessible by superadmin users.
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Store retrieved successfully
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
 *       400:
 *         description: Store ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - Superadmin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stores/:storeId', SuperAdminController.getStoreById);

/**
 * @swagger
 * /api/superadmin/stores/{storeId}/status:
 *   patch:
 *     summary: Update store status (Superadmin only)
 *     description: Update the status of a specific store. Only accessible by superadmin users.
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 description: New store status
 *                 example: "active"
 *             required:
 *               - status
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
 *                   example: "Store status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - Superadmin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/stores/:storeId/status', SuperAdminController.updateStoreStatus);

/**
 * @swagger
 * /api/superadmin/statistics:
 *   get:
 *     summary: Get stores statistics (Superadmin only)
 *     description: Retrieve comprehensive statistics about all stores. Only accessible by superadmin users.
 *     tags: [Superadmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     totalStores:
 *                       type: number
 *                       example: 25
 *                     activeStores:
 *                       type: number
 *                       example: 20
 *                     inactiveStores:
 *                       type: number
 *                       example: 3
 *                     suspendedStores:
 *                       type: number
 *                       example: 2
 *                     totalOwners:
 *                       type: number
 *                       example: 45
 *                     totalProducts:
 *                       type: number
 *                       example: 1250
 *                     totalOrders:
 *                       type: number
 *                       example: 890
 *                     totalRevenue:
 *                       type: number
 *                       example: 125000.50
 *                     averageRevenuePerStore:
 *                       type: number
 *                       example: 5000.02
 *                     storesByStatus:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: number
 *                           example: 20
 *                         inactive:
 *                           type: number
 *                           example: 3
 *                         suspended:
 *                           type: number
 *                           example: 2
 *                     topPerformingStores:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           storeId:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           storeName:
 *                             type: string
 *                             example: "Electronics Store"
 *                           revenue:
 *                             type: number
 *                             example: 15000.00
 *                           orders:
 *                             type: number
 *                             example: 150
 *       403:
 *         description: Access denied - Superadmin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/statistics', SuperAdminController.getStoresStatistics);

module.exports = router;
