const Affiliation = require('../Models/Affiliation');
const AffiliatePayment = require('../Models/AffiliatePayment');
const User = require('../Models/User');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');

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
        message: 'Store not found'
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
        errors: errors.array()
      });
    }
    
    // Extract store ID from token using the new middleware
    const { getStoreIdFromHeaders } = require('../middleware/storeAuth');
    const storeId = await getStoreIdFromHeaders(req.headers);
    console.log('storeId', storeId);
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID not found in token'
      });
    }
    
    const Store = require('../Models/Store');
    const store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    const domain = store.slug;
    console.log('domain', domain);
    // Check if email already exists in both Affiliation and User models
    const existingAffiliate = await Affiliation.findOne({
      email: req.body.email,
      store: storeId
    });

    const existingUser = await User.findOne({
      email: req.body.email,
      store: storeId
    });

    if (existingAffiliate || existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create user record first (password will be hashed by User model's pre-save hook)
    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password, // Plain password - will be hashed by User model
      phone: req.body.mobile,
      role: 'affiliate',
      status: 'active',
      isActive: true
    };

    const user = await User.create(userData);

    // Generate unique affiliate code
    const affiliateCode = await Affiliation.generateUniqueAffiliateCode();

    const affiliateLink = `http://localhost:5174/${domain}/affiliate/${affiliateCode}`;

    // Add store and userId to the request body
    const affiliateData = {
      ...req.body,
      affiliateLink,
      affiliateCode,
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
        errors: errors.array()
      });
    }

    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const affiliate = await Affiliation.findOne(filter);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    // Check if email is being updated and if it already exists
    if (req.body.email && req.body.email !== affiliate.email) {
      // Extract store ID from token
      const { getStoreIdFromHeaders } = require('../middleware/storeAuth');
      const storeId = await getStoreIdFromHeaders(req.headers);
      
      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID not found in token'
        });
      }
      
      const existingAffiliate = await Affiliation.findOne({
        email: req.body.email,
        store: storeId,
        _id: { $ne: req.params.id }
      });

      const existingUser = await User.findOne({
        email: req.body.email,
        _id: { $ne: affiliate.userId }
      });

      if (existingAffiliate || existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
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
        if (req.body.email) user.email = req.body.email;
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
    const filter = addStoreFilter(req, { _id: req.params.id });
    
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
    const filter = addStoreFilter(req, { _id: req.params.id });
    
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
    const filter = addStoreFilter(req, { _id: req.params.id });
    
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

    // Extract store ID from token
    const { getStoreIdFromHeaders } = require('../middleware/storeAuth');
    const storeId = await getStoreIdFromHeaders(req.headers);
    
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

    if (!affiliateCode || !storeId) {
      return res.status(400).json({
        success: false,
        message: 'Affiliate code and store ID are required'
      });
    }

    const affiliate = await Affiliation.findOne({
      affiliateCode: affiliateCode.toUpperCase(),
      store: storeId,
      status: 'Active'
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found or inactive'
      });
    }

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
      data: affiliateData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting affiliate by code',
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