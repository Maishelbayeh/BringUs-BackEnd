// monjed update start
// Cart model for unified shopping cart (authenticated & guest)
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: String },
  priceAtAdd: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestId: { type: String, default: null, index: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  items: [cartItemSchema]
}, { timestamps: true });

// One cart per user/store or guestId/store
cartSchema.index({ user: 1, store: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });
cartSchema.index({ guestId: 1, store: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } });

// Optional: TTL index for guest carts (e.g., 30 days)
// cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000, partialFilterExpression: { guestId: { $exists: true, $ne: null } } });

module.exports = mongoose.model('Cart', cartSchema);
// monjed update end

