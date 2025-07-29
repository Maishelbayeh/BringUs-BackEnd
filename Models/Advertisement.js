const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // HTML content with inline CSS
  htmlContent: {
    type: String,
    required: false,
    trim: true,
    maxlength: 5000 // Increased for HTML content
  },
  // Background image URL (optional)
  backgroundImageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Background image URL must be a valid URL'
    }
  },
  // Position on page (top, bottom, sidebar, etc.)
  position: {
    type: String,
    enum: ['top', 'bottom', 'sidebar', 'popup', 'banner'],
    default: 'top'
  },
  // Display settings
  isActive: {
    type: Boolean,
    default: true
  },
  // Schedule settings
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  // Priority for multiple ads (higher number = higher priority)
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  // Click tracking
  clickCount: {
    type: Number,
    default: 0
  },
  // View tracking
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure only one active advertisement per store
advertisementSchema.index({ store: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// Index for performance
advertisementSchema.index({ store: 1, position: 1 });
advertisementSchema.index({ store: 1, priority: -1 });
advertisementSchema.index({ store: 1, startDate: -1 });
advertisementSchema.index({ store: 1, endDate: -1 });

// Virtual for checking if advertisement is currently active based on dates
advertisementSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  const isInDateRange = (!this.startDate || now >= this.startDate) && 
                       (!this.endDate || now <= this.endDate);
  return this.isActive && isInDateRange;
});

// Pre-save middleware to ensure only one active advertisement per store
advertisementSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    try {
      // Deactivate all other advertisements for this store
      await this.constructor.updateMany(
        { 
          store: this.store, 
          _id: { $ne: this._id },
          isActive: true 
        },
        { isActive: false }
      );
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Custom validator: either htmlContent or backgroundImageUrl must be present
advertisementSchema.pre('validate', function(next) {
  if (!this.htmlContent && !this.backgroundImageUrl) {
    this.invalidate('htmlContent', 'Either htmlContent or backgroundImageUrl is required.');
    this.invalidate('backgroundImageUrl', 'Either htmlContent or backgroundImageUrl is required.');
  }
  next();
});

// Static method to get active advertisement for a store
advertisementSchema.statics.getActiveAdvertisement = function(storeId) {
  return this.findOne({
    store: storeId,
    isActive: true,
    $or: [
      { startDate: { $lte: new Date() } },
      { startDate: { $exists: false } }
    ],
    $or: [
      { endDate: { $gte: new Date() } },
      { endDate: { $exists: false } }
    ]
  }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get all advertisements for a store with pagination
advertisementSchema.statics.getAdvertisementsByStore = function(storeId, options = {}) {
  const { page = 1, limit = 10, isActive, position } = options;
  const skip = (page - 1) * limit;
  
  let query = { store: storeId };
  if (isActive !== undefined) query.isActive = isActive;
  if (position) query.position = position;
  
  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Instance method to increment click count
advertisementSchema.methods.incrementClick = function() {
  this.clickCount += 1;
  return this.save();
};

// Instance method to increment view count
advertisementSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method to activate advertisement (deactivates others)
advertisementSchema.methods.activate = async function() {
  // Deactivate all other advertisements for this store
  await this.constructor.updateMany(
    { 
      store: this.store, 
      _id: { $ne: this._id },
      isActive: true 
    },
    { isActive: false }
  );
  
  // Activate this advertisement
  this.isActive = true;
  return this.save();
};

module.exports = mongoose.model('Advertisement', advertisementSchema); 