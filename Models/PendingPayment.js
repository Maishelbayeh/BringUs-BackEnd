const mongoose = require('mongoose');

/**
 * PendingPayment Model
 * Tracks payment transactions that are waiting to be completed
 * Used by background worker to auto-activate subscriptions
 */
const pendingPaymentSchema = new mongoose.Schema({
  // Store reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required'],
    index: true
  },
  
  // Payment reference from gateway
  reference: {
    type: String,
    required: [true, 'Payment reference is required'],
    unique: true,
    trim: true,
    index: true
  },
  
  // Plan being purchased
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: [true, 'Plan ID is required']
  },
  
  // Payment details
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  
  currency: {
    type: String,
    default: 'ILS'
  },
  
  // Customer info
  customerEmail: {
    type: String,
    trim: true
  },
  
  customerName: {
    type: String,
    trim: true
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'abandoned', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Tracking
  checkAttempts: {
    type: Number,
    default: 0
  },
  
  lastCheckedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // Metadata from payment
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Activation details (when subscription is activated)
  subscriptionActivated: {
    type: Boolean,
    default: false
  },
  
  activatedAt: {
    type: Date,
    default: null
  },
  
  activationSource: {
    type: String,
    enum: ['webhook', 'polling', 'verify-backup', 'manual'],
    default: null
  },
  
  // Error tracking
  lastError: {
    type: String,
    default: null
  },
  
  errorCount: {
    type: Number,
    default: 0
  },
  
  // Expiry - auto-delete after 24 hours
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - MongoDB will auto-delete
  }
  
}, {
  timestamps: true
});

// Indexes for efficient queries
pendingPaymentSchema.index({ status: 1, expiresAt: 1 });
pendingPaymentSchema.index({ store: 1, status: 1 });
pendingPaymentSchema.index({ createdAt: 1 });

// Instance method to mark as completed
pendingPaymentSchema.methods.markAsCompleted = function(source = 'webhook') {
  this.status = 'completed';
  this.subscriptionActivated = true;
  this.completedAt = new Date();
  this.activatedAt = new Date();
  this.activationSource = source;
  return this.save();
};

// Instance method to mark as failed
pendingPaymentSchema.methods.markAsFailed = function(error = '') {
  this.status = 'failed';
  this.completedAt = new Date();
  this.lastError = error;
  this.errorCount += 1;
  return this.save();
};

// Instance method to mark as abandoned
pendingPaymentSchema.methods.markAsAbandoned = function() {
  this.status = 'abandoned';
  this.completedAt = new Date();
  return this.save();
};

// Instance method to increment check attempts
pendingPaymentSchema.methods.incrementCheckAttempts = function() {
  this.checkAttempts += 1;
  this.lastCheckedAt = new Date();
  return this.save();
};

// Static method to get pending payments for polling
pendingPaymentSchema.statics.getPendingForPolling = function() {
  return this.find({
    status: 'pending',
    expiresAt: { $gt: new Date() }, // Not expired
    checkAttempts: { $lt: 50 } // Max 50 attempts (50 * 10 sec = ~8 minutes)
  }).sort({ createdAt: 1 }); // Oldest first
};

// Static method to cleanup old completed payments
pendingPaymentSchema.statics.cleanupOldPayments = function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.deleteMany({
    status: { $in: ['completed', 'failed', 'abandoned'] },
    completedAt: { $lt: oneDayAgo }
  });
};

module.exports = mongoose.model('PendingPayment', pendingPaymentSchema);

