const mongoose = require('mongoose');

const productSpecificationSchema = new mongoose.Schema({
  descriptionAr: {
    type: String,
    required: [true, 'Arabic description is required'],
    trim: true,
    maxlength: [100, 'Arabic description cannot exceed 100 characters']
  },
  descriptionEn: {
    type: String,
    required: [true, 'English description is required'],
    trim: true,
    maxlength: [100, 'English description cannot exceed 100 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false // جعل التصنيف اختياري
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Product specification store is required']
  }
}, {
  timestamps: true
});

// Create index for search functionality
productSpecificationSchema.index({
  descriptionAr: 'text',
  descriptionEn: 'text'
});

// Create index for category
productSpecificationSchema.index({ category: 1 });

// Create index for store isolation
productSpecificationSchema.index({ store: 1 });
productSpecificationSchema.index({ store: 1, category: 1 });

module.exports = mongoose.model('ProductSpecification', productSpecificationSchema); 