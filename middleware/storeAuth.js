const Store = require('../Models/Store');
const Owner = require('../Models/Owner');

// Middleware to verify store access
exports.verifyStoreAccess = async (req, res, next) => {
  try {
    let storeId = req.params.storeId || req.body.store || req.query.storeId;
    
    // If no storeId is provided, try to get user's default store
    if (!storeId && req.user) {
      const owner = await Owner.findOne({ 
        userId: req.user.id,
        status: 'active'
      }).populate('storeId');
      
      if (owner && owner.storeId) {
        storeId = owner.storeId._id;
      }
    }
    
    if (!storeId) {
      return res.status(400).json({ 
        error: 'Store ID is required or user must have a default store' 
      });
    }

    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ 
        error: 'Store not found' 
      });
    }

    // Check if store is active
    if (store.status !== 'active') {
      return res.status(403).json({ 
        error: 'Store is not active' 
      });
    }

    // Add store to request for later use
    req.store = store;
    req.params.storeId = storeId;
    next();
  } catch (error) {
    //CONSOLE.error('Store verification error:', error);
    res.status(500).json({ 
      error: 'Store verification failed',
      message: error.message
    });
  }
};

// Middleware to check if user has access to store
exports.checkStoreOwnership = async (req, res, next) => {
  try {
    let storeId = req.params.storeId || req.body.store || req.query.storeId;
    const userId = req.user?.id; // Assuming user is authenticated

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // If no storeId is provided, try to get user's default store
    if (!storeId) {
      const owner = await Owner.findOne({ 
        userId: req.user.id,
        status: 'active'
      }).populate('storeId');
      
      if (owner && owner.storeId) {
        storeId = owner.storeId._id;
      }
    }

    if (!storeId) {
      return res.status(400).json({ 
        error: 'Store ID is required or user must have a default store' 
      });
    }

    // Check if user owns or has access to this store
    const owner = await Owner.findOne({ 
      userId: userId,
      storeId: storeId,
      status: 'active'
    });

    if (!owner) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have access to this store'
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ 
        error: 'Store not found' 
      });
    }

    req.store = store;
    req.storeOwner = owner;
    next();
  } catch (error) {
    //CONSOLE.error('Store ownership verification error:', error);
    res.status(500).json({ 
      error: 'Store ownership verification failed',
      message: error.message
    });
  }
}; 