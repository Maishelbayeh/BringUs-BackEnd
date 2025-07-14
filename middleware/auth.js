const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Protect routes - require authentication (TEMPORARILY DISABLED FOR TESTING)
exports.protect = async (req, res, next) => {
  try {
    // TEMPORARY: Skip JWT verification for testing
    // Create a mock superadmin user for testing
    req.user = {
      _id: '6863f791f1a6dba57fe0e323', // Superadmin ID from database
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@bringus.com',
      role: 'superadmin',
      status: 'active',
      isActive: true
    };
    
    console.log('🔓 Auth bypassed - Using mock superadmin user');
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
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

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log('Invalid token in optional auth:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}; 