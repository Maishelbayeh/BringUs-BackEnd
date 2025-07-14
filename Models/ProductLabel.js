const mongoose = require('mongoose');

const productLabelSchema = new mongoose.Schema({
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
  descriptionAr: {
    type: String,
    maxlength: [200, 'Arabic description cannot exceed 200 characters']
  },
  descriptionEn: {
    type: String,
    maxlength: [200, 'English description cannot exceed 200 characters']
  },
  color: {
    type: String,
    default: '#6B7280',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Color must be a valid hex color code'
    }
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
    required: [true, 'Product label store is required']
  }
}, {
  timestamps: true
});

// Create index for search functionality
productLabelSchema.index({
  nameAr: 'text',
  nameEn: 'text',
  descriptionAr: 'text',
  descriptionEn: 'text'
});

// Create index for store isolation
productLabelSchema.index({ store: 1 });
productLabelSchema.index({ store: 1, isActive: 1 });

module.exports = mongoose.model('ProductLabel', productLabelSchema); 