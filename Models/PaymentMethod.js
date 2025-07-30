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
    enum: ['cash', 'card', 'digital_wallet', 'bank_transfer', 'qr_code', 'other'],
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
  

  

  
  // Logo and branding
  logoUrl: {
    type: String,
    trim: true
  },
  
  // QR Code settings
  qrCode: {
    enabled: {
      type: Boolean,
      default: false
    },
    qrCodeUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(url) {
          if (!this.qrCode.enabled) return true;
          return url && url.length > 0;
        },
        message: 'QR Code URL is required when QR code is enabled'
      }
    },
    qrCodeImage: {
      type: String,
      trim: true
    },
    qrCodeData: {
      type: String,
      trim: true
    }
  },
  
  // Payment images (like reflect)
  paymentImages: [{
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    imageType: {
      type: String,
      enum: ['logo', 'banner', 'qr_code', 'payment_screenshot', 'other'],
      default: 'other'
    },
    altText: {
      type: String,
      trim: true,
      maxlength: [200, 'Alt text cannot exceed 200 characters']
    },

  }]
}, {
  timestamps: true
});

// Create indexes for store isolation and performance
paymentMethodSchema.index({ store: 1 });
paymentMethodSchema.index({ store: 1, isActive: 1 });
paymentMethodSchema.index({ store: 1, isDefault: 1 });
paymentMethodSchema.index({ store: 1, methodType: 1 });
paymentMethodSchema.index({ store: 1, 'qrCode.enabled': 1 });

// Ensure only one default method per store and prevent inactive default
paymentMethodSchema.pre('save', async function(next) {
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
    const error = new Error('Default payment method cannot be inactive');
    return next(error);
  }
  
  // Remove default status from inactive methods
  if (!this.isActive && this.isDefault) {
    this.isDefault = false;
  }
  
  // Validate QR code settings
  if (this.qrCode.enabled && !this.qrCode.qrCodeUrl && !this.qrCode.qrCodeData) {
    const error = new Error('QR Code URL or data is required when QR code is enabled');
    return next(error);
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

// Virtual for QR code info
paymentMethodSchema.virtual('qrCodeInfo').get(function() {
  if (!this.qrCode.enabled) return null;
  
  return {
    enabled: this.qrCode.enabled,
    url: this.qrCode.qrCodeUrl,
    image: this.qrCode.qrCodeImage,
    data: this.qrCode.qrCodeData
  };
});

// Virtual for payment images sorted by priority
paymentMethodSchema.virtual('sortedPaymentImages').get(function() {
  if (!this.paymentImages || this.paymentImages.length === 0) return [];
  
  return this.paymentImages.sort((a, b) => a.priority - b.priority);
});

// Ensure virtuals are included in JSON
paymentMethodSchema.set('toJSON', { virtuals: true });
paymentMethodSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema); 