const Wholesaler = require('../Models/Wholesaler');
const Store = require('../Models/Store');
const { success, error } = require('../utils/response');

// Get all wholesalers for a store
const getAllWholesalers = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;

    // Build query
    let query = { store: storeId };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get wholesalers with pagination
    const wholesalers = await Wholesaler.find(query)
      .populate('store', 'name domain')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Wholesaler.countDocuments(query);

    // Get statistics
    const stats = await Wholesaler.getWholesalerStats(storeId);

    return success(res, {
      data: {
        wholesalers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: stats[0] || {
          totalWholesalers: 0,
          activeWholesalers: 0,
          averageDiscount: 0,
          verifiedWholesalers: 0
        }
      },
      message: 'Wholesalers retrieved successfully'
    });

  } catch (err) {
    //CONSOLE.error('Error getting wholesalers:', err);
    return error(res, { message: 'Failed to get wholesalers', statusCode: 500 });
  }
};

// Get single wholesaler by ID
const getWholesalerById = async (req, res) => {
  try {
    const { storeId, wholesalerId } = req.params;

    const wholesaler = await Wholesaler.findOne({ 
      _id: wholesalerId, 
      store: storeId 
    })
    .populate('store', 'name domain')
    .populate('verifiedBy', 'firstName lastName');

    if (!wholesaler) {
      return error(res, { message: 'Wholesaler not found', statusCode: 404 });
    }

    return success(res, { data: wholesaler, message: 'Wholesaler retrieved successfully' });

  } catch (err) {
    //CONSOLE.error('Error getting wholesaler:', err);
    return error(res, { message: 'Failed to get wholesaler', statusCode: 500 });
  }
};

// Create new wholesaler
const createWholesaler = async (req, res) => {
  try {
    const { storeId } = req.params;
    const wholesalerData = req.body;

    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return error(res, { message: 'Store not found', statusCode: 404 });
    }

    // Check if email already exists for this store
    const existingWholesaler = await Wholesaler.findOne({
      email: wholesalerData.email,
      store: storeId
    });

    if (existingWholesaler) {
      return error(res, { message: 'Email already exists for this store', statusCode: 400 });
    }

    // Add store ID to wholesaler data
    wholesalerData.store = storeId;
    
    // Set default status to Active if not provided
    if (!wholesalerData.status) {
      wholesalerData.status = 'Active';
    }

    // Create wholesaler
    const wholesaler = await Wholesaler.create(wholesalerData);

    // Populate references
    await wholesaler.populate('store', 'name domain');

    return success(res, { data: wholesaler, message: 'Wholesaler created successfully', statusCode: 201 });

  } catch (err) {
    //CONSOLE.error('Error creating wholesaler:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return error(res, { message: errors.join(', '), statusCode: 400 });
    }
    
    return error(res, { message: 'Failed to create wholesaler', statusCode: 500 });
  }
};

// Update wholesaler
const updateWholesaler = async (req, res) => {
  try {
    const { storeId, wholesalerId } = req.params;
    const updateData = req.body;

    // Find wholesaler
    const wholesaler = await Wholesaler.findOne({ 
      _id: wholesalerId, 
      store: storeId 
    });

    if (!wholesaler) {
      return error(res, { message: 'Wholesaler not found', statusCode: 404 });
    }

    // Check if email is being updated and if it already exists
    if (updateData.email && updateData.email !== wholesaler.email) {
      const existingWholesaler = await Wholesaler.findOne({
        email: updateData.email,
        store: storeId,
        _id: { $ne: wholesalerId }
      });

      if (existingWholesaler) {
        return error(res, { message: 'Email already exists for this store', statusCode: 400 });
      }
    }

    // Update wholesaler
    const updatedWholesaler = await Wholesaler.findByIdAndUpdate(
      wholesalerId,
      updateData,
      { new: true, runValidators: true }
    ).populate('store', 'name domain')
     .populate('verifiedBy', 'firstName lastName');

    return success(res, { data: updatedWholesaler, message: 'Wholesaler updated successfully' });

  } catch (err) {
    //CONSOLE.error('Error updating wholesaler:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return error(res, { message: errors.join(', '), statusCode: 400 });
    }
    
    return error(res, { message: 'Failed to update wholesaler', statusCode: 500 });
  }
};

// Delete wholesaler
const deleteWholesaler = async (req, res) => {
  try {
    const { storeId, wholesalerId } = req.params;

    const wholesaler = await Wholesaler.findOneAndDelete({ 
      _id: wholesalerId, 
      store: storeId 
    });

    if (!wholesaler) {
      return error(res, { message: 'Wholesaler not found', statusCode: 404 });
    }

    return success(res, { data: null, message: 'Wholesaler deleted successfully' });

  } catch (err) {
    //CONSOLE.error('Error deleting wholesaler:', err);
    return error(res, { message: 'Failed to delete wholesaler', statusCode: 500 });
  }
};

// Verify wholesaler
const verifyWholesaler = async (req, res) => {
  try {
    const { storeId, wholesalerId } = req.params;
    const { verifiedBy } = req.body;

    const wholesaler = await Wholesaler.findOne({ 
      _id: wholesalerId, 
      store: storeId 
    });

    if (!wholesaler) {
      return error(res, { message: 'Wholesaler not found', statusCode: 404 });
    }

    if (wholesaler.isVerified) {
      return error(res, { message: 'Wholesaler is already verified', statusCode: 400 });
    }

    // Verify wholesaler
    await wholesaler.verify(verifiedBy);

    // Populate references
    await wholesaler.populate('store', 'name domain');
    await wholesaler.populate('verifiedBy', 'firstName lastName');

    return success(res, { data: wholesaler, message: 'Wholesaler verified successfully' });

  } catch (err) {
    //CONSOLE.error('Error verifying wholesaler:', err);
    return error(res, { message: 'Failed to verify wholesaler', statusCode: 500 });
  }
};

// Update wholesaler status
const updateWholesalerStatus = async (req, res) => {
  try {
    const { storeId, wholesalerId } = req.params;
    const { status } = req.body;

    const wholesaler = await Wholesaler.findOne({ 
      _id: wholesalerId, 
      store: storeId 
    });

    if (!wholesaler) {
      return error(res, { message: 'Wholesaler not found', statusCode: 404 });
    }

    // Update status
    await wholesaler.updateStatus(status);

    // Populate references
    await wholesaler.populate('store', 'name domain');
    await wholesaler.populate('verifiedBy', 'firstName lastName');

    return success(res, { data: wholesaler, message: 'Wholesaler status updated successfully' });

  } catch (err) {
    //CONSOLE.error('Error updating wholesaler status:', err);
    return error(res, { message: 'Failed to update wholesaler status', statusCode: 500 });
  }
};

// Get wholesaler statistics
const getWholesalerStats = async (req, res) => {
  try {
    const { storeId } = req.params;

    const stats = await Wholesaler.getWholesalerStats(storeId);
    const topWholesalers = await Wholesaler.getTopWholesalers(storeId, 5);

    return success(res, {
      data: {
        stats: stats[0] || {
          totalWholesalers: 0,
          activeWholesalers: 0,
          averageDiscount: 0,
          verifiedWholesalers: 0
        },
        topWholesalers
      },
      message: 'Wholesaler statistics retrieved successfully'
    });

  } catch (err) {
    //CONSOLE.error('Error getting wholesaler stats:', err);
    return error(res, { message: 'Failed to get wholesaler statistics', statusCode: 500 });
  }
};

// Bulk operations
const bulkUpdateStatus = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { wholesalerIds, status } = req.body;

    if (!wholesalerIds || !Array.isArray(wholesalerIds) || wholesalerIds.length === 0) {
      return error(res, { message: 'Wholesaler IDs array is required', statusCode: 400 });
    }

    if (!status) {
      return error(res, { message: 'Status is required', statusCode: 400 });
    }

    const result = await Wholesaler.updateMany(
      { 
        _id: { $in: wholesalerIds }, 
        store: storeId 
      },
      { 
        status,
        lastActivity: new Date()
      }
    );

    return success(res, {
      updatedCount: result.modifiedCount
    }, `${result.modifiedCount} wholesalers status updated successfully`);

  } catch (err) {
    //CONSOLE.error('Error bulk updating wholesaler status:', err);
    return error(res, { message: 'Failed to bulk update wholesaler status', statusCode: 500 });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { wholesalerIds } = req.body;

    if (!wholesalerIds || !Array.isArray(wholesalerIds) || wholesalerIds.length === 0) {
      return error(res, { message: 'Wholesaler IDs array is required', statusCode: 400 });
    }

    const result = await Wholesaler.deleteMany({
      _id: { $in: wholesalerIds },
      store: storeId
    });

    return success(res, {
      deletedCount: result.deletedCount
    }, `${result.deletedCount} wholesalers deleted successfully`);

  } catch (err) {
    //CONSOLE.error('Error bulk deleting wholesalers:', err);
    return error(res, { message: 'Failed to bulk delete wholesalers', statusCode: 500 });
  }
};

module.exports = {
  getAllWholesalers,
  getWholesalerById,
  createWholesaler,
  updateWholesaler,
  deleteWholesaler,
  verifyWholesaler,
  updateWholesalerStatus,
  getWholesalerStats,
  bulkUpdateStatus,
  bulkDelete
}; 