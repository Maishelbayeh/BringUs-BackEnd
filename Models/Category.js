const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  nameAr: {
    type: String,
    required: [false, 'Arabic name is required'],
    trim: true,
    maxlength: [50, 'Arabic name cannot exceed 50 characters']
  },
  nameEn: {
    type: String,
    required: [false, 'English name is required'],
    trim: true,
    maxlength: [50, 'English name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    lowercase: true
  },
  descriptionAr: {
    type: String,
    maxlength: [500, 'Arabic description cannot exceed 500 characters']
  },
  descriptionEn: {
    type: String,
    maxlength: [500, 'English description cannot exceed 500 characters']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  // level: {
  //   type: Number,
  //   default: 0,
  //   min: [0, 'Level cannot be negative']
  // },
  image: {
    type: String,
    default: null
  },
  // icon: {
  //   type: String,
  //   trim: true
  // },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0,
    min: [0, 'Product count cannot be negative']
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

// Create compound index for slug and store (slug should be unique per store)
categorySchema.index({ slug: 1, store: 1 }, { unique: true });

// Create index for search functionality
categorySchema.index({
  nameAr: 'text',
  nameEn: 'text',
  descriptionAr: 'text',
  descriptionEn: 'text'
});

// Create index for store filtering
categorySchema.index({ store: 1 });
categorySchema.index({ store: 1, parent: 1 });

// Virtual for full path
categorySchema.virtual('fullPath').get(function() {
  if (this.parent) {
    return `${this.parent.fullPath} > ${this.nameEn}`;
  }
  return this.nameEn;
});

// Virtual for full path in Arabic
categorySchema.virtual('fullPathAr').get(function() {
  if (this.parent) {
    return `${this.parent.fullPathAr} > ${this.nameAr}`;
  }
  return this.nameAr;
});

// Virtual for children
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Ensure virtual fields are serialized
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

// Pre-save middleware to generate slug if not provided
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema); 