const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
    unique: true
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: [0, 'Level cannot be negative']
  },
  image: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    },
    alt: String
  },
  icon: {
    type: String,
    trim: true
  },
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

// Create index for slug
categorySchema.index({ slug: 1 });

// Virtual for full path
categorySchema.virtual('fullPath').get(function() {
  if (this.parent) {
    return `${this.parent.fullPath} > ${this.name}`;
  }
  return this.name;
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
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema); 