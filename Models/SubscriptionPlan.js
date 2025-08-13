const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [100, 'Plan name cannot exceed 100 characters']
  },
  nameAr: {
    type: String,
    required: [true, 'Plan name in Arabic is required'],
    trim: true,
    maxlength: [100, 'Plan name in Arabic cannot exceed 100 characters']
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
  type: {
    type: String,
    enum: ['free', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom'],
    required: [true, 'Plan type is required']
  },
  duration: {
    type: Number, // Duration in days
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 day']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'ILS', 'SAR', 'AED', 'EGP']
  },
  features: [{
    name: {
      type: String,
      required: true
    },
    nameAr: {
      type: String,
      required: true
    },
    description: String,
    descriptionAr: String,
    included: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  maxProducts: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  maxOrders: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  maxUsers: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  storageLimit: {
    type: Number, // in MB
    default: -1 // -1 means unlimited
  },
  customFeatures: {
    type: Object,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
subscriptionPlanSchema.index({ type: 1, isActive: 1 });
subscriptionPlanSchema.index({ sortOrder: 1 });
subscriptionPlanSchema.index({ isPopular: 1, isActive: 1 });

// Virtual for formatted price
subscriptionPlanSchema.virtual('formattedPrice').get(function() {
  return `${this.price} ${this.currency}`;
});

// Virtual for duration in human readable format
subscriptionPlanSchema.virtual('durationText').get(function() {
  if (this.duration === 30) return '1 Month';
  if (this.duration === 90) return '3 Months';
  if (this.duration === 180) return '6 Months';
  if (this.duration === 365) return '1 Year';
  return `${this.duration} Days`;
});

subscriptionPlanSchema.virtual('durationTextAr').get(function() {
  if (this.duration === 30) return 'شهر واحد';
  if (this.duration === 90) return '3 أشهر';
  if (this.duration === 180) return '6 أشهر';
  if (this.duration === 365) return 'سنة واحدة';
  return `${this.duration} يوم`;
});

// Method to check if plan is unlimited
subscriptionPlanSchema.methods.isUnlimited = function(feature) {
  const limits = {
    products: this.maxProducts,
    orders: this.maxOrders,
    users: this.maxUsers,
    storage: this.storageLimit
  };
  return limits[feature] === -1;
};

// Method to get plan summary
subscriptionPlanSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    nameAr: this.nameAr,
    type: this.type,
    duration: this.duration,
    durationText: this.durationText,
    durationTextAr: this.durationTextAr,
    price: this.price,
    currency: this.currency,
    formattedPrice: this.formattedPrice,
    isActive: this.isActive,
    isPopular: this.isPopular,
    features: this.features.filter(f => f.included).map(f => ({
      name: f.name,
      nameAr: f.nameAr
    }))
  };
};

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
