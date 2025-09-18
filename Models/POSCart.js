const mongoose = require('mongoose');

// POS Cart Item Schema
const posCartItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  variant: { 
    type: String 
  },
  priceAtAdd: { 
    type: Number, 
    required: true 
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  },
  // Selected product specifications
  selectedSpecifications: [{
    specificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductSpecification',
      required: true
    },
    valueId: {
      type: String,
      required: true
    },
    valueAr: {
      type: String,
      required: false
    },
    valueEn: {
      type: String,
      required: false
    },
    titleAr: {
      type: String,
      required: false
    },
    titleEn: {
      type: String,
      required: false
    }
  }],
  // Selected product colors
  selectedColors: [{
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(colorOption) {
        const isValidHexColor = (color) => {
          const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
          return hexRegex.test(color);
        };
        
        if (typeof colorOption === 'string') {
          return true;
        }
        
        if (Array.isArray(colorOption)) {
          return colorOption.every(color => typeof color === 'string' && isValidHexColor(color));
        }
        
        return false;
      },
      message: 'Invalid color format'
    }
  }]
});

// POS Cart Schema
const posCartSchema = new mongoose.Schema({
  // Admin who created this cart
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Store where this POS cart belongs
  store: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true 
  },
  // Cart session identifier (for multi-tab support)
  sessionId: { 
    type: String, 
    required: true,
    index: true
  },
  // Cart name/title (optional, for admin to identify the cart)
  cartName: { 
    type: String,
    default: 'POS Cart'
  },
  // Customer information (if known)
  customer: {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'United States' }
    }
  },
  // Cart items
  items: [posCartItemSchema],
  // Cart status
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  // Payment information (always cash, no change)
  payment: {
    method: { 
      type: String,
      default: 'cash'
    },
    amount: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    notes: { type: String, default: 'POS cash payment - no change' }
  },
  // Discount information
  discount: {
    type: { 
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none'
    },
    value: { type: Number, default: 0 },
    reason: { type: String }
  },
  // Tax information
  tax: {
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  // Notes
  notes: {
    admin: { type: String },
    customer: { type: String }
  },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { 
  timestamps: true 
});

// Indexes for better performance
posCartSchema.index({ admin: 1, store: 1, sessionId: 1 }, { unique: true });
posCartSchema.index({ admin: 1, store: 1, status: 1 });
posCartSchema.index({ store: 1, status: 1 });
posCartSchema.index({ createdAt: -1 });

// Virtual for total items count
posCartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for subtotal
posCartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => total + (item.priceAtAdd * item.quantity), 0);
});

// Virtual for total with tax and discount
posCartSchema.virtual('total').get(function() {
  let total = this.subtotal;
  
  // Apply discount
  if (this.discount.type === 'percentage') {
    total = total - (total * this.discount.value / 100);
  } else if (this.discount.type === 'fixed') {
    total = total - this.discount.value;
  }
  
  // Apply tax
  total = total + this.tax.amount;
  
  return Math.max(0, total);
});

// Pre-save middleware to update timestamps
posCartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Method to add item to cart
posCartSchema.methods.addItem = function(itemData) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === itemData.product.toString() &&
    item.variant === itemData.variant &&
    JSON.stringify(item.selectedSpecifications) === JSON.stringify(itemData.selectedSpecifications) &&
    JSON.stringify(item.selectedColors) === JSON.stringify(itemData.selectedColors)
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += itemData.quantity;
  } else {
    this.items.push(itemData);
  }
  
  return this.save();
};

// Method to remove item from cart
posCartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId);
  return this.save();
};

// Method to update item quantity
posCartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    } else {
      item.quantity = quantity;
      return this.save();
    }
  }
  throw new Error('Item not found');
};

// Method to clear cart
posCartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Method to complete cart (convert to order)
posCartSchema.methods.completeCart = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('POSCart', posCartSchema);
