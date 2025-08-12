const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superadminAuth');
const SubscriptionController = require('../Controllers/SubscriptionController');

/**
 * @swagger
 * /api/subscription/stats:
 *   get:
 *     summary: Get subscription statistics
 *     description: Retrieve comprehensive subscription statistics for all stores
 *     tags: [Subscriptions]
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
 *                     total:
 *                       type: number
 *                       example: 150
 *                     active:
 *                       type: number
 *                       example: 120
 *                     inactive:
 *                       type: number
 *                       example: 25
 *                     suspended:
 *                       type: number
 *                       example: 5
 *                     subscribed:
 *                       type: number
 *                       example: 80
 *                     trial:
 *                       type: number
 *                       example: 40
 *                     expiringToday:
 *                       type: number
 *                       example: 3
 *                     expiringThisWeek:
 *                       type: number
 *                       example: 12
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', protect, requireSuperAdmin, SubscriptionController.getSubscriptionStats);

/**
 * @swagger
 * /api/subscription/check/{storeId}:
 *   get:
 *     summary: Check subscription status for a specific store
 *     description: Get detailed subscription information for a specific store
 *     tags: [Subscriptions]
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
 *         description: Subscription status retrieved successfully
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
 *                     storeId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     storeName:
 *                       type: string
 *                       example: "Electronics Store"
 *                     isSubscriptionActive:
 *                       type: boolean
 *                       example: true
 *                     shouldBeDeactivated:
 *                       type: boolean
 *                       example: false
 *                     daysUntilExpiry:
 *                       type: number
 *                       example: 25
 *                     subscription:
 *                       $ref: '#/components/schemas/StoreSubscription'
 *                     status:
 *                       type: string
 *                       example: "active"
 *       400:
 *         description: Store ID is required
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
router.get('/check/:storeId', protect, requireSuperAdmin, SubscriptionController.checkStoreSubscription);

/**
 * @swagger
 * /api/subscription/trigger-check:
 *   post:
 *     summary: Manually trigger subscription check
 *     description: Manually trigger the daily subscription status check (Superadmin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription check completed successfully
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
 *                   example: "Subscription check completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     checked:
 *                       type: number
 *                       example: 150
 *                     deactivated:
 *                       type: number
 *                       example: 5
 *                     warnings:
 *                       type: number
 *                       example: 12
 *                     errors:
 *                       type: number
 *                       example: 0
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
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
router.post('/trigger-check', protect, requireSuperAdmin, SubscriptionController.triggerSubscriptionCheck);

/**
 * @swagger
 * /api/subscription/activate/{storeId}:
 *   post:
 *     summary: Activate subscription for a store
 *     description: Activate or renew subscription for a specific store
 *     tags: [Subscriptions]
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
 *               plan:
 *                 type: string
 *                 enum: [monthly, quarterly, semi_annual, annual]
 *                 description: Subscription plan
 *                 example: "monthly"
 *               durationInDays:
 *                 type: number
 *                 description: Duration in days
 *                 example: 30
 *               amount:
 *                 type: number
 *                 description: Subscription amount
 *                 example: 99.99
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, paypal, bank_transfer, cash]
 *                 description: Payment method
 *                 example: "credit_card"
 *               autoRenew:
 *                 type: boolean
 *                 description: Auto-renew subscription
 *                 example: true
 *             required:
 *               - plan
 *               - durationInDays
 *     responses:
 *       200:
 *         description: Subscription activated successfully
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
 *                   example: "Subscription activated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     storeName:
 *                       type: string
 *                       example: "Electronics Store"
 *                     subscription:
 *                       $ref: '#/components/schemas/StoreSubscription'
 *                     status:
 *                       type: string
 *                       example: "active"
 *       400:
 *         description: Invalid request data
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
router.post('/activate/:storeId', protect, requireSuperAdmin, SubscriptionController.activateSubscription);

/**
 * @swagger
 * /api/subscription/extend-trial/{storeId}:
 *   post:
 *     summary: Extend trial period for a store
 *     description: Extend the trial period for a specific store
 *     tags: [Subscriptions]
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
 *               daysToAdd:
 *                 type: number
 *                 description: Number of days to add to trial
 *                 example: 7
 *             required:
 *               - daysToAdd
 *     responses:
 *       200:
 *         description: Trial extended successfully
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
 *                   example: "Trial extended by 7 days"
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     storeName:
 *                       type: string
 *                       example: "Electronics Store"
 *                     trialEndDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-15T00:00:00.000Z"
 *                     daysUntilTrialExpires:
 *                       type: number
 *                       example: 14
 *       400:
 *         description: Invalid request data
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
router.post('/extend-trial/:storeId', protect, requireSuperAdmin, SubscriptionController.extendTrial);

/**
 * @swagger
 * /api/subscription/expiring:
 *   get:
 *     summary: Get stores with expiring subscriptions
 *     description: Get list of stores with subscriptions expiring within specified days
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *         description: Number of days to check for expiring subscriptions
 *         example: 7
 *     responses:
 *       200:
 *         description: Expiring stores retrieved successfully
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
 *                           storeNameAr:
 *                             type: string
 *                             example: "متجر الإلكترونيات"
 *                           slug:
 *                             type: string
 *                             example: "electronics-store"
 *                           subscription:
 *                             $ref: '#/components/schemas/StoreSubscription'
 *                           status:
 *                             type: string
 *                             example: "active"
 *                           daysUntilExpiry:
 *                             type: number
 *                             example: 3
 *                           type:
 *                             type: string
 *                             enum: [subscription, trial]
 *                             example: "subscription"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: number
 *                       example: 5
 *                     daysChecked:
 *                       type: number
 *                       example: 7
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/expiring', protect, requireSuperAdmin, SubscriptionController.getExpiringStores);

/**
 * @swagger
 * /api/subscription/deactivated:
 *   get:
 *     summary: Get deactivated stores
 *     description: Get list of stores that have been deactivated due to expired subscriptions
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 30
 *         description: Number of days to look back for deactivated stores
 *         example: 30
 *     responses:
 *       200:
 *         description: Deactivated stores retrieved successfully
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
 *                           storeNameAr:
 *                             type: string
 *                             example: "متجر الإلكترونيات"
 *                           slug:
 *                             type: string
 *                             example: "electronics-store"
 *                           subscription:
 *                             $ref: '#/components/schemas/StoreSubscription'
 *                           status:
 *                             type: string
 *                             example: "inactive"
 *                           reason:
 *                             type: string
 *                             enum: [subscription_expired, trial_expired]
 *                             example: "subscription_expired"
 *                           deactivatedAt:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: number
 *                       example: 10
 *                     daysChecked:
 *                       type: number
 *                       example: 30
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/deactivated', protect, requireSuperAdmin, SubscriptionController.getDeactivatedStores);

/**
 * @swagger
 * /api/subscription/cancel/{storeId}:
 *   post:
 *     summary: Cancel subscription for a store
 *     description: Cancel subscription for a specific store
 *     tags: [Subscriptions]
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
 *               immediate:
 *                 type: boolean
 *                 description: Cancel immediately or at end of period
 *                 example: false
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
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
 *                   example: "Subscription will be cancelled at end of period"
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     storeName:
 *                       type: string
 *                       example: "Electronics Store"
 *                     subscription:
 *                       $ref: '#/components/schemas/StoreSubscription'
 *                     status:
 *                       type: string
 *                       example: "active"
 *       400:
 *         description: Invalid request data
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
router.post('/cancel/:storeId', protect, requireSuperAdmin, SubscriptionController.cancelSubscription);

module.exports = router;
