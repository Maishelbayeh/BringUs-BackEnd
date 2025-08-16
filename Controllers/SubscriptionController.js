const Store = require('../Models/Store');
const SubscriptionService = require('../services/SubscriptionService');
const { validationResult } = require('express-validator');

/**
 * Get subscription statistics
 */
const getSubscriptionStats = async (req, res) => {
    try {
        const stats = await SubscriptionService.getSubscriptionStats();
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching subscription stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Check subscription status for a specific store
 */
const checkStoreSubscription = async (req, res) => {
    try {
        const { storeId } = req.params;
        
        const subscriptionInfo = await SubscriptionService.checkStoreSubscription(storeId);
        
        if (!subscriptionInfo) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: subscriptionInfo
        });
    } catch (error) {
        console.error('Error checking store subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Manually trigger subscription check (Superadmin only)
 */
const triggerSubscriptionCheck = async (req, res) => {
    try {
        await SubscriptionService.checkSubscriptionStatus();
        
        res.status(200).json({
            success: true,
            message: 'Subscription check completed successfully'
        });
    } catch (error) {
        console.error('Error triggering subscription check:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Activate or renew subscription for a store
 */
const activateSubscription = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { storeId } = req.params;
        const { 
            planId, // Now using planId instead of plan type
            referenceId,
            autoRenew = false,
            startDate, // Optional custom start date for custom plans
            endDate    // Optional custom end date for custom plans
        } = req.body;

        // Get the subscription plan
        const SubscriptionPlan = require('../Models/SubscriptionPlan');
        const plan = await SubscriptionPlan.findById(planId);
        
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        if (!plan.isActive) {
            return res.status(400).json({
                success: false,
                message: 'This subscription plan is not active'
            });
        }

        // Get current store to save previous state
        const currentStore = await Store.findById(storeId);
        if (!currentStore) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Save previous state
        const previousState = {
            subscription: { ...currentStore.subscription.toObject() },
            status: currentStore.status
        };

        // Calculate dates based on plan duration or use custom dates
        let subscriptionStartDate, subscriptionEndDate;
        
        if (plan.type === 'custom') {
            // For custom plans, use provided dates or default to current date
            subscriptionStartDate = startDate ? new Date(startDate) : new Date();
            subscriptionEndDate = endDate ? new Date(endDate) : new Date();
            
            // If only startDate is provided, calculate endDate based on plan duration
            if (startDate && !endDate) {
                subscriptionEndDate = new Date(subscriptionStartDate);
                subscriptionEndDate.setDate(subscriptionEndDate.getDate() + plan.duration);
            }
            // If only endDate is provided, calculate startDate based on plan duration
            else if (!startDate && endDate) {
                subscriptionStartDate = new Date(subscriptionEndDate);
                subscriptionStartDate.setDate(subscriptionStartDate.getDate() - plan.duration);
            }
            // If neither is provided, use current date and calculate endDate
            else if (!startDate && !endDate) {
                subscriptionStartDate = new Date();
                subscriptionEndDate = new Date();
                subscriptionEndDate.setDate(subscriptionEndDate.getDate() + plan.duration);
            }
            
            // Validate that endDate is after startDate
            if (subscriptionEndDate <= subscriptionStartDate) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }
        } else {
            // For non-custom plans, use current date and calculate based on duration
            subscriptionStartDate = new Date();
            subscriptionEndDate = new Date();
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + plan.duration);
        }

        // Update store subscription
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                'subscription.isSubscribed': true,
                'subscription.plan': plan.type,
                'subscription.planId': planId, // Store the plan ID for reference
                'subscription.startDate': subscriptionStartDate,
                'subscription.endDate': subscriptionEndDate,
                'subscription.lastPaymentDate': subscriptionStartDate,
                'subscription.nextPaymentDate': subscriptionEndDate,
                'subscription.autoRenew': autoRenew,
                'subscription.referenceId': referenceId,
                'subscription.amount': plan.price,
                'subscription.currency': plan.currency,
                status: 'active' // Activate store
            },
            { new: true, runValidators: true }
        );

        if (!updatedStore) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Add to subscription history
        const action = currentStore.subscription.isSubscribed ? 'subscription_renewed' : 'subscription_activated';
        const description = currentStore.subscription.isSubscribed 
            ? `Subscription renewed to ${plan.name} plan for ${plan.price} ${plan.currency}`
            : `Subscription activated with ${plan.name} plan for ${plan.price} ${plan.currency}`;

        await updatedStore.addSubscriptionHistory(
            action,
            description,
            {
                planId: plan._id,
                planName: plan.name,
                planNameAr: plan.nameAr,
                planType: plan.type,
                duration: plan.duration,
                price: plan.price,
                currency: plan.currency,
                referenceId,
                autoRenew,
                startDate:subscriptionStartDate,
                endDate:subscriptionEndDate,
            },
            req.user._id
        );

        res.status(200).json({
            success: true,
            message: 'Subscription activated successfully',
            data: {
                store: updatedStore,
                plan: {
                    id: plan._id,
                    name: plan.name,
                    nameAr: plan.nameAr,
                    type: plan.type,
                    duration: plan.duration,
                    price: plan.price,
                    currency: plan.currency,
                }
            }
        });
    } catch (error) {
        console.error('Error activating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Extend trial period for a store
 */
const extendTrial = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { storeId } = req.params;
        const { days } = req.body;

        if (!days || days <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Days must be a positive number'
            });
        }

        // Get current store
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Save previous state
        const previousTrialEnd = store.subscription.trialEndDate;

        // Calculate new trial end date
        const currentTrialEnd = store.subscription.trialEndDate || new Date();
        const newTrialEnd = new Date(currentTrialEnd);
        newTrialEnd.setDate(newTrialEnd.getDate() + days);

        // Update trial end date
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                'subscription.trialEndDate': newTrialEnd,
                'subscription.isSubscribed': false // Ensure it's still in trial
            },
            { new: true, runValidators: true }
        );

        // Add to subscription history
        await updatedStore.addSubscriptionHistory(
            'trial_extended',
            `Trial period extended by ${days} days`,
            {
                previousTrialEnd,
                newTrialEnd,
                daysAdded: days,
                extendedBy: req.user._id
            },
            req.user._id
        );

        res.status(200).json({
            success: true,
            message: `Trial extended by ${days} days`,
            data: updatedStore
        });
    } catch (error) {
        console.error('Error extending trial:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Extend free trial period for a store (Superadmin only)
 */
const extendFreeTrial = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { storeId } = req.params;
        const { days, reason } = req.body;

        if (!days || days <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Days must be a positive number'
            });
        }

        if (days > 365) {
            return res.status(400).json({
                success: false,
                message: 'Trial extension cannot exceed 365 days'
            });
        }

        // Get current store
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Check if store is currently in trial
        if (store.subscription.isSubscribed) {
            return res.status(400).json({
                success: false,
                message: 'Cannot extend trial for a store with active subscription'
            });
        }

        // Save previous state
        const previousTrialEnd = store.subscription.trialEndDate;
        const previousDaysUntilExpiry = store.daysUntilTrialExpires;

        // Calculate new trial end date
        const currentTrialEnd = store.subscription.trialEndDate || new Date();
        const newTrialEnd = new Date(currentTrialEnd);
        newTrialEnd.setDate(newTrialEnd.getDate() + days);

        // Update trial end date
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                'subscription.trialEndDate': newTrialEnd,
                'subscription.isSubscribed': false, // Ensure it's still in trial
                status: 'active' // Ensure store is active
            },
            { new: true, runValidators: true }
        );

        // Add to subscription history
        await updatedStore.addSubscriptionHistory(
            'free_trial_extended',
            `Free trial period extended by ${days} days${reason ? ` - Reason: ${reason}` : ''}`,
            {
                previousTrialEnd,
                newTrialEnd,
                daysAdded: days,
                previousDaysUntilExpiry,
                newDaysUntilExpiry: updatedStore.daysUntilTrialExpires,
                reason: reason || 'No reason provided',
                extendedBy: req.user._id,
                extendedAt: new Date()
            },
            req.user._id
        );

        res.status(200).json({
            success: true,
            message: `Free trial extended by ${days} days`,
            data: {
                storeId: updatedStore._id,
                storeName: updatedStore.nameEn,
                previousTrialEnd,
                newTrialEnd,
                daysAdded: days,
                daysUntilExpiry: updatedStore.daysUntilTrialExpires,
                subscription: {
                    isSubscribed: updatedStore.subscription.isSubscribed,
                    trialEndDate: updatedStore.subscription.trialEndDate,
                    isTrialExpired: updatedStore.isTrialExpired
                },
                status: updatedStore.status
            }
        });
    } catch (error) {
        console.error('Error extending free trial:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get stores with expiring subscriptions/trials
 */
const getExpiringStores = async (req, res) => {
    try {
        const { days = 3, search } = req.query;
        
        const expiringDate = new Date();
        expiringDate.setDate(expiringDate.getDate() + parseInt(days));

        // Build filter
        const filter = {
            $or: [
                {
                    'subscription.isSubscribed': true,
                    'subscription.endDate': { $lte: expiringDate, $gt: new Date() }
                },
                {
                    'subscription.isSubscribed': false,
                    'subscription.trialEndDate': { $lte: expiringDate, $gt: new Date() }
                }
            ]
        };

        // Add search filter for store name
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive search
            filter.$and = [
                {
                    $or: [
                        { nameEn: searchRegex },
                        { nameAr: searchRegex }
                    ]
                }
            ];
        }

        // Find stores with expiring subscriptions or trials
        const expiringStores = await Store.find(filter)
            .select('nameEn nameAr subscription status createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: expiringStores,
            count: expiringStores.length,
            search: search || null
        });
    } catch (error) {
        console.error('Error fetching expiring stores:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get recently deactivated stores
 */
const getDeactivatedStores = async (req, res) => {
    try {
        const { days = 7, search } = req.query;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        // Build filter
        const filter = {
            status: 'inactive',
            updatedAt: { $gte: cutoffDate },
            $or: [
                {
                    'subscription.isSubscribed': true,
                    'subscription.endDate': { $lt: new Date() }
                },
                {
                    'subscription.isSubscribed': false,
                    'subscription.trialEndDate': { $lt: new Date() }
                }
            ]
        };

        // Add search filter for store name
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive search
            filter.$and = [
                {
                    $or: [
                        { nameEn: searchRegex },
                        { nameAr: searchRegex }
                    ]
                }
            ];
        }

        // Find stores deactivated due to subscription/trial expiry
        const deactivatedStores = await Store.find(filter)
            .select('nameEn nameAr subscription status createdAt updatedAt')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: deactivatedStores,
            count: deactivatedStores.length,
            search: search || null
        });
    } catch (error) {
        console.error('Error fetching deactivated stores:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Cancel subscription for a store
 */
const cancelSubscription = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { reason } = req.body;

        // Get current store to save previous state
        const currentStore = await Store.findById(storeId);
        if (!currentStore) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Save previous state
        const previousState = {
            subscription: { ...currentStore.subscription.toObject() },
            status: currentStore.status
        };

        // Update store subscription
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                'subscription.isSubscribed': false,
                'subscription.autoRenew': false,
                'subscription.endDate': new Date(), // End immediately
                status: 'inactive'
            },
            { new: true, runValidators: true }
        );

        // Add to subscription history
        await updatedStore.addSubscriptionHistory(
            'subscription_cancelled',
            `Subscription cancelled${reason ? ` - Reason: ${reason}` : ''}`,
            {
                reason: reason || 'No reason provided',
                cancelledBy: req.user._id,
                cancelledAt: new Date(),
                previousState
            },
            req.user._id
        );

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: updatedStore
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Disable auto-renewal for a store subscription
 */
const disableAutoRenewal = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { reason } = req.body;

        // Get current store to save previous state
        const currentStore = await Store.findById(storeId);
        if (!currentStore) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Check if auto-renewal is already disabled
        if (!currentStore.subscription.autoRenew) {
            return res.status(400).json({
                success: false,
                message: 'Auto-renewal is already disabled'
            });
        }

        // Save previous state
        const previousState = {
            subscription: { ...currentStore.subscription.toObject() },
            status: currentStore.status
        };

        // Update store subscription to disable auto-renewal
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                'subscription.autoRenew': false
            },
            { new: true, runValidators: true }
        );

        // Add to subscription history
        await updatedStore.addSubscriptionHistory(
            'auto_renewal_disabled',
            `Auto-renewal disabled${reason ? ` - Reason: ${reason}` : ''}`,
            {
                reason: reason || 'No reason provided',
                disabledBy: req.user._id,
                disabledAt: new Date(),
                previousState
            },
            req.user._id
        );

        res.status(200).json({
            success: true,
            message: 'Auto-renewal disabled successfully',
            data: {
                storeId: updatedStore._id,
                storeName: updatedStore.nameEn,
                autoRenew: updatedStore.subscription.autoRenew,
                subscriptionEndDate: updatedStore.subscription.endDate,
                message: 'Subscription will not renew automatically when it expires'
            }
        });
    } catch (error) {
        console.error('Error disabling auto-renewal:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Enable auto-renewal for a store subscription
 */
const enableAutoRenewal = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { reason } = req.body;

        // Get current store to save previous state
        const currentStore = await Store.findById(storeId);
        if (!currentStore) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Check if auto-renewal is already enabled
        if (currentStore.subscription.autoRenew) {
            return res.status(400).json({
                success: false,
                message: 'Auto-renewal is already enabled'
            });
        }

        // Check if subscription is active
        if (!currentStore.subscription.isSubscribed) {
            return res.status(400).json({
                success: false,
                message: 'Cannot enable auto-renewal for inactive subscription'
            });
        }

        // Save previous state
        const previousState = {
            subscription: { ...currentStore.subscription.toObject() },
            status: currentStore.status
        };

        // Update store subscription to enable auto-renewal
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                'subscription.autoRenew': true
            },
            { new: true, runValidators: true }
        );

        // Add to subscription history
        await updatedStore.addSubscriptionHistory(
            'auto_renewal_enabled',
            `Auto-renewal enabled${reason ? ` - Reason: ${reason}` : ''}`,
            {
                reason: reason || 'No reason provided',
                enabledBy: req.user._id,
                enabledAt: new Date(),
                previousState
            },
            req.user._id
        );

        res.status(200).json({
            success: true,
            message: 'Auto-renewal enabled successfully',
            data: {
                storeId: updatedStore._id,
                storeName: updatedStore.nameEn,
                autoRenew: updatedStore.subscription.autoRenew,
                subscriptionEndDate: updatedStore.subscription.endDate,
                message: 'Subscription will renew automatically when it expires'
            }
        });
    } catch (error) {
        console.error('Error enabling auto-renewal:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get all subscriptions with filters
 */
const getAllSubscriptions = async (req, res) => {
    try {
        const { 
            status, 
            plan, 
            search,
            page = 1, 
            limit = 10,
            sort = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build filter
        const filter = {};
        
        if (status) {
            if (status === 'active') {
                filter.status = 'active';
            } else if (status === 'inactive') {
                filter.status = 'inactive';
            }
        }

        if (plan) {
            filter['subscription.planId'] = plan;
        }

        // Add search filter for store name
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive search
            filter.$or = [
                { nameEn: searchRegex },
                { nameAr: searchRegex }
            ];
        }

        // Build sort
        const sortObj = {};
        sortObj[sort] = order === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get stores with subscription info
        const stores = await Store.find(filter)
            .select('nameEn nameAr subscription status createdAt')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const total = await Store.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: stores,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            search: search || null
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Update subscription details
 */
const updateSubscription = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { storeId } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.storeId;

        // Get current store to save previous state
        const currentStore = await Store.findById(storeId);
        if (!currentStore) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Save previous state
        const previousState = {
            subscription: { ...currentStore.subscription.toObject() },
            status: currentStore.status
        };

        // Build subscription update object
        const subscriptionUpdate = {};
        Object.keys(updateData).forEach(key => {
            if (key.startsWith('subscription.')) {
                subscriptionUpdate[key] = updateData[key];
            }
        });

        // Update store
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            subscriptionUpdate,
            { new: true, runValidators: true }
        );

        // Add to subscription history
        await updatedStore.addSubscriptionHistory(
            'plan_changed',
            'Subscription details updated',
            {
                changes: updateData,
                updatedBy: req.user._id,
                previousState
            },
            req.user._id
        );

        res.status(200).json({
            success: true,
            message: 'Subscription updated successfully',
            data: updatedStore
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Update subscription end date (Superadmin only)
 */
const updateSubscriptionEndDate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { storeId } = req.params;
        const { endDate, reason } = req.body;

        // Validate endDate
        if (!endDate) {
            return res.status(400).json({
                success: false,
                message: 'End date is required'
            });
        }

        const newEndDate = new Date(endDate);
        if (isNaN(newEndDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid end date format'
            });
        }

        // Get current store to save previous state
        const currentStore = await Store.findById(storeId);
        if (!currentStore) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Check if store has an active subscription
        if (!currentStore.subscription.isSubscribed) {
            return res.status(400).json({
                success: false,
                message: 'Store does not have an active subscription'
            });
        }

        // Save previous state
        const previousState = {
            subscription: { ...currentStore.subscription.toObject() },
            status: currentStore.status
        };

        const previousEndDate = currentStore.subscription.endDate;

        // Update subscription end date
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                'subscription.endDate': newEndDate,
                'subscription.nextPaymentDate': newEndDate
            },
            { new: true, runValidators: true }
        );

        // Add to subscription history
        await updatedStore.addSubscriptionHistory(
            'end_date_updated',
            `Subscription end date updated${reason ? ` - Reason: ${reason}` : ''}`,
            {
                previousEndDate,
                newEndDate,
                reason: reason || 'No reason provided',
                updatedBy: req.user._id,
                updatedAt: new Date()
            },
            req.user._id
        );

        res.status(200).json({
            success: true,
            message: 'Subscription end date updated successfully',
            data: {
                storeId: updatedStore._id,
                storeName: updatedStore.nameEn,
                previousEndDate,
                newEndDate,
                subscription: {
                    isSubscribed: updatedStore.subscription.isSubscribed,
                    endDate: updatedStore.subscription.endDate,
                    nextPaymentDate: updatedStore.subscription.nextPaymentDate,
                    plan: updatedStore.subscription.plan,
                    planId: updatedStore.subscription.planId,
                    amount: updatedStore.subscription.amount,
                    currency: updatedStore.subscription.currency
                }
            }
        });
    } catch (error) {
        console.error('Error updating subscription end date:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get subscription history for a specific store
 */
const getStoreSubscriptionHistory = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { page = 1, limit = 10, action } = req.query;

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Get history with pagination
        const historyData = store.getSubscriptionHistory(parseInt(page), parseInt(limit));
        
        // Filter by action if specified
        let filteredHistory = historyData.history;
        if (action) {
            filteredHistory = historyData.history.filter(entry => entry.action === action);
        }

        res.status(200).json({
            success: true,
            data: {
                storeId: store._id,
                storeName: store.nameEn,
                history: filteredHistory,
                pagination: {
                    ...historyData.pagination,
                    filteredCount: filteredHistory.length
                }
            }
        });
    } catch (error) {
        console.error('Error fetching subscription history:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get subscription statistics for a specific store
 */
const getStoreSubscriptionStats = async (req, res) => {
    try {
        const { storeId } = req.params;

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        const stats = store.getSubscriptionStats();
        const recentActivities = store.getRecentActivities(30);

        res.status(200).json({
            success: true,
            data: {
                storeId: store._id,
                storeName: store.nameEn,
                stats,
                recentActivities: recentActivities.slice(0, 5) // Last 5 activities
            }
        });
    } catch (error) {
        console.error('Error fetching subscription stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get recent activities across all stores
 */
const getAllRecentActivities = async (req, res) => {
    try {
        const { days = 30, page = 1, limit = 20 } = req.query;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        // Get all stores with recent activities
        const stores = await Store.find({
            'subscriptionHistory.performedAt': { $gte: cutoffDate }
        }).select('nameEn nameAr subscriptionHistory');

        // Collect all activities
        let allActivities = [];
        stores.forEach(store => {
            const recentActivities = store.getRecentActivities(parseInt(days));
            recentActivities.forEach(activity => {
                allActivities.push({
                    storeId: store._id,
                    storeName: store.nameEn,
                    storeNameAr: store.nameAr,
                    ...activity.toObject()
                });
            });
        });

        // Sort by date (newest first)
        allActivities.sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt));

        // Apply pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedActivities = allActivities.slice(skip, skip + parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                activities: paginatedActivities,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: allActivities.length,
                    pages: Math.ceil(allActivities.length / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Reactivate a store
 */
const reactivateStore = async (req, res) => {
    try {
        const { storeId } = req.params;
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Check if store is currently inactive
        if (store.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'Store is already active'
            });
        }

        // Reactivate the store
        await store.reactivateStore(req.user._id);

        res.status(200).json({
            success: true,
            message: 'Store reactivated successfully',
            data: {
                storeId: store._id,
                storeName: store.nameEn,
                status: store.status,
                reactivatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error reactivating store:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get store status information (Public endpoint - no authentication required)
 */
const getStoreStatus = async (req, res) => {
    try {
        const { storeId } = req.params;
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Check if store should be deactivated (this will happen automatically)
        if (store.shouldBeDeactivated()) {
            await store.deactivateIfExpired();
        }

        // Return public status information (no sensitive data)
        res.status(200).json({
            success: true,
            data: {
                storeId: store._id,
                storeName: store.nameEn,
                status: store.status,
                isSubscriptionActive: store.isSubscriptionActive,
                isTrialExpired: store.isTrialExpired,
                daysUntilTrialExpires: store.daysUntilTrialExpires,
                daysUntilSubscriptionExpires: store.daysUntilSubscriptionExpires,
                subscription: {
                    isSubscribed: store.subscription.isSubscribed,
                    endDate: store.subscription.endDate,
                    trialEndDate: store.subscription.trialEndDate,
                    planId: store.subscription.planId,
                    amount: store.subscription.amount,
                    currency: store.subscription.currency
                }
            }
        });
    } catch (error) {
        console.error('Error getting store status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get store status by slug (Public endpoint - no authentication required)
 */
const getStoreStatusBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        const store = await Store.findOne({ slug });
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Check if store should be deactivated (this will happen automatically)
        if (store.shouldBeDeactivated()) {
            await store.deactivateIfExpired();
        }

        // Return public status information (no sensitive data)
        res.status(200).json({
            success: true,
            data: {
                storeId: store._id,
                storeName: store.nameEn,
                slug: store.slug,
                status: store.status,
                isSubscriptionActive: store.isSubscriptionActive,
                isTrialExpired: store.isTrialExpired,
                daysUntilTrialExpires: store.daysUntilTrialExpires,
                daysUntilSubscriptionExpires: store.daysUntilSubscriptionExpires,
                subscription: {
                    isSubscribed: store.subscription.isSubscribed,
                    endDate: store.subscription.endDate,
                    trialEndDate: store.subscription.trialEndDate,
                    planId: store.subscription.planId,
                    amount: store.subscription.amount,
                    currency: store.subscription.currency
                }
            }
        });
    } catch (error) {
        console.error('Error getting store status by slug:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
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
    getStoreStatus,
    getStoreStatusBySlug
};
