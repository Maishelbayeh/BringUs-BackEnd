const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superadminAuth');
const {
    getSubscriptionStats,
    checkStoreSubscription,
    triggerSubscriptionCheck,
    activateSubscription,
    extendTrial,
    extendFreeTrial,
    getExpiringStores,
    getDeactivatedStores,
    cancelSubscription,
    disableAutoRenewal,
    enableAutoRenewal,
    getAllSubscriptions,
    updateSubscription,
    updateSubscriptionEndDate,
    getStoreSubscriptionHistory,
    getStoreSubscriptionStats,
    getAllRecentActivities,
    reactivateStore,
    getStoreStatus
} = require('../Controllers/SubscriptionController');

/**
 * @swagger
 * /api/subscription/stats:
 *   get:
 *     summary: Get subscription statistics
 *     description: Retrieve comprehensive statistics about all subscriptions in the system
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved subscription statistics
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
 *                       type: integer
 *                       example: 150
 *                     activeStores:
 *                       type: integer
 *                       example: 120
 *                     inactiveStores:
 *                       type: integer
 *                       example: 30
 *                     subscribedStores:
 *                       type: integer
 *                       example: 80
 *                     trialStores:
 *                       type: integer
 *                       example: 25
 *                     expiredStores:
 *                       type: integer
 *                       example: 15
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.get('/stats', protect,  getSubscriptionStats);

/**
 * @swagger
 * /api/subscription/stores:
 *   get:
 *     summary: Get all subscriptions with filters
 *     description: Retrieve all stores with their subscription information, with optional filtering, search, and pagination
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by store status
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *           enum: [free, monthly, quarterly, semi_annual, annual]
 *         description: Filter by subscription plan
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search stores by name (English or Arabic)
 *         example: "store"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, nameEn, nameAr, status]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Successfully retrieved subscriptions
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
 *                     $ref: '#/components/schemas/StoreSubscription'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     pages:
 *                       type: integer
 *                       example: 15
 *                 search:
 *                   type: string
 *                   nullable: true
 *                   description: The search term used (if any)
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.get('/stores', protect,  getAllSubscriptions);

/**
 * @swagger
 * /api/subscription/stores/{storeId}:
 *   get:
 *     summary: Check subscription status for a specific store
 *     description: Retrieve detailed subscription information for a specific store
 *     tags: [Subscriptions]
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
 *         description: Successfully retrieved store subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StoreSubscription'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/stores/:storeId', protect,  checkStoreSubscription);

/**
 * @swagger
 * /api/subscription/stores/{storeId}:
 *   post:
 *     summary: Activate subscription for a store
 *     description: Activate or renew a subscription for a specific store
 *     tags: [Subscriptions]
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
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: The subscription plan ID
 *                 example: "507f1f77bcf86cd799439011"
 *               referenceId
 *                 type: string
 *                 description: Reference ID for the subscription
 *                 example: "1234567890"
 *               autoRenew:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to auto-renew the subscription
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T00:00:00.000Z"
 *                 description: Custom start date for custom subscription plans (optional)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59.999Z"
 *                 description: Custom end date for custom subscription plans (optional)
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
 *                   example: Subscription activated successfully
 *                 data:
 *                   $ref: '#/components/schemas/StoreSubscription'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.post('/stores/:storeId', 
    protect, 
    
    [
        param('storeId').isMongoId().withMessage('Invalid store ID'),
        body('planId').isMongoId().withMessage('Invalid plan ID'),
        body('referenceId').optional().isString().withMessage('Invalid reference ID'),
        body('autoRenew').optional().isBoolean().withMessage('AutoRenew must be a boolean'),
        body('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
        body('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
    ],
    activateSubscription
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}:
 *   put:
 *     summary: Update subscription details
 *     description: Update subscription information for a specific store
 *     tags: [Subscriptions]
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
 *             properties:
 *               subscription.plan:
 *                 type: string
 *                 enum: [free, monthly, quarterly, semi_annual, annual]
 *               subscription.amount:
 *                 type: number
 *                 minimum: 0
 *               subscription.currency:
 *                 type: string
 *               subscription.paymentMethod:
 *                 type: string
 *                 enum: [credit_card, paypal, bank_transfer, cash]
 *               subscription.autoRenew:
 *                 type: boolean
 *               subscription.endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Subscription updated successfully
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
 *                   example: Subscription updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/StoreSubscription'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.put('/stores/:storeId', 
    protect, 
    
    [
        param('storeId').isMongoId().withMessage('Invalid store ID')
    ],
    updateSubscription
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/trial:
 *   post:
 *     summary: Extend trial period for a store
 *     description: Extend the trial period for a specific store by a specified number of days
 *     tags: [Subscriptions]
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
 *               - days
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 description: Number of days to extend the trial
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
 *                   example: Trial extended by 7 days
 *                 data:
 *                   $ref: '#/components/schemas/StoreSubscription'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.post('/stores/:storeId/trial',
    protect,
    
    [
        param('storeId').isMongoId().withMessage('Invalid store ID'),
        body('days').isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
    ],
    extendTrial
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/free-trial:
 *   post:
 *     summary: Extend free trial period for a store (Superadmin only)
 *     description: Extend the free trial period for a specific store by a specified number of days. This is specifically for stores that are in trial mode and not subscribed.
 *     tags: [Subscriptions]
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
 *               - days
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 description: Number of days to extend the free trial
 *               reason:
 *                 type: string
 *                 description: Optional reason for extending the free trial
 *                 example: "Customer request for more time to evaluate"
 *     responses:
 *       200:
 *         description: Free trial extended successfully
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
 *                   example: Free trial extended by 30 days
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeId:
 *                       type: string
 *                     storeName:
 *                       type: string
 *                     previousTrialEnd:
 *                       type: string
 *                       format: date-time
 *                     newTrialEnd:
 *                       type: string
 *                       format: date-time
 *                     daysAdded:
 *                       type: integer
 *                     daysUntilExpiry:
 *                       type: integer
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         isSubscribed:
 *                           type: boolean
 *                         trialEndDate:
 *                           type: string
 *                           format: date-time
 *                         isTrialExpired:
 *                           type: boolean
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid request data or store has active subscription
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.post('/stores/:storeId/free-trial',
    protect,
    
    [
        param('storeId').isMongoId().withMessage('Invalid store ID'),
        body('days').isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    extendFreeTrial
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/cancel:
 *   post:
 *     summary: Cancel subscription for a store
 *     description: Cancel the subscription for a specific store
 *     tags: [Subscriptions]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
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
 *                   example: Subscription cancelled successfully
 *                 data:
 *                   $ref: '#/components/schemas/StoreSubscription'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.post('/stores/:storeId/cancel',
    protect,
    
    [
        param('storeId').isMongoId().withMessage('Invalid store ID')
    ],
    cancelSubscription
);

/**
 * @swagger
 * /api/subscription/expiring:
 *   get:
 *     summary: Get stores with expiring subscriptions/trials
 *     description: Retrieve stores that have subscriptions or trials expiring within a specified number of days
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 3
 *         description: Number of days to check for expiring subscriptions/trials
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search stores by name (English or Arabic)
 *         example: "store"
 *     responses:
 *       200:
 *         description: Successfully retrieved expiring stores
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
 *                     $ref: '#/components/schemas/StoreSubscription'
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 search:
 *                   type: string
 *                   nullable: true
 *                   description: The search term used (if any)
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.get('/expiring', 
    protect, 
    
    [
        query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30')
    ],
    getExpiringStores
);

/**
 * @swagger
 * /api/subscription/deactivated:
 *   get:
 *     summary: Get recently deactivated stores
 *     description: Retrieve stores that have been deactivated due to expired subscriptions/trials
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 90
 *           default: 7
 *         description: Number of days to look back for deactivated stores
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search stores by name (English or Arabic)
 *         example: "store"
 *     responses:
 *       200:
 *         description: Successfully retrieved deactivated stores
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
 *                     $ref: '#/components/schemas/StoreSubscription'
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 search:
 *                   type: string
 *                   nullable: true
 *                   description: The search term used (if any)
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.get('/deactivated',
    protect,
    
    [
        query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90')
    ],
    getDeactivatedStores
);

/**
 * @swagger
 * /api/subscription/trigger-check:
 *   post:
 *     summary: Manually trigger subscription check
 *     description: Manually trigger the daily subscription status check (for testing or admin use)
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
 *                   example: Subscription check completed successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.post('/trigger-check', protect,  triggerSubscriptionCheck);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/history:
 *   get:
 *     summary: Get subscription history for a specific store
 *     description: Retrieve detailed subscription history for a specific store with pagination and filtering
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The store ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [trial_started, trial_extended, subscription_activated, subscription_renewed, subscription_cancelled, subscription_expired, payment_received, payment_failed, plan_changed, amount_changed, auto_renew_changed, payment_method_changed, store_deactivated, store_reactivated]
 *         description: Filter by action type
 *     responses:
 *       200:
 *         description: Successfully retrieved subscription history
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
 *                     storeName:
 *                       type: string
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           description:
 *                             type: string
 *                           details:
 *                             type: object
 *                           performedBy:
 *                             type: string
 *                           performedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         filteredCount:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/stores/:storeId/history',
    protect,
   
    [
        param('storeId').isMongoId().withMessage('Invalid store ID'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    ],
    getStoreSubscriptionHistory
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/stats:
 *   get:
 *     summary: Get subscription statistics for a specific store
 *     description: Retrieve detailed subscription statistics and recent activities for a specific store
 *     tags: [Subscriptions]
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
 *         description: Successfully retrieved subscription statistics
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
 *                     storeName:
 *                       type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalActions:
 *                           type: integer
 *                         actionsByType:
 *                           type: object
 *                         lastActivity:
 *                           type: object
 *                         trialExtensions:
 *                           type: integer
 *                         payments:
 *                           type: integer
 *                         cancellations:
 *                           type: integer
 *                     recentActivities:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/stores/:storeId/stats',
    protect,
    
    [
        param('storeId').isMongoId().withMessage('Invalid store ID')
    ],
    getStoreSubscriptionStats
);

/**
 * @swagger
 * /api/subscription/activities:
 *   get:
 *     summary: Get recent activities across all stores
 *     description: Retrieve recent subscription activities from all stores with pagination
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to look back
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved recent activities
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
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           storeId:
 *                             type: string
 *                           storeName:
 *                             type: string
 *                           storeNameAr:
 *                             type: string
 *                           action:
 *                             type: string
 *                           description:
 *                             type: string
 *                           performedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.get('/activities',
    protect,
    
    [
        query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    getAllRecentActivities
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/reactivate:
 *   patch:
 *     summary: Reactivate a store
 *     description: Reactivate a store that has been deactivated due to expired subscription/trial
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
 *     responses:
 *       200:
 *         description: Store reactivated successfully
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
 *                   example: "Store reactivated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeId:
 *                       type: string
 *                     storeName:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     reactivatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Store is already active
 *       404:
 *         description: Store not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.patch('/stores/:storeId/reactivate',
    protect,
    [
        param('storeId').isMongoId().withMessage('Invalid store ID')
    ],
    reactivateStore
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/status:
 *   get:
 *     summary: Get store status information
 *     description: Get detailed status information for a specific store including subscription details
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Successfully retrieved store status
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
 *                     storeName:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [active, inactive, suspended]
 *                     isSubscriptionActive:
 *                       type: boolean
 *                     isTrialExpired:
 *                       type: boolean
 *                     daysUntilTrialExpires:
 *                       type: integer
 *                       nullable: true
 *                     daysUntilSubscriptionExpires:
 *                       type: integer
 *                       nullable: true
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         isSubscribed:
 *                           type: boolean
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         trialEndDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         planId:
 *                           type: string
 *                           nullable: true
 *                         amount:
 *                           type: number
 *                         currency:
 *                           type: string
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/stores/:storeId/status',
    [
        param('storeId').isMongoId().withMessage('Invalid store ID')
    ],
    getStoreStatus
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/disable-auto-renewal:
 *   patch:
 *     summary: Disable auto-renewal for a store subscription
 *     description: Disable automatic renewal for a store's subscription. The subscription will not renew automatically when it expires.
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for disabling auto-renewal
 *                 example: "Customer request"
 *     responses:
 *       200:
 *         description: Auto-renewal disabled successfully
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
 *                   example: "Auto-renewal disabled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeId:
 *                       type: string
 *                     storeName:
 *                       type: string
 *                     autoRenew:
 *                       type: boolean
 *                       example: false
 *                     subscriptionEndDate:
 *                       type: string
 *                       format: date-time
 *                     message:
 *                       type: string
 *                       example: "Subscription will not renew automatically when it expires"
 *       400:
 *         description: Auto-renewal is already disabled
 *       404:
 *         description: Store not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.patch('/stores/:storeId/disable-auto-renewal',
    protect,
    [
        param('storeId').isMongoId().withMessage('Invalid store ID'),
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    disableAutoRenewal
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/enable-auto-renewal:
 *   patch:
 *     summary: Enable auto-renewal for a store subscription
 *     description: Enable automatic renewal for a store's subscription. The subscription will renew automatically when it expires.
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for enabling auto-renewal
 *                 example: "Customer request"
 *     responses:
 *       200:
 *         description: Auto-renewal enabled successfully
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
 *                   example: "Auto-renewal enabled successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeId:
 *                       type: string
 *                     storeName:
 *                       type: string
 *                     autoRenew:
 *                       type: boolean
 *                       example: true
 *                     subscriptionEndDate:
 *                       type: string
 *                       format: date-time
 *                     message:
 *                       type: string
 *                       example: "Subscription will renew automatically when it expires"
 *       400:
 *         description: Auto-renewal is already enabled or subscription is inactive
 *       404:
 *         description: Store not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.patch('/stores/:storeId/enable-auto-renewal',
    protect,
    [
        param('storeId').isMongoId().withMessage('Invalid store ID'),
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    enableAutoRenewal
);

/**
 * @swagger
 * /api/subscription/stores/{storeId}/end-date:
 *   patch:
 *     summary: Update subscription end date (Superadmin only)
 *     description: Update the end date of a store's subscription. This allows superadmins to extend or shorten subscription periods.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endDate
 *             properties:
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: New end date for the subscription
 *                 example: "2024-12-31T23:59:59.999Z"
 *               reason:
 *                 type: string
 *                 description: Optional reason for updating the end date
 *                 example: "Customer request for extension"
 *     responses:
 *       200:
 *         description: Subscription end date updated successfully
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
 *                   example: "Subscription end date updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeId:
 *                       type: string
 *                     storeName:
 *                       type: string
 *                     previousEndDate:
 *                       type: string
 *                       format: date-time
 *                     newEndDate:
 *                       type: string
 *                       format: date-time
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         isSubscribed:
 *                           type: boolean
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                         nextPaymentDate:
 *                           type: string
 *                           format: date-time
 *                         plan:
 *                           type: string
 *                         planId:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         currency:
 *                           type: string
 *       400:
 *         description: Invalid request data or store does not have active subscription
 *       404:
 *         description: Store not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.patch('/stores/:storeId/end-date',
    protect,
    [
        param('storeId').isMongoId().withMessage('Invalid store ID'),
        body('endDate').isISO8601().withMessage('End date must be a valid ISO 8601 date'),
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    updateSubscriptionEndDate
);

module.exports = router;
