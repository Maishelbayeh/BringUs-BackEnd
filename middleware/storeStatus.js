const Store = require('../Models/Store');

/**
 * Middleware to check and update store status automatically
 * This middleware will be called before any store-specific operations
 */
exports.checkStoreStatus = async (req, res, next) => {
  try {
    // Get store ID from token or params
    const storeId = req.storeId || req.params.storeId || req.body.storeId;
    
    if (!storeId) {
      return next(); // No store ID, continue
    }

    // Find the store
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if store should be deactivated
    if (store.shouldBeDeactivated()) {
      await store.deactivateIfExpired();
      
      // If this is a non-admin request, return error
      if (req.user && !['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Store is currently inactive due to expired subscription/trial',
          storeStatus: 'inactive',
          subscriptionStatus: store.subscription.isSubscribed ? 'expired' : 'trial_expired'
        });
      }
    }

    // Add store info to request for later use
    req.currentStore = store;
    next();
  } catch (error) {
    console.error('Store status check error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware to require active store status
 * This will block requests if store is inactive
 */
exports.requireActiveStore = async (req, res, next) => {
  try {
    const storeId = req.storeId || req.params.storeId || req.body.storeId;
    
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

    // Check and update status if needed
    if (store.shouldBeDeactivated()) {
      await store.deactivateIfExpired();
    }

    // Check if store is active
    if (store.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Store is currently inactive',
        storeStatus: store.status,
        subscriptionStatus: store.subscription.isSubscribed ? 'expired' : 'trial_expired',
        daysUntilExpiry: store.daysUntilTrialExpires || store.daysUntilSubscriptionExpires
      });
    }

    req.currentStore = store;
    next();
  } catch (error) {
    console.error('Active store check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking store status',
      error: error.message
    });
  }
};

/**
 * Middleware to get store status info (for informational purposes)
 * This doesn't block requests but provides store status information
 */
exports.getStoreStatusInfo = async (req, res, next) => {
  try {
    const storeId = req.storeId || req.params.storeId || req.body.storeId;
    
    if (!storeId) {
      return next();
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return next();
    }

    // Check and update status if needed
    if (store.shouldBeDeactivated()) {
      await store.deactivateIfExpired();
    }

    // Add store status info to request
    req.storeStatusInfo = {
      storeId: store._id,
      status: store.status,
      isSubscriptionActive: store.isSubscriptionActive,
      isTrialExpired: store.isTrialExpired,
      daysUntilTrialExpires: store.daysUntilTrialExpires,
      daysUntilSubscriptionExpires: store.daysUntilSubscriptionExpires,
      subscription: {
        isSubscribed: store.subscription.isSubscribed,
        endDate: store.subscription.endDate,
        trialEndDate: store.subscription.trialEndDate,
        planId: store.subscription.planId
      }
    };

    next();
  } catch (error) {
    console.error('Store status info error:', error);
    next(); // Continue even if there's an error
  }
};
