const mongoose = require('mongoose');

const deliveryMethodSchema = new mongoose.Schema({
  // Store association for isolation
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Location information
  locationAr: {
    type: String,
    required: [true, 'Arabic location name is required'],
    trim: true,
    maxlength: [100, 'Arabic location name cannot exceed 100 characters']
  },
  
  locationEn: {
    type: String,
    required: [true, 'English location name is required'],
    trim: true,
    maxlength: [100, 'English location name cannot exceed 100 characters']
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Delivery price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price cannot exceed 10000']
  },
  
  // Contact information
  whatsappNumber: {
    type: String,
    required: [true, 'WhatsApp number is required'],
    trim: true
  },
  
  // Status and settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Additional settings
  estimatedDays: {
    type: Number,
    default: 1,
    min: [1, 'Estimated days must be at least 1'],
    max: [30, 'Estimated days cannot exceed 30']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  descriptionAr: {
    type: String,
    trim: true,
    maxlength: [500, 'Arabic description cannot exceed 500 characters']
  },
  
  descriptionEn: {
    type: String,
    trim: true,
    maxlength: [500, 'English description cannot exceed 500 characters']
  },
  
  // Priority for sorting
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority cannot be negative']
  }
}, {
  timestamps: true
});

// Create indexes for store isolation and performance
deliveryMethodSchema.index({ store: 1 });
deliveryMethodSchema.index({ store: 1, isActive: 1 });
deliveryMethodSchema.index({ store: 1, isDefault: 1 });
deliveryMethodSchema.index({ store: 1, priority: 1 });

// Ensure only one default method per store and prevent inactive default
deliveryMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Remove default from other methods in the same store
    await this.constructor.updateMany(
      { store: this.store, _id: { $ne: this._id } },
      { isDefault: false }
    );
    
    // Ensure default method is always active
    if (!this.isActive) {
      this.isActive = true;
    }
  }
  
  // Prevent setting default method as inactive
  if (this.isDefault && !this.isActive) {
    const error = new Error('Default delivery method cannot be inactive');
    return next(error);
  }
  
  // Remove default status from inactive methods
  if (!this.isActive && this.isDefault) {
    this.isDefault = false;
  }
  
  next();
});

// Virtual for full location name
deliveryMethodSchema.virtual('location').get(function() {
  return {
    ar: this.locationAr,
    en: this.locationEn
  };
});

// Ensure virtuals are included in JSON
deliveryMethodSchema.set('toJSON', { virtuals: true });
deliveryMethodSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DeliveryMethod', deliveryMethodSchema); 