const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  name: {
    type: String,
    required: [true, 'Variant name is required'],
    trim: true,
    maxlength: [100, 'Variant name cannot exceed 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Variant price is required'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative']
  },
  sku: {
    type: String,
    unique: true,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: [0, 'Low stock threshold cannot be negative']
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: {
      type: Number,
      min: [0, 'Length cannot be negative']
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative']
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative']
    }
  },
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    alt: String
  }],
  mainImage: {
    public_id: {
      type: String
    },
    url: {
      type: String
    },
    alt: String
  },
  // attributes: [{
  //   name: {
  //     type: String,
  //     required: true
  //   },
  //   value: {
  //     type: String,
  //     required: true
  //   }
  // }],
  specifications: [{
    specificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductSpecification'
    },
    value: {
      type: String,
      required: true
    }
  }],
  colors: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Color must be a valid hex color'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Product variant store is required']
  }
}, {
  timestamps: true
});

// Create index for product
productVariantSchema.index({ productId: 1 });

// Create index for SKU
productVariantSchema.index({ sku: 1 });

// Create index for barcode
productVariantSchema.index({ barcode: 1 });

// Create index for search functionality
productVariantSchema.index({
  name: 'text'
});

// Create index for store isolation
productVariantSchema.index({ store: 1 });
productVariantSchema.index({ store: 1, productId: 1 });
productVariantSchema.index({ store: 1, sku: 1 });

// Virtual for discount percentage
productVariantSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Ensure virtual fields are serialized
productVariantSchema.set('toJSON', { virtuals: true });
productVariantSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema); 