const mongoose = require('mongoose');
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
      //CONSOLE.log('Create store - Request body:', req.body);
      //CONSOLE.log('Create store - Request file:', req.file);
      
      let { 
        nameAr, 
        nameEn, 
        descriptionAr, 
        descriptionEn, 
        slug, 
        contact, 
        settings,
        whatsappNumber
      } = req.body;
      

      // Parse JSON strings if they come as strings from multipart/form-data
      if (typeof contact === 'string') {
        try {
          contact = JSON.parse(contact);
        } catch (e) {
          //CONSOLE.error('Error parsing contact:', e);
          return error(res, { 
            message: 'Invalid contact data format', 
            statusCode: 400 
          });
        }
      }

      if (typeof settings === 'string') {
        try {
          settings = JSON.parse(settings);
        } catch (e) {
          //CONSOLE.error('Error parsing settings:', e);
          return error(res, { 
            message: 'Invalid settings data format', 
            statusCode: 400 
          });
        }
      }

      //CONSOLE.log('Parsed contact:', contact);
      //CONSOLE.log('Parsed settings:', settings);

      // Validate required fields
      if (!nameAr || !nameEn  || !contact?.email) {
        return error(res, { 
          message: 'Missing required fields: nameAr, nameEn, and contact.email are required', 
          statusCode: 400 
        });
      }

      // Slug will be automatically generated from nameEn in the model's pre-save hook

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
          //CONSOLE.error('Logo upload error:', uploadError);
          return error(res, { 
            message: 'Failed to upload logo', 
            statusCode: 500 
          });
        }
      }

      // Create store data (slug will be generated automatically)
      const storeData = {
        nameAr,
        nameEn,
        descriptionAr,
        descriptionEn,
        contact,
        settings: settings || {},
        whatsappNumber,
        ...(logoData && { logo: logoData })
      };

      const store = await Store.create(storeData);

      // Create owner record
      // await Owner.create({
      //   userId,
      //   storeId: store._id,
      //   isPrimaryOwner: true,
      //   permissions: [
      //     'manage_store',
      //     'manage_users',
      //     'manage_products',
      //     'manage_categories',
      //     'manage_orders',
      //     'manage_inventory',
      //     'view_analytics',
      //     'manage_settings'
      //   ]
      // });

      await store.populate('contact');
      
      // Generate store URL after slug is created
      const baseDomain = 'https://bringus-main.onrender.com';
      const storeUrl = `${baseDomain}/${store.slug}`;
      
      // Update the store with the generated URL
      store.url = storeUrl;
      await store.save();
      
      // Add the generated URL to the response
      const storeResponse = {
        ...store.toObject(),
        storeUrl: store.generateStoreUrl()
      };
      
      return success(res, { data: storeResponse, message: 'Store created successfully', statusCode: 201 });
    } catch (err) {
      //CONSOLE.error('Create store error:', err);
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
      
      console.log('Update store - ID:', id);
      console.log('Update store - Request body:', req.body);
      console.log('Update store - Update data:', updateData);

      // Validate store ID format
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return error(res, { 
          message: 'Invalid store ID format', 
          statusCode: 400 
        });
      }

      // Parse JSON strings for complex objects
      if (updateData.contact && typeof updateData.contact === 'string') {
        try {
          updateData.contact = JSON.parse(updateData.contact);
        } catch (parseError) {
          //CONSOLE.error('Error parsing contact JSON:', parseError);
          return error(res, { 
            message: 'Invalid contact data format', 
            statusCode: 400 
          });
        }
      }

      if (updateData.settings && typeof updateData.settings === 'string') {
        try {
          updateData.settings = JSON.parse(updateData.settings);
        } catch (parseError) {
          //CONSOLE.error('Error parsing settings JSON:', parseError);
          return error(res, { 
            message: 'Invalid settings data format', 
            statusCode: 400 
          });
        }
      }

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
      } else if (updateData.logo && typeof updateData.logo === 'object') {
        // Logo is already provided as an object, keep it as is
        // No need to process it further
        console.log('Logo provided as object:', updateData.logo);
      }

      // Check if store exists before updating
      const existingStore = await Store.findById(id);
      if (!existingStore) {
        return error(res, { 
          message: 'Store not found', 
          statusCode: 404 
        });
      }

      // Check if slug already exists (if being updated)
      if (updateData.slug) {
        const storeWithSameSlug = await Store.findOne({ slug: updateData.slug, _id: { $ne: id } });
        if (storeWithSameSlug) {
          return error(res, { 
            message: 'Store slug already exists', 
            statusCode: 400 
          });
        }
      }

      console.log('Update store - About to update with data:', updateData);
      
      // Validate required fields if they're being updated
      if (updateData.contact && !updateData.contact.email) {
        return error(res, { 
          message: 'Contact email is required', 
          statusCode: 400 
        });
      }

      if (updateData.nameAr && !updateData.nameAr.trim()) {
        return error(res, { 
          message: 'Arabic name is required', 
          statusCode: 400 
        });
      }

      if (updateData.nameEn && !updateData.nameEn.trim()) {
        return error(res, { 
          message: 'English name is required', 
          statusCode: 400 
        });
      }

      if (updateData.slug && !updateData.slug.trim()) {
        return error(res, { 
          message: 'Slug is required', 
          statusCode: 400 
        });
      }
      
      console.log('Update store - About to execute database update...');
      
      try {
        const store = await Store.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        ).populate('contact', 'email phone address');

        console.log('Update store - Database update successful');
        console.log('Update store - Result:', store);

        if (!store) {
          return error(res, { message: 'Store not found', statusCode: 404 });
        }
        return success(res, { data: store, message: 'Store updated successfully' });
      } catch (dbError) {
        console.error('Update store - Database error:', dbError);
        console.error('Update store - Database error name:', dbError.name);
        console.error('Update store - Database error code:', dbError.code);
        console.error('Update store - Database error message:', dbError.message);
        
        // Handle specific database errors
        if (dbError.name === 'ValidationError') {
          return error(res, { 
            message: 'Validation error', 
            error: dbError.message,
            statusCode: 400 
          });
        }
        
        if (dbError.code === 11000) {
          return error(res, { 
            message: 'Duplicate key error - slug already exists', 
            statusCode: 400 
          });
        }
        
        throw dbError; // Re-throw to be caught by outer catch block
      }
    } catch (err) {
      console.error('Update store error:', err);
      console.error('Update store error stack:', err.stack);
      console.error('Update store error name:', err.name);
      console.error('Update store error code:', err.code);
      return error(res, { message: 'Server error', error: err.message, details: err.stack });
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
      const { page = 1, limit = 10, status, search, includeGuests = false, role } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const Order = require('../Models/Order');
      // Build filter for registered customers
      const filter = { 
        store: storeId, 
        role: { $in: ['client', 'wholesaler'] }
      };

      // Add role filter if provided
      if (role && ['client', 'wholesaler'].includes(role)) {
        filter.role = role;
      }

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

      console.log('filter',filter);
      const customers = await User.find(filter)
        .select('-password')
        .populate('store', 'nameAr nameEn slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      // Get order counts for each customer
      const customerIds = customers.map(customer => customer._id);
      const orderCounts = await Order.aggregate([
        {
          $match: {
            'user.id': { $in: customerIds },
            'store.id': new mongoose.Types.ObjectId(storeId)
          }
        },
        {
          $group: {
            _id: '$user.id',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$pricing.total' },
            lastOrderDate: { $max: '$createdAt' }
          }
        }
      ]);
      
      // Create a map of customer ID to order count
      const orderCountMap = {};
      orderCounts.forEach(item => {
        orderCountMap[item._id.toString()] = {
          orderCount: item.orderCount,
          totalSpent: item.totalSpent || 0,
          lastOrderDate: item.lastOrderDate
        };
      });
      
      // Add order information to each customer
      const customersWithOrders = customers.map(customer => {
        const customerId = customer._id.toString();
        const orderInfo = orderCountMap[customerId] || {
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: null
        };
        
        return {
          ...customer.toObject(),
          orderCount: orderInfo.orderCount,
          totalSpent: orderInfo.totalSpent,
          lastOrderDate: orderInfo.lastOrderDate
        };
      });
        
              console.log('customers with orders', customersWithOrders);
      // Get total count for registered customers
      const totalCustomers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalCustomers / parseInt(limit));

      // Get statistics for registered customers (including wholesalers)
      const activeCustomers = await User.countDocuments({ store: storeId, role: { $in: ['client', 'wholesaler'] }, status: 'active' });
      const inactiveCustomers = await User.countDocuments({ store: storeId, role: { $in: ['client', 'wholesaler'] }, status: 'inactive' });
      const bannedCustomers = await User.countDocuments({ store: storeId, role: { $in: ['client', 'wholesaler'] }, status: 'banned' });
      const verifiedCustomers = await User.countDocuments({ store: storeId, role: { $in: ['client', 'wholesaler'] }, isEmailVerified: true });
      
      // Get separate statistics for clients and wholesalers
      const activeClients = await User.countDocuments({ store: storeId, role: 'client', status: 'active' });
      const activeWholesalers = await User.countDocuments({ store: storeId, role: 'wholesaler', status: 'active' });
      const totalClients = await User.countDocuments({ store: storeId, role: 'client' });
      const totalWholesalers = await User.countDocuments({ store: storeId, role: 'wholesaler' });

      let guests = [];
      let totalGuests = 0;
      let guestStatistics = {};

      // If includeGuests is true, get guest customers from orders
      if (includeGuests === 'true' || includeGuests === true) {
        console.log('includeGuests',includeGuests);
        const Order = require('../Models/Order');
        
                              // Get unique guest customers from orders
            const guestOrders = await Order.aggregate([
            {
             $match: {
               'store.id': new mongoose.Types.ObjectId(storeId),
               guestId: { $ne: null, $exists: true }
             }
            },
                          {
                $group: {
                  store: { $first: '$store.id' },
                  _id: '$guestId',
                  firstName: { $first: '$user.firstName' },
                  lastName: { $first: '$user.lastName' },
                  email: { $first: '$user.email' },
                  phone: { $first: '$user.phone' },
                  orderCount: { $sum: 1 },
                  totalSpent: { $sum: '$totalPrice' },
                  lastOrderDate: { $max: '$createdAt' },
                  firstOrderDate: { $min: '$createdAt' }
                }
              },
            {
              $sort: { lastOrderDate: -1 }
            }
          ]);

                          console.log('guestOrders count:', guestOrders.length);
        console.log('guestOrders sample:', guestOrders.slice(0, 2));
        console.log('storeId being searched:', storeId);

        // Apply search filter to guests if provided
        let filteredGuests = guestOrders;
        if (search) {
          filteredGuests = guestOrders.filter(guest => 
            guest.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            guest.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            guest.email?.toLowerCase().includes(search.toLowerCase()) ||
            guest.phone?.toLowerCase().includes(search.toLowerCase())
          );
        }

        // Apply pagination to guests
        const guestSkip = (parseInt(page) - 1) * parseInt(limit);
        guests = filteredGuests.slice(guestSkip, guestSkip + parseInt(limit));
        totalGuests = filteredGuests.length;

        // Calculate guest statistics
        guestStatistics = {
          total: totalGuests,
          totalSpent: guestOrders.reduce((sum, guest) => sum + (guest.totalSpent || 0), 0),
          averageOrderValue: guestOrders.length > 0 ? 
            guestOrders.reduce((sum, guest) => sum + (guest.totalSpent || 0), 0) / guestOrders.length : 0,
          averageOrdersPerGuest: guestOrders.length > 0 ? 
            guestOrders.reduce((sum, guest) => sum + guest.orderCount, 0) / guestOrders.length : 0
        };
      }

      // Combine customers and guests if includeGuests is true
      let combinedData = customersWithOrders;
      let combinedTotal = totalCustomers;
      let combinedStatistics = {
        total: totalCustomers,
        active: activeCustomers,
        inactive: inactiveCustomers,
        banned: bannedCustomers,
        emailVerified: verifiedCustomers,
        // Separate statistics for clients and wholesalers
        clients: {
          total: totalClients,
          active: activeClients
        },
        wholesalers: {
          total: totalWholesalers,
          active: activeWholesalers
        }
      };

      if (includeGuests === 'true' || includeGuests === true) {
        // Add guest flag to each guest
        const guestsWithFlag = guests.map(guest => ({
          ...guest,
          isGuest: true,
          role: 'guest',
          status: 'active'
        }));

        // Add customer flag to each customer
        const customersWithFlag = customersWithOrders.map(customer => ({
          ...customer,
          isGuest: false
        }));

        combinedData = [...customersWithFlag, ...guestsWithFlag];
        combinedTotal = totalCustomers + totalGuests;
        console.log('Final combined data count:', combinedData.length);
        console.log('Customers count:', customersWithFlag.length);
        console.log('Guests count:', guestsWithFlag.length);
        console.log('Sample customer with orders:', customersWithOrders[0]);
        combinedStatistics = {
          ...combinedStatistics,
          guests: guestStatistics,
          totalWithGuests: combinedTotal
        };
      }

      return success(res, {
        data: combinedData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(combinedTotal / parseInt(limit)),
          totalItems: combinedTotal,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < Math.ceil(combinedTotal / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        },
        statistics: combinedStatistics,
        filters: {
          includeGuests: includeGuests === 'true' || includeGuests === true,
          search: search || null,
          status: status || null,
          role: role || null
        }
      });
    } catch (err) {
      return error(res, { message: 'Get customers by store error', error: err });
    }
  }


  /**
   * Get guest customers by store ID
   * @route GET /api/stores/:storeId/guests
   */
  static async getGuestsByStoreId(req, res) {
    try {
      const { storeId } = req.params;
      const { page = 1, limit = 10, search, sortBy = 'lastOrderDate', sortOrder = 'desc' } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const Order = require('../Models/Order');
      
      // Build match conditions
      const matchConditions = {
        'store.id': new mongoose.Types.ObjectId(storeId),
        'user.id': null, // Guest orders have null user.id
        'user.email': { $ne: 'guest@example.com' } // Exclude default guest email
      };

      // Add search filter if provided
      if (search) {
        matchConditions.$or = [
          { 'user.firstName': { $regex: search, $options: 'i' } },
          { 'user.lastName': { $regex: search, $options: 'i' } },
          { 'user.email': { $regex: search, $options: 'i' } },
          { 'user.phone': { $regex: search, $options: 'i' } }
        ];
      }

      // Get unique guest customers from orders
      const guestOrders = await Order.aggregate([
        {
          $match: matchConditions
        },
        {
          $group: {
            _id: '$user.email',
            firstName: { $first: '$user.firstName' },
            lastName: { $first: '$user.lastName' },
            email: { $first: '$user.email' },
            phone: { $first: '$user.phone' },
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$totalPrice' },
            lastOrderDate: { $max: '$createdAt' },
            firstOrderDate: { $min: '$createdAt' },
            averageOrderValue: { $avg: '$totalPrice' }
          }
        },
        {
          $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        }
      ]);

      // Apply pagination
      const totalGuests = guestOrders.length;
      const paginatedGuests = guestOrders.slice(skip, skip + parseInt(limit));

      // Calculate statistics
      const totalSpent = guestOrders.reduce((sum, guest) => sum + (guest.totalSpent || 0), 0);
      const averageOrderValue = guestOrders.length > 0 ? totalSpent / guestOrders.length : 0;
      const averageOrdersPerGuest = guestOrders.length > 0 ? 
        guestOrders.reduce((sum, guest) => sum + guest.orderCount, 0) / guestOrders.length : 0;

      // Get recent guests (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentGuests = guestOrders.filter(guest => 
        new Date(guest.lastOrderDate) >= thirtyDaysAgo
      ).length;

      // Get top spending guests
      const topSpenders = guestOrders
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, 5)
        .map(guest => ({
          email: guest.email,
          name: `${guest.firstName} ${guest.lastName}`,
          totalSpent: guest.totalSpent,
          orderCount: guest.orderCount
        }));

      return success(res, {
        data: paginatedGuests.map(guest => ({
          ...guest,
          isGuest: true,
          role: 'guest',
          status: 'active'
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalGuests / parseInt(limit)),
          totalItems: totalGuests,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < Math.ceil(totalGuests / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        },
        statistics: {
          total: totalGuests,
          totalSpent,
          averageOrderValue,
          averageOrdersPerGuest,
          recentGuests,
          topSpenders
        },
        filters: {
          search: search || null,
          sortBy,
          sortOrder
        }
      });
    } catch (err) {
      return error(res, { message: 'Get guests by store error', error: err });
    }
  }

  // Get customer by ID within store
  static async getCustomerById(req, res) {
    try {
      const { storeId, customerId } = req.params;
      
      console.log('🔍 getCustomerById - storeId from params:', storeId);
      console.log('🔍 getCustomerById - customerId from params:', customerId);
      console.log('🔍 getCustomerById - User making request:', req.user.email, 'Role:', req.user.role);

      const customer = await User.findOne({
        _id: customerId,
        store: storeId,
        role: 'client'
      })
      .select('-password')
      .populate('store', 'nameAr nameEn slug');

      console.log('🔍 getCustomerById - Query result:', customer ? 'Customer found' : 'Customer not found');
      if (customer) {
        console.log('🔍 getCustomerById - Customer details:', {
          _id: customer._id,
          email: customer.email,
          store: customer.store,
          role: customer.role
        });
      }

      if (!customer) {
        return error(res, { message: 'Customer not found', statusCode: 404 });
      }

      return success(res, { data: customer });
    } catch (err) {
      console.error('🔍 getCustomerById - Error:', err);
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