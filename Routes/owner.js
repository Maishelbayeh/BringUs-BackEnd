const express = require('express');
const router = express.Router();
const OwnerController = require('../Controllers/OwnerController');
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
 * /api/owners:
 *   post:
 *     summary: Create a new owner (Superadmin only)
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - storeId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: "User ID to make owner"
 *               storeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *                 description: "Store ID"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [manage_store, manage_users, manage_products, manage_categories, manage_orders, manage_inventory, view_analytics, manage_settings]
 *                 example: ["manage_store", "manage_users"]
 *               isPrimaryOwner:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Owner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error or user already owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Superadmin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Store or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', isSuperAdmin, OwnerController.createOwner);

/**
 * @swagger
 * /api/owners/user/{userId}:
 *   get:
 *     summary: Get all stores for a user (Superadmin only)
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *         description: "User ID"
 *     responses:
 *       200:
 *         description: User stores retrieved successfully
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
router.get('/user/:userId', isSuperAdmin, OwnerController.getUserStores);

/**
 * @swagger
 * /api/owners/store/{storeId}:
 *   get:
 *     summary: Get all owners for a store
 *     tags: [Owners]
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
 *         description: Store owners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Access denied or permission required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/store/:storeId', hasStoreAccess, hasPermission('manage_users'), OwnerController.getStoreOwners);

/**
 * @swagger
 * /api/owners/{id}:
 *   get:
 *     summary: Get owner by ID
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: "Owner ID"
 *     responses:
 *       200:
 *         description: Owner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Access denied or permission required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Owner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', hasStoreAccess, hasPermission('manage_users'), OwnerController.getOwner);

/**
 * @swagger
 * /api/owners/{id}:
 *   put:
 *     summary: Update owner
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: "Owner ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [manage_store, manage_users, manage_products, manage_categories, manage_orders, manage_inventory, view_analytics, manage_settings]
 *                 example: ["manage_store", "manage_users"]
 *               isPrimaryOwner:
 *                 type: boolean
 *                 example: false
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Owner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
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
 *         description: Owner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', hasStoreAccess, hasPermission('manage_users'), OwnerController.updateOwner);

/**
 * @swagger
 * /api/owners/{id}:
 *   delete:
 *     summary: Delete owner (Primary owner only)
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: "Owner ID"
 *     responses:
 *       200:
 *         description: Owner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Cannot delete primary owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Primary owner access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Owner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', hasStoreAccess, isPrimaryOwner, OwnerController.deleteOwner);

module.exports = router; 