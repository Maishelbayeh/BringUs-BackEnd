const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  
  status: {

    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_store',
      'manage_users',
      'manage_products',
      'manage_categories',
      'manage_orders',
      'manage_inventory',
      'view_analytics',
      'manage_settings'
    ]
  }],
  isPrimaryOwner: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure one primary owner per store
ownerSchema.index({ storeId: 1, isPrimaryOwner: 1 }, { unique: true, partialFilterExpression: { isPrimaryOwner: true } });

// Ensure one owner per user per store
ownerSchema.index({ userId: 1, storeId: 1 }, { unique: true });

module.exports = mongoose.model('Owner', ownerSchema); 