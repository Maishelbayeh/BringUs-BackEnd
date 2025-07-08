const express = require('express');
const router = express.Router();
const StoreController = require('../Controllers/StoreController');
const { protect, authorize, isActive } = require('../middleware/auth');
const { 
  hasStoreAccess, 
  hasPermission, 
  isPrimaryOwner, 
  isAdmin, 
  isSuperAdmin 
} = require('../middleware/permissions');

// All routes require authentication
router.use(protect);
router.use(isActive);

/**
 * @swagger
 * /api/stores/domain/{domain}:
 *   get:
 *     summary: Get store by domain (Public)
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         example: "mystore"
 *         description: "Store domain"
 *     responses:
 *       200:
 *         description: Store retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/domain/:domain', StoreController.getStoreByDomain);

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stores (Superadmin only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All stores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Superadmin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', isSuperAdmin, StoreController.getAllStores);

/**
 * @swagger
 * /api/stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - domain
 *               - contact
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "My Store"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "A great store"
 *               domain:
 *                 type: string
 *                 example: "mystore"
 *                 description: "Unique store domain"
 *               contact:
 *                 type: object
 *                 required:
 *                   - email
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "contact@mystore.com"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
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
 *                         example: "USA"
 *               settings:
 *                 type: object
 *                 properties:
 *                   currency:
 *                     type: string
 *                     example: "USD"
 *                   language:
 *                     type: string
 *                     example: "en"
 *                   timezone:
 *                     type: string
 *                     example: "UTC"
 *                   taxRate:
 *                     type: number
 *                     example: 0
 *                   shippingEnabled:
 *                     type: boolean
 *                     example: true
 *     responses:
 *       201:
 *         description: Store created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Domain already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', StoreController.createStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *     responses:
 *       200:
 *         description: Store retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', StoreController.getStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Update store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Updated Store Name"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated store description"
 *               domain:
 *                 type: string
 *                 example: "updatedstore"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 example: "active"
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "newcontact@store.com"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *               settings:
 *                 type: object
 *                 properties:
 *                   currency:
 *                     type: string
 *                     example: "EUR"
 *                   language:
 *                     type: string
 *                     example: "ar"
 *                   timezone:
 *                     type: string
 *                     example: "Asia/Dubai"
 *     responses:
 *       200:
 *         description: Store updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Domain already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied or permission required
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
 */
router.put('/:id', hasStoreAccess, hasPermission('manage_store'), StoreController.updateStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Delete store (Primary owner only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *     responses:
 *       200:
 *         description: Store deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Primary owner access required
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
 */
router.delete('/:id', hasStoreAccess, isPrimaryOwner, StoreController.deleteStore);

/**
 * @swagger
 * /api/stores/{storeId}/stats:
 *   get:
 *     summary: Get store statistics
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *     responses:
 *       200:
 *         description: Store statistics retrieved successfully
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
 *                     ownersCount:
 *                       type: number
 *                       example: 5
 *       403:
 *         description: Access denied or permission required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:storeId/stats', hasStoreAccess, hasPermission('view_analytics'), StoreController.getStoreStats);

module.exports = router; 