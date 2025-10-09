const Owner = require('../Models/Owner');
const Store = require('../Models/Store');

// Check if user has access to store (PRIORITIZING URL PARAMETERS)
exports.hasStoreAccess = async (req, res, next) => {
  try {
    let storeId;
    
    // 1. Try to get storeId from URL parameters first (as per user request)
    if (req.params.storeId) {
      storeId = req.params.storeId;
      console.log('🔍 Got storeId from req.params.storeId:', storeId);
    } else if (req.params.id) {
      storeId = req.params.id;
      console.log('🔍 Got storeId from req.params.id:', storeId);
    }
    
    // 2. If not found in params, try to get from token (req.user.storeId)
    if (!storeId && req.user && req.user.storeId) {
      storeId = req.user.storeId;
      console.log('🔍 Got storeId from token (req.user.storeId):', storeId);
    }
    
    // 3. If still not found, try to get from user's store field (req.user.store)
    if (!storeId && req.user && req.user.store) {
      storeId = req.user.store;
      console.log('🔍 Got storeId from user.store field:', storeId);
    }
    
    // 4. If still not found, try to get from user's default store in database (Owner collection)
    if (!storeId && req.user) {
      console.log('🔍 Looking for user in Owner collection for default store...');
      const owner = await Owner.findOne({
        userId: req.user._id,
        status: 'active'
      }).populate('storeId');
      
      if (owner && owner.storeId) {
        storeId = owner.storeId._id;
        console.log('🔍 Got storeId from Owner collection:', storeId);
      }
    }
    
    console.log('🔍 Final storeId determined by hasStoreAccess:', storeId);
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required and could not be determined from parameters, token, or user data.',
        messageAr: 'معرف المتجر مطلوب ولا يمكن تحديده من المعاملات أو الرمز المميز أو بيانات المستخدم.'
      });
    }
    
    // Superadmin and Admin have access to all stores
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID not found in token or user data',
          messageAr: 'معرف المتجر غير موجود في الرمز المميز أو بيانات المستخدم'
        });
      }
      
      const store = await Store.findById(storeId);
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found',
          messageAr: 'المتجر غير موجود'
        });
      }
      req.store = store;
      
      // Create a mock owner for superadmin/admin
      req.owner = {
        userId: req.user._id,
        storeId: store._id,
        permissions: ['manage_store', 'manage_users', 'manage_products', 'manage_categories', 'manage_orders', 'manage_inventory', 'view_analytics', 'manage_settings'],
        isPrimaryOwner: true,
        status: 'active'
      };
      req.admin = {
        userId: req.user._id,
        storeId: store._id,
        permissions: ['manage_store', 'manage_users', 'manage_products', 'manage_categories', 'manage_orders', 'manage_inventory', 'view_analytics', 'manage_settings'],
        isPrimaryOwner: true,
        status: 'active'
      };
      //CONSOLE.log('🔓 Store access bypassed - Superadmin/Admin access granted');
      return next();
    }

    // For other users, check owner relationship
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID not found in token or user data',
        messageAr: 'معرف المتجر غير موجود في الرمز المميز أو بيانات المستخدم'
      });
    }
    
    const owner = await Owner.findOne({
      userId: req.user._id,
      storeId,
      status: 'active'
    }).populate('storeId');

    if (!owner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this store',
        messageAr: 'تم رفض الوصول إلى هذا المتجر'
      });
    }

    req.store = owner.storeId;
    req.owner = owner;
    next();
  } catch (error) {
    console.error('Store access middleware error:', error);
    console.error('Store access middleware error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      messageAr: 'خطأ في الخادم',
      details: error.message
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
        message: `Permission denied: ${permission}`,
        messageAr: `تم رفض الإذن: ${permission}`
      });
    } catch (error) {
      //CONSOLE.error('Permission middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        messageAr: 'خطأ في الخادم'
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
      message: 'Only primary owner can perform this action',
      messageAr: 'المالك الأساسي فقط يمكنه تنفيذ هذا الإجراء'
    });
  } catch (error) {
    //CONSOLE.error('Primary owner middleware error:', error);
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
    message: 'Admin access required',
    messageAr: 'الوصول كمدير مطلوب'
  });
};

// Check if user is superadmin
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role === 'superadmin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Super admin access required',
    messageAr: 'الوصول كمدير عام مطلوب'
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
          message: 'Store ID is required for admin users',
          messageAr: 'معرف المتجر مطلوب لمستخدمي الإدارة'
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
          message: 'Access denied to this store',
          messageAr: 'تم رفض الوصول إلى هذا المتجر'
        });
      }
    }

    next();
  } catch (error) {
    //CONSOLE.error('Store ID validation error:', error);
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
          message: 'Store ID is required for admin users',
          messageAr: 'معرف المتجر مطلوب لمستخدمي الإدارة'
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
          message: 'Access denied to this store',
          messageAr: 'تم رفض الوصول إلى هذا المتجر'
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
    //CONSOLE.error('Admin store ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 