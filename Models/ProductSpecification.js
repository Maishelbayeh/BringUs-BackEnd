const mongoose = require('mongoose');

const productSpecificationSchema = new mongoose.Schema({
  titleAr: {
    type: String,
    required: [true, 'Arabic title is required'],
    trim: true,
    maxlength: [100, 'Arabic title cannot exceed 100 characters']
  },
  titleEn: {
    type: String,
    required: [true, 'English title is required'],
    trim: true,
    maxlength: [100, 'English title cannot exceed 100 characters']
  },
  values: [{
    valueAr: {
      type: String,
      required: [true, 'Arabic value is required'],
      trim: true,
      maxlength: [200, 'Arabic value cannot exceed 200 characters']
    },
    valueEn: {
      type: String,
      required: [true, 'English value is required'],
      trim: true,
      maxlength: [200, 'English value cannot exceed 200 characters']
    }
  }],
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
  titleAr: 'text',
  titleEn: 'text'
});

// Create index for category
productSpecificationSchema.index({ category: 1 });

// Create index for store isolation
productSpecificationSchema.index({ store: 1 });
productSpecificationSchema.index({ store: 1, category: 1 });

module.exports = mongoose.model('ProductSpecification', productSpecificationSchema); 