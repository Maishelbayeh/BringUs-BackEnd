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
 *     tags: [Auth]
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
 *                 example: "superadmin@gmail.com"
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
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number'),
  body('role').optional().isIn(['client', 'admin', 'superadmin']).withMessage('Role must be client, admin, or superadmin'),
  body('store').optional().isMongoId().withMessage('Store must be a valid MongoDB ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, store, role, status, addresses } = req.body;

    // Validate store exists if provided
    if (store) {
      const Store = require('../Models/Store');
      const storeExists = await Store.findById(store);
      if (!storeExists) {
        return res.status(400).json({
          success: false,
          message: 'Store not found',
          messageAr: 'المتجر غير موجود'
        });
      }
    }

    // Check if user already exists with same email, store, and role
    console.log('🔍 Checking for existing user with:', { email, store, role });
    const existingUser = await User.findOne({ 
      email: email, 
      store: store, 
      role: role 
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email in this store with this role',
        messageAr: 'المستخدم موجود بالفعل بهذا البريد الإلكتروني في هذا المتجر بهذا الدور'
      });
    }

    // For admin and superadmin roles, check if email already exists with these roles globally
    if (role === 'admin' || role === 'superadmin') {
      const existingAdminUser = await User.findOne({ 
        email: email,
        role: role
      });
      if (existingAdminUser) {
        return res.status(409).json({
          success: false,
          message: `User with ${role} role already exists with this email`,
          messageAr: `مستخدم بدور ${role === 'admin' ? 'مسؤول' : 'مسؤول عام'} موجود بالفعل بهذا البريد الإلكتروني`
        });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      store: store,
      role: role,
      status: status,
      addresses: addresses || []

    });
    
    // Generate JWT token
    const token = user.getJwtToken();

    // Send email verification OTP if store is provided
    let emailVerificationSent = false;
    let emailVerificationError = null;
    
    console.log(`🔧 Attempting to send email verification OTP to: ${user.email}`);
    
    if (store) {
      try {
        const Store = require('../Models/Store');
        const storeData = await Store.findById(store);
        
        if (storeData) {
          console.log(`📧 Store found: ${storeData.nameEn || storeData.nameAr} (${storeData.slug})`);
          
          // Generate 5-digit OTP
          const otp = Math.floor(10000 + Math.random() * 90000).toString();
          
          // Store OTP in user document with expiration (1 minute)
          const otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
          
          user.emailVerificationOTP = otp;
          user.emailVerificationExpiry = otpExpiry;
          await user.save();
          
          // Send email using our email service
          const emailService = require('../services/emailService');
          const emailResult = await emailService.sendVerificationEmail(
            user.email, 
            otp, 
            storeData.nameEn || storeData.nameAr || 'Our Store',
            storeData.contact?.email || 'info@bringus.com'
          );
          
          if (emailResult.success) {
            emailVerificationSent = true;
            console.log('✅ Email verification OTP sent successfully via Mailtrap');
            console.log(`   Email: ${user.email}`);
            console.log(`   Store: ${storeData.nameEn || storeData.nameAr}`);
            console.log(`   OTP: ${otp}`);
          } else {
            emailVerificationError = emailResult.error;
            console.log('⚠️ Email verification failed:', emailResult.error);
            console.log(`   OTP for testing: ${otp}`);
          }
        } else {
          console.log('⚠️ Store not found for email verification');
          emailVerificationError = 'Store not found';
        }
      } catch (error) {
        console.log('⚠️ Error sending email verification:', error.message);
        emailVerificationError = error.message;
      }
    } else {
      console.log('⚠️ No store provided, skipping email verification');
      emailVerificationError = 'No store provided';
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      messageAr: 'تم تسجيل المستخدم بنجاح',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        store: user.store,
        status: user.status,
        addresses: user.addresses
      },
      emailVerification: {
        sent: emailVerificationSent,
        message: emailVerificationSent 
          ? 'Email verification OTP sent successfully' 
          : emailVerificationError || 'Email verification not sent',
        messageAr: emailVerificationSent 
          ? 'تم إرسال رمز التحقق من البريد الإلكتروني بنجاح' 
          : 'لم يتم إرسال رمز التحقق من البريد الإلكتروني'
      }
    });
  } catch (error) {
    //CONSOLE.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      messageAr: 'خطأ في تسجيل المستخدم',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
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
 *               storeSlug:
 *                 type: string
 *                 description: Optional store slug to specify which store to login to (prevents conflicts when user has multiple accounts)
 *                 example: "my-store"
 *               url:
 *                 type: string
 *                 description: Optional URL from which the login request is made (used to auto-detect store)
 *                 example: "https://my-store.example.com/login"
 *               rememberMe:
 *                 type: boolean
 *                 description: If true, token expires in 30 days instead of 7 days
 *                 example: true
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
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
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
  body('password').notEmpty().withMessage('Password is required'),
  body('storeSlug').optional().isString().withMessage('Store slug must be a string'),
  body('url').optional().isString().withMessage('URL must be a string'),
  body('rememberMe').optional().isBoolean().withMessage('Remember me must be a boolean')
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

    const { email, password, url, rememberMe = false } = req.body;
    let { storeSlug } = req.body;
    
    // Normalize email for consistent lookup
    const normalizeEmail = (email) => {
      if (!email) return email;
      let normalized = email.trim().toLowerCase();
      const [localPart, domain] = normalized.split('@');
      if (domain === 'gmail.com' || domain === 'googlemail.com') {
        const normalizedLocal = localPart.replace(/\./g, '');
        normalized = `${normalizedLocal}@${domain}`;
      }
      return normalized;
    };
    
    const normalizedEmail = normalizeEmail(email);
    
    // If URL is provided but storeSlug is not, try to extract storeSlug from URL
    if (url && !storeSlug) {
      try {
        const urlObj = new URL(url);
        
        // Try to extract from subdomain (e.g., store1.example.com)
        const subdomain = urlObj.hostname.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'bringus' && subdomain !== 'localhost') {
          storeSlug = subdomain;
          console.log(`📍 Extracted storeSlug from subdomain: ${storeSlug}`);
        }
        
        // Try to extract from path (e.g., /store/store1)
        if (!storeSlug) {
          const pathMatch = urlObj.pathname.match(/\/store\/([^\/]+)/);
          if (pathMatch && pathMatch[1]) {
            storeSlug = pathMatch[1];
            console.log(`📍 Extracted storeSlug from path: ${storeSlug}`);
          }
        }
      } catch (err) {
        console.log(`⚠️ Could not parse URL: ${url}`);
      }
    }
    
    // Handle different login scenarios based on role and storeSlug
    let user = null;
    let store = null;
    
    console.log(`🔍 Login attempt for email: ${normalizedEmail}`);
    console.log(`   storeSlug: ${storeSlug || 'none'}`);
    console.log(`   url: ${url || 'none'}`);
    console.log(`   rememberMe: ${rememberMe}`);
    
    if (storeSlug) {
      // Find store by slug
      const Store = require('../Models/Store');
      store = await Store.findOne({ slug: storeSlug });
      
      if (!store) {
        console.log(`❌ Store not found with slug: ${storeSlug}`);
        return res.status(400).json({
          success: false,
          message: 'Store not found',
          messageAr: 'المتجر غير موجود'
        });
      }
      
      console.log(`✅ Store found: ${store.nameEn || store.nameAr} (${store.slug})`);
      
      // Find user with email and store
      user = await User.findOne({ email: normalizedEmail, store: store._id }).select('+password').populate('store');
      
      if (user) {
        console.log(`✅ User found in store: ${user.firstName} ${user.lastName} (${user.role})`);
      } else {
        console.log(`❌ User not found with email: ${normalizedEmail} in store: ${store.slug}`);
      }
    } else {
      // Check if multiple accounts exist with this email
      const allUsers = await User.find({ email: normalizedEmail });
      
      if (allUsers.length > 1) {
        // Multiple accounts exist - require storeSlug to disambiguate
        console.log(`⚠️ Multiple accounts found for email: ${normalizedEmail} (${allUsers.length} accounts)`);
        return res.status(400).json({
          success: false,
          message: 'Multiple accounts found. Please specify storeSlug to login.',
          messageAr: 'تم العثور على حسابات متعددة. يرجى تحديد storeSlug لتسجيل الدخول.',
          error: {
            code: 'MULTIPLE_ACCOUNTS',
            accountCount: allUsers.length,
            availableAccounts: allUsers.map(u => ({
              role: u.role,
              storeId: u.store,
              requiresStoreSlug: true
            }))
          }
        });
      }
      
      // For superadmin or single account users, find by email only
      console.log('🔍 Searching for user by email only (superadmin or single account)');
      user = await User.findOne({ email: normalizedEmail }).select('+password').populate('store');
      
      if (user) {
        console.log(`✅ User found: ${user.firstName} ${user.lastName} (${user.role})`);
        if (user.store) {
          console.log(`   Store: ${user.store.nameEn || user.store.nameAr}`);
        } else {
          console.log('   No store assigned');
        }
      } else {
        console.log(`❌ User not found with email: ${normalizedEmail}`);
      }
    }
    
    if (!user) {
      // If no user found and storeSlug was provided, check if user exists in other stores
      if (storeSlug) {
        const allUsers = await User.find({ email: normalizedEmail }).populate('store', 'nameAr nameEn slug status');
        if (allUsers.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'User not found in this store',
            messageAr: 'المستخدم غير موجود في هذا المتجر',
            availableAccounts: allUsers.map(u => ({
              role: u.role,
              storeId: u.store ? u.store._id : null,
              storeName: u.store ? (u.store.nameEn || u.store.nameAr) : null,
              storeSlug: u.store ? u.store.slug : null,
              redirectUrl: u.role === 'admin' || u.role === 'superadmin' 
                ? 'https://bringus.onrender.com/' 
                : 'https://bringus-main.onrender.com/'
            }))
          });
        }
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        messageAr: 'بريد إلكتروني أو كلمة مرور غير صحيحة'
      });
    }
       



    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        messageAr: 'بريد إلكتروني أو كلمة مرور غير صحيحة'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        messageAr: 'الحساب معطل'
      });
    }

    if(user.isEmailVerified == false){
      return res.status(401).json({
        success: false,
        message: 'Email is not verified',
        messageAr: 'البريد الإلكتروني غير مؤكد'
      });
    }

    // Check if URL is admin panel and user has appropriate role
    if (url) {
      const adminUrls = [
        'https://bringus.onrender.com',
        'https://bringus.onrender.com/',
        'http://localhost:3000',
        'http://localhost:3000/'
      ];
      
      const clientUrls = [
        'https://bringus-main.onrender.com',
        'https://bringus-main.onrender.com/',
        'http://localhost:3001',
        'http://localhost:3001/'
      ];
      
      const isAdminUrl = adminUrls.some(adminUrl => 
        url.toLowerCase().startsWith(adminUrl.toLowerCase())
      );
      
      const isClientUrl = clientUrls.some(clientUrl => 
        url.toLowerCase().startsWith(clientUrl.toLowerCase())
      );
      
      // Check admin panel access
      if (isAdminUrl && user.role !== 'admin' && user.role !== 'superadmin') {
        console.log(`❌ Access denied: ${user.role} tried to access admin panel from ${url}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied. This panel is only for admin and superadmin users.',
          messageAr: 'رفض الوصول. هذه اللوحة مخصصة فقط لمستخدمي الإدارة.',
          error: {
            code: 'ADMIN_PANEL_ACCESS_DENIED',
            userRole: user.role,
            requiredRoles: ['admin', 'superadmin'],
            redirectUrl: 'https://bringus-main.onrender.com/'
          }
        });
      }
      
      // Check client panel access (prevent admin/superadmin from logging in to client panel)
      if (isClientUrl && (user.role === 'admin' || user.role === 'superadmin')) {
        console.log(`❌ Access denied: ${user.role} tried to access client panel from ${url}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admins should use the admin panel.',
          messageAr: 'رفض الوصول. يجب على المسؤولين استخدام لوحة الإدارة.',
          error: {
            code: 'CLIENT_PANEL_ADMIN_DENIED',
            userRole: user.role,
            redirectUrl: 'https://bringus.onrender.com/'
          }
        });
      }
      
      if (isAdminUrl) {
        console.log(`✅ Admin panel access granted for ${user.role}`);
      } else if (isClientUrl) {
        console.log(`✅ Client panel access granted for ${user.role}`);
      }
    }

    // Update last login information
    user.lastLogin = new Date();
    if (url) {
      user.lastLoginUrl = url;
    }
    await user.save();
    
    console.log(`✅ Login successful for ${user.firstName} ${user.lastName} (${user.role})`);

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

    } else if (user.role === 'client' || user.role === 'affiliate' || user.role === 'wholesaler') {
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
    } else if (user.role === 'admin') {
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

    // Generate JWT token with storeId and rememberMe if available
    const token = user.getJwtToken(storeIdForToken, rememberMe);

    // Determine redirect URL based on role
    let redirectUrl;
    if (user.role === 'admin' || user.role === 'superadmin') {
      redirectUrl = 'https://bringus.onrender.com/';
    } else {
      redirectUrl = 'https://bringus-main.onrender.com/';
    }

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
      messageAr: 'تم تسجيل الدخول بنجاح',
      token,
      tokenExpiresIn: rememberMe ? '30 days' : '7 days',
      redirectUrl, // Add redirect URL based on role
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        store: userStore, // Default store for admin
        stores: userStores, // All stores for admin
        isOwner: isOwner, // Flag indicating if user is an owner
        isEmailVerified: user.isEmailVerified
      },
      isEmailVerified: user.isEmailVerified,  
      isActive: user.isActive,
      storeId: storeIdForToken, // أضف هذا الحقل لسهولة الوصول من الفرونت
      isOwner: isOwner, // Flag indicating if user is an owner
      userStatus: user.status
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      messageAr: 'خطأ في تسجيل الدخول',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/check-email:
 *   post:
 *     summary: Check if email exists across different roles and stores
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               storeSlug:
 *                 type: string
 *                 description: "Optional store slug to check specific store"
 *                 example: "my-store"
 *     responses:
 *       200:
 *         description: Email check successful
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
 *                   example: "Email check completed"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 exists:
 *                   type: boolean
 *                   example: true
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         example: "admin"
 *                       storeId:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       storeName:
 *                         type: string
 *                         example: "My Store"
 *                       storeSlug:
 *                         type: string
 *                         example: "my-store"
 *                       redirectUrl:
 *                         type: string
 *                         example: "https://bringus.onrender.com/"
 *       400:
 *         description: Validation error
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
router.post('/check-email', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('storeSlug').optional().isString().withMessage('Store slug must be a string')
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

    const { email, storeSlug } = req.body;
    
    console.log(`🔍 Checking email existence: ${email}, storeSlug: ${storeSlug || 'none'}`);
    
    // Find all users with this email
    const users = await User.find({ email }).populate('store', 'nameAr nameEn slug status');
    
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Email check completed',
      messageAr: 'تم التحقق من البريد الإلكتروني',
        email,
        exists: false,
        accounts: []
      });
    }

    // Process each user account
    const accounts = users.map(user => {
      let redirectUrl;
      if (user.role === 'admin' || user.role === 'superadmin') {
        redirectUrl = 'https://bringus.onrender.com/';
      } else {
        redirectUrl = 'https://bringus-main.onrender.com/';
      }

      return {
        role: user.role,
        storeId: user.store ? user.store._id : null,
        storeName: user.store ? (user.store.nameEn || user.store.nameAr) : null,
        storeSlug: user.store ? user.store.slug : null,
        redirectUrl,
        isActive: user.isActive,
        status: user.status
      };
    });

    // If storeSlug is provided, filter accounts for that specific store
    let filteredAccounts = accounts;
    if (storeSlug) {
      filteredAccounts = accounts.filter(account => 
        account.storeSlug === storeSlug
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Email check completed',
      messageAr: 'تم التحقق من البريد الإلكتروني',
      email,
      exists: filteredAccounts.length > 0,
      accounts: filteredAccounts,
      totalAccounts: accounts.length
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email',
      messageAr: 'خطأ في التحقق من البريد الإلكتروني',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/login-any:
 *   post:
 *     summary: Login user with any available account
 *     description: Login with email and password, returns all available accounts for the user
 *     tags: [Auth]
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
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         example: "admin"
 *                       storeId:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       storeName:
 *                         type: string
 *                         example: "My Store"
 *                       storeSlug:
 *                         type: string
 *                         example: "my-store"
 *                       redirectUrl:
 *                         type: string
 *                         example: "https://bringus.onrender.com/"
 *                       token:
 *                         type: string
 *                         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
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
router.post('/login-any', [
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
    
    // Normalize email for consistent lookup
    const normalizeEmailFunc = (email) => {
      if (!email) return email;
      let normalized = email.trim().toLowerCase();
      const [localPart, domain] = normalized.split('@');
      if (domain === 'gmail.com' || domain === 'googlemail.com') {
        const normalizedLocal = localPart.replace(/\./g, '');
        normalized = `${normalizedLocal}@${domain}`;
      }
      return normalized;
    };
    
    const normalizedEmail = normalizeEmailFunc(email);
    
    console.log(`🔍 Login-any attempt for email: ${normalizedEmail}`);
    
    // Find all users with this email
    const users = await User.find({ email: normalizedEmail }).select('+password').populate('store', 'nameAr nameEn slug status');
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password against the first user (all users should have same password)
    const firstUser = users[0];
    const isPasswordCorrect = await firstUser.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if any user is active
    const activeUsers = users.filter(user => user.isActive && user.isEmailVerified);
    
    if (activeUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'No active accounts found',
        messageAr: 'لا توجد حسابات نشطة'
      });
    }

    // Generate tokens for all active accounts
    const accounts = activeUsers.map(user => {
      let redirectUrl;
      if (user.role === 'admin' || user.role === 'superadmin') {
        redirectUrl = 'https://bringus.onrender.com/';
      } else {
        redirectUrl = 'https://bringus-main.onrender.com/';
      }

      const token = user.getJwtToken(user.store ? user.store._id : null);

      return {
        role: user.role,
        storeId: user.store ? user.store._id : null,
        storeName: user.store ? (user.store.nameEn || user.store.nameAr) : null,
        storeSlug: user.store ? user.store.slug : null,
        redirectUrl,
        token,
        isActive: user.isActive,
        status: user.status,
        userId: user._id
      };
    });

    // Update last login for all users
    await User.updateMany(
      { _id: { $in: activeUsers.map(u => u._id) } },
      { lastLogin: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      messageAr: 'تم تسجيل الدخول بنجاح',
      email,
      accounts,
      totalAccounts: accounts.length
    });

  } catch (error) {
    console.error('Login-any error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      messageAr: 'خطأ في تسجيل الدخول',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
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
        message: 'Access denied. No token provided.',
        messageAr: 'الوصول مرفوض. لم يتم توفير رمز'
      });
    }

            const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
        const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id).populate('store');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        messageAr: 'رمز غير صالح'
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
        message: 'User not found with this email',
        messageAr: 'المستخدم غير موجود بهذا البريد الإلكتروني'
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
      messageAr: 'تم إرسال رمز إعادة تعيين كلمة المرور إلى البريد الإلكتروني',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    //CONSOLE.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reset email',
      messageAr: 'خطأ في إرسال بريد إعادة التعيين',
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
        message: 'Password reset token is invalid or has expired',
        messageAr: 'رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      messageAr: 'تم تحديث كلمة المرور بنجاح'
    });
  } catch (error) {
    //CONSOLE.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      messageAr: 'خطأ في إعادة تعيين كلمة المرور',
      error: error.message
    });
  }
});

module.exports = router; 