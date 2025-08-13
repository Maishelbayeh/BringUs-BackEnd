const SubscriptionPlan = require('../Models/SubscriptionPlan');
const { validationResult } = require('express-validator');

/**
 * Create a new subscription plan
 */
const createPlan = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const {
            name,
            nameAr,
            description,
            descriptionAr,
            type,
            duration,
            price,
            currency = 'USD',
            features = [],
            isActive = true,
            isPopular = false,
            sortOrder = 0,
            maxProducts = -1,
            maxOrders = -1,
            maxUsers = -1,
            storageLimit = -1,
            customFeatures = {}
        } = req.body;

        // Check if plan with same type and duration already exists
        const existingPlan = await SubscriptionPlan.findOne({
            type,
            duration,
            isActive: true
        });

        if (existingPlan) {
            return res.status(400).json({
                success: false,
                message: 'A plan with this type and duration already exists'
            });
        }

        const plan = await SubscriptionPlan.create({
            name,
            nameAr,
            description,
            descriptionAr,
            type,
            duration,
            price,
            currency,
            features,
            isActive,
            isPopular,
            sortOrder,
            maxProducts,
            maxOrders,
            maxUsers,
            storageLimit,
            customFeatures,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Subscription plan created successfully',
            data: plan
        });
    } catch (error) {
        console.error('Error creating subscription plan:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get all subscription plans with filters
 */
const getAllPlans = async (req, res) => {
    try {
        const {
            isActive,
            type,
            sortBy = 'sortOrder',
            sortOrder = 'asc',
            page = 1,
            limit = 10
        } = req.query;

        // Build filter object
        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }
        if (type) {
            filter.type = type;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const plans = await SubscriptionPlan.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        const total = await SubscriptionPlan.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: plans,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get active plans for public display
 */
const getActivePlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true })
            .sort({ sortOrder: 1, price: 1 })
            .select('-createdBy -updatedBy -__v');

        const formattedPlans = plans.map(plan => plan.getSummary());

        res.status(200).json({
            success: true,
            data: formattedPlans
        });
    } catch (error) {
        console.error('Error fetching active plans:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get a specific subscription plan
 */
const getPlanById = async (req, res) => {
    try {
        const { planId } = req.params;

        const plan = await SubscriptionPlan.findById(planId)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        res.status(200).json({
            success: true,
            data: plan
        });
    } catch (error) {
        console.error('Error fetching subscription plan:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Update a subscription plan
 */
const updatePlan = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { planId } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated
        delete updateData._id;
        delete updateData.createdBy;
        delete updateData.createdAt;

        // Add updatedBy
        updateData.updatedBy = req.user._id;

        const plan = await SubscriptionPlan.findByIdAndUpdate(
            planId,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'firstName lastName email')
         .populate('updatedBy', 'firstName lastName email');

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subscription plan updated successfully',
            data: plan
        });
    } catch (error) {
        console.error('Error updating subscription plan:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Delete a subscription plan
 */
const deletePlan = async (req, res) => {
    try {
        const { planId } = req.params;

        const plan = await SubscriptionPlan.findById(planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        // Check if plan is being used by any stores
        const Store = require('../Models/Store');
        const storesUsingPlan = await Store.countDocuments({
            'subscription.plan': plan.type
        });

        if (storesUsingPlan > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete plan. It is currently used by ${storesUsingPlan} store(s). Consider deactivating it instead.`
            });
        }

        await SubscriptionPlan.findByIdAndDelete(planId);

        res.status(200).json({
            success: true,
            message: 'Subscription plan deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting subscription plan:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Toggle plan active status
 */
const togglePlanStatus = async (req, res) => {
    try {
        const { planId } = req.params;

        const plan = await SubscriptionPlan.findById(planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        plan.isActive = !plan.isActive;
        plan.updatedBy = req.user._id;
        await plan.save();

        res.status(200).json({
            success: true,
            message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
            data: plan
        });
    } catch (error) {
        console.error('Error toggling plan status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Set plan as popular
 */
const setPopularPlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const { isPopular } = req.body;

        const plan = await SubscriptionPlan.findById(planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        plan.isPopular = isPopular;
        plan.updatedBy = req.user._id;
        await plan.save();

        res.status(200).json({
            success: true,
            message: `Plan popularity ${isPopular ? 'set' : 'removed'} successfully`,
            data: plan
        });
    } catch (error) {
        console.error('Error setting plan popularity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get plan statistics
 */
const getPlanStats = async (req, res) => {
    try {
        const stats = {
            total: await SubscriptionPlan.countDocuments(),
            active: await SubscriptionPlan.countDocuments({ isActive: true }),
            inactive: await SubscriptionPlan.countDocuments({ isActive: false }),
            popular: await SubscriptionPlan.countDocuments({ isPopular: true }),
            byType: {}
        };

        // Get count by type
        const types = ['free', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom'];
        for (const type of types) {
            stats.byType[type] = await SubscriptionPlan.countDocuments({ type });
        }

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching plan stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createPlan,
    getAllPlans,
    getActivePlans,
    getPlanById,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    setPopularPlan,
    getPlanStats
};
