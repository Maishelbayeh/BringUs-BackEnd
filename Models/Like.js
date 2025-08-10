const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // جعلها اختيارية للمستخدمين غير المسجلين
  },
  guestId: {
    type: String,
    required: false // للمستخدمين غير المسجلين
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  wishlistUserId: {
    type: String,
    required: false,
    default: null
  },
  wishlistName: {
    type: String,
    required: false
  },
  isWishlistHeader: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// فهرس مركب للمستخدمين المسجلين (مع wishlistUserId)
likeSchema.index({ user: 1, product: 1, store: 1, wishlistUserId: 1 }, { 
  unique: true, 
  partialFilterExpression: { user: { $type: 'objectId' } } 
});

// فهرس مركب للمستخدمين غير المسجلين (مع wishlistUserId)
likeSchema.index({ guestId: 1, product: 1, store: 1, wishlistUserId: 1 }, { 
  unique: true, 
  partialFilterExpression: { guestId: { $type: 'string' } } 
});

// فهرس إضافي للبحث السريع
likeSchema.index({ store: 1, user: 1 });
likeSchema.index({ store: 1, guestId: 1 });

module.exports = mongoose.model('Like', likeSchema); 