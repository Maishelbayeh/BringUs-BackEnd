const Store = require('../Models/Store');
const Owner = require('../Models/Owner');
const Order = require('../Models/Order');
const Product = require('../Models/Product');
const User = require('../Models/User');
const { validationResult } = require('express-validator');

// Get all stores with their owners
const getAllStores = async (req, res) => {
    try {
        // Get all stores
        const stores = await Store.find({}).lean();
        
        // Get owners for all stores
        const storeIds = stores.map(store => store._id);
        const owners = await Owner.find({ storeId: { $in: storeIds } }).populate('userId', 'name email phone').lean();
        
        // Group owners by storeId
        const ownersByStore = owners.reduce((acc, owner) => {
            if (!acc[owner.storeId]) {
                acc[owner.storeId] = [];
            }
            acc[owner.storeId].push(owner);
            return acc;
        }, {});
        
        // Combine stores with their owners
        const storesWithOwners = stores.map(store => ({
            ...store,
            owners: ownersByStore[store._id] || []
        }));
        
        res.status(200).json({
            success: true,
            data: storesWithOwners,
            count: storesWithOwners.length
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get store by ID with owners
const getStoreById = async (req, res) => {
    try {
        const { storeId } = req.params;
        
        // Get store
        const store = await Store.findById(storeId).lean();
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }
        
        // Get owners for this store
        const owners = await Owner.find({ storeId }).populate('userId', 'name email phone').lean();
        
        // Combine store with owners
        const storeWithOwners = {
            ...store,
            owners: owners
        };
        
        res.status(200).json({
            success: true,
            data: storeWithOwners
        });
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update store status
const updateStoreStatus = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['active', 'inactive', 'suspended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: active, inactive, suspended'
            });
        }
        
        // Update store
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            { status },
            { new: true, runValidators: true }
        );
        
        if (!updatedStore) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Store status updated successfully',
            data: updatedStore
        });
    } catch (error) {
        console.error('Error updating store status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get system-wide statistics
const getSystemStatistics = async (req, res) => {
    try {
        // Get counts
        const totalStores = await Store.countDocuments();
        const activeStores = await Store.countDocuments({ status: 'active' });
        const inactiveStores = await Store.countDocuments({ status: 'inactive' });
        const suspendedStores = await Store.countDocuments({ status: 'suspended' });
        
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        // Get subscription statistics
        const subscribedStores = await Store.countDocuments({
            'subscription.isSubscribed': true,
            'subscription.endDate': { $gt: new Date() }
        });
        
        const trialStores = await Store.countDocuments({
            'subscription.trialEndDate': { $gt: new Date() },
            'subscription.isSubscribed': false
        });
        
        const expiredStores = await Store.countDocuments({
            $or: [
                { 'subscription.trialEndDate': { $lt: new Date() }, 'subscription.isSubscribed': false },
                { 'subscription.endDate': { $lt: new Date() }, 'subscription.isSubscribed': true }
            ]
        });
        
        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentOrders = await Order.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        const recentStores = await Store.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        // Calculate total revenue (if orders have total field)
        const revenuePipeline = [
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $in: ['completed', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' }
                }
            }
        ];
        
        const revenueResult = await Order.aggregate(revenuePipeline);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
        
        const statistics = {
            stores: {
                total: totalStores,
                active: activeStores,
                inactive: inactiveStores,
                suspended: suspendedStores,
                subscribed: subscribedStores,
                trial: trialStores,
                expired: expiredStores
            },
            users: {
                total: totalUsers
            },
            products: {
                total: totalProducts
            },
            orders: {
                total: totalOrders,
                recent: recentOrders
            },
            revenue: {
                total: totalRevenue
            },
            activity: {
                newStores: recentStores
            }
        };
        
        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    getAllStores,
    getStoreById,
    updateStoreStatus,
    getSystemStatistics
};
