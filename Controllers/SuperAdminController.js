const Store = require('../Models/Store');
const User = require('../Models/User');
const Owner = require('../Models/Owner');

// Get all stores with owners information
exports.getAllStores = async (req, res) => {
  try {
    // Verify superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin role required.'
      });
    }

    const stores = await Store.find({})
      .populate({
        path: 'owners',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone status isActive'
        }
      })
      .select('-__v')
      .sort({ createdAt: -1 });

    // Get owners for each store
    const storesWithOwners = await Promise.all(
      stores.map(async (store) => {
        const owners = await Owner.find({ storeId: store._id })
          .populate('userId', 'firstName lastName email phone status isActive')
          .select('-__v');

        return {
          _id: store._id,
          nameAr: store.nameAr,
          nameEn: store.nameEn,
          descriptionAr: store.descriptionAr,
          descriptionEn: store.descriptionEn,
          logo: store.logo,
          slug: store.slug,
          status: store.status,
          settings: store.settings,
          whatsappNumber: store.whatsappNumber,
          contact: store.contact,
          owners: owners.map(owner => ({
            _id: owner._id,
            userId: owner.userId,
            status: owner.status,
            permissions: owner.permissions,
            isPrimaryOwner: owner.isPrimaryOwner,
            createdAt: owner.createdAt,
            updatedAt: owner.updatedAt
          })),
          createdAt: store.createdAt,
          updatedAt: store.updatedAt
        };
      })
    );

    return res.json({
      success: true,
      data: storesWithOwners,
      count: storesWithOwners.length
    });

  } catch (error) {
    console.error('Get all stores error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching stores',
      error: error.message
    });
  }
};

// Get store by ID with owners information
exports.getStoreById = async (req, res) => {
  try {
    // Verify superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin role required.'
      });
    }

    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const store = await Store.findById(storeId)
      .select('-__v');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Get owners for the store
    const owners = await Owner.find({ storeId: store._id })
      .populate('userId', 'firstName lastName email phone status isActive')
      .select('-__v');

    const storeWithOwners = {
      _id: store._id,
      nameAr: store.nameAr,
      nameEn: store.nameEn,
      descriptionAr: store.descriptionAr,
      descriptionEn: store.descriptionEn,
      logo: store.logo,
      slug: store.slug,
      status: store.status,
      settings: store.settings,
      whatsappNumber: store.whatsappNumber,
      contact: store.contact,
      owners: owners.map(owner => ({
        _id: owner._id,
        userId: owner.userId,
        status: owner.status,
        permissions: owner.permissions,
        isPrimaryOwner: owner.isPrimaryOwner,
        createdAt: owner.createdAt,
        updatedAt: owner.updatedAt
      })),
      createdAt: store.createdAt,
      updatedAt: store.updatedAt
    };

    return res.json({
      success: true,
      data: storeWithOwners
    });

  } catch (error) {
    console.error('Get store by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching store',
      error: error.message
    });
  }
};

// Update store status
exports.updateStoreStatus = async (req, res) => {
  try {
    // Verify superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin role required.'
      });
    }

    const { storeId } = req.params;
    const { status } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (active, inactive, suspended)'
      });
    }

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Update store status
    store.status = status;
    await store.save();

    // Get updated store with owners
    const owners = await Owner.find({ storeId: store._id })
      .populate('userId', 'firstName lastName email phone status isActive')
      .select('-__v');

    const updatedStore = {
      _id: store._id,
      nameAr: store.nameAr,
      nameEn: store.nameEn,
      descriptionAr: store.descriptionAr,
      descriptionEn: store.descriptionEn,
      logo: store.logo,
      slug: store.slug,
      status: store.status,
      settings: store.settings,
      whatsappNumber: store.whatsappNumber,
      contact: store.contact,
      owners: owners.map(owner => ({
        _id: owner._id,
        userId: owner.userId,
        status: owner.status,
        permissions: owner.permissions,
        isPrimaryOwner: owner.isPrimaryOwner,
        createdAt: owner.createdAt,
        updatedAt: owner.updatedAt
      })),
      createdAt: store.createdAt,
      updatedAt: store.updatedAt
    };

    return res.json({
      success: true,
      message: `Store status updated to ${status}`,
      data: updatedStore
    });

  } catch (error) {
    console.error('Update store status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating store status',
      error: error.message
    });
  }
};

// Get stores statistics
exports.getStoresStatistics = async (req, res) => {
  try {
    // Verify superadmin role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin role required.'
      });
    }

    const totalStores = await Store.countDocuments();
    const activeStores = await Store.countDocuments({ status: 'active' });
    const inactiveStores = await Store.countDocuments({ status: 'inactive' });
    const suspendedStores = await Store.countDocuments({ status: 'suspended' });

    const totalOwners = await Owner.countDocuments();
    const activeOwners = await Owner.countDocuments({ status: 'active' });
    const inactiveOwners = await Owner.countDocuments({ status: 'inactive' });

    return res.json({
      success: true,
      data: {
        stores: {
          total: totalStores,
          active: activeStores,
          inactive: inactiveStores,
          suspended: suspendedStores
        },
        owners: {
          total: totalOwners,
          active: activeOwners,
          inactive: inactiveOwners
        }
      }
    });

  } catch (error) {
    console.error('Get stores statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
