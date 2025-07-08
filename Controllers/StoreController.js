const Store = require('../Models/Store');
const Owner = require('../Models/Owner');
const User = require('../Models/User');
const { success, error } = require('../utils/response');

/**
 * Controller for Store operations
 */
class StoreController {
  // Create new store
  static async createStore(req, res) {
    try {
      const { name, description, domain, contact, settings } = req.body;
      const userId = req.user._id;
      const existingStore = await Store.findOne({ domain });
      if (existingStore) return error(res, { message: 'Domain already exists', statusCode: 400 });
      const store = await Store.create({ name, description, domain, contact, settings });
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
      return success(res, { data: store, message: 'Store created', statusCode: 201 });
    } catch (err) {
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
      if (!store) return error(res, { message: 'Store not found', statusCode: 404 });
      return success(res, { data: store });
    } catch (err) {
      return error(res, { message: 'Get store error', error: err });
    }
  }

  // Get store by domain
  static async getStoreByDomain(req, res) {
    try {
      const { domain } = req.params;
      const store = await Store.findOne({ domain, status: 'active' }).populate('contact', 'email phone address');
      if (!store) return error(res, { message: 'Store not found', statusCode: 404 });
      return success(res, { data: store });
    } catch (err) {
      return error(res, { message: 'Get store by domain error', error: err });
    }
  }

  // Update store
  static async updateStore(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      if (updateData.domain) {
        const existingStore = await Store.findOne({ domain: updateData.domain, _id: { $ne: id } });
        if (existingStore) return error(res, { message: 'Domain already exists', statusCode: 400 });
      }
      const store = await Store.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('contact', 'email phone address');
      if (!store) return error(res, { message: 'Store not found', statusCode: 404 });
      return success(res, { data: store, message: 'Store updated' });
    } catch (err) {
      return error(res, { message: 'Update store error', error: err });
    }
  }

  // Delete store
  static async deleteStore(req, res) {
    try {
      const { id } = req.params;
      const store = await Store.findById(id);
      if (!store) return error(res, { message: 'Store not found', statusCode: 404 });
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
}

module.exports = StoreController; 