const Store = require('../Models/Store');
const Owner = require('../Models/Owner');

// Middleware to ensure all requests include store context
exports.requireStoreContext = async (req, res, next) => {
  try {
    const storeId = req.params.storeId || req.body.store || req.query.storeId;
    
    if (!storeId) {
      return res.status(400).json({ 
        error: 'Store context is required',
        message: 'All operations must be performed within a store context'
      });
    }

    // Verify store exists and is active
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ 
        error: 'Store not found' 
      });
    }

    if (store.status !== 'active') {
      return res.status(403).json({ 
        error: 'Store is not active',
        status: store.status
      });
    }

    req.store = store;
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Store context verification failed' 
    });
  }
};

// Middleware to check user access to store
exports.checkStoreAccess = async (req, res, next) => {
  try {
    const storeId = req.store._id;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Check if user has access to this store
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

    req.storeOwner = owner;
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Store access verification failed' 
    });
  }
};

// Middleware to check specific permissions
exports.requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.storeOwner) {
      return res.status(403).json({ 
        error: 'Store access required' 
      });
    }

    if (!req.storeOwner.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Permission denied',
        required: permission,
        current: req.storeOwner.permissions
      });
    }

    next();
  };
};

// Middleware to ensure data belongs to the store
exports.ensureStoreData = (modelName) => {
  return async (req, res, next) => {
    try {
      const storeId = req.store._id;
      const itemId = req.params.id;

      if (!itemId) {
        return next(); // No specific item to check
      }

      const Model = require(`../Models/${modelName}`);
      const item = await Model.findById(itemId);

      if (!item) {
        return res.status(404).json({ 
          error: `${modelName} not found` 
        });
      }

      // Check if item belongs to the store
      if (item.store.toString() !== storeId.toString()) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `This ${modelName.toLowerCase()} does not belong to your store`
        });
      }

      req.item = item;
      next();
    } catch (error) {
      res.status(500).json({ 
        error: 'Data verification failed' 
      });
    }
  };
};

// Helper function to add store filter to queries
exports.addStoreFilter = async (req, query = {}) => {
  // If req.store is set, use it
  if (req.store) {
    query.store = req.store._id;
  } 
  // If storeId is provided in query and user is superadmin, use it
  else if (req.query.storeId && req.user && req.user.role === 'superadmin') {
    query.store = req.query.storeId;
  }
  // Otherwise, try to get store ID from token
  else {
    const { getStoreIdFromHeaders } = require('./storeAuth');
    const storeId = await getStoreIdFromHeaders(req.headers);
    if (storeId) {
      query.store = storeId;
    }
  }
  
  return query;
};

// Helper function to validate store-specific data
exports.validateStoreData = (data, storeId) => {
  if (!data.store) {
    data.store = storeId;
  } else if (data.store.toString() !== storeId.toString()) {
    throw new Error('Store mismatch');
  }
  return data;
}; 