const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// monjed update start
// Cart merge logic after successful login
const Cart = require('../Models/Cart');
// monjed update end

// Import middleware for store access
const { checkAdminStoreOwnership } = require('../middleware/permissions');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "moon95@gmail.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "123123"
 *               phone:
 *                 type: string
 *                 pattern: "^[\\+]?[1-9][\\d]{0,15}$"
 *                 example: "+1234567890"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     role:
 *                       type: string
 *                       example: "client"
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    // Generate JWT token
    const token = user.getJwtToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    //CONSOLE.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "moon95@gmail.com"
 *               password:
 *                 type: string
 *                 example: "123123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     avatar:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials or account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password').populate('store');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get store information for admin users
    let userStore = null;
    let userStores = [];
    let storeIdForToken = null;
    let isOwner = false;
    if (user.role === 'admin') {
      try {
        const Owner = require('../Models/Owner');
        const Store = require('../Models/Store');
        const owners = await Owner.find({ 
          userId: user._id, 
          status: 'active' 
        }).populate('storeId');
        if (owners && owners.length > 0) {
          isOwner = true;
          userStores = owners.map(owner => ({
            id: owner.storeId._id,
            nameAr: owner.storeId.nameAr,
            nameEn: owner.storeId.nameEn,
            slug: owner.storeId.slug,
            status: owner.storeId.status,
            isPrimaryOwner: owner.isPrimaryOwner,
            isOwner: true,
            permissions: owner.permissions
          }));
          // Set the first store as default
          userStore = userStores[0];
          storeIdForToken = userStores[0].id;
        }
        else{
          try {
            const store = await Store.findById(user.store);

            if (store) {
              userStore = {
                id: store._id,
                nameAr: store.nameAr,
                nameEn: store.nameEn,
                slug: store.slug,
                status: store.status,
                isOwner: false,
                permissions: []
              };
              userStores = [userStore];
              storeIdForToken = store._id;
            }
          } catch (storeError) {
            //CONSOLE.error('Error fetching client store:', storeError);
            // Don't fail login if store fetch fails
          }
        }
      } catch (storeError) {
        //CONSOLE.error('Error fetching admin store:', storeError);
        // Don't fail login if store fetch fails
      } 

    } else if (user.role === 'client' && user.store) {
      try {
        const Store = require('../Models/Store');
        const store = await Store.findById(user.store);
        if (store) {
          userStore = {
            id: store._id,
            nameAr: store.nameAr,
            nameEn: store.nameEn,
            slug: store.slug,
            status: store.status,
            isOwner: false,
            permissions: []
          };
          userStores = [userStore];
          storeIdForToken = store._id;
        }
      } catch (storeError) {
        //CONSOLE.error('Error fetching client store:', storeError);
        // Don't fail login if store fetch fails
      }
    } else if (user.role === 'affiliate' || user.role === 'wholesaler'||user.role === 'admin') {
      try {
        const Store = require('../Models/Store');
        const store = await Store.findById(user.store);
        if (store) {
          userStore = {
            id: store._id,
            nameAr: store.nameAr,
            nameEn: store.nameEn,
            slug: store.slug,
            status: store.status,
            isOwner: false,
            permissions: []
          };
          userStores = [userStore];
          storeIdForToken = store._id;

          // Get wholesaler specific data if user is wholesaler
          if (user.role === 'wholesaler') {
            try {
              const Wholesaler = require('../Models/Wholesaler');
              const wholesaler = await Wholesaler.findOne({ userId: user._id });
              if (wholesaler) {
                userStore = {
                  ...userStore,
                  discount: wholesaler.discount,
                  businessName: wholesaler.businessName,
                  isVerified: wholesaler.isVerified,
                  status: wholesaler.status
                };
                userStores = [userStore];
              }
            } catch (wholesalerError) {
              //CONSOLE.error('Error fetching wholesaler data:', wholesalerError);
              // Don't fail login if wholesaler fetch fails
            }
          }
        }
      } catch (storeError) {
        //CONSOLE.error('Error fetching affiliate/wholesaler store:', storeError);
        // Don't fail login if store fetch fails
      }
    }

    // Generate JWT token with storeId if available
    const token = user.getJwtToken(storeIdForToken);

    // monjed update start
    // Cart merge logic after successful login
    if (req.guestId && req.store && req.store._id) {
      const guestCart = await Cart.findOne({ guestId: req.guestId, store: req.store._id });
      if (guestCart) {
        let userCart = await Cart.findOne({ user: user._id, store: req.store._id });
        if (!userCart) {
          userCart = await Cart.create({ user: user._id, store: req.store._id, items: [] });
        }
        // Merge items
        guestCart.items.forEach(guestItem => {
          const idx = userCart.items.findIndex(
            item => item.product.toString() === guestItem.product.toString() && item.variant === guestItem.variant
          );
          if (idx > -1) {
            userCart.items[idx].quantity += guestItem.quantity;
          } else {
            userCart.items.push({ ...guestItem.toObject() });
          }
        });
        await userCart.save();
        await Cart.deleteOne({ _id: guestCart._id });
      }
    }
    // monjed update end

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        store: userStore, // Default store for admin
        stores: userStores, // All stores for admin
        isOwner: isOwner // Flag indicating if user is an owner
      },
      storeId: storeIdForToken, // أضف هذا الحقل لسهولة الوصول من الفرونت
      isOwner: isOwner, // Flag indicating if user is an owner
      userStatus: user.status
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid token or account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

            const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
        const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id).populate('store');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request for middleware
    req.user = user;

    // Check store ownership for admin users
    if (user.role === 'admin') {
      try {
        await checkAdminStoreOwnership(req, res, () => {});
      } catch (error) {
        //CONSOLE.error('Store ownership check error:', error);
      }
    }

    // Get store information for admin users
    let userStore = null;
    let userStores = [];
    let isOwner = false;
    if (user.role === 'admin') {
      try {
        const Owner = require('../Models/Owner');
        const Store = require('../Models/Store');
        
        const owners = await Owner.find({ 
          userId: user._id, 
          status: 'active' 
        }).populate('storeId');
        
        if (owners && owners.length > 0) {
          isOwner = true;
          userStores = owners.map(owner => ({
            id: owner.storeId._id,
            nameAr: owner.storeId.nameAr,
            nameEn: owner.storeId.nameEn,
            slug: owner.storeId.slug,
            status: owner.storeId.status,
            isPrimaryOwner: owner.isPrimaryOwner,
            isOwner: true,
            permissions: owner.permissions
          }));
          
          // Set the first store as default
          userStore = userStores[0];
        }
      } catch (storeError) {
        //CONSOLE.error('Error fetching admin store:', storeError);
      }
    } else if (user.role === 'client' && user.store) {
      try {
        const Store = require('../Models/Store');
        const store = await Store.findById(user.store);
        if (store) {
          userStore = {
            id: store._id,
            nameAr: store.nameAr,
            nameEn: store.nameEn,
            slug: store.slug,
            status: store.status,
            isOwner: false,
            permissions: []
          };
          userStores = [userStore];
        }
      } catch (storeError) {
        //CONSOLE.error('Error fetching client store:', storeError);
      }
    } else if (user.role === 'affiliate' || user.role === 'wholesaler') {
      try {
        const Store = require('../Models/Store');
        const store = await Store.findById(user.store);
        if (store) {
          userStore = {
            id: store._id,
            nameAr: store.nameAr,
            nameEn: store.nameEn,
            slug: store.slug,
            status: store.status,
            isOwner: false,
            permissions: []
          };
          userStores = [userStore];

          // Get wholesaler specific data if user is wholesaler
          if (user.role === 'wholesaler') {
            try {
              const Wholesaler = require('../Models/Wholesaler');
              const wholesaler = await Wholesaler.findOne({ userId: user._id });
              if (wholesaler) {
                userStore = {
                  ...userStore,
                  discount: wholesaler.discount,
                  businessName: wholesaler.businessName,
                  isVerified: wholesaler.isVerified,
                  status: wholesaler.status
                };
                userStores = [userStore];
              }
            } catch (wholesalerError) {
              //CONSOLE.error('Error fetching wholesaler data:', wholesalerError);
            }
          }
        }
      } catch (storeError) {
        //CONSOLE.error('Error fetching affiliate/wholesaler store:', storeError);
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        store: userStore, // Default store for admin
        stores: userStores, // All stores for admin
        isOwner: isOwner // Flag indicating if user is an owner
      },
      isOwner: isOwner // Flag indicating if user is an owner
    });
  } catch (error) {
    //CONSOLE.error('Get user error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // TODO: Send email with reset token
    // For now, just return the token (in production, send via email)
    res.status(200).json({
      success: true,
      message: 'Password reset token sent to email',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    //CONSOLE.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reset email',
      error: error.message
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    //CONSOLE.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

module.exports = router; 