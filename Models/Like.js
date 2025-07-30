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
  }
}, { timestamps: true });

// فهرس مركب للمستخدمين المسجلين
likeSchema.index({ user: 1, product: 1, store: 1 }, { 
  unique: true, 
  partialFilterExpression: { user: { $type: 'objectId' } } 
});

// فهرس مركب للمستخدمين غير المسجلين
likeSchema.index({ guestId: 1, product: 1, store: 1 }, { 
  unique: true, 
  partialFilterExpression: { guestId: { $type: 'string' } } 
});

module.exports = mongoose.model('Like', likeSchema); 