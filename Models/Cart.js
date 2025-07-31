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
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(colorOption) {
        // دالة للتحقق من صحة لون hex
        const isValidHexColor = (color) => {
          const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
          return hexRegex.test(color);
        };
        
        // إذا كان لون واحد (string) - مثل "red" أو "#ff0000"
        if (typeof colorOption === 'string') {
          // يقبل أسماء الألوان أو ألوان hex
          return true;
        }
        
        // إذا كان مصفوفة من ألوان hex
        if (Array.isArray(colorOption)) {
          return colorOption.every(color => typeof color === 'string' && isValidHexColor(color));
        }
        
        // إذا كان أي نوع آخر، رفض
        return false;
      },
      message: 'Invalid color format. Each color option must be either a string (color name or hex) or an array of hex colors. Examples: "red", "#ff0000", or ["#ff0000", "#ffffff"]'
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


