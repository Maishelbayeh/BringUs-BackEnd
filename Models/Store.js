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
    required: false, // Will be generated automatically
    trim: true,
    lowercase: true
  },
  url: {
    type: String,
    trim: true
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

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null
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
        // Default trial period: 30 days from creation
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30);
        return trialEnd;
      }
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    referenceId: {
      type: String,
      default: null
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

  // Subscription history to track all activities
  subscriptionHistory: [{
    action: {
      type: String,
      enum: [
        'free_trial_extended',
        'free_trial_cancelled',
        'end_date_updated',
        'trial_started',
        'trial_extended', 
        'subscription_activated',
        'subscription_renewed',
        'subscription_cancelled',
        'subscription_expired',
        'payment_received',
        'payment_failed',
        'plan_changed',
        'amount_changed',
        'auto_renew_changed',
        'payment_method_changed',
        'store_deactivated',
        'store_reactivated',
        'auto_renewal_disabled',
        'auto_renewal_enabled'
      ],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    details: {
      type: Object,
      default: {}
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // null for system actions
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    previousState: {
      type: Object,
      default: null
    },
    newState: {
      type: Object,
      default: null
    }
  }],
  
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
    lahzaToken:{
      type: String,
      default: null
    },
    lahzaSecretKey:{
      type: String,
      default: null
    },

    storeSocials: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
      linkedin: String,
      telegram: String,
      snapchat: String,
      pinterest: String,
      tiktok: String
    }
  },
  //whatsapp number
  whatsappNumber: {
    type: String,
    required: false
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

// Pre-save middleware to generate slug from nameEn
storeSchema.pre('save', async function(next) {
  // Only generate slug if it's not already set or if nameEn has changed
  if (!this.slug || this.isModified('nameEn')) {
    // Generate slug from nameEn
    let generatedSlug = this.nameEn
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Ensure slug is not empty
    if (!generatedSlug) {
      generatedSlug = 'store-' + Date.now();
    }

    // Check if slug already exists and make it unique
    let finalSlug = generatedSlug;
    let counter = 1;
    const Store = this.constructor;
    
    while (await Store.findOne({ slug: finalSlug, _id: { $ne: this._id } })) {
      finalSlug = `${generatedSlug}-${counter}`;
      counter++;
    }

    this.slug = finalSlug;
  }
  next();
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

// Virtual for store URL
storeSchema.virtual('storeUrl').get(function() {
  const baseDomain = 'https://bringus-main.onrender.com';
  return `${baseDomain}/${this.slug}`;
});

// Method to generate store URL
storeSchema.methods.generateStoreUrl = function() {
  const baseDomain = 'https://bringus-main.onrender.com';
  return `${baseDomain}/${this.slug}`;
};

// Method to check if store should be deactivated
storeSchema.methods.shouldBeDeactivated = function() {
  // If subscribed, check subscription end date
  if (this.subscription.isSubscribed) {
    return this.subscription.endDate && new Date() > this.subscription.endDate;
  }
  
  // If not subscribed, check trial end date (30 days limit)
  return this.subscription.trialEndDate && new Date() > this.subscription.trialEndDate;
};

// Method to deactivate store when subscription/trial expires
storeSchema.methods.deactivateIfExpired = async function() {
  if (this.shouldBeDeactivated()) {
    const previousStatus = this.status;
    this.status = 'inactive';
    this.subscription.isSubscribed = false;
    
    // Add to subscription history
    await this.addSubscriptionHistory(
      'store_deactivated',
      'Store deactivated due to expired subscription/trial',
      {
        previousStatus,
        newStatus: 'inactive',
        reason: this.subscription.isSubscribed ? 'subscription_expired' : 'trial_expired'
      }
    );
    
    return true; // Store was deactivated
  }
  return false; // Store was not deactivated
};

// Method to reactivate store
storeSchema.methods.reactivateStore = async function(performedBy = null) {
  const previousStatus = this.status;
  this.status = 'active';
  
  // Add to subscription history
  await this.addSubscriptionHistory(
    'store_reactivated',
    'Store reactivated',
    {
      previousStatus,
      newStatus: 'active'
    },
    performedBy
  );
  
  return this.save();
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

// Method to add subscription history entry
storeSchema.methods.addSubscriptionHistory = function(action, description, details = {}, performedBy = null) {
  const historyEntry = {
    action,
    description,
    details,
    performedBy,
    performedAt: new Date()
  };
  
  this.subscriptionHistory.push(historyEntry);
  return this.save();
};

// Method to get subscription history with pagination
storeSchema.methods.getSubscriptionHistory = function(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const history = this.subscriptionHistory
    .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))
    .slice(skip, skip + limit);
  
  return {
    history,
    pagination: {
      page,
      limit,
      total: this.subscriptionHistory.length,
      pages: Math.ceil(this.subscriptionHistory.length / limit)
    }
  };
};

// Method to get recent subscription activities
storeSchema.methods.getRecentActivities = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.subscriptionHistory
    .filter(entry => new Date(entry.performedAt) >= cutoffDate)
    .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt));
};

// Method to get subscription statistics
storeSchema.methods.getSubscriptionStats = function() {
  const stats = {
    totalActions: this.subscriptionHistory.length,
    actionsByType: {},
    lastActivity: null,
    trialExtensions: 0,
    payments: 0,
    cancellations: 0
  };
  
  if (this.subscriptionHistory.length > 0) {
    stats.lastActivity = this.subscriptionHistory[this.subscriptionHistory.length - 1];
    
    this.subscriptionHistory.forEach(entry => {
      // Count by action type
      stats.actionsByType[entry.action] = (stats.actionsByType[entry.action] || 0) + 1;
      
      // Count specific actions
      if (entry.action === 'trial_extended') stats.trialExtensions++;
      if (entry.action === 'payment_received') stats.payments++;
      if (entry.action === 'subscription_cancelled') stats.cancellations++;
    });
  }
  
  return stats;
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