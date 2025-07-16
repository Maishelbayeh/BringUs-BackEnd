const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nameAr: {
    type: String,
    required: [true, 'Arabic product name is required'],
    trim: true,
    maxlength: [100, 'Arabic product name cannot exceed 100 characters']
  },
  nameEn: {
    type: String,
    required: [true, 'English product name is required'],
    trim: true,
    maxlength: [100, 'English product name cannot exceed 100 characters']
  },
  descriptionAr: {
    type: String,
    required: [true, 'Arabic product description is required'],
    maxlength: [2000, 'Arabic description cannot exceed 2000 characters']
  },
  descriptionEn: {
    type: String,
    required: [true, 'English product description is required'],
    maxlength: [2000, 'English description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },

  barcodes: [{
    type: String,
    trim: true,
    validate: {
      validator: function(barcode) {
        console.log('🔍 Validating barcode:', barcode);
        const isValid = barcode && barcode.trim().length > 0;
        console.log('🔍 Barcode validation result:', isValid);
        return isValid;
      },
      message: 'Barcode cannot be empty'
    }
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },

  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Product store is required']
  },

  images: [{
    type: String,
    default: []
  }],
  mainImage: {
    type: String,
    default: null
  },
  productLabels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductLabel'
  }],
  // Unit (piece, kg, liter, etc.)
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: [true, 'Product unit is required']
  },
  // Available quantity
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative'],
    default: 0
  },
  // Product order for sorting
  productOrder: {
    type: Number,
    default: 0
  },
  // Visibility status
  visibility: {
    type: Boolean,
    default: true
  },
  // Flag to indicate if product has variants
  hasVariants: {
    type: Boolean,
    default: false
  },
 
  variants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  attributes: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],
  specifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductSpecification'
  }],
  // قيم المواصفات المختارة
  specificationValues: [{
    specificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductSpecification',
      required: true
    },
    valueId: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  }],
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
  

  // Product colors - array of color arrays
  // Each inner array represents a color option (can be single color or multiple colors)
  // Example: [['#000000'], ['#FFFFFF', '#FF0000']] - first option is black only, second is white+red
  colors: [{
    type: [String], // Array of color codes (hex, rgb, etc.)
    validate: {
      validator: function(colors) {
        // Validate that each color is a valid color format
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$|^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
        return colors.every(color => colorRegex.test(color));
      },
      message: 'Invalid color format. Use hex (#RRGGBB), rgb(r,g,b), or rgba(r,g,b,a) format'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  salePercentage: {
    type: Number,
    min: [0, 'Sale percentage cannot be negative'],
    max: [100, 'Sale percentage cannot exceed 100']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  numReviews: {
    type: Number,
    default: 0,
    min: [0, 'Number of reviews cannot be negative']
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  soldCount: {
    type: Number,
    default: 0,
    min: [0, 'Sold count cannot be negative']
  },
  seo: {
    title: {
      type: String,
      maxlength: [60, 'SEO title cannot exceed 60 characters']
    },
    description: {
      type: String,
      maxlength: [160, 'SEO description cannot exceed 160 characters']
    },
    keywords: [String]
  }
}, {
  timestamps: true
});

// Create index for search functionality
productSchema.index({
  nameAr: 'text',
  nameEn: 'text',
  descriptionAr: 'text',
  descriptionEn: 'text'
});

// Create index for category
productSchema.index({ category: 1 });

// Create index for category path
productSchema.index({ categoryPath: 1 });

// Create index for product labels
productSchema.index({ productLabels: 1 });

// Create index for specifications
productSchema.index({ specifications: 1 });

// Create index for specification values
productSchema.index({ specificationValues: 1 });

// Create index for unit
productSchema.index({ unit: 1 });

// Create index for visibility
productSchema.index({ visibility: 1 });

// Create index for product order
productSchema.index({ productOrder: 1 });

// Create index for colors
productSchema.index({ colors: 1 });

// Create index for barcodes
productSchema.index({ barcodes: 1 });

// Create index for hasVariants
productSchema.index({ hasVariants: 1 });

// Create index for variants (for parent products)
productSchema.index({ variants: 1 });

// Create indexes for store isolation
productSchema.index({ store: 1 });
productSchema.index({ store: 1, category: 1 });
productSchema.index({ store: 1, isActive: 1 });
productSchema.index({ store: 1, visibility: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Virtual for final price
productSchema.virtual('finalPrice').get(function() {
  if (this.isOnSale && this.salePercentage > 0) {
    return this.price - (this.price * this.salePercentage / 100);
  }
  return this.price;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for all unique colors
productSchema.virtual('allColors').get(function() {
  if (!this.colors || this.colors.length === 0) return [];
  
  // Flatten all color arrays and get unique colors
  const allColors = this.colors.flat();
  return [...new Set(allColors)];
});

// Virtual for color options count
productSchema.virtual('colorOptionsCount').get(function() {
  return this.colors ? this.colors.length : 0;
});

// Virtual for total variants count
productSchema.virtual('variantsCount').get(function() {
  return this.variants ? this.variants.length : 0;
});

// Virtual for active variants count
productSchema.virtual('activeVariantsCount').get(function() {
  if (!this.variants || !Array.isArray(this.variants)) return 0;
  return this.variants.filter(variant => variant.isActive).length;
});

// Virtual for total stock including variants
productSchema.virtual('totalStock').get(function() {
  let total = this.stock || 0;
  if (this.variants && Array.isArray(this.variants) && this.variants.length > 0) {
    total += this.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  }
  return total;
});

// Virtual to check if product is a parent
productSchema.virtual('isParent').get(function() {
  return this.hasVariants && this.variants && this.variants.length > 0;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Add pre-save middleware to log barcodes
productSchema.pre('save', function(next) {
  console.log('🔍 Pre-save - barcodes:', this.barcodes);
  console.log('🔍 Pre-save - barcodes type:', typeof this.barcodes);
  console.log('🔍 Pre-save - barcodes is array:', Array.isArray(this.barcodes));
  next();
});

productSchema.pre('remove', async function(next) {
  try {
    await mongoose.model('Like').deleteMany({ product: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

// Add pre-findOneAndUpdate middleware to log barcodes
productSchema.pre('findOneAndUpdate', function(next) {
  console.log('🔍 Pre-findOneAndUpdate - update data:', this._update);
  if (this._update.barcodes) {
    console.log('🔍 Pre-findOneAndUpdate - barcodes:', this._update.barcodes);
    console.log('🔍 Pre-findOneAndUpdate - barcodes type:', typeof this._update.barcodes);
    console.log('🔍 Pre-findOneAndUpdate - barcodes is array:', Array.isArray(this._update.barcodes));
  }
  next();
});

module.exports = mongoose.model('Product', productSchema); 