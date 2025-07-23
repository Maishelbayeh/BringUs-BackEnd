const mongoose = require('mongoose');

const affiliatePaymentSchema = new mongoose.Schema({
  // Store reference for isolation
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  
  // Affiliate reference
  affiliate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Affiliation',
    required: [true, 'Affiliate is required']
  },
  
  // Payment details
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than 0']
  },
  
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'cash', 'check', 'credit_card'],
    required: [true, 'Payment method is required']
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  reference: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  
  transactionId: {
    type: String,
    trim: true,
    maxlength: [100, 'Transaction ID cannot exceed 100 characters']
  },
  
  // Payment dates
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required']
  },
  
  processedDate: {
    type: Date
  },
  
  // Bank transfer details (if applicable)
  bankTransfer: {
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
    },
    beneficiaryName: {
      type: String,
      trim: true,
      maxlength: [100, 'Beneficiary name cannot exceed 100 characters']
    }
  },
  
  // PayPal details (if applicable)
  paypal: {
    paypalEmail: {
      type: String,
      trim: true,
      maxlength: [100, 'PayPal email cannot exceed 100 characters']
    },
    paypalTransactionId: {
      type: String,
      trim: true,
      maxlength: [100, 'PayPal transaction ID cannot exceed 100 characters']
    }
  },
  
  // Payment notes and description
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Processing information
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Processed by user is required']
  },
  
  // Balance tracking
  previousBalance: {
    type: Number,
    required: [true, 'Previous balance is required'],
    min: [0, 'Previous balance cannot be negative']
  },
  
  newBalance: {
    type: Number,
    required: [true, 'New balance is required'],
    min: [0, 'New balance cannot be negative']
  },
  
  // Commission period (optional)
  commissionPeriod: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    totalCommission: {
      type: Number,
      min: [0, 'Total commission cannot be negative']
    }
  },
  
  // Attachments and documents
  attachments: [{
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'File name cannot exceed 200 characters']
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true
    },
    fileType: {
      type: String,
      required: true,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Audit trail
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'processed', 'completed', 'failed', 'cancelled', 'updated'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Audit notes cannot exceed 500 characters']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
affiliatePaymentSchema.index({ store: 1, affiliate: 1 });
affiliatePaymentSchema.index({ store: 1, paymentStatus: 1 });
affiliatePaymentSchema.index({ store: 1, paymentDate: -1 });
affiliatePaymentSchema.index({ store: 1, reference: 1 }, { unique: true });
affiliatePaymentSchema.index({ store: 1, transactionId: 1 });
affiliatePaymentSchema.index({ store: 1, 'bankTransfer.iban': 1 });

// Virtual for payment status display
affiliatePaymentSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled'
  };
  return statusMap[this.paymentStatus] || this.paymentStatus;
});

// Virtual for payment method display
affiliatePaymentSchema.virtual('methodDisplay').get(function() {
  const methodMap = {
    bank_transfer: 'Bank Transfer',
    paypal: 'PayPal',
    cash: 'Cash',
    check: 'Check',
    credit_card: 'Credit Card'
  };
  return methodMap[this.paymentMethod] || this.paymentMethod;
});

// Virtual for formatted amount
affiliatePaymentSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Pre-save middleware to generate reference if not provided
affiliatePaymentSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = generatePaymentReference();
  }
  
  // Update new balance
  this.newBalance = this.previousBalance - this.amount;
  
  // Add to audit trail if this is a new payment
  if (this.isNew) {
    this.auditTrail.push({
      action: 'created',
      performedBy: this.processedBy,
      notes: 'Payment created'
    });
  }
  
  next();
});

// Static method to generate unique payment reference
affiliatePaymentSchema.statics.generateUniqueReference = async function() {
  let reference;
  let isUnique = false;
  
  while (!isUnique) {
    reference = generatePaymentReference();
    const existing = await this.findOne({ reference: reference });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return reference;
};

// Static method to get payment statistics for a store
affiliatePaymentSchema.statics.getPaymentStats = function(storeId) {
  return this.aggregate([
    { $match: { store: mongoose.Types.ObjectId(storeId) } },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] }
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$amount', 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
        },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0] }
        },
        averagePayment: { $avg: '$amount' }
      }
    }
  ]);
};

// Static method to get payment statistics by affiliate
affiliatePaymentSchema.statics.getAffiliatePaymentStats = function(storeId, affiliateId) {
  return this.aggregate([
    { 
      $match: { 
        store: mongoose.Types.ObjectId(storeId),
        affiliate: mongoose.Types.ObjectId(affiliateId)
      } 
    },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] }
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$amount', 0] }
        },
        lastPaymentDate: { $max: '$paymentDate' },
        averagePayment: { $avg: '$amount' }
      }
    }
  ]);
};

// Static method to get recent payments
affiliatePaymentSchema.statics.getRecentPayments = function(storeId, limit = 10) {
  return this.find({ store: storeId })
    .populate('affiliate', 'firstName lastName email')
    .populate('processedBy', 'firstName lastName')
    .sort({ paymentDate: -1 })
    .limit(limit);
};

// Instance method to process payment
affiliatePaymentSchema.methods.processPayment = function(processedBy, notes = '') {
  this.paymentStatus = 'processing';
  this.processedDate = new Date();
  
  this.auditTrail.push({
    action: 'processed',
    performedBy: processedBy,
    notes: notes || 'Payment processing started'
  });
  
  return this.save();
};

// Instance method to complete payment
affiliatePaymentSchema.methods.completePayment = function(processedBy, transactionId = '', notes = '') {
  this.paymentStatus = 'completed';
  this.processedDate = new Date();
  if (transactionId) {
    this.transactionId = transactionId;
  }
  
  this.auditTrail.push({
    action: 'completed',
    performedBy: processedBy,
    notes: notes || 'Payment completed successfully'
  });
  
  return this.save();
};

// Instance method to fail payment
affiliatePaymentSchema.methods.failPayment = function(processedBy, notes = '') {
  this.paymentStatus = 'failed';
  
  this.auditTrail.push({
    action: 'failed',
    performedBy: processedBy,
    notes: notes || 'Payment failed'
  });
  
  return this.save();
};

// Instance method to cancel payment
affiliatePaymentSchema.methods.cancelPayment = function(processedBy, notes = '') {
  this.paymentStatus = 'cancelled';
  
  this.auditTrail.push({
    action: 'cancelled',
    performedBy: processedBy,
    notes: notes || 'Payment cancelled'
  });
  
  return this.save();
};

// Helper function to generate payment reference
function generatePaymentReference() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${timestamp}-${random}`;
}

module.exports = mongoose.model('AffiliatePayment', affiliatePaymentSchema); 