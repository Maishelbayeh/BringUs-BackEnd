const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  nameAr: {
    type: String,
    required: [true, 'Arabic name is required'],
    trim: true,
    maxlength: [50, 'Arabic name cannot exceed 50 characters']
  },
  nameEn: {
    type: String,
    required: [true, 'English name is required'],
    trim: true,
    maxlength: [50, 'English name cannot exceed 50 characters']
  },
  symbol: {
    type: String,
    required: [true, 'Unit symbol is required'],
    trim: true,
    maxlength: [10, 'Unit symbol cannot exceed 10 characters']
  },
  descriptionAr: {
    type: String,
    maxlength: [200, 'Arabic description cannot exceed 200 characters']
  },
  descriptionEn: {
    type: String,
    maxlength: [200, 'English description cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create index for search functionality
unitSchema.index({
  nameAr: 'text',
  nameEn: 'text',
  symbol: 'text'
});

module.exports = mongoose.model('Unit', unitSchema); 