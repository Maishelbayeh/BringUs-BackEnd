const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  nameAr: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  nameEn: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  descriptionAr: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  descriptionEn: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  logo: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    }
  },
  slug: {
    type: String,
    unique: true,
    required: [true, 'Domain is required'],
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  settings: {
    mainColor: {
      type: String,
      default: '#000000'
    },
  
    language: {
      type: String,
      default: 'en'
    },
    storeDiscount: {
      type: Number,
      default: 0
    },
   
    timezone: {
      type: String,
      default: 'UTC'
    },
    taxRate: {
      type: Number,
      default: 0
    },
    shippingEnabled: {
      type: Boolean,
      default: true
    },

    storeSocials: {
      type:   Object,
      default: {
        facebook: String,
        instagram: String,
        twitter: String,
        youtube: String,
        linkedin: String,
        telegram: String,
        snapchat: String,
        pinterest: String,
        tiktok: String,
      }
    }
  },
  //whatsapp number
  whatsappNumber: {
    type: String,
    required: [false, 'WhatsApp number is required']
  },
  contact: {
    email: {
      type: String,
      required: [true, 'Contact email is required']
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  }
}, {
  timestamps: true
});

// Ensure unique slug
storeSchema.index({ slug: 1 }, { unique: true });

storeSchema.pre('remove', async function(next) {
  try {
    await mongoose.model('Like').deleteMany({ store: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Store', storeSchema); 