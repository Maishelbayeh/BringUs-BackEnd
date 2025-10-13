const Wholesaler = require('../Models/Wholesaler');
const Store = require('../Models/Store');
const User = require('../Models/User');
const { success, error } = require('../utils/response');

/**
 * Normalize email address consistently
 * - Converts to lowercase
 * - Removes dots from Gmail addresses (Gmail ignores dots)
 * - Trims whitespace
 */
const normalizeEmail = (email) => {
  if (!email) return email;
  
  // Trim and convert to lowercase
  let normalized = email.trim().toLowerCase();
  
  // For Gmail addresses, remove dots from the local part (before @)
  const [localPart, domain] = normalized.split('@');
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove all dots from the local part
    const normalizedLocal = localPart.replace(/\./g, '');
    normalized = `${normalizedLocal}@${domain}`;
  }
  
  return normalized;
};

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

    // Remove password from each wholesaler response
    const wholesalersResponse = wholesalers.map(wholesaler => {
      const wholesalerObj = wholesaler.toObject();
      delete wholesalerObj.password;
      return wholesalerObj;
    });

    return success(res, {
      data: {
        wholesalers: wholesalersResponse,
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
      message: 'Wholesalers retrieved successfully',
      messageAr: 'تم جلب تجار الجملة بنجاح'
    });

  } catch (err) {
    //CONSOLE.error('Error getting wholesalers:', err);
    return error(res, { message: 'Failed to get wholesalers', messageAr: 'فشل في جلب تجار الجملة', statusCode: 500 });
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
      return error(res, { message: 'Wholesaler not found', messageAr: 'تاجر الجملة غير موجود', statusCode: 404 });
    }

    // Remove password from response if it exists
    const wholesalerResponse = wholesaler.toObject();
    delete wholesalerResponse.password;

    return success(res, { data: wholesalerResponse, message: 'Wholesaler retrieved successfully', messageAr: 'تم جلب تاجر الجملة بنجاح' });

  } catch (err) {
    //CONSOLE.error('Error getting wholesaler:', err);
    return error(res, { message: 'Failed to get wholesaler', messageAr: 'فشل في جلب تاجر الجملة', statusCode: 500 });
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
      return error(res, { message: 'Store not found', messageAr: 'المتجر غير موجود', statusCode: 404 });
    }

    // Normalize email for consistent storage and duplicate checking
    const normalizedEmail = normalizeEmail(wholesalerData.email);

    // CRITICAL SECURITY: Check if email already exists in the same store (ANY ROLE)
    // Check in User model for any user in this store with this email
    const existingUserInStore = await User.findOne({
      email: normalizedEmail,
      store: storeId
      // Do NOT filter by role - email must be unique per store
    });

    if (existingUserInStore) {
      return error(res, { 
        message: `This email is already registered in this store as ${existingUserInStore.role}. Please use a different email.`,
        messageAr: `هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر بدور ${existingUserInStore.role}. يرجى استخدام بريد إلكتروني مختلف.`,
        statusCode: 409 
      });
    }

    // Check if email already exists in Wholesaler model for this store
    const existingWholesaler = await Wholesaler.findOne({
      email: normalizedEmail,
      store: storeId
    });

    if (existingWholesaler) {
      return error(res, { 
        message: 'Email already exists as wholesaler in this store',
        messageAr: 'البريد الإلكتروني موجود بالفعل كتاجر جملة في هذا المتجر',
        statusCode: 409 
      });
    }

    // Check if password is provided
    if (!wholesalerData.password) {
      return error(res, { message: 'Password is required', messageAr: 'كلمة المرور مطلوبة', statusCode: 400 });
    }

    // Create user record first (password will be hashed by User model's pre-save hook)
    const userData = {
      firstName: wholesalerData.firstName,
      lastName: wholesalerData.lastName,
      email: normalizedEmail,
      password: wholesalerData.password, // Plain password - will be hashed by User model
      phone: wholesalerData.mobile,
      role: 'wholesaler',
      status: 'active',
      isActive: true,
      store: storeId
    };
    

    const user = await User.create(userData);

    // Add store ID, user ID, and normalized email to wholesaler data
    wholesalerData.store = storeId;
    wholesalerData.userId = user._id;
    wholesalerData.email = normalizedEmail;
    
    // Set default status to Active if not provided
    if (!wholesalerData.status) {
      wholesalerData.status = 'Active';
    }

    // Create wholesaler
    const wholesaler = await Wholesaler.create(wholesalerData);

    // Populate references
    await wholesaler.populate('store', 'name domain');

    // Remove password from response if it exists
    const wholesalerResponse = wholesaler.toObject();
    delete wholesalerResponse.password;

    return success(res, { data: wholesalerResponse, message: 'Wholesaler created successfully', messageAr: 'تم إنشاء تاجر الجملة بنجاح', statusCode: 201 });

  } catch (err) {
    //CONSOLE.error('Error creating wholesaler:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return error(res, { message: errors.join(', '), messageAr: 'خطأ في التحقق من صحة البيانات', statusCode: 400 });
    }
    
    return error(res, { message: 'Failed to create wholesaler', messageAr: 'فشل في إنشاء تاجر الجملة', statusCode: 500 });
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
      return error(res, { message: 'Wholesaler not found', messageAr: 'تاجر الجملة غير موجود', statusCode: 404 });
    }

    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const normalizedEmail = normalizeEmail(updateData.email);
      
      if (normalizedEmail !== wholesaler.email) {
        // CRITICAL SECURITY: Check if email exists in same store (ANY ROLE)
        const existingUserInStore = await User.findOne({
          email: normalizedEmail,
          store: storeId,
          _id: { $ne: wholesaler.userId }
        });

        if (existingUserInStore) {
          return error(res, { 
            message: `This email is already registered in this store as ${existingUserInStore.role}. Please use a different email.`,
            messageAr: `هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر بدور ${existingUserInStore.role}. يرجى استخدام بريد إلكتروني مختلف.`,
            statusCode: 409 
          });
        }

        // Check if email exists in Wholesaler model for this store
        const existingWholesaler = await Wholesaler.findOne({
          email: normalizedEmail,
          store: storeId,
          _id: { $ne: wholesalerId }
        });

        if (existingWholesaler) {
          return error(res, { 
            message: 'Email already exists as wholesaler in this store',
            messageAr: 'البريد الإلكتروني موجود بالفعل كتاجر جملة في هذا المتجر',
            statusCode: 409 
          });
        }
      }
      
      // Use normalized email
      updateData.email = normalizedEmail;
    }

    // Update wholesaler fields
    Object.keys(updateData).forEach(key => {
      wholesaler[key] = updateData[key];
    });

    // Save the wholesaler (this will trigger pre-save middleware for password hashing)
    await wholesaler.save();

    // Update corresponding user record
    if (Object.keys(updateData).some(key => ['firstName', 'lastName', 'email', 'password', 'mobile'].includes(key))) {
      const user = await User.findById(wholesaler.userId);
      if (user) {
        if (updateData.firstName) user.firstName = updateData.firstName;
        if (updateData.lastName) user.lastName = updateData.lastName;
        if (updateData.email) user.email = updateData.email;
        if (updateData.password) user.password = updateData.password; // Plain password - will be hashed by User model's pre-save hook
        if (updateData.mobile) user.phone = updateData.mobile;
        
        await user.save(); // This will trigger the pre-save middleware for password hashing
      }
    }

    // Populate references
    await wholesaler.populate('store', 'name domain');
    await wholesaler.populate('verifiedBy', 'firstName lastName');

    // Remove password from response if it exists
    const wholesalerResponse = wholesaler.toObject();
    delete wholesalerResponse.password;

    return success(res, { data: wholesalerResponse, message: 'Wholesaler updated successfully', messageAr: 'تم تحديث تاجر الجملة بنجاح' });

  } catch (err) {
    //CONSOLE.error('Error updating wholesaler:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return error(res, { message: errors.join(', '), messageAr: 'خطأ في التحقق من صحة البيانات', statusCode: 400 });
    }
    
    return error(res, { message: 'Failed to update wholesaler', messageAr: 'فشل في تحديث تاجر الجملة', statusCode: 500 });
  }
};

// Delete wholesaler
const deleteWholesaler = async (req, res) => {
  try {
    const { storeId, wholesalerId } = req.params;

    const wholesaler = await Wholesaler.findOne({ 
      _id: wholesalerId, 
      store: storeId 
    });

    if (!wholesaler) {
      return error(res, { message: 'Wholesaler not found', messageAr: 'تاجر الجملة غير موجود', statusCode: 404 });
    }

    // Delete the wholesaler record
    await Wholesaler.findByIdAndDelete(wholesalerId);

    // Delete the corresponding user record
    if (wholesaler.userId) {
      await User.findByIdAndDelete(wholesaler.userId);
    }

    return success(res, { data: null, message: 'Wholesaler deleted successfully', messageAr: 'تم حذف تاجر الجملة بنجاح' });

  } catch (err) {
    //CONSOLE.error('Error deleting wholesaler:', err);
    return error(res, { message: 'Failed to delete wholesaler', messageAr: 'فشل في حذف تاجر الجملة', statusCode: 500 });
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
      return error(res, { message: 'Wholesaler not found', messageAr: 'تاجر الجملة غير موجود', statusCode: 404 });
    }

    if (wholesaler.isVerified) {
      return error(res, { message: 'Wholesaler is already verified', messageAr: 'تاجر الجملة محقق بالفعل', statusCode: 400 });
    }

    // Verify wholesaler
    await wholesaler.verify(verifiedBy);

    // Populate references
    await wholesaler.populate('store', 'name domain');
    await wholesaler.populate('verifiedBy', 'firstName lastName');

    return success(res, { data: wholesaler, message: 'Wholesaler verified successfully', messageAr: 'تم التحقق من تاجر الجملة بنجاح' });

  } catch (err) {
    //CONSOLE.error('Error verifying wholesaler:', err);
    return error(res, { message: 'Failed to verify wholesaler', messageAr: 'فشل في التحقق من تاجر الجملة', statusCode: 500 });
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
      return error(res, { message: 'Wholesaler not found', messageAr: 'تاجر الجملة غير موجود', statusCode: 404 });
    }

    // Update status
    await wholesaler.updateStatus(status);

    // Populate references
    await wholesaler.populate('store', 'name domain');
    await wholesaler.populate('verifiedBy', 'firstName lastName');

    return success(res, { data: wholesaler, message: 'Wholesaler status updated successfully', messageAr: 'تم تحديث حالة تاجر الجملة بنجاح' });

  } catch (err) {
    //CONSOLE.error('Error updating wholesaler status:', err);
    return error(res, { message: 'Failed to update wholesaler status', messageAr: 'فشل في تحديث حالة تاجر الجملة', statusCode: 500 });
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
      message: 'Wholesaler statistics retrieved successfully',
      messageAr: 'تم جلب إحصائيات تجار الجملة بنجاح'
    });

  } catch (err) {
    //CONSOLE.error('Error getting wholesaler stats:', err);
    return error(res, { message: 'Failed to get wholesaler statistics', messageAr: 'فشل في جلب إحصائيات تجار الجملة', statusCode: 500 });
  }
};

// Bulk operations
const bulkUpdateStatus = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { wholesalerIds, status } = req.body;

    if (!wholesalerIds || !Array.isArray(wholesalerIds) || wholesalerIds.length === 0) {
      return error(res, { message: 'Wholesaler IDs array is required', messageAr: 'مصفوفة معرفات تجار الجملة مطلوبة', statusCode: 400 });
    }

    if (!status) {
      return error(res, { message: 'Status is required', messageAr: 'الحالة مطلوبة', statusCode: 400 });
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
      data: { updatedCount: result.modifiedCount },
      message: `${result.modifiedCount} wholesalers status updated successfully`,
      messageAr: `تم تحديث حالة ${result.modifiedCount} تجار جملة بنجاح`
    });

  } catch (err) {
    //CONSOLE.error('Error bulk updating wholesaler status:', err);
    return error(res, { message: 'Failed to bulk update wholesaler status', messageAr: 'فشل في تحديث حالة تجار الجملة بالجملة', statusCode: 500 });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { wholesalerIds } = req.body;

    if (!wholesalerIds || !Array.isArray(wholesalerIds) || wholesalerIds.length === 0) {
      return error(res, { message: 'Wholesaler IDs array is required', messageAr: 'مصفوفة معرفات تجار الجملة مطلوبة', statusCode: 400 });
    }

    // Get wholesalers to find their user IDs
    const wholesalers = await Wholesaler.find({
      _id: { $in: wholesalerIds },
      store: storeId
    });

    // Extract user IDs
    const userIds = wholesalers.map(wholesaler => wholesaler.userId).filter(id => id);

    // Delete wholesalers
    const result = await Wholesaler.deleteMany({
      _id: { $in: wholesalerIds },
      store: storeId
    });

    // Delete corresponding user records
    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } });
    }

    return success(res, {
      data: { deletedCount: result.deletedCount },
      message: `${result.deletedCount} wholesalers deleted successfully`,
      messageAr: `تم حذف ${result.deletedCount} تجار جملة بنجاح`
    });

  } catch (err) {
    //CONSOLE.error('Error bulk deleting wholesalers:', err);
    return error(res, { message: 'Failed to bulk delete wholesalers', messageAr: 'فشل في حذف تجار الجملة بالجملة', statusCode: 500 });
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