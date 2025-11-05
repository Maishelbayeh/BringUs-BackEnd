const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique:   false,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [function() {
      return this.isNew; // Only require password when creating a new user
    }, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  avatar: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    }
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'client','affiliate','wholesaler'],
    default: 'client'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: false
    },
    country: {
      type: String,
      required: true,
      default: 'United States'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  // New fields for OTP-based email verification
  emailVerificationOTP: String,
  emailVerificationExpiry: Date,
  emailVerifiedAt: Date,
  // Pending email change fields
  pendingEmail: String,  // New email waiting for verification
  pendingEmailOTP: String,  // OTP for new email verification
  pendingEmailExpiry: Date,  // OTP expiry for new email
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  lastLoginUrl: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Store association for customers
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }
  
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare user password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// Return JWT token
userSchema.methods.getJwtToken = function(storeId, rememberMe = false) {
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  
  // If rememberMe is true, token expires in 30 days, otherwise 7 days (or from env)
  const jwtExpire = rememberMe ? '30d' : (process.env.JWT_EXPIRE || '7d');
  
  const payload = { 
    id: this._id, 
    role: this.role,
    redirectUrl: this.role === 'admin' || this.role === 'superadmin' 
      ? 'https://admin.bring2.us/' 
      : 'https://bring2.us/'
  };
  
  if (storeId) payload.storeId = storeId;
  if (rememberMe) payload.rememberMe = true;
  
  return jwt.sign(payload, jwtSecret, {
    expiresIn: jwtExpire
  });
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expire time
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Create indexes for store isolation
userSchema.index({ store: 1 });
userSchema.index({ store: 1, role: 1 });
userSchema.index({ store: 1, status: 1 });

// Create compound unique index for admin and superadmin roles (email + role must be unique for these roles)
// This prevents duplicate admin/superadmin roles for the same email globally
userSchema.index({ email: 1, role: 1 }, { 
  unique: true, 
  partialFilterExpression: { role: { $in: ['admin', 'superadmin'] } }
});

// Create compound unique index for client roles (email + store + role must be unique)
// This prevents duplicate client roles for the same email in the same store
userSchema.index({ email: 1, store: 1, role: 1 }, { 
  unique: true, 
  partialFilterExpression: { role: 'client' }
});

module.exports = mongoose.model('User', userSchema); 