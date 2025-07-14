const Store = require('../Models/Store');
const Owner = require('../Models/Owner');
const User = require('../Models/User');
const { success, error } = require('../utils/response');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');

/**
 * Controller for Store operations
 */
class StoreController {
  // Create new store
  static async createStore(req, res) {
    try {
      const { 
        nameAr, 
        nameEn, 
        descriptionAr, 
        descriptionEn, 
        slug, 
        contact, 
        settings,
        whatsappNumber,
        logo 
      } = req.body;
      
      const userId = req.user._id;

      // Validate required fields
      if (!nameAr || !nameEn || !slug || !contact?.email) {
        return error(res, { 
          message: 'Missing required fields: nameAr, nameEn, slug, and contact.email are required', 
          statusCode: 400 
        });
      }

      // Check if slug already exists
      const existingStore = await Store.findOne({ slug });
      if (existingStore) {
        return error(res, { 
          message: 'Store slug already exists', 
          statusCode: 400 
        });
      }

      // Handle logo upload if provided
      let logoData = null;
      if (req.file) {
        try {
          const uploadResult = await uploadToCloudflare(
            req.file.buffer,
            req.file.originalname,
            'store-logos'
          );
          logoData = {
            public_id: uploadResult.key,
            url: uploadResult.url
          };
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
          return error(res, { 
            message: 'Failed to upload logo', 
            statusCode: 500 
          });
        }
      }

      // Create store data
      const storeData = {
        nameAr,
        nameEn,
        descriptionAr,
        descriptionEn,
        slug,
        contact,
        settings: settings || {},
        whatsappNumber,
        ...(logoData && { logo: logoData })
      };

      const store = await Store.create(storeData);

      // Create owner record
      await Owner.create({
        userId,
        storeId: store._id,
        isPrimaryOwner: true,
        permissions: [
          'manage_store',
          'manage_users',
          'manage_products',
          'manage_categories',
          'manage_orders',
          'manage_inventory',
          'view_analytics',
          'manage_settings'
        ]
      });

      await store.populate('contact');
      return success(res, { data: store, message: 'Store created successfully', statusCode: 201 });
    } catch (err) {
      console.error('Create store error:', err);
      return error(res, { message: 'Create store error', error: err });
    }
  }

  // Get all stores (for superadmin)
  static async getAllStores(req, res) {
    try {
      const stores = await Store.find().populate('contact', 'email phone');
      return success(res, { data: stores, count: stores.length });
    } catch (err) {
      return error(res, { message: 'Get all stores error', error: err });
    }
  }

  // Get store by ID
  static async getStore(req, res) {
    try {
      const { id } = req.params;
      const store = await Store.findById(id).populate('contact', 'email phone address');
      if (!store) {
        return error(res, { message: 'Store not found', statusCode: 404 });
      }
      return success(res, { data: store });
    } catch (err) {
      return error(res, { message: 'Get store error', error: err });
    }
  }

  // Get store by slug
  static async getStoreBySlug(req, res) {
    try {
      const { slug } = req.params;
      const store = await Store.findOne({ slug, status: 'active' }).populate('contact', 'email phone address');
      if (!store) {
        return error(res, { message: 'Store not found', statusCode: 404 });
      }
      return success(res, { data: store });
    } catch (err) {
      return error(res, { message: 'Get store by slug error', error: err });
    }
  }

  // Update store
  static async updateStore(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Handle logo upload if provided
      if (req.file) {
        try {
          const uploadResult = await uploadToCloudflare(
            req.file.buffer,
            req.file.originalname,
            'store-logos'
          );
          updateData.logo = {
            public_id: uploadResult.key,
            url: uploadResult.url
          };
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
          return error(res, { 
            message: 'Failed to upload logo', 
            statusCode: 500 
          });
        }
      }

      // Check if slug already exists (if being updated)
      if (updateData.slug) {
        const existingStore = await Store.findOne({ slug: updateData.slug, _id: { $ne: id } });
        if (existingStore) {
          return error(res, { 
            message: 'Store slug already exists', 
            statusCode: 400 
          });
        }
      }

      const store = await Store.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('contact', 'email phone address');

      if (!store) {
        return error(res, { message: 'Store not found', statusCode: 404 });
      }
      return success(res, { data: store, message: 'Store updated successfully' });
    } catch (err) {
      console.error('Update store error:', err);
      return error(res, { message: 'Update store error', error: err });
    }
  }

  // Delete store
  static async deleteStore(req, res) {
    try {
      const { id } = req.params;
      const store = await Store.findById(id);
      if (!store) {
        return error(res, { message: 'Store not found', statusCode: 404 });
      }
      
      await Owner.deleteMany({ storeId: id });
      await Store.findByIdAndDelete(id);
      return success(res, { message: 'Store deleted successfully' });
    } catch (err) {
      return error(res, { message: 'Delete store error', error: err });
    }
  }

  // Get store statistics
  static async getStoreStats(req, res) {
    try {
      const { storeId } = req.params;
      const ownersCount = await Owner.countDocuments({ storeId, status: 'active' });
      return success(res, { data: { ownersCount } });
    } catch (err) {
      return error(res, { message: 'Get store stats error', error: err });
    }
  }

  // Get customers by store ID
  static async getCustomersByStoreId(req, res) {
    try {
      const { storeId } = req.params;
      const { page = 1, limit = 10, status, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build filter
      const filter = { 
        store: storeId, 
        role: 'client' 
      };

      // Add status filter if provided
      if (status) {
        filter.status = status;
      }

      // Add search filter if provided
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      // Get customers with pagination
      const customers = await User.find(filter)
        .select('-password')
        .populate('store', 'nameAr nameEn slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await User.countDocuments(filter);
      const totalPages = Math.ceil(total / parseInt(limit));

      // Get statistics
      const activeCustomers = await User.countDocuments({ store: storeId, role: 'client', status: 'active' });
      const inactiveCustomers = await User.countDocuments({ store: storeId, role: 'client', status: 'inactive' });
      const bannedCustomers = await User.countDocuments({ store: storeId, role: 'client', status: 'banned' });
      const verifiedCustomers = await User.countDocuments({ store: storeId, role: 'client', isEmailVerified: true });

      return success(res, {
        data: customers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        statistics: {
          total: total,
          active: activeCustomers,
          inactive: inactiveCustomers,
          banned: bannedCustomers,
          emailVerified: verifiedCustomers
        }
      });
    } catch (err) {
      return error(res, { message: 'Get customers by store error', error: err });
    }
  }

  // Get customer by ID within store
  static async getCustomerById(req, res) {
    try {
      const { storeId, customerId } = req.params;

      const customer = await User.findOne({
        _id: customerId,
        store: storeId,
        role: 'client'
      })
      .select('-password')
      .populate('store', 'nameAr nameEn slug');

      if (!customer) {
        return error(res, { message: 'Customer not found', statusCode: 404 });
      }

      return success(res, { data: customer });
    } catch (err) {
      return error(res, { message: 'Get customer error', error: err });
    }
  }

  // Update customer within store
  static async updateCustomer(req, res) {
    try {
      const { storeId, customerId } = req.params;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.role;
      delete updateData.store;

      const customer = await User.findOneAndUpdate(
        {
          _id: customerId,
          store: storeId,
          role: 'client'
        },
        updateData,
        { new: true, runValidators: true }
      )
      .select('-password')
      .populate('store', 'nameAr nameEn slug');

      if (!customer) {
        return error(res, { message: 'Customer not found', statusCode: 404 });
      }

      return success(res, { data: customer, message: 'Customer updated successfully' });
    } catch (err) {
      return error(res, { message: 'Update customer error', error: err });
    }
  }

  // Delete customer within store
  static async deleteCustomer(req, res) {
    try {
      const { storeId, customerId } = req.params;

      const customer = await User.findOneAndDelete({
        _id: customerId,
        store: storeId,
        role: 'client'
      });

      if (!customer) {
        return error(res, { message: 'Customer not found', statusCode: 404 });
      }

      return success(res, { message: 'Customer deleted successfully' });
    } catch (err) {
      return error(res, { message: 'Delete customer error', error: err });
    }
  }
}

module.exports = StoreController; 