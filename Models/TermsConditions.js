const mongoose = require('mongoose');

const termsConditionsSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    default: 'Terms & Conditions'
  },
  htmlContent: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'ar', 'fr', 'es']
  },
  category: {
    type: String,
    default: 'general',
    enum: ['general', 'privacy', 'shipping', 'returns', 'payment', 'custom']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for performance
termsConditionsSchema.index({ store: 1, isActive: 1 });
termsConditionsSchema.index({ store: 1, language: 1 });

module.exports = mongoose.model('TermsConditions', termsConditionsSchema); 