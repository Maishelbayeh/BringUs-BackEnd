const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Middleware to protect routes (requires authentication)
exports.protect = async (req, res, next) => {
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
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Add storeId from token to user object
      if (decoded.storeId) {
        user.storeId = decoded.storeId;
      }

      req.user = user;
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
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Middleware for optional authentication (supports both authenticated and guest users)
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // No token provided, continue as guest user
      return next();
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id);

      if (!user) {
        // Invalid token, continue as guest user
        return next();
      }

      if (!user.isActive) {
        // Deactivated account, continue as guest user
        return next();
      }

      // Add storeId from token to user object
      if (decoded.storeId) {
        user.storeId = decoded.storeId;
      }

      req.user = user;
      next();
    } catch (error) {
      // Invalid token, continue as guest user
      return next();
    }
  } catch (error) {
    // Error occurred, continue as guest user
    return next();
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is active
exports.isActive = (req, res, next) => {
  if (req.user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Account is not active'
    });
  }
  next();
}; 