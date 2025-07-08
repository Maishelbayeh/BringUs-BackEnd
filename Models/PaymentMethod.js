const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  // Store association for isolation
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Basic information
  titleAr: {
    type: String,
    required: [true, 'Arabic title is required'],
    trim: true,
    maxlength: [100, 'Arabic title cannot exceed 100 characters']
  },
  
  titleEn: {
    type: String,
    required: [true, 'English title is required'],
    trim: true,
    maxlength: [100, 'English title cannot exceed 100 characters']
  },
  
  // Description
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
  
  // Method type
  methodType: {
    type: String,
    required: [true, 'Method type is required'],
    enum: ['cash', 'card', 'digital_wallet', 'bank_transfer', 'other'],
    default: 'other'
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
  
  // Financial settings
  processingFee: {
    type: Number,
    default: 0,
    min: [0, 'Processing fee cannot be negative'],
    max: [100, 'Processing fee cannot exceed 100%']
  },
  
  minimumAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum amount cannot be negative']
  },
  
  maximumAmount: {
    type: Number,
    default: 100000,
    min: [0, 'Maximum amount cannot be negative']
  },
  
  // Supported currencies
  supportedCurrencies: [{
    type: String,
    trim: true,
    uppercase: true,
    minlength: [3, 'Currency code must be at least 3 characters'],
    maxlength: [3, 'Currency code must be at most 3 characters']
  }],
  
  // Logo and branding
  logoUrl: {
    type: String,
    trim: true
  },
  
  // Additional settings
  requiresCardNumber: {
    type: Boolean,
    default: false
  },
  
  requiresExpiryDate: {
    type: Boolean,
    default: false
  },
  
  requiresCVV: {
    type: Boolean,
    default: false
  },
  
  // Priority for sorting
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority cannot be negative']
  },
  
  // Configuration for specific payment providers
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Create indexes for store isolation and performance
paymentMethodSchema.index({ store: 1 });
paymentMethodSchema.index({ store: 1, isActive: 1 });
paymentMethodSchema.index({ store: 1, isDefault: 1 });
paymentMethodSchema.index({ store: 1, methodType: 1 });
paymentMethodSchema.index({ store: 1, priority: 1 });

// Ensure only one default method per store
paymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Remove default from other methods in the same store
    await this.constructor.updateMany(
      { store: this.store, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Virtual for full title
paymentMethodSchema.virtual('title').get(function() {
  return {
    ar: this.titleAr,
    en: this.titleEn
  };
});

// Virtual for full description
paymentMethodSchema.virtual('description').get(function() {
  return {
    ar: this.descriptionAr,
    en: this.descriptionEn
  };
});

// Ensure virtuals are included in JSON
paymentMethodSchema.set('toJSON', { virtuals: true });
paymentMethodSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema); 