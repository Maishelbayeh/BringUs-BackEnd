const User = require('../Models/User');

// Middleware to check if user is superadmin
exports.requireSuperAdmin = async (req, res, next) => {
  try {
    // Check if user exists and is superadmin
    if (!req.user || req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin role required.'
      });
    }

    // Check if user is active
    if (!req.user.isActive || req.user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account is not active.'
      });
    }

    next();
  } catch (error) {
    console.error('Superadmin auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional middleware to check if user is superadmin (doesn't block if not)
exports.optionalSuperAdmin = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'superadmin' && req.user.isActive && req.user.status === 'active') {
      req.isSuperAdmin = true;
    } else {
      req.isSuperAdmin = false;
    }
    next();
  } catch (error) {
    console.error('Optional superadmin auth error:', error);
    req.isSuperAdmin = false;
    next();
  }
};
