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
        //CONSOLE.log('🔍 Validating barcode:', barcode);
        const isValid = barcode && barcode.trim().length > 0;
        //CONSOLE.log('🔍 Barcode validation result:', isValid);
        return isValid;
      },
      message: 'Barcode cannot be empty'
    }
  }],
  // تغيير من category واحد إلى array من categories
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product categories are required']
  }],
  // الاحتفاظ بـ category للتوافق مع الكود القديم
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
  // قيم المواصفات المختارة مع الكمية المنفصلة لكل specification
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
    },
    // إضافة كمية منفصلة لكل specification
    quantity: {
      type: Number,
      required: [false, 'Specification quantity is required'],
      min: [0, 'Specification quantity cannot be negative'],
      default: 0
    },
    // إضافة سعر منفصل لكل specification (اختياري)
    price: {
      type: Number,
      min: [0, 'Specification price cannot be negative'],
      default: 0
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
  

  // Product colors - تغيير ليقبل JSON دائماً
  colors: {
    type: String, // JSON string
    default: '[]',
    validate: {
      validator: function(colors) {
        try {
          const parsedColors = JSON.parse(colors);
          if (!Array.isArray(parsedColors)) {
            return false;
          }
          // Validate that each color group is an array of valid color codes
          const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$|^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
          return parsedColors.every(colorGroup => 
            Array.isArray(colorGroup) && 
            colorGroup.every(color => typeof color === 'string' && colorRegex.test(color))
          );
        } catch (error) {
          return false;
        }
      },
      message: 'Colors must be a valid JSON array of color arrays. Use hex (#RRGGBB), rgb(r,g,b), or rgba(r,g,b,a) format'
    }
  },
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

// Create index for categories array
productSchema.index({ categories: 1 });

// Create index for category path
productSchema.index({ categoryPath: 1 });

// Create index for product labels
productSchema.index({ productLabels: 1 });

// Create index for specifications
productSchema.index({ specifications: 1 });

// Create index for specification values
productSchema.index({ specificationValues: 1 });

// Create index for specification quantities
productSchema.index({ 'specificationValues.quantity': 1 });

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
  if (!this.colors) return [];
  
  try {
    const parsedColors = typeof this.colors === 'string' ? JSON.parse(this.colors) : this.colors;
    if (!Array.isArray(parsedColors) || parsedColors.length === 0) return [];
    
    // Flatten all color arrays and get unique colors
    const allColors = parsedColors.flat();
    return [...new Set(allColors)];
  } catch (error) {
    return [];
  }
});

// Virtual for color options count
productSchema.virtual('colorOptionsCount').get(function() {
  if (!this.colors) return 0;
  
  try {
    const parsedColors = typeof this.colors === 'string' ? JSON.parse(this.colors) : this.colors;
    return Array.isArray(parsedColors) ? parsedColors.length : 0;
  } catch (error) {
    return 0;
  }
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

// Virtual for total specification quantities
productSchema.virtual('totalSpecificationQuantities').get(function() {
  if (!this.specificationValues || !Array.isArray(this.specificationValues)) {
    return 0;
  }
  return this.specificationValues.reduce((total, spec) => total + (spec.quantity || 0), 0);
});

// Virtual for specification stock status
productSchema.virtual('specificationStockStatus').get(function() {
  if (!this.specificationValues || !Array.isArray(this.specificationValues)) {
    return 'no_specifications';
  }
  
  const totalQuantity = this.specificationValues.reduce((total, spec) => total + (spec.quantity || 0), 0);
  if (totalQuantity === 0) return 'out_of_stock';
  if (totalQuantity <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual to check if product is a parent
productSchema.virtual('isParent').get(function() {
  return this.hasVariants && this.variants && this.variants.length > 0;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Add pre-save middleware to log barcodes and sync categories
productSchema.pre('save', function(next) {
  //CONSOLE.log('🔍 Pre-save - barcodes:', this.barcodes);
  //CONSOLE.log('🔍 Pre-save - barcodes type:', typeof this.barcodes);
  //CONSOLE.log('🔍 Pre-save - barcodes is array:', Array.isArray(this.barcodes));
  
  // تحديث category من categories إذا كان categories موجود
  if (this.categories && this.categories.length > 0 && !this.category) {
    this.category = this.categories[0];
  }
  
  // تحويل colors إلى JSON إذا كان array
  if (Array.isArray(this.colors)) {
    this.colors = JSON.stringify(this.colors);
  }
  
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

// Add pre-findOneAndUpdate middleware to log barcodes and sync categories
productSchema.pre('findOneAndUpdate', function(next) {
  //CONSOLE.log('🔍 Pre-findOneAndUpdate - update data:', this._update);
  if (this._update.barcodes) {
    //CONSOLE.log('🔍 Pre-findOneAndUpdate - barcodes:', this._update.barcodes);
    //CONSOLE.log('🔍 Pre-findOneAndUpdate - barcodes type:', typeof this._update.barcodes);
    //CONSOLE.log('🔍 Pre-findOneAndUpdate - barcodes is array:', Array.isArray(this._update.barcodes));
  }
  
  // تحديث category من categories إذا كان categories موجود
  if (this._update.categories && this._update.categories.length > 0 && !this._update.category) {
    this._update.category = this._update.categories[0];
  }
  
  // تحويل colors إلى JSON إذا كان array
  if (this._update.colors && Array.isArray(this._update.colors)) {
    this._update.colors = JSON.stringify(this._update.colors);
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema); 