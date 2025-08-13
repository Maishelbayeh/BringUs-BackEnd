/**
 * Example: Using Store ID Extraction in Controllers
 * 
 * This file demonstrates how to use the store ID extraction functions
 * in your controllers for data isolation and store-specific operations.
 */

const { 
    getStoreIdFromToken,
    getStoreIdFromHeaders 
} = require('../middleware/storeAuth');

// Example 1: Controller function that uses store ID for data isolation
const getStoreProducts = async (req, res) => {
    try {
        // Extract store ID from token
        const storeId = await getStoreIdFromHeaders(req.headers);
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID not found in token'
            });
        }

        // Use store ID to filter products
        const Product = require('../Models/Product');
        const { page = 1, limit = 10, category, search } = req.query;

        // Build query with store filter
        const query = { store: storeId };
        
        if (category) {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nameAr: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('category', 'name nameAr')
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                storeId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// Example 2: Controller function that handles both authenticated and guest users
const getPublicProducts = async (req, res) => {
    try {
        // Try to get store ID from token (optional)
        const storeId = await getStoreIdFromHeaders(req.headers);
        const { page = 1, limit = 10 } = req.query;

        const Product = require('../Models/Product');
        let products, total;

        if (storeId) {
            // User is authenticated - show store-specific products
            const query = { store: storeId, isActive: true };
            
            products = await Product.find(query)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('category', 'name nameAr')
                .sort({ createdAt: -1 });

            total = await Product.countDocuments(query);
        } else {
            // Guest user - show public products or return empty
            products = [];
            total = 0;
        }

        res.status(200).json({
            success: true,
            authenticated: !!storeId,
            data: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                storeId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// Example 3: Controller function that validates store access
const updateStoreSettings = async (req, res) => {
    try {
        // Extract store ID from token
        const storeId = await getStoreIdFromHeaders(req.headers);
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID not found in token'
            });
        }

        // Validate that the store exists and user has access
        const Store = require('../Models/Store');
        const store = await Store.findById(storeId);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Check if user has permission to update this store
        const User = require('../Models/User');
        const user = await User.findById(req.user._id);

        if (user.role !== 'superadmin' && user.store?.toString() !== storeId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own store.'
            });
        }

        // Update store settings
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Store settings updated successfully',
            data: {
                storeId,
                storeName: updatedStore.name,
                settings: updatedStore.settings
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating store settings',
            error: error.message
        });
    }
};

// Example 4: Controller function that uses store ID for affiliate operations
const getAffiliateStats = async (req, res) => {
    try {
        // Extract store ID from token
        const storeId = await getStoreIdFromHeaders(req.headers);
        
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID not found in token'
            });
        }

        // Get affiliate statistics for this store
        const Affiliation = require('../Models/Affiliation');
        const Order = require('../Models/Order');

        // Get all affiliates for this store
        const affiliates = await Affiliation.find({ store: storeId });
        
        // Get total sales from affiliate orders
        const affiliateOrders = await Order.find({
            store: storeId,
            'affiliateTracking.affiliateId': { $exists: true }
        });

        const totalSales = affiliateOrders.reduce((sum, order) => sum + order.subtotal, 0);
        const totalCommission = affiliateOrders.reduce((sum, order) => {
            return sum + (order.affiliateTracking?.commission || 0);
        }, 0);

        res.status(200).json({
            success: true,
            data: {
                storeId,
                affiliates: affiliates.length,
                totalOrders: affiliateOrders.length,
                totalSales,
                totalCommission,
                averageOrderValue: affiliateOrders.length > 0 ? totalSales / affiliateOrders.length : 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching affiliate stats',
            error: error.message
        });
    }
};

// Example 5: Controller function that handles multiple store scenarios
const getMultiStoreData = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const storeId = await getStoreIdFromToken(token);
        
        const { dataType } = req.params;
        const { page = 1, limit = 10 } = req.query;

        let data, total;

        switch (dataType) {
            case 'products':
                if (!storeId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Store ID required for products'
                    });
                }
                
                const Product = require('../Models/Product');
                const productQuery = { store: storeId };
                
                data = await Product.find(productQuery)
                    .limit(limit * 1)
                    .skip((page - 1) * limit)
                    .populate('category', 'name nameAr');
                
                total = await Product.countDocuments(productQuery);
                break;

            case 'orders':
                if (!storeId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Store ID required for orders'
                    });
                }
                
                const Order = require('../Models/Order');
                const orderQuery = { store: storeId };
                
                data = await Order.find(orderQuery)
                    .limit(limit * 1)
                    .skip((page - 1) * limit)
                    .populate('user', 'firstName lastName email')
                    .sort({ createdAt: -1 });
                
                total = await Order.countDocuments(orderQuery);
                break;

            case 'public':
                // Public data that doesn't require store ID
                data = [];
                total = 0;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data type'
                });
        }

        res.status(200).json({
            success: true,
            data: {
                items: data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                storeId,
                dataType
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching data',
            error: error.message
        });
    }
};

// Example 6: Utility function for controllers
const validateStoreAccess = async (req, storeId) => {
    try {
        if (!storeId) {
            return {
                valid: false,
                error: 'Store ID not found in token'
            };
        }

        const Store = require('../Models/Store');
        const store = await Store.findById(storeId);

        if (!store) {
            return {
                valid: false,
                error: 'Store not found'
            };
        }

        if (store.status !== 'active') {
            return {
                valid: false,
                error: 'Store is not active'
            };
        }

        return {
            valid: true,
            store
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
};

// Example 7: Controller using the utility function
const getStoreAnalytics = async (req, res) => {
    try {
        const storeId = await getStoreIdFromHeaders(req.headers);
        
        // Validate store access
        const validation = await validateStoreAccess(req, storeId);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const { store } = validation;

        // Get analytics data
        const Order = require('../Models/Order');
        const Product = require('../Models/Product');
        const User = require('../Models/User');

        const [
            totalOrders,
            totalProducts,
            totalUsers,
            totalRevenue
        ] = await Promise.all([
            Order.countDocuments({ store: storeId }),
            Product.countDocuments({ store: storeId }),
            User.countDocuments({ store: storeId }),
            Order.aggregate([
                { $match: { store: store._id } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                storeId,
                storeName: store.name,
                analytics: {
                    totalOrders,
                    totalProducts,
                    totalUsers,
                    totalRevenue: totalRevenue[0]?.total || 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error.message
        });
    }
};

module.exports = {
    getStoreProducts,
    getPublicProducts,
    updateStoreSettings,
    getAffiliateStats,
    getMultiStoreData,
    validateStoreAccess,
    getStoreAnalytics
};
