const Affiliation = require('../Models/Affiliation');
const AffiliatePayment = require('../Models/AffiliatePayment');
const User = require('../Models/User');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');

/**
 * Normalize email address consistently
 * - Converts to lowercase
 * - Removes dots from Gmail addresses (Gmail ignores dots)
 * - Trims whitespace
 */
const normalizeEmail = (email) => {
  if (!email) return email;
  
  // Trim and convert to lowercase
  let normalized = email.trim().toLowerCase();
  
  // For Gmail addresses, remove dots from the local part (before @)
  const [localPart, domain] = normalized.split('@');
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove all dots from the local part
    const normalizedLocal = localPart.replace(/\./g, '');
    normalized = `${normalizedLocal}@${domain}`;
  }
  
  return normalized;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Affiliation:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - mobile
 *         - address
 *         - percent
 *         - store
 *       properties:
 *         firstName:
 *           type: string
 *           description: Affiliate first name
 *           example: "Omar"
 *         lastName:
 *           type: string
 *           description: Affiliate last name
 *           example: "Khaled"
 *         email:
 *           type: string
 *           description: Affiliate email address
 *           example: "omar@example.com"
 *         password:
 *           type: string
 *           description: Affiliate password
 *           example: "password123"
 *         mobile:
 *           type: string
 *           description: Mobile number
 *           example: "+970599888888"
 *         address:
 *           type: string
 *           description: Address
 *           example: "Hebron, Palestine"
 *         percent:
 *           type: number
 *           description: Commission percentage
 *           example: 8
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Suspended, Pending]
 *           description: Affiliate status
 *           example: "Active"
 *         affiliateCode:
 *           type: string
 *           description: Unique affiliate code
 *           example: "ABC12345"
 *         affiliateLink:
 *           type: string
 *           description: Affiliate referral link
 *           example: "https://store.com/ref/ABC12345"
 */

/**
 * @swagger
 * /api/affiliations:
 *   get:
 *     summary: Get all affiliates
 *     description: Retrieve a list of all affiliates for the current store
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Suspended, Pending]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: List of affiliates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Affiliation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     totalItems:
 *                       type: integer
 *                       example: 3
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
const getAllAffiliates = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, storeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add store filter for isolation
    let filter = await addStoreFilter(req);
    
    // Override store filter if storeId is provided (for testing)
    if (storeId && req.user.role === 'superadmin') {
      filter = { store: storeId };
    }
    
    // Add additional filters
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { affiliateCode: { $regex: search, $options: 'i' } }
      ];
    }

    const affiliates = await Affiliation.find(filter)
      .populate('store', 'name domain')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Affiliation.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: affiliates,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    //CONSOLE.error('Get all affiliates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching affiliates',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/stats:
 *   get:
 *     summary: Get affiliate statistics
 *     description: Retrieve affiliate statistics for the store
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Affiliate statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalAffiliates:
 *                       type: integer
 *                       example: 50
 *                     activeAffiliates:
 *                       type: integer
 *                       example: 35
 *                     totalSales:
 *                       type: number
 *                       example: 150000
 *                     totalCommission:
 *                       type: number
 *                       example: 12000
 *                     totalPaid:
 *                       type: number
 *                       example: 8000
 *                     totalBalance:
 *                       type: number
 *                       example: 4000
 *                     totalOrders:
 *                       type: integer
 *                       example: 1500
 *                     totalCustomers:
 *                       type: integer
 *                       example: 1200
 *                     averageCommission:
 *                       type: number
 *                       example: 8.5
 *       500:
 *         description: Internal server error
 */
const getAffiliateStats = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    // Extract store ID from token using the new middleware
    const { getStoreIdFromHeaders } = require('../middleware/storeAuth');
    let targetStoreId = await getStoreIdFromHeaders(req.headers);
    
    if (!targetStoreId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID not found in token'
      });
    }
    
    // Allow superadmin to override store ID
    if (storeId && req.user.role === 'superadmin') {
      targetStoreId = storeId;
    }

    const stats = await Affiliation.getAffiliateStats(targetStoreId);
    
    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalAffiliates: 0,
        activeAffiliates: 0,
        totalSales: 0,
        totalCommission: 0,
        totalPaid: 0,
        totalBalance: 0,
        totalOrders: 0,
        totalCustomers: 0,
        averageCommission: 0
      }
    });
  } catch (error) {
    //CONSOLE.error('Get affiliate stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching affiliate statistics',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/store/{storeId}:
 *   get:
 *     summary: Get affiliates by store ID
 *     description: Retrieve all affiliates for a specific store (public endpoint)
 *     tags: [Affiliation]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439012"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Suspended, Pending]
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of affiliates to return
 *     responses:
 *       200:
 *         description: Affiliates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Affiliation'
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
const getAffiliatesByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status, limit = 10 } = req.query;

    // Verify store exists
    const Store = require('../Models/Store');
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }

    // Build filter
    let filter = { store: storeId };
    
    // Add status filter if provided
    if (status) filter.status = status;

    // Get affiliates
    const affiliates = await Affiliation.find(filter)
      .populate('store', 'name domain')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-password'); // Exclude password from response

    res.status(200).json({
      success: true,
      data: affiliates
    });
  } catch (error) {
    //CONSOLE.error('Get affiliates by store ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching affiliates',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/top-performers:
 *   get:
 *     summary: Get top performing affiliates
 *     description: Retrieve top performing affiliates by sales
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of affiliates to return
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Top performing affiliates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Affiliation'
 *       500:
 *         description: Internal server error
 */
const getTopPerformers = async (req, res) => {
  try {
    const { limit = 10, storeId } = req.query;
    
    // Extract store ID from token using the new middleware
    const { getStoreIdFromHeaders } = require('../middleware/storeAuth');
    let targetStoreId = await getStoreIdFromHeaders(req.headers);
    
    if (!targetStoreId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID not found in token'
      });
    }
    
    // Allow superadmin to override store ID
    if (storeId && req.user.role === 'superadmin') {
      targetStoreId = storeId;
    }

    const topAffiliates = await Affiliation.getTopAffiliates(targetStoreId, parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: topAffiliates
    });
  } catch (error) {
    //CONSOLE.error('Get top performers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top performing affiliates',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/{id}:
 *   get:
 *     summary: Get affiliate by ID
 *     description: Retrieve a specific affiliate by their ID
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliate ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Affiliate retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Affiliation'
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
const getAffiliateById = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    // Add store filter for isolation
    let filter = await addStoreFilter(req, { _id: req.params.id });
    
    // Override store filter if storeId is provided (for testing)
    if (storeId && req.user.role === 'superadmin') {
      filter = { _id: req.params.id, store: storeId };
    }
    
    const affiliate = await Affiliation.findOne(filter)
      .populate('store', 'name domain')
      .populate('verifiedBy', 'firstName lastName');

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: affiliate
    });
  } catch (error) {
    //CONSOLE.error('Get affiliate by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching affiliate',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations:
 *   post:
 *     summary: Create new affiliate
 *     description: Create a new affiliate partner
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Affiliation'
 *     responses:
 *       201:
 *         description: Affiliate created successfully
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
 *                   example: "Affiliate created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Affiliation'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const createAffiliate = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل في التحقق من صحة البيانات',
        errors: errors.array()
      });
    }
    
    // Extract store ID with multiple fallback strategies
    let storeId = null;
    
    // Strategy 1: Try to get from token
    const { getStoreIdFromHeaders } = require('../middleware/storeAuth');
    storeId = await getStoreIdFromHeaders(req.headers);
    console.log('storeId from token:', storeId);
    
    // Strategy 2: If not in token, try req.user.store (from authenticated user)
    if (!storeId && req.user && req.user.store) {
      storeId = req.user.store;
      console.log('storeId from req.user.store:', storeId);
    }
    
    // Strategy 3: If still not found, look up user's Owner record
    if (!storeId && req.user) {
      const Owner = require('../Models/Owner');
      const owner = await Owner.findOne({ 
        userId: req.user._id,
        status: 'active'
      });
      if (owner && owner.storeId) {
        storeId = owner.storeId;
        console.log('storeId from Owner record:', storeId);
      }
    }
    
    // Strategy 4: Check if storeId is provided in request body or query (for superadmin)
    if (!storeId && req.user && req.user.role === 'superadmin') {
      storeId = req.body.store || req.query.storeId;
      console.log('storeId from request (superadmin):', storeId);
    }
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID not found. Please ensure you are logged in with a store-associated account or provide storeId in the request.',
        messageAr: 'معرف المتجر غير موجود. يرجى التأكد من تسجيل الدخول بحساب مرتبط بمتجر أو توفير معرف المتجر في الطلب.'
      });
    }
    
    const Store = require('../Models/Store');
    const store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }
    
    const domain = store.slug;
    const baseDomain = 'https://bringus-main.onrender.com';
    console.log('domain', domain);
    
    // Normalize email for consistent storage and duplicate checking
    const normalizedEmail = normalizeEmail(req.body.email);

    // CRITICAL SECURITY: Check if email already exists in the same store (ANY ROLE)
    const existingUserInStore = await User.findOne({
      email: normalizedEmail,
      store: storeId
      // Do NOT filter by role - email must be unique per store
    });

    if (existingUserInStore) {
      return res.status(409).json({
        success: false,
        message: `This email is already registered in this store as ${existingUserInStore.role}. Please use a different email.`,
        messageAr: `هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر بدور ${existingUserInStore.role}. يرجى استخدام بريد إلكتروني مختلف.`,
        error: {
          code: 'DUPLICATE_EMAIL_IN_STORE',
          existingRole: existingUserInStore.role,
          newRole: 'affiliate'
        }
      });
    }

    // Check if email already exists in Affiliation model for this store
    const existingAffiliate = await Affiliation.findOne({
      email: normalizedEmail,
      store: storeId
    });

    if (existingAffiliate) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists as affiliate in this store',
        messageAr: 'البريد الإلكتروني موجود بالفعل كمسوق بالعمولة في هذا المتجر'
      });
    }

    // Create user record first (password will be hashed by User model's pre-save hook)
    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: normalizedEmail,
      password: req.body.password, // Plain password - will be hashed by User model
      phone: req.body.mobile,
      role: 'affiliate',
      status: 'active',
      isActive: true,
      store: storeId // Add store reference to user
    };

    const user = await User.create(userData);

    // Generate unique affiliate link and code using the Model's static method
    // This ensures 100% uniqueness by checking the database
    const { affiliateLink, affiliateCode } = await Affiliation.generateUniqueAffiliateLink(domain);
    
    console.log('✅ Generated unique affiliate link:', affiliateLink);
    console.log('✅ Generated unique affiliate code:', affiliateCode);

    // Add store, userId, normalized email, and generated link/code to the request body
    const affiliateData = {
      ...req.body,
      email: normalizedEmail,  // Use normalized email
      affiliateLink,    // Backend-generated, guaranteed unique
      affiliateCode,    // Backend-generated, guaranteed unique
      store: storeId,
      userId: user._id
    };

    const affiliate = await Affiliation.create(affiliateData);

    // Remove password from response
    const affiliateResponse = affiliate.toObject();
    delete affiliateResponse.password;

    res.status(201).json({
      success: true,
      message: 'Affiliate created successfully',
      data: affiliateResponse
    });
  } catch (error) {
    //CONSOLE.error('Create affiliate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating affiliate',
      messageAr: 'خطأ في إنشاء الشريك',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/{id}:
 *   put:
 *     summary: Update affiliate
 *     description: Update an existing affiliate
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Affiliation'
 *     responses:
 *       200:
 *         description: Affiliate updated successfully
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
 *                   example: "Affiliate updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Affiliation'
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
const updateAffiliate = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل في التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    // Add store filter for isolation
    const filter = await addStoreFilter(req, { _id: req.params.id });
    
    const affiliate = await Affiliation.findOne(filter);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found',
        messageAr: 'الشريك غير موجود'
      });
    }

    // Check if email is being updated and if it already exists
    if (req.body.email) {
      const normalizedEmail = normalizeEmail(req.body.email);
      
      if (normalizedEmail !== affiliate.email) {
        // Extract store ID with fallbacks
        let storeId = null;
        const { getStoreIdFromHeaders } = require('../middleware/storeAuth');
        storeId = await getStoreIdFromHeaders(req.headers);
        
        if (!storeId && req.user && req.user.store) {
          storeId = req.user.store;
        }
        
        if (!storeId) {
          const Owner = require('../Models/Owner');
          const owner = await Owner.findOne({ 
            userId: req.user._id,
            status: 'active'
          });
          if (owner && owner.storeId) {
            storeId = owner.storeId;
          }
        }
        
        if (!storeId) {
          return res.status(400).json({
            success: false,
            message: 'Store ID not found in token',
            messageAr: 'معرف المتجر غير موجود في الرمز المميز'
          });
        }
        
        // CRITICAL SECURITY: Check if email exists in same store (ANY ROLE)
        const existingUserInStore = await User.findOne({
          email: normalizedEmail,
          store: storeId,
          _id: { $ne: affiliate.userId }
        });

        if (existingUserInStore) {
          return res.status(409).json({
            success: false,
            message: `This email is already registered in this store as ${existingUserInStore.role}. Please use a different email.`,
            messageAr: `هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر بدور ${existingUserInStore.role}. يرجى استخدام بريد إلكتروني مختلف.`
          });
        }

        // Check if email exists in Affiliation model for this store
        const existingAffiliate = await Affiliation.findOne({
          email: normalizedEmail,
          store: storeId,
          _id: { $ne: req.params.id }
        });

        if (existingAffiliate) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists as affiliate in this store',
            messageAr: 'البريد الإلكتروني موجود بالفعل كمسوق بالعمولة في هذا المتجر'
          });
        }
        
        // Use normalized email
        req.body.email = normalizedEmail;
      }
    }

    // Update affiliate
    Object.assign(affiliate, req.body);
    await affiliate.save();

    // Update corresponding user record
    if (Object.keys(req.body).some(key => ['firstName', 'lastName', 'email', 'password', 'mobile'].includes(key))) {
      const user = await User.findById(affiliate.userId);
      if (user) {
        if (req.body.firstName) user.firstName = req.body.firstName;
        if (req.body.lastName) user.lastName = req.body.lastName;
        if (req.body.email) user.email = normalizeEmail(req.body.email);
        if (req.body.password) user.password = req.body.password; // Plain password - will be hashed by User model's pre-save hook
        if (req.body.mobile) user.phone = req.body.mobile;
        
        await user.save(); // This will trigger the pre-save middleware for password hashing
      }
    }

    // Remove password from response
    const affiliateResponse = affiliate.toObject();
    delete affiliateResponse.password;

    res.status(200).json({
      success: true,
      message: 'Affiliate updated successfully',
      data: affiliateResponse
    });
  } catch (error) {
    //CONSOLE.error('Update affiliate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating affiliate',
      messageAr: 'خطأ في تحديث الشريك',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/{id}/verify:
 *   patch:
 *     summary: Verify affiliate
 *     description: Verify an affiliate account
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliate ID
 *     responses:
 *       200:
 *         description: Affiliate verified successfully
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
 *                   example: "Affiliate verified successfully"
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
const verifyAffiliate = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = await addStoreFilter(req, { _id: req.params.id });
    
    const affiliate = await Affiliation.findOne(filter);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    await affiliate.verify(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Affiliate verified successfully'
    });
  } catch (error) {
    //CONSOLE.error('Verify affiliate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying affiliate',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/{id}/payments:
 *   get:
 *     summary: Get affiliate payments
 *     description: Retrieve payment history for a specific affiliate
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliate ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: Affiliate payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AffiliatePayment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     totalItems:
 *                       type: integer
 *                       example: 3
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
const getAffiliatePayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add store filter for isolation
    const filter = await addStoreFilter(req, { _id: req.params.id });
    
    const affiliate = await Affiliation.findOne(filter);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    // Extract store ID from token
    const { getStoreIdFromHeaders } = require('../middleware/storeAuth');
    const storeId = await getStoreIdFromHeaders(req.headers);
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID not found in token'
      });
    }
    
    // Build payment filter
    let paymentFilter = {
      store: storeId,
      affiliate: req.params.id
    };

    if (status) {
      paymentFilter.paymentStatus = status;
    }

    const payments = await AffiliatePayment.find(paymentFilter)
      .populate('processedBy', 'firstName lastName')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AffiliatePayment.countDocuments(paymentFilter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    //CONSOLE.error('Get affiliate payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching affiliate payments',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/{id}/payments:
 *   post:
 *     summary: Create affiliate payment
 *     description: Create a new payment for an affiliate
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *               - paymentDate
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, paypal, cash, check, credit_card]
 *                 example: "bank_transfer"
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               description:
 *                 type: string
 *                 example: "Monthly commission payment"
 *               notes:
 *                 type: string
 *                 example: "Payment for January 2024"
 *     responses:
 *       201:
 *         description: Payment created successfully
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
 *                   example: "Payment created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/AffiliatePayment'
 *       404:
 *         description: Affiliate not found
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const createAffiliatePayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add store filter for isolation
    const filter = await addStoreFilter(req, { _id: req.params.id });
    
    const affiliate = await Affiliation.findOne(filter);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    // Check if payment amount exceeds balance
    if (req.body.amount > affiliate.balance) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds available balance'
      });
    }

    // Extract store ID with fallbacks
    let storeId = null;
    const { getStoreIdFromHeaders } = require('../middleware/storeAuth');
    storeId = await getStoreIdFromHeaders(req.headers);
    
    if (!storeId && req.user && req.user.store) {
      storeId = req.user.store;
    }
    
    if (!storeId) {
      const Owner = require('../Models/Owner');
      const owner = await Owner.findOne({ 
        userId: req.user._id,
        status: 'active'
      });
      if (owner && owner.storeId) {
        storeId = owner.storeId;
      }
    }
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID not found in token'
      });
    }
    
    // Create payment
    const paymentData = {
      ...req.body,
      store: storeId,
      affiliate: req.params.id,
      processedBy: req.user._id,
      previousBalance: affiliate.balance,
      newBalance: affiliate.balance - req.body.amount
    };

    const payment = await AffiliatePayment.create(paymentData);

    // Update affiliate balance
    await affiliate.processPayment(req.body.amount, req.body.paymentMethod, payment.reference);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    //CONSOLE.error('Create affiliate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/code/{affiliateCode}:
 *   get:
 *     summary: Get affiliate by code
 *     description: Get affiliate information by affiliate code (public endpoint)
 *     tags: [Affiliation]
 *     parameters:
 *       - in: path
 *         name: affiliateCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliate code
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Affiliate found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Affiliation'
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
const getAffiliateByCode = async (req, res) => {
  try {
    const { affiliateCode } = req.params;
    const { storeId } = req.query;

    console.log(`🔍 [getAffiliateByCode] Searching for affiliate:`);
    console.log(`   Code: ${affiliateCode} (will convert to: ${affiliateCode.toUpperCase()})`);
    console.log(`   StoreId: ${storeId}`);

    if (!affiliateCode || !storeId) {
      return res.status(400).json({
        success: false,
        message: 'Affiliate code and store ID are required',
        messageAr: 'كود الشريك ومعرف المتجر مطلوبان'
      });
    }

    // First, try to find the affiliate with Active status
    const normalizedCode = affiliateCode.trim().toUpperCase();
    
    let affiliate = await Affiliation.findOne({
      affiliateCode: normalizedCode,
      store: storeId,
      status: 'Active'
    });

    // If not found with Active status, check if affiliate exists with any status
    if (!affiliate) {
      console.log(`⚠️ [getAffiliateByCode] Affiliate not found with status 'Active'`);
      console.log(`   Checking if affiliate exists with any status...`);
      
      const anyAffiliate = await Affiliation.findOne({
        affiliateCode: normalizedCode,
        store: storeId
      });

      if (anyAffiliate) {
        console.log(`❌ [getAffiliateByCode] Affiliate found but status is: ${anyAffiliate.status}`);
        return res.status(404).json({
          success: false,
          message: `Affiliate is not active. Current status: ${anyAffiliate.status}`,
          messageAr: `الشريك غير نشط. الحالة الحالية: ${anyAffiliate.status}`,
          error: {
            code: 'AFFILIATE_NOT_ACTIVE',
            currentStatus: anyAffiliate.status,
            affiliateId: anyAffiliate._id
          }
        });
      }

      // Check if affiliate exists with different code format (case-insensitive)
      const affiliateAnyCase = await Affiliation.findOne({
        affiliateCode: { $regex: new RegExp(`^${affiliateCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        store: storeId
      });

      if (affiliateAnyCase) {
        console.log(`⚠️ [getAffiliateByCode] Found affiliate with different case: ${affiliateAnyCase.affiliateCode}`);
        console.log(`   Status: ${affiliateAnyCase.status}`);
        
        if (affiliateAnyCase.status === 'Active') {
          affiliate = affiliateAnyCase;
        } else {
          return res.status(404).json({
            success: false,
            message: `Affiliate is not active. Current status: ${affiliateAnyCase.status}`,
            messageAr: `الشريك غير نشط. الحالة الحالية: ${affiliateAnyCase.status}`,
            error: {
              code: 'AFFILIATE_NOT_ACTIVE',
              currentStatus: affiliateAnyCase.status,
              affiliateCode: affiliateAnyCase.affiliateCode
            }
          });
        }
      } else {
        // Get all affiliates in this store for debugging
        const allAffiliates = await Affiliation.find({ store: storeId })
          .select('affiliateCode status firstName lastName')
          .limit(20);
        
        console.log(`❌ [getAffiliateByCode] Affiliate not found at all`);
        console.log(`   Available affiliates in store (${allAffiliates.length}):`);
        allAffiliates.forEach(a => {
          console.log(`   - Code: "${a.affiliateCode}", Status: ${a.status}, Name: ${a.firstName} ${a.lastName}`);
        });
        
        return res.status(404).json({
          success: false,
          message: 'Affiliate not found',
          messageAr: 'الشريك غير موجود',
          error: {
            code: 'AFFILIATE_NOT_FOUND',
            searchedCode: normalizedCode,
            storeId: storeId,
            availableAffiliates: allAffiliates.map(a => ({
              code: a.affiliateCode,
              status: a.status,
              name: `${a.firstName} ${a.lastName}`
            }))
          }
        });
      }
    }

    console.log(`✅ [getAffiliateByCode] Affiliate found: ${affiliate.firstName} ${affiliate.lastName}`);
    console.log(`   Code: ${affiliate.affiliateCode}, Status: ${affiliate.status}`);

    // Return only necessary information for tracking
    const affiliateData = {
      id: affiliate._id,
      firstName: affiliate.firstName,
      lastName: affiliate.lastName,
      email: affiliate.email,
      affiliateCode: affiliate.affiliateCode,
      affiliateLink: affiliate.affiliateLink,
      percent: affiliate.percent,
      status: affiliate.status
    };

    res.status(200).json({
      success: true,
      message: 'Affiliate found successfully',
      messageAr: 'تم العثور على الشريك بنجاح',
      data: affiliateData
    });
  } catch (error) {
    console.error('❌ [getAffiliateByCode] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting affiliate by code',
      messageAr: 'خطأ في الحصول على الشريك',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/affiliations/{id}:
 *   delete:
 *     summary: Delete affiliate
 *     description: Delete an affiliate by ID
 *     tags: [Affiliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Affiliate ID
 *     responses:
 *       200:
 *         description: Affiliate deleted successfully
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
 *                   example: "Affiliate deleted successfully"
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
const deleteAffiliate = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = await addStoreFilter(req, { _id: req.params.id });
    const affiliate = await Affiliation.findOne(filter);
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }
    
    // Delete the affiliate record
    await Affiliation.deleteOne({ _id: affiliate._id });
    
    // Delete the corresponding user record
    if (affiliate.userId) {
      await User.findByIdAndDelete(affiliate.userId);
    }
    
    res.status(200).json({
      success: true,
      message: 'Affiliate deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting affiliate',
      error: error.message
    });
  }
};

module.exports = {
  getAllAffiliates,
  getAffiliateStats,
  getTopPerformers,
  getAffiliateById,
  getAffiliatesByStoreId,
  createAffiliate,
  updateAffiliate,
  verifyAffiliate,
  getAffiliatePayments,
  createAffiliatePayment,
  deleteAffiliate,
  getAffiliateByCode,
}; 