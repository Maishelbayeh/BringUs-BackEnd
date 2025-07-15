const Owner = require('../Models/Owner');
const Store = require('../Models/Store');

// Check if user has access to store (TEMPORARILY SIMPLIFIED FOR TESTING)
exports.hasStoreAccess = async (req, res, next) => {
  try {
    const storeId = req.params.storeId || req.params.id;
    
    // TEMPORARY: Superadmin has access to all stores
    if (req.user.role === 'superadmin') {
      const store = await Store.findById(storeId);
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }
      req.store = store;
      
      // Create a mock owner for superadmin
      req.owner = {
        userId: req.user._id,
        storeId: store._id,
        permissions: ['manage_store', 'manage_users', 'manage_products', 'manage_categories', 'manage_orders', 'manage_inventory', 'view_analytics', 'manage_settings'],
        isPrimaryOwner: true,
        status: 'active'
      };
      
      console.log('🔓 Store access bypassed - Superadmin access granted');
      return next();
    }

    // For other users, check owner relationship
    const owner = await Owner.findOne({
      userId: req.user._id,
      storeId,
      status: 'active'
    }).populate('storeId');

    if (!owner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this store'
      });
    }

    req.store = owner.storeId;
    req.owner = owner;
    next();
  } catch (error) {
    console.error('Store access middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check specific permission
exports.hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Superadmin has all permissions
      if (req.user.role === 'superadmin') {
        return next();
      }

      // Check if user has the specific permission
      if (req.owner && req.owner.permissions.includes(permission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission}`
      });
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

// Check if user is primary owner
exports.isPrimaryOwner = async (req, res, next) => {
  try {
    // Superadmin is considered primary owner
    if (req.user.role === 'superadmin') {
      return next();
    }

    if (req.owner && req.owner.isPrimaryOwner) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Only primary owner can perform this action'
    });
  } catch (error) {
    console.error('Primary owner middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if user is admin or higher
exports.isAdmin = (req, res, next) => {
  if (req.user.role === 'superadmin' || req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Admin access required'
  });
};

// Check if user is superadmin
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role === 'superadmin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Super admin access required'
  });
};

// Middleware to require storeId for admin users
exports.requireStoreIdForAdmin = (req, res, next) => {
  try {
    // Superadmin doesn't need storeId
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Admin users must provide storeId
    if (req.user.role === 'admin') {
      const storeId = req.params.storeId || req.body.storeId || req.query.storeId;
      
      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required for admin users'
        });
      }

      // Verify admin has access to this store
      const Owner = require('../Models/Owner');
      const owner = Owner.findOne({
        userId: req.user._id,
        storeId: storeId,
        status: 'active'
      });

      if (!owner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this store'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Store ID validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Middleware to check if admin is owner of store
exports.checkAdminStoreOwnership = async (req, res, next) => {
  try {
    // Superadmin has access to all stores
    if (req.user.role === 'superadmin') {
      return next();
    }

    // For admin users, check ownership
    if (req.user.role === 'admin') {
      const storeId = req.params.storeId || req.body.storeId || req.query.storeId;
      
      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required for admin users'
        });
      }

      const Owner = require('../Models/Owner');
      const owner = await Owner.findOne({
        userId: req.user._id,
        storeId: storeId,
        status: 'active'
      }).populate('storeId');

      if (!owner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this store'
        });
      }

      // Add store and owner info to request
      req.store = owner.storeId;
      req.owner = owner;
      req.isOwner = true;
      req.isPrimaryOwner = owner.isPrimaryOwner;
    }

    next();
  } catch (error) {
    console.error('Admin store ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 