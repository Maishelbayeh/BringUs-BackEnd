const User = require('../Models/User');

/**
 * Middleware to require superadmin role
 * Ensures the authenticated user has superadmin role
 */
const requireSuperAdmin = async (req, res, next) => {
    try {
        // Check if user exists and has superadmin role
        if (!req.user || req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Superadmin role required.'
            });
        }

        next();
    } catch (error) {
        console.error('Superadmin auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authorization'
        });
    }
};

/**
 * Middleware to optionally check superadmin role
 * Allows access but adds superadmin flag to request
 */
const optionalSuperAdmin = async (req, res, next) => {
    try {
        // Add superadmin flag to request
        req.isSuperAdmin = req.user && req.user.role === 'superadmin';
        next();
    } catch (error) {
        console.error('Optional superadmin auth error:', error);
        req.isSuperAdmin = false;
        next();
    }
};

module.exports = {
    requireSuperAdmin,
    optionalSuperAdmin
};
