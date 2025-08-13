const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superadminAuth');
const {
    createPlan,
    getAllPlans,
    getActivePlans,
    getPlanById,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    setPopularPlan,
    getPlanStats
} = require('../Controllers/SubscriptionPlanController');

/**
 * @swagger
 * /api/subscription-plans:
 *   post:
 *     summary: Create a new subscription plan
 *     description: Create a new subscription plan with pricing and features (Superadmin only)
 *     tags: [Subscription Plans]
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
 *               - nameAr
 *               - type
 *               - duration
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Monthly"
 *               nameAr:
 *                 type: string
 *                 example: "بريميوم شهري"
 *               description:
 *                 type: string
 *                 example: "Premium monthly subscription with unlimited features"
 *               descriptionAr:
 *                 type: string
 *                 example: "اشتراك شهري بريميوم مع ميزات غير محدودة"
 *               type:
 *                 type: string
 *                 enum: [free, monthly, quarterly, semi_annual, annual, custom]
 *                 example: "monthly"
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *                 example: 30
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 99.99
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, ILS, SAR, AED, EGP]
 *                 default: "USD"
 *               features:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     nameAr:
 *                       type: string
 *                     description:
 *                       type: string
 *                     descriptionAr:
 *                       type: string
 *                     included:
 *                       type: boolean
 *                       default: true
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               isPopular:
 *                 type: boolean
 *                 default: false
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *               maxProducts:
 *                 type: integer
 *                 default: -1
 *               maxOrders:
 *                 type: integer
 *                 default: -1
 *               maxUsers:
 *                 type: integer
 *                 default: -1
 *               storageLimit:
 *                 type: integer
 *                 default: -1
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
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
 *                   example: "Subscription plan created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 *       400:
 *         description: Validation error or plan already exists
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.post('/',
    protect,
    requireSuperAdmin,
    [
        body('name').notEmpty().withMessage('Plan name is required'),
        body('nameAr').notEmpty().withMessage('Plan name in Arabic is required'),
        body('type').isIn(['free', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom']).withMessage('Invalid plan type'),
        body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
        body('currency').optional().isIn(['USD', 'EUR', 'ILS', 'SAR', 'AED', 'EGP']).withMessage('Invalid currency')
    ],
    createPlan
);

/**
 * @swagger
 * /api/subscription-plans:
 *   get:
 *     summary: Get all subscription plans with filters
 *     description: Retrieve all subscription plans with optional filtering and pagination (Superadmin only)
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [free, monthly, quarterly, semi_annual, annual, custom]
 *         description: Filter by plan type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [sortOrder, price, createdAt, name]
 *           default: sortOrder
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved subscription plans
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
 *                     $ref: '#/components/schemas/SubscriptionPlan'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.get('/',
    protect,
    requireSuperAdmin,
    [
        query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
        query('type').optional().isIn(['free', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom']).withMessage('Invalid plan type'),
        query('sortBy').optional().isIn(['sortOrder', 'price', 'createdAt', 'name']).withMessage('Invalid sort field'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    getAllPlans
);

/**
 * @swagger
 * /api/subscription-plans/active:
 *   get:
 *     summary: Get active subscription plans for public display
 *     description: Retrieve all active subscription plans for public display (no authentication required)
 *     tags: [Subscription Plans]
 *     responses:
 *       200:
 *         description: Successfully retrieved active plans
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
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       nameAr:
 *                         type: string
 *                       type:
 *                         type: string
 *                       duration:
 *                         type: integer
 *                       durationText:
 *                         type: string
 *                       durationTextAr:
 *                         type: string
 *                       price:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       formattedPrice:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       isPopular:
 *                         type: boolean
 *                       features:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             nameAr:
 *                               type: string
 *       500:
 *         description: Internal server error
 */
router.get('/active', getActivePlans);

/**
 * @swagger
 * /api/subscription-plans/{planId}:
 *   get:
 *     summary: Get a specific subscription plan
 *     description: Retrieve detailed information about a specific subscription plan (Superadmin only)
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: The subscription plan ID
 *     responses:
 *       200:
 *         description: Successfully retrieved subscription plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Subscription plan not found
 *       500:
 *         description: Internal server error
 */
router.get('/:planId',
    protect,
    requireSuperAdmin,
    [
        param('planId').isMongoId().withMessage('Invalid plan ID')
    ],
    getPlanById
);

/**
 * @swagger
 * /api/subscription-plans/{planId}:
 *   put:
 *     summary: Update a subscription plan
 *     description: Update an existing subscription plan (Superadmin only)
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: The subscription plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               nameAr:
 *                 type: string
 *               description:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [free, monthly, quarterly, semi_annual, annual, custom]
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *               price:
 *                 type: number
 *                 minimum: 0
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, ILS, SAR, AED, EGP]
 *               features:
 *                 type: array
 *               isActive:
 *                 type: boolean
 *               isPopular:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               maxProducts:
 *                 type: integer
 *               maxOrders:
 *                 type: integer
 *               maxUsers:
 *                 type: integer
 *               storageLimit:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Subscription plan updated successfully
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
 *                   example: "Subscription plan updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Subscription plan not found
 *       500:
 *         description: Internal server error
 */
router.put('/:planId',
    protect,
    requireSuperAdmin,
    [
        param('planId').isMongoId().withMessage('Invalid plan ID'),
        body('type').optional().isIn(['free', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom']).withMessage('Invalid plan type'),
        body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
        body('currency').optional().isIn(['USD', 'EUR', 'ILS', 'SAR', 'AED', 'EGP']).withMessage('Invalid currency')
    ],
    updatePlan
);

/**
 * @swagger
 * /api/subscription-plans/{planId}:
 *   delete:
 *     summary: Delete a subscription plan
 *     description: Delete a subscription plan (only if not in use by any stores) (Superadmin only)
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: The subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription plan deleted successfully
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
 *                   example: "Subscription plan deleted successfully"
 *       400:
 *         description: Plan is in use by stores
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Subscription plan not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:planId',
    protect,
    requireSuperAdmin,
    [
        param('planId').isMongoId().withMessage('Invalid plan ID')
    ],
    deletePlan
);

/**
 * @swagger
 * /api/subscription-plans/{planId}/toggle:
 *   post:
 *     summary: Toggle plan active status
 *     description: Activate or deactivate a subscription plan (Superadmin only)
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: The subscription plan ID
 *     responses:
 *       200:
 *         description: Plan status toggled successfully
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
 *                   example: "Plan activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Subscription plan not found
 *       500:
 *         description: Internal server error
 */
router.post('/:planId/toggle',
    protect,
    requireSuperAdmin,
    [
        param('planId').isMongoId().withMessage('Invalid plan ID')
    ],
    togglePlanStatus
);

/**
 * @swagger
 * /api/subscription-plans/{planId}/popular:
 *   post:
 *     summary: Set plan as popular
 *     description: Mark or unmark a subscription plan as popular (Superadmin only)
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: The subscription plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPopular
 *             properties:
 *               isPopular:
 *                 type: boolean
 *                 description: Whether to mark the plan as popular
 *     responses:
 *       200:
 *         description: Plan popularity updated successfully
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
 *                   example: "Plan popularity set successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       404:
 *         description: Subscription plan not found
 *       500:
 *         description: Internal server error
 */
router.post('/:planId/popular',
    protect,
    requireSuperAdmin,
    [
        param('planId').isMongoId().withMessage('Invalid plan ID'),
        body('isPopular').isBoolean().withMessage('isPopular must be a boolean')
    ],
    setPopularPlan
);

/**
 * @swagger
 * /api/subscription-plans/stats:
 *   get:
 *     summary: Get subscription plan statistics
 *     description: Retrieve statistics about subscription plans (Superadmin only)
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved plan statistics
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
 *                       type: integer
 *                       example: 10
 *                     active:
 *                       type: integer
 *                       example: 8
 *                     inactive:
 *                       type: integer
 *                       example: 2
 *                     popular:
 *                       type: integer
 *                       example: 3
 *                     byType:
 *                       type: object
 *                       properties:
 *                         free:
 *                           type: integer
 *                         monthly:
 *                           type: integer
 *                         quarterly:
 *                           type: integer
 *                         semi_annual:
 *                           type: integer
 *                         annual:
 *                           type: integer
 *                         custom:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a superadmin
 *       500:
 *         description: Internal server error
 */
router.get('/stats',
    protect,
    requireSuperAdmin,
    getPlanStats
);

module.exports = router;
