const Store = require('../Models/Store');
const SubscriptionService = require('../services/SubscriptionService');

/**
 * Get subscription statistics
 */
exports.getSubscriptionStats = async (req, res) => {
  try {
    const stats = await SubscriptionService.getSubscriptionStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching subscription statistics',
      error: error.message
    });
  }
};

/**
 * Check subscription status for a specific store
 */
exports.checkStoreSubscription = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const subscriptionInfo = await SubscriptionService.checkStoreSubscription(storeId);
    
    return res.json({
      success: true,
      data: subscriptionInfo
    });
  } catch (error) {
    console.error('Error checking store subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking store subscription',
      error: error.message
    });
  }
};

/**
 * Manually trigger subscription check (for testing or admin use)
 */
exports.triggerSubscriptionCheck = async (req, res) => {
  try {
    // Verify superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin role required.'
      });
    }

    const results = await SubscriptionService.checkSubscriptionStatus();
    
    return res.json({
      success: true,
      message: 'Subscription check completed successfully',
      data: results
    });
  } catch (error) {
    console.error('Error triggering subscription check:', error);
    return res.status(500).json({
      success: false,
      message: 'Error triggering subscription check',
      error: error.message
    });
  }
};

/**
 * Activate subscription for a store
 */
exports.activateSubscription = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { plan, durationInDays, amount, paymentMethod, autoRenew } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!plan || !durationInDays) {
      return res.status(400).json({
        success: false,
        message: 'Plan and duration are required'
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Activate subscription
    await store.activateSubscription(plan, durationInDays, amount || 0);
    
    // Update additional fields
    if (paymentMethod) {
      store.subscription.paymentMethod = paymentMethod;
    }
    if (autoRenew !== undefined) {
      store.subscription.autoRenew = autoRenew;
    }
    
    await store.save();

    return res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        storeId: store._id,
        storeName: store.nameEn,
        subscription: store.subscription,
        status: store.status
      }
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error activating subscription',
      error: error.message
    });
  }
};

/**
 * Extend trial period for a store
 */
exports.extendTrial = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { daysToAdd } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!daysToAdd || daysToAdd <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid number of days to add is required'
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    await store.extendTrial(daysToAdd);

    return res.json({
      success: true,
      message: `Trial extended by ${daysToAdd} days`,
      data: {
        storeId: store._id,
        storeName: store.nameEn,
        trialEndDate: store.subscription.trialEndDate,
        daysUntilTrialExpires: store.daysUntilTrialExpires
      }
    });
  } catch (error) {
    console.error('Error extending trial:', error);
    return res.status(500).json({
      success: false,
      message: 'Error extending trial',
      error: error.message
    });
  }
};

/**
 * Get stores with expiring subscriptions
 */
exports.getExpiringStores = async (req, res) => {
  try {
    const { days = 7 } = req.query; // Default to 7 days
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const expiringStores = await Store.find({
      $or: [
        // Trial expiring
        {
          'subscription.isSubscribed': false,
          'subscription.trialEndDate': { 
            $gte: now, 
            $lte: futureDate 
          },
          status: 'active'
        },
        // Subscription expiring
        {
          'subscription.isSubscribed': true,
          'subscription.endDate': { 
            $gte: now, 
            $lte: futureDate 
          },
          status: 'active'
        }
      ]
    }).select('nameEn nameAr slug subscription status createdAt');

    const storesWithDetails = expiringStores.map(store => ({
      storeId: store._id,
      storeName: store.nameEn,
      storeNameAr: store.nameAr,
      slug: store.slug,
      subscription: store.subscription,
      status: store.status,
      daysUntilExpiry: store.subscription.isSubscribed 
        ? store.daysUntilSubscriptionExpires 
        : store.daysUntilTrialExpires,
      type: store.subscription.isSubscribed ? 'subscription' : 'trial',
      createdAt: store.createdAt
    }));

    return res.json({
      success: true,
      data: {
        stores: storesWithDetails,
        count: storesWithDetails.length,
        daysChecked: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Error getting expiring stores:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching expiring stores',
      error: error.message
    });
  }
};

/**
 * Get stores that have been deactivated due to expired subscriptions
 */
exports.getDeactivatedStores = async (req, res) => {
  try {
    const { days = 30 } = req.query; // Default to 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const deactivatedStores = await Store.find({
      status: 'inactive',
      updatedAt: { $gte: cutoffDate }
    }).select('nameEn nameAr slug subscription status createdAt updatedAt');

    const storesWithDetails = deactivatedStores.map(store => ({
      storeId: store._id,
      storeName: store.nameEn,
      storeNameAr: store.nameAr,
      slug: store.slug,
      subscription: store.subscription,
      status: store.status,
      reason: store.subscription.isSubscribed ? 'subscription_expired' : 'trial_expired',
      deactivatedAt: store.updatedAt,
      createdAt: store.createdAt
    }));

    return res.json({
      success: true,
      data: {
        stores: storesWithDetails,
        count: storesWithDetails.length,
        daysChecked: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Error getting deactivated stores:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching deactivated stores',
      error: error.message
    });
  }
};

/**
 * Cancel subscription for a store
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { immediate = false } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    if (!store.subscription.isSubscribed) {
      return res.status(400).json({
        success: false,
        message: 'Store is not subscribed'
      });
    }

    if (immediate) {
      // Cancel immediately
      store.subscription.isSubscribed = false;
      store.subscription.autoRenew = false;
      store.subscription.endDate = new Date();
      store.status = 'inactive';
    } else {
      // Cancel at end of current period
      store.subscription.autoRenew = false;
    }

    await store.save();

    return res.json({
      success: true,
      message: immediate ? 'Subscription cancelled immediately' : 'Subscription will be cancelled at end of period',
      data: {
        storeId: store._id,
        storeName: store.nameEn,
        subscription: store.subscription,
        status: store.status
      }
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};
