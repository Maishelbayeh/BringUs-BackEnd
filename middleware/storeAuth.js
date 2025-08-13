const Store = require('../Models/Store');
const Owner = require('../Models/Owner');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

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
        userId: req.user._id,
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
    console.error('Store verification error:', error);
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
    const userId = req.user?._id;

    // If no storeId is provided, try to get user's default store
    if (!storeId && !storeSlug) {
      const owner = await Owner.findOne({ 
        userId: req.user._id,
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
    console.error('Store ownership verification error:', error);
    res.status(500).json({ 
      error: 'Store ownership verification failed',
      message: error.message
    });
  }
}; 

/**
 * Middleware to extract store ID from JWT token
 * This middleware decodes the JWT token and extracts the storeId
 * It adds the storeId to req.storeId for use in subsequent middleware/routes
 */
exports.extractStoreId = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const decoded = jwt.verify(token, jwtSecret);
      
      // Extract storeId from token
      if (decoded.storeId) {
        req.storeId = decoded.storeId;
      } else {
        // If no storeId in token, try to get it from user's store field
        const user = await User.findById(decoded._id || decoded.id);
        if (user && user.store) {
          req.storeId = user.store;
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Token extraction error',
      error: error.message
    });
  }
};

/**
 * Middleware to extract store ID from JWT token (optional version)
 * This middleware works even if no token is provided
 */
exports.extractStoreIdOptional = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // No token provided, continue without storeId
      return next();
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const decoded = jwt.verify(token, jwtSecret);
      
      // Extract storeId from token
      if (decoded.storeId) {
        req.storeId = decoded.storeId;
      } else {
        // If no storeId in token, try to get it from user's store field
        const user = await User.findById(decoded.id);
        if (user && user.store) {
          req.storeId = user.store;
        }
      }

      next();
    } catch (error) {
      // Invalid token, continue without storeId
      return next();
    }
  } catch (error) {
    // Error occurred, continue without storeId
    return next();
  }
};

/**
 * Middleware to require store ID from token
 * This middleware ensures that a valid storeId is present in the request
 */
exports.requireStoreId = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const decoded = jwt.verify(token, jwtSecret);
      
      let storeId = null;

          // Extract storeId from token
    if (decoded.storeId) {
      storeId = decoded.storeId;
    } else {
      // If no storeId in token, try to get it from user's store field
      const user = await User.findById(decoded._id || decoded.id);
      if (user && user.store) {
        storeId = user.store;
      }
    }

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID not found in token or user data'
        });
      }

      req.storeId = storeId;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Token extraction error',
      error: error.message
    });
  }
};

/**
 * Utility function to get store ID from token (for use in controllers)
 * @param {string} token - JWT token
 * @returns {string|null} - Store ID or null if not found
 */
exports.getStoreIdFromToken = async (token) => {
  try {
    if (!token) return null;

    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Extract storeId from token
    if (decoded.storeId) {
      return decoded.storeId;
    } else {
      // If no storeId in token, try to get it from user's store field
      const user = await User.findById(decoded._id || decoded.id);
      if (user && user.store) {
        return user.store;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Utility function to get store ID from request headers
 * @param {Object} headers - Request headers
 * @returns {string|null} - Store ID or null if not found
 */
exports.getStoreIdFromHeaders = async (headers) => {
  try {
    let token;

    if (headers.authorization && headers.authorization.startsWith('Bearer')) {
      token = headers.authorization.split(' ')[1];
    }

    if (!token) return null;

    return await exports.getStoreIdFromToken(token);
  } catch (error) {
    return null;
  }
}; 