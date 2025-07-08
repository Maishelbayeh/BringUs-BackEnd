const mongoose = require('mongoose');

const wholesalerSchema = new mongoose.Schema({
  // Store reference for isolation
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  
  // Personal information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^[+]?[\d\s\-\(\)]+$/, 'Please enter a valid mobile number']
  },
  
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  
  // Business information
  discount: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100%']
  },
  
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
    default: 'Active'
  },
  
  // Business details
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  
  businessLicense: {
    type: String,
    trim: true,
    maxlength: [50, 'Business license cannot exceed 50 characters']
  },
  
  taxNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Tax number cannot exceed 50 characters']
  },
  
  // Contact information
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  
  // Bank information (optional)
  bankInfo: {
    bankName: {
      type: String,
      trim: true,
      maxlength: [100, 'Bank name cannot exceed 100 characters']
    },
    accountNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Account number cannot exceed 50 characters']
    },
    iban: {
      type: String,
      trim: true,
      maxlength: [50, 'IBAN cannot exceed 50 characters']
    },
    swiftCode: {
      type: String,
      trim: true,
      maxlength: [20, 'SWIFT code cannot exceed 20 characters']
    }
  },
  
  // Settings and preferences (optional)
  settings: {
    autoApproval: {
      type: Boolean,
      default: false
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: [0, 'Credit limit cannot be negative']
    },
    paymentTerms: {
      type: Number,
      default: 30,
      min: [0, 'Payment terms cannot be negative']
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Notes and comments
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationDate: {
    type: Date
  },
  
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Last activity tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
wholesalerSchema.index({ store: 1, email: 1 }, { unique: true });
wholesalerSchema.index({ store: 1, status: 1 });
wholesalerSchema.index({ store: 1, 'bankInfo.iban': 1 });
wholesalerSchema.index({ store: 1, lastActivity: -1 });
wholesalerSchema.index({ store: 1, discount: -1 });

// Virtual for full name
wholesalerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for discount rate as percentage
wholesalerSchema.virtual('discountRate').get(function() {
  return `${this.discount}%`;
});



// Static method to get wholesaler statistics for a store
wholesalerSchema.statics.getWholesalerStats = function(storeId) {
  return this.aggregate([
    { $match: { store: storeId } },
    {
      $group: {
        _id: null,
        totalWholesalers: { $sum: 1 },
        activeWholesalers: {
          $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
        },
        averageDiscount: { $avg: '$discount' },
        verifiedWholesalers: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get top wholesalers by discount
wholesalerSchema.statics.getTopWholesalers = function(storeId, limit = 10) {
  return this.find({ store: storeId })
    .sort({ discount: -1 })
    .limit(limit)
    .select('firstName lastName email discount status isVerified');
};

// Instance method to verify wholesaler
wholesalerSchema.methods.verify = function(verifiedBy) {
  this.isVerified = true;
  this.verificationDate = new Date();
  this.verifiedBy = verifiedBy;
  this.status = 'Active';
  
  return this.save();
};

// Instance method to update status
wholesalerSchema.methods.updateStatus = function(status) {
  this.status = status;
  this.lastActivity = new Date();
  
  return this.save();
};

module.exports = mongoose.model('Wholesaler', wholesalerSchema); 