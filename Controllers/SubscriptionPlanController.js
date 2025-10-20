const SubscriptionPlan = require('../Models/SubscriptionPlan');
const { validationResult } = require('express-validator');

/**
 * Create a new subscription plan
 */
const createPlan = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Map validation errors to include both English and Arabic messages
            const formattedErrors = errors.array().map(err => {
                const fieldMessages = {
                    'name': { en: 'Plan name is required', ar: 'اسم الخطة مطلوب' },
                    'nameAr': { en: 'Plan name in Arabic is required', ar: 'اسم الخطة بالعربية مطلوب' },
                    'type': { en: 'Invalid plan type', ar: 'نوع الخطة غير صالح' },
                    'duration': { en: 'Duration must be a positive integer', ar: 'المدة يجب أن تكون رقماً صحيحاً موجباً' },
                    'price': { en: 'Price must be a non-negative number', ar: 'السعر يجب أن يكون رقماً موجباً أو صفر' },
                    'currency': { en: 'Invalid currency', ar: 'العملة غير صالحة' }
                };
                
                const field = err.path || err.param;
                const messages = fieldMessages[field] || { 
                    en: err.msg, 
                    ar: 'خطأ في التحقق من الحقل' 
                };
                
                return {
                    field: field,
                    message: messages.en,
                    messageAr: messages.ar,
                    value: err.value
                };
            });

            return res.status(400).json({
                success: false,
                message: 'Validation failed. Please check the form fields.',
                messageAr: 'فشل التحقق من الصحة. يرجى التحقق من حقول النموذج.',
                errors: formattedErrors
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
                message: 'A plan with this type and duration already exists',
                messageAr: 'خطة بهذا النوع والمدة موجودة بالفعل'
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
            messageAr: 'تم إنشاء خطة الاشتراك بنجاح',
            data: plan
        });
    } catch (error) {
        console.error('Error creating subscription plan:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            messageAr: 'خطأ داخلي في الخادم',
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
            messageAr: 'خطأ داخلي في الخادم',
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
            messageAr: 'خطأ داخلي في الخادم',
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
                message: 'Subscription plan not found',
                messageAr: 'خطة الاشتراك غير موجودة'
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
            messageAr: 'خطأ داخلي في الخادم',
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
            // Map validation errors to include both English and Arabic messages
            const formattedErrors = errors.array().map(err => {
                const fieldMessages = {
                    'planId': { en: 'Invalid plan ID', ar: 'معرف الخطة غير صالح' },
                    'type': { en: 'Invalid plan type', ar: 'نوع الخطة غير صالح' },
                    'duration': { en: 'Duration must be a positive integer', ar: 'المدة يجب أن تكون رقماً صحيحاً موجباً' },
                    'price': { en: 'Price must be a non-negative number', ar: 'السعر يجب أن يكون رقماً موجباً أو صفر' },
                    'currency': { en: 'Invalid currency', ar: 'العملة غير صالحة' }
                };
                
                const field = err.path || err.param;
                const messages = fieldMessages[field] || { 
                    en: err.msg, 
                    ar: 'خطأ في التحقق من الحقل' 
                };
                
                return {
                    field: field,
                    message: messages.en,
                    messageAr: messages.ar,
                    value: err.value
                };
            });

            return res.status(400).json({
                success: false,
                message: 'Validation failed. Please check the form fields.',
                messageAr: 'فشل التحقق من الصحة. يرجى التحقق من حقول النموذج.',
                errors: formattedErrors
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
                message: 'Subscription plan not found',
                messageAr: 'خطة الاشتراك غير موجودة'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subscription plan updated successfully',
            messageAr: 'تم تحديث خطة الاشتراك بنجاح',
            data: plan
        });
    } catch (error) {
        console.error('Error updating subscription plan:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            messageAr: 'خطأ داخلي في الخادم',
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
                message: 'Subscription plan not found',
                messageAr: 'خطة الاشتراك غير موجودة'
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
                message: `Cannot delete plan. It is currently used by ${storesUsingPlan} store(s). Consider deactivating it instead.`,
                messageAr: `لا يمكن حذف الخطة. يتم استخدامها حاليًا من قبل ${storesUsingPlan} متجر. فكر في إلغاء تفعيلها بدلاً من ذلك.`
            });
        }

        await SubscriptionPlan.findByIdAndDelete(planId);

        res.status(200).json({
            success: true,
            message: 'Subscription plan deleted successfully',
            messageAr: 'تم حذف خطة الاشتراك بنجاح'
        });
    } catch (error) {
        console.error('Error deleting subscription plan:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            messageAr: 'خطأ داخلي في الخادم',
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
                message: 'Subscription plan not found',
                messageAr: 'خطة الاشتراك غير موجودة'
            });
        }

        plan.isActive = !plan.isActive;
        plan.updatedBy = req.user._id;
        await plan.save();

        res.status(200).json({
            success: true,
            message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
            messageAr: plan.isActive ? 'تم تفعيل الخطة بنجاح' : 'تم إلغاء تفعيل الخطة بنجاح',
            data: plan
        });
    } catch (error) {
        console.error('Error toggling plan status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            messageAr: 'خطأ داخلي في الخادم',
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
                message: 'Subscription plan not found',
                messageAr: 'خطة الاشتراك غير موجودة'
            });
        }

        plan.isPopular = isPopular;
        plan.updatedBy = req.user._id;
        await plan.save();

        res.status(200).json({
            success: true,
            message: `Plan popularity ${isPopular ? 'set' : 'removed'} successfully`,
            messageAr: isPopular ? 'تم تعيين الخطة كشائعة بنجاح' : 'تم إزالة الخطة من الشائعة بنجاح',
            data: plan
        });
    } catch (error) {
        console.error('Error setting plan popularity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            messageAr: 'خطأ داخلي في الخادم',
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
            messageAr: 'خطأ داخلي في الخادم',
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
