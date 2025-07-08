const mongoose = require('mongoose');

const stockPreviewSchema = new mongoose.Schema({
  // Product reference
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  
  // Store reference for isolation
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  
  // Stock quantities
  availableQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Available quantity cannot be negative']
  },
  
  reservedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Reserved quantity cannot be negative']
  },
  
  soldQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Sold quantity cannot be negative']
  },
  
  damagedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Damaged quantity cannot be negative']
  },
  
  // Stock alerts
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Low stock threshold cannot be negative']
  },
  
  outOfStockThreshold: {
    type: Number,
    default: 0,
    min: [0, 'Out of stock threshold cannot be negative']
  },
  
  // Stock status
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock'
  },
  
  // Visibility status
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Last stock update
  lastStockUpdate: {
    type: Date,
    default: Date.now
  },
  
  // Stock movement history
  stockMovements: [{
    type: {
      type: String,
      enum: ['purchase', 'sale', 'return', 'damage', 'adjustment', 'reservation'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    previousQuantity: {
      type: Number,
      required: true
    },
    newQuantity: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    reference: {
      type: String,
      trim: true,
      maxlength: [100, 'Reference cannot exceed 100 characters']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Stock alerts
  alerts: [{
    type: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'overstock', 'expiry_warning'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Alert message cannot exceed 500 characters']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Product variants stock (if applicable)
  variantStock: [{
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant'
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Available quantity cannot be negative']
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative']
    },
    soldQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Sold quantity cannot be negative']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
stockPreviewSchema.index({ store: 1, product: 1 }, { unique: true });
stockPreviewSchema.index({ store: 1, stockStatus: 1 });
stockPreviewSchema.index({ store: 1, isVisible: 1 });
stockPreviewSchema.index({ store: 1, 'alerts.isRead': 1 });
stockPreviewSchema.index({ store: 1, lastStockUpdate: -1 });

// Virtual for total quantity
stockPreviewSchema.virtual('totalQuantity').get(function() {
  return this.availableQuantity + this.reservedQuantity + this.soldQuantity + this.damagedQuantity;
});

// Virtual for stock percentage
stockPreviewSchema.virtual('stockPercentage').get(function() {
  const total = this.totalQuantity;
  if (total === 0) return 0;
  return Math.round((this.availableQuantity / total) * 100);
});

// Virtual for isLowStock
stockPreviewSchema.virtual('isLowStock').get(function() {
  return this.availableQuantity <= this.lowStockThreshold && this.availableQuantity > 0;
});

// Virtual for isOutOfStock
stockPreviewSchema.virtual('isOutOfStock').get(function() {
  return this.availableQuantity <= this.outOfStockThreshold;
});

// Pre-save middleware to update stock status
stockPreviewSchema.pre('save', function(next) {
  // Update stock status based on available quantity
  if (this.availableQuantity <= this.outOfStockThreshold) {
    this.stockStatus = 'out_of_stock';
  } else if (this.availableQuantity <= this.lowStockThreshold) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
  }
  
  // Update last stock update timestamp
  this.lastStockUpdate = new Date();
  
  next();
});

// Static method to get stock summary for a store
stockPreviewSchema.statics.getStockSummary = function(storeId) {
  return this.aggregate([
    { $match: { store: mongoose.Types.ObjectId(storeId) } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalAvailableQuantity: { $sum: '$availableQuantity' },
        totalReservedQuantity: { $sum: '$reservedQuantity' },
        totalSoldQuantity: { $sum: '$soldQuantity' },
        totalDamagedQuantity: { $sum: '$damagedQuantity' },
        inStockProducts: {
          $sum: { $cond: [{ $eq: ['$stockStatus', 'in_stock'] }, 1, 0] }
        },
        lowStockProducts: {
          $sum: { $cond: [{ $eq: ['$stockStatus', 'low_stock'] }, 1, 0] }
        },
        outOfStockProducts: {
          $sum: { $cond: [{ $eq: ['$stockStatus', 'out_of_stock'] }, 1, 0] }
        },
        visibleProducts: {
          $sum: { $cond: ['$isVisible', 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get low stock products
stockPreviewSchema.statics.getLowStockProducts = function(storeId, limit = 10) {
  return this.find({
    store: storeId,
    stockStatus: { $in: ['low_stock', 'out_of_stock'] }
  })
  .populate('product', 'nameAr nameEn image category')
  .sort({ availableQuantity: 1 })
  .limit(limit);
};

// Static method to get stock alerts
stockPreviewSchema.statics.getStockAlerts = function(storeId, unreadOnly = false) {
  const match = { store: storeId };
  if (unreadOnly) {
    match['alerts.isRead'] = false;
  }
  
  return this.find(match)
    .populate('product', 'nameAr nameEn image')
    .sort({ 'alerts.createdAt': -1 });
};

// Instance method to add stock movement
stockPreviewSchema.methods.addStockMovement = function(movementData) {
  this.stockMovements.push(movementData);
  return this.save();
};

// Instance method to add alert
stockPreviewSchema.methods.addAlert = function(alertData) {
  this.alerts.push(alertData);
  return this.save();
};

// Instance method to mark alerts as read
stockPreviewSchema.methods.markAlertsAsRead = function() {
  this.alerts.forEach(alert => {
    alert.isRead = true;
  });
  return this.save();
};

// Instance method to update stock quantities
stockPreviewSchema.methods.updateStock = function(updates) {
  if (updates.availableQuantity !== undefined) {
    this.availableQuantity = updates.availableQuantity;
  }
  if (updates.reservedQuantity !== undefined) {
    this.reservedQuantity = updates.reservedQuantity;
  }
  if (updates.soldQuantity !== undefined) {
    this.soldQuantity = updates.soldQuantity;
  }
  if (updates.damagedQuantity !== undefined) {
    this.damagedQuantity = updates.damagedQuantity;
  }
  
  return this.save();
};

module.exports = mongoose.model('StockPreview', stockPreviewSchema); 