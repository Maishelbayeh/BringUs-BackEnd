const Owner = require('../Models/Owner');
const Store = require('../Models/Store');
const User = require('../Models/User');
const { success, error } = require('../utils/response');

/**
 * Controller for Owner operations (store-user relationship)
 */
class OwnerController {
  // Create new owner
  static async createOwner(req, res) {
    try {
      const { userId, storeId, permissions, isPrimaryOwner } = req.body;
      const store = await Store.findById(storeId);
      if (!store) return error(res, { message: 'Store not found', statusCode: 404 });
      const user = await User.findById(userId);
      if (!user) return error(res, { message: 'User not found', statusCode: 404 });
      const existingOwner = await Owner.findOne({ userId, storeId });
      if (existingOwner) return error(res, { message: 'User is already an owner of this store', statusCode: 400 });
      if (isPrimaryOwner) {
        const primaryOwner = await Owner.findOne({ storeId, isPrimaryOwner: true });
        if (primaryOwner) return error(res, { message: 'Store already has a primary owner', statusCode: 400 });
      }
      const owner = await Owner.create({ userId, storeId, permissions: permissions || [], isPrimaryOwner: isPrimaryOwner || false });
      await owner.populate('userId', 'firstName lastName email');
      await owner.populate('storeId', 'name domain');
      return success(res, { data: owner, message: 'Owner created', statusCode: 201 });
    } catch (err) {
      return error(res, { message: 'Create owner error', error: err });
    }
  }

  // Get all owners for a store
  static async getStoreOwners(req, res) {
    try {
      const { storeId } = req.params;
      const owners = await Owner.find({ storeId })
        .populate('userId', 'firstName lastName email avatar')
        .populate('storeId', 'name domain');
      return success(res, { data: owners, count: owners.length });
    } catch (err) {
      return error(res, { message: 'Get store owners error', error: err });
    }
  }

  // Get owner by ID
  static async getOwner(req, res) {
    try {
      const { id } = req.params;
      const owner = await Owner.findById(id)
        .populate('userId', 'firstName lastName email avatar')
        .populate('storeId', 'name domain');
      if (!owner) return error(res, { message: 'Owner not found', statusCode: 404 });
      return success(res, { data: owner });
    } catch (err) {
      return error(res, { message: 'Get owner error', error: err });
    }
  }

  // Update owner
  static async updateOwner(req, res) {
    try {
      const { id } = req.params;
      const { permissions, isPrimaryOwner, status } = req.body;
      const owner = await Owner.findById(id);
      if (!owner) return error(res, { message: 'Owner not found', statusCode: 404 });
      if (isPrimaryOwner && !owner.isPrimaryOwner) {
        await Owner.updateMany({ storeId: owner.storeId, isPrimaryOwner: true }, { isPrimaryOwner: false });
      }
      const updatedOwner = await Owner.findByIdAndUpdate(
        id,
        { permissions, isPrimaryOwner, status },
        { new: true, runValidators: true }
      ).populate('userId', 'firstName lastName email')
       .populate('storeId', 'name domain');
      return success(res, { data: updatedOwner, message: 'Owner updated' });
    } catch (err) {
      return error(res, { message: 'Update owner error', error: err });
    }
  }

  // Delete owner
  static async deleteOwner(req, res) {
    try {
      const { id } = req.params;
      const owner = await Owner.findById(id);
      if (!owner) return error(res, { message: 'Owner not found', statusCode: 404 });
      if (owner.isPrimaryOwner) return error(res, { message: 'Cannot delete primary owner', statusCode: 400 });
      await Owner.findByIdAndDelete(id);
      return success(res, { message: 'Owner deleted successfully' });
    } catch (err) {
      return error(res, { message: 'Delete owner error', error: err });
    }
  }

  // Get stores for a user
  static async getUserStores(req, res) {
    try {
      const { userId } = req.params;
      const owners = await Owner.find({ userId, status: 'active' })
        .populate('storeId', 'name domain logo status')
        .populate('userId', 'firstName lastName email');
      return success(res, { data: owners, count: owners.length });
    } catch (err) {
      return error(res, { message: 'Get user stores error', error: err });
    }
  }
}

module.exports = OwnerController; 