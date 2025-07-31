// monjed update start
// Cart model for unified shopping cart (authenticated & guest)
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: String },
  priceAtAdd: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
  // إضافة الصفات المختارة للمنتج
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
    value: {
      type: String,
      required: false
    },
    title: {
      type: String,
      required: false
    }
  }],
  // إضافة الألوان المختارة للمنتج
  selectedColors: [{
    type: String, // Array of color codes (hex, rgb, etc.)
    validate: {
      validator: function(color) {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$|^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
        return colorRegex.test(color);
      },
      message: 'Invalid color format. Use hex (#RRGGBB), rgb(r,g,b), or rgba(r,g,b,a) format'
    }
  }]
}, { _id: false });

// monjed update end


const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestId: { type: String, default: null, index: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  items: [cartItemSchema]
}, { timestamps: true });

// One cart per user/store or guestId/store
cartSchema.index({ user: 1, store: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });
cartSchema.index({ guestId: 1, store: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } });

// TTL index for guest carts - حذف تلقائي بعد 30 يوم
cartSchema.index({ updatedAt: 1 }, { 
  expireAfterSeconds: 2592000, // 30 days = 30 * 24 * 60 * 60
  partialFilterExpression: { guestId: { $exists: true, $ne: null } } 
});

module.exports = mongoose.model('Cart', cartSchema);
// monjed update end


