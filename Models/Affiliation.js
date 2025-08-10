const mongoose = require('mongoose');

const affiliationSchema = new mongoose.Schema({
  // Store reference for isolation
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  
  // User reference for authentication
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Affiliate personal information
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
  
  // Affiliate business information
  percent: {
    type: Number,
    required: [true, 'Commission percentage is required'],
    min: [0, 'Commission percentage cannot be negative'],
    max: [100, 'Commission percentage cannot exceed 100%']
  },
  
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
    default: 'Pending'
  },
  
  // Affiliate link and tracking
  affiliateCode: {
    type: String,
    unique: true,
    required: [true, 'Affiliate code is required'],
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{6,10}$/, 'Affiliate code must be 6-10 alphanumeric characters']
  },
  
  affiliateLink: {
    type: String,
    required: [true, 'Affiliate link is required'],
    trim: true
  },
  
  // Performance tracking
  totalSales: {
    type: Number,
    default: 0,
    min: [0, 'Total sales cannot be negative']
  },
  
  totalCommission: {
    type: Number,
    default: 0,
    min: [0, 'Total commission cannot be negative']
  },
  
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, 'Total paid cannot be negative']
  },
  
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  
  // Statistics
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  
  totalCustomers: {
    type: Number,
    default: 0,
    min: [0, 'Total customers cannot be negative']
  },
  
  conversionRate: {
    type: Number,
    default: 0,
    min: [0, 'Conversion rate cannot be negative'],
    max: [100, 'Conversion rate cannot exceed 100%']
  },
  
  // Tracking information
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  registrationDate: {
    type: Date,
    default: Date.now
  },
  
  // Bank information for payments
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
  
  // Settings and preferences
  settings: {
    autoPayment: {
      type: Boolean,
      default: false
    },
    paymentThreshold: {
      type: Number,
      default: 100,
      min: [0, 'Payment threshold cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'cash', 'check'],
      default: 'bank_transfer'
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
affiliationSchema.index({ store: 1, email: 1 }, { unique: true });
affiliationSchema.index({ store: 1, affiliateCode: 1 }, { unique: true });
affiliationSchema.index({ store: 1, status: 1 });
affiliationSchema.index({ store: 1, 'bankInfo.iban': 1 });
affiliationSchema.index({ store: 1, lastActivity: -1 });
affiliationSchema.index({ store: 1, totalSales: -1 });
affiliationSchema.index({ store: 1, userId: 1 }, { unique: true });

// Virtual for full name
affiliationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for remaining balance
affiliationSchema.virtual('remainingBalance').get(function() {
  return this.totalCommission - this.totalPaid;
});

// Virtual for commission rate as percentage
affiliationSchema.virtual('commissionRate').get(function() {
  return `${this.percent}%`;
});

// Virtual for performance score
affiliationSchema.virtual('performanceScore').get(function() {
  if (this.totalSales === 0) return 0;
  return Math.round((this.totalOrders / this.totalSales) * 100);
});

// Pre-save middleware to generate affiliate code if not provided
affiliationSchema.pre('save', function(next) {
  if (!this.affiliateCode) {
    this.affiliateCode = generateAffiliateCode();
  }
  
  if (!this.affiliateLink) {
    this.affiliateLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ref/${this.affiliateCode}`;
  }
  
  // Update balance
  this.balance = this.totalCommission - this.totalPaid;
  
  // Update conversion rate
  if (this.totalSales > 0) {
    this.conversionRate = Math.round((this.totalOrders / this.totalSales) * 100);
  }
  
  next();
});

// Static method to generate unique affiliate code
affiliationSchema.statics.generateUniqueAffiliateCode = async function() {
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = generateAffiliateCode();
    const existing = await this.findOne({ affiliateCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
};

// Static method to get affiliate statistics for a store
affiliationSchema.statics.getAffiliateStats = function(storeId) {
  return this.aggregate([
    { $match: { store: mongoose.Types.ObjectId(storeId) } },
    {
      $group: {
        _id: null,
        totalAffiliates: { $sum: 1 },
        activeAffiliates: {
          $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
        },
        totalSales: { $sum: '$totalSales' },
        totalCommission: { $sum: '$totalCommission' },
        totalPaid: { $sum: '$totalPaid' },
        totalBalance: { $sum: '$balance' },
        totalOrders: { $sum: '$totalOrders' },
        totalCustomers: { $sum: '$totalCustomers' },
        averageCommission: { $avg: '$percent' }
      }
    }
  ]);
};

// Static method to get top performing affiliates
affiliationSchema.statics.getTopAffiliates = function(storeId, limit = 10) {
  return this.find({ store: storeId })
    .sort({ totalSales: -1 })
    .limit(limit)
    .select('firstName lastName email totalSales totalCommission balance status');
};

// Instance method to update sales and commission
affiliationSchema.methods.updateSales = function(salesAmount, orderId) {
  this.totalSales += salesAmount;
  this.totalOrders += 1;
  this.totalCommission += (salesAmount * this.percent / 100);
  this.balance = this.totalCommission - this.totalPaid;
  this.lastActivity = new Date();
  
  return this.save();
};

// Instance method to process payment
affiliationSchema.methods.processPayment = function(paymentAmount, paymentMethod, reference) {
  if (paymentAmount > this.balance) {
    throw new Error('Payment amount exceeds available balance');
  }
  
  this.totalPaid += paymentAmount;
  this.balance = this.totalCommission - this.totalPaid;
  this.lastActivity = new Date();
  
  return this.save();
};

// Instance method to verify affiliate
affiliationSchema.methods.verify = function(verifiedBy) {
  this.isVerified = true;
  this.verificationDate = new Date();
  this.verifiedBy = verifiedBy;
  this.status = 'Active';
  
  return this.save();
};

// Helper function to generate affiliate code
function generateAffiliateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = mongoose.model('Affiliation', affiliationSchema); 