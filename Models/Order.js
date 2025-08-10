const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: false
  },
  store: {
    type: Object, // نسخة من بيانات المتجر وقت الطلب
    required: true
  },

  user: {
    type: Object, // نسخة من بيانات المستخدم وقت الطلب
    required: true
  },
  guestId: {
    type: String, // للضيوف غير المسجلين
    required: false
  },
  items: [{
    productId: {
      type: String, // فقط id نصي للمنتج (اختياري)
      required: true
    },
    productSnapshot: {
      type: Object,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: false
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative']
    },
    variant: {
      name: String,
      option: String
    },
    // إضافة الصفات المختارة للمنتج من السلة
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
    // إضافة الألوان المختارة للمنتج من السلة
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
  }],

  status: {
    type: String,
    enum: ['pending', 'shipped', 'delivered', 'cancelled'],
    enumAr:['قيد المراجعة','مؤكد','منتهي','ملغي'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    enumAr:['غير مدفوع','مدفوع'],
    default: 'unpaid'
  },
  notes: {
    customer: String,
    admin: String
  },
  isGift: {
    type: Boolean,
    default: false
  },
  affiliate: {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    mobile: { type: String },
    address: { type: String },
    percent: { type: Number },
    status: { type: String },
    affiliateCode: { type: String },
    affiliateLink: { type: String },
    totalSales: { type: Number },
    totalCommission: { type: Number },
    totalPaid: { type: Number },
    balance: { type: Number },
    totalOrders: { type: Number },
    totalCustomers: { type: Number },
    conversionRate: { type: Number },
    lastActivity: { type: Date },
    registrationDate: { type: Date },
    bankInfo: {
      bankName: { type: String },
      accountNumber: { type: String },
      iban: { type: String },
      swiftCode: { type: String }
    },
    settings: {
      autoPayment: { type: Boolean },
      paymentThreshold: { type: Number },
      paymentMethod: { type: String },
      notifications: {
        email: { type: Boolean },
        sms: { type: Boolean }
      }
    },
    notes: { type: String },
    isVerified: { type: Boolean },
    verificationDate: { type: Date },
    verifiedBy: { type: String },
  },
  deliveryArea: {
    locationAr: { type: String },
    locationEn: { type: String },
    price: { type: Number },
    estimatedDays: { type: Number },
    whatsappNumber: { type: String },
    isActive: { type: Boolean },
    isDefault: { type: Boolean },
    description: { type: String },
    descriptionAr: { type: String },
    descriptionEn: { type: String },
    priority: { type: Number },
  },
  currency: {
    type: String,
    required: false
  },
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: String, // Changed from ObjectId to String
    ref: 'User'
  },
  cancellationReason: String
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD${year}${month}${day}${random}`;
  }
  next();
});


// Create indexes for store isolation
orderSchema.index({ store: 1 });
orderSchema.index({ store: 1, user: 1 });
orderSchema.index({ store: 1, guestId: 1 });
orderSchema.index({ store: 1, status: 1 });
orderSchema.index({ store: 1, orderNumber: 1 }, { unique: true });

// Virtual for order summary
orderSchema.virtual('orderSummary').get(function() {
  return {
    orderNumber: this.orderNumber,
    total: (this.pricing && typeof this.pricing.total !== 'undefined') ? this.pricing.total : 0,
    status: this.status,
    itemCount: this.items ? this.items.length : 0,
    createdAt: this.createdAt
  };
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema); 