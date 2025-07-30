const Store = require('../Models/Store');
const Owner = require('../Models/Owner');

// Middleware to verify store access (supports both authenticated and guest users)
exports.verifyStoreAccess = async (req, res, next) => {
  try {
    let storeId = req.params.storeId || req.body.store || req.query.storeId;
    let storeSlug = req.params.storeSlug || req.body.storeSlug || req.query.storeSlug;
    
    // If no storeId is provided, try to get from JWT token first (for authenticated users)
    if (!storeId && req.user && req.user.storeId) {
      storeId = req.user.storeId;
    }
    
    // If still no storeId, try to get user's default store from database (for authenticated users)
    if (!storeId && req.user) {
      const owner = await Owner.findOne({ 
        userId: req.user._id || req.user.id,
        status: 'active'
      }).populate('storeId');
      
      if (owner && owner.storeId) {
        storeId = owner.storeId._id;
      }
    }
    
    // For guest users, we need either storeId or storeSlug to be provided
    if (!storeId && !storeSlug) {
      return res.status(400).json({ 
        error: 'Store ID or Store Slug is required. Please provide storeId or storeSlug in params, body, or query.' 
      });
    }

    let store;
    
    // Find store by ID or slug
    if (storeId) {
      store = await Store.findById(storeId);
    } else if (storeSlug) {
      store = await Store.findOne({ slug: storeSlug, status: 'active' });
    }
    
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
    req.params.storeId = store._id;
    next();
  } catch (error) {
    //CONSOLE.error('Store verification error:', error);
    res.status(500).json({ 
      error: 'Store verification failed',
      message: error.message
    });
  }
};

// Middleware to check if user has access to store (authenticated users only)
exports.checkStoreOwnership = async (req, res, next) => {
  try {
    // This middleware requires authentication
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    let storeId = req.params.storeId || req.body.store || req.query.storeId;
    let storeSlug = req.params.storeSlug || req.body.storeSlug || req.query.storeSlug;
    const userId = req.user?.id;

    // If no storeId is provided, try to get user's default store
    if (!storeId && !storeSlug) {
      const owner = await Owner.findOne({ 
        userId: req.user.id,
        status: 'active'
      }).populate('storeId');
      
      if (owner && owner.storeId) {
        storeId = owner.storeId._id;
      }
    }

    if (!storeId && !storeSlug) {
      return res.status(400).json({ 
        error: 'Store ID or Store Slug is required or user must have a default store' 
      });
    }

    let store;
    
    // Find store by ID or slug
    if (storeId) {
      store = await Store.findById(storeId);
    } else if (storeSlug) {
      store = await Store.findOne({ slug: storeSlug, status: 'active' });
    }
    
    if (!store) {
      return res.status(404).json({ 
        error: 'Store not found' 
      });
    }

    // Check if user owns or has access to this store
    const owner = await Owner.findOne({ 
      userId: userId,
      storeId: store._id,
      status: 'active'
    });

    if (!owner) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have access to this store'
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