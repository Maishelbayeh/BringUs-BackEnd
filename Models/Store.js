const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  nameAr: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  nameEn: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  descriptionAr: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  descriptionEn: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  logo: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    }
  },
  slug: {
    type: String,
    unique: true,
    required: [true, 'Domain is required'],
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Subscription fields
  subscription: {
    isSubscribed: {
      type: Boolean,
      default: false
    },
    plan: {
      type: String,
      enum: ['free', 'monthly', 'quarterly', 'semi_annual', 'annual'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    lastPaymentDate: {
      type: Date,
      default: null
    },
    nextPaymentDate: {
      type: Date,
      default: null
    },
    trialEndDate: {
      type: Date,
      default: function() {
        // Default trial period: 14 days from creation
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        return trialEnd;
      }
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'cash'],
      default: null
    },
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  settings: {
    currency: {
      type: String,
      default: 'ILS'
    },
    mainColor: {
      type: String,
      default: '#000000'
    },
  
    language: {
      type: String,
      default: 'en'
    },
    storeDiscount: {
      type: Number,
      default: 0
    },
   
    timezone: {
      type: String,
      default: 'UTC'
    },
    taxRate: {
      type: Number,
      default: 0
    },
    shippingEnabled: {
      type: Boolean,
      default: true
    },

    storeSocials: {
      type:   Object,
      default: {
        facebook: String,
        instagram: String,
        twitter: String,
        youtube: String,
        linkedin: String,
        telegram: String,
        snapchat: String,
        pinterest: String,
        tiktok: String,
      }
    }
  },
  //whatsapp number
  whatsappNumber: {
    type: String,
    required: [false, 'WhatsApp number is required']
  },
  contact: {
    email: {
      type: String,
      required: [true, 'Contact email is required']
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  }
}, {
  timestamps: true
});

// Ensure unique slug
storeSchema.index({ slug: 1 }, { unique: true });

// Add index for active stores by slug
storeSchema.index({ slug: 1, status: 1 });

// Add indexes for subscription queries
storeSchema.index({ 'subscription.endDate': 1 });
storeSchema.index({ 'subscription.trialEndDate': 1 });
storeSchema.index({ 'subscription.isSubscribed': 1, status: 1 });

// Virtual for checking if subscription is active
storeSchema.virtual('isSubscriptionActive').get(function() {
  if (!this.subscription.isSubscribed) {
    // Check trial period
    return this.subscription.trialEndDate && new Date() < this.subscription.trialEndDate;
  }
  
  // Check paid subscription
  return this.subscription.endDate && new Date() < this.subscription.endDate;
});

// Virtual for checking if trial is expired
storeSchema.virtual('isTrialExpired').get(function() {
  return this.subscription.trialEndDate && new Date() > this.subscription.trialEndDate;
});

// Virtual for days until trial expires
storeSchema.virtual('daysUntilTrialExpires').get(function() {
  if (!this.subscription.trialEndDate) return null;
  const now = new Date();
  const trialEnd = new Date(this.subscription.trialEndDate);
  const diffTime = trialEnd - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for days until subscription expires
storeSchema.virtual('daysUntilSubscriptionExpires').get(function() {
  if (!this.subscription.endDate) return null;
  const now = new Date();
  const subEnd = new Date(this.subscription.endDate);
  const diffTime = subEnd - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to check if store should be deactivated
storeSchema.methods.shouldBeDeactivated = function() {
  // If subscribed, check subscription end date
  if (this.subscription.isSubscribed) {
    return this.subscription.endDate && new Date() > this.subscription.endDate;
  }
  
  // If not subscribed, check trial end date (14 days limit)
  return this.subscription.trialEndDate && new Date() > this.subscription.trialEndDate;
};

// Method to activate subscription
storeSchema.methods.activateSubscription = function(plan, durationInDays, amount = 0) {
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationInDays);
  
  this.subscription.isSubscribed = true;
  this.subscription.plan = plan;
  this.subscription.startDate = now;
  this.subscription.endDate = endDate;
  this.subscription.lastPaymentDate = now;
  this.subscription.nextPaymentDate = endDate;
  this.subscription.amount = amount;
  this.status = 'active';
  
  return this.save();
};

// Method to extend trial period
storeSchema.methods.extendTrial = function(daysToAdd) {
  const currentTrialEnd = this.subscription.trialEndDate || new Date();
  currentTrialEnd.setDate(currentTrialEnd.getDate() + daysToAdd);
  this.subscription.trialEndDate = currentTrialEnd;
  return this.save();
};

storeSchema.pre('remove', async function(next) {
  try {
    await mongoose.model('Like').deleteMany({ store: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Store', storeSchema); 