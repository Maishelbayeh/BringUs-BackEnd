const User = require('../Models/User');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');
const Store = require('../Models/Store');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

/**
 * Normalize email address consistently across all operations
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
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           description: User's first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           description: User's last name
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           description: User's password (min 6 characters)
 *           example: "password123"
 *         phone:
 *           type: string
 *           description: User's phone number
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           enum: [user, admin, moderator]
 *           description: User's role
 *           example: "user"
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "User created successfully"
 *         data:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *           description: JWT token for authentication
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Register a new user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           example:
 *             firstName: "John"
 *             lastName: "Doe"
 *             email: "john.doe@example.com"
 *             password: "password123"
 *             phone: "+1234567890"
 *             role: "user"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       409:
 *         description: Conflict - user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User already exists with this email"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error creating user"
 */
const createUser = async (req, res) => {
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

    const { firstName, lastName, email, password, phone, role, store, addresses, status } = req.body;

    // Normalize email for consistent storage and duplicate checking
    const normalizedEmail = normalizeEmail(email);

    // CRITICAL SECURITY: Check if email already exists in the same store (ANY ROLE)
    // This prevents cross-role account conflicts and security issues
    if (store) {
      const existingUserInStore = await User.findOne({ 
        email: normalizedEmail,
        store: store
        // ❌ DO NOT check role - email must be unique per store regardless of role
      });
      
      if (existingUserInStore) {
        return res.status(409).json({
          success: false,
          message: `This email is already registered in this store as ${existingUserInStore.role}. Please use a different email.`,
          messageAr: `هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر بدور ${existingUserInStore.role}. يرجى استخدام بريد إلكتروني مختلف.`,
          error: {
            code: 'DUPLICATE_EMAIL_IN_STORE',
            existingRole: existingUserInStore.role,
            newRole: role
          }
        });
      }
    }

    // For admin and superadmin roles, check if email already exists with these roles globally
    if (role === 'admin' || role === 'superadmin') {
      const existingAdminUser = await User.findOne({ 
        email: normalizedEmail,
        role: role
      });
      if (existingAdminUser) {
        return res.status(409).json({
          success: false,
          message: `User with ${role} role already exists with this email`,
          messageAr: `المستخدم بدور ${role} موجود بالفعل بهذا البريد الإلكتروني`
        });
      }
    }

    // Prepare user data
    const userData = {
      firstName,
      lastName,
      email: normalizedEmail,  // Use normalized email
      password,
      phone,
      role: role || 'client',
      status: status || 'active'
    };

    // Handle addresses - filter out addresses with empty required fields
    if (addresses && Array.isArray(addresses)) {
      userData.addresses = addresses.filter(addr => 
        addr.street && addr.street.trim() && 
        addr.city && addr.city.trim() && 
        addr.state && addr.state.trim() && 
        addr.country && addr.country.trim()
        // zipCode is optional, so we don't validate it
      );
    } else {
      userData.addresses = [];
    }
    // Add store if provided and user is admin or client
    if (store && (userData.role === 'admin' || userData.role === 'client')) {
      // If store is an object with _id, extract the _id
      userData.store = typeof store === 'object' && store._id ? store._id : store;
      console.log(`🔧 Store assigned to user: ${userData.store}`);
    } else {
      console.log(`⚠️  No store assigned. Store: ${store}, Role: ${userData.role}`);
    }
    
    // Validate store requirement for admin and client roles
    if ((userData.role === 'admin' || userData.role === 'client') && !userData.store) {
      return res.status(400).json({
        success: false,
        message: 'Store is required for admin and client roles',
        messageAr: 'المتجر مطلوب لأدوار المدير والعميل'
      });
    }

    // Create user
    console.log(`🔧 Creating user with data:`, {
      email: userData.email,
      role: userData.role,
      store: userData.store,
      addressesCount: userData.addresses.length
    });
    const user = await User.create(userData);
    console.log(`✅ User created with ID: ${user._id}, Store: ${user.store}`);

    // Generate JWT token
    const token = user.getJwtToken();

    // Check if user is an owner
    let isOwner = false;
    if (user.role === 'admin') {
      try {
        const Owner = require('../Models/Owner');
        const owners = await Owner.find({ 
          userId: user._id, 
          status: 'active' 
        });
        isOwner = owners.length > 0;
      } catch (error) {
        // Don't fail if owner check fails
      }
    }

    // Remove password from response
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      addresses: user.addresses,
      store: user.store,
      createdAt: user.createdAt,
      isOwner: isOwner
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        store: user.store
      }
    });
  } catch (error) {
    //CONSOLE.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      messageAr: 'خطأ في إنشاء المستخدم',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users (Admin only)
 *     tags: [Users]
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
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, moderator]
 *         description: Filter by user role
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, customerOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add store filter for isolation
    const filter = await addStoreFilter(req);
    
    // Filter by role if specified
    if (role) filter.role = role;
    
    // Filter customers only if requested
    if (customerOnly === 'true') {
      filter.role = { $in: ['client', 'wholesaler'] };
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('store', 'name domain')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add owner flag for admin users
    const usersWithOwnerFlag = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      if (user.role === 'admin') {
        try {
          const Owner = require('../Models/Owner');
          const owners = await Owner.find({ 
            userId: user._id, 
            status: 'active' 
          });
          userObj.isOwner = owners.length > 0;
        } catch (error) {
          userObj.isOwner = false;
        }
      } else {
        userObj.isOwner = false;
      }
      return userObj;
    }));

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: usersWithOwnerFlag,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    //CONSOLE.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      messageAr: 'خطأ في جلب المستخدمين',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
const getUserById = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = await addStoreFilter(req, { _id: req.params.id });
    
    const user = await User.findOne(filter)
      .select('-password')
      .populate('store', 'name domain');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Add owner flag for admin users
    const userObj = user.toObject();
    if (user.role === 'admin') {
      try {
        const Owner = require('../Models/Owner');
        const owners = await Owner.find({ 
          userId: user._id, 
          status: 'active' 
        });
        userObj.isOwner = owners.length > 0;
      } catch (error) {
        userObj.isOwner = false;
      }
    } else {
      userObj.isOwner = false;
    }

    res.status(200).json({
      success: true,
      data: userObj
    });
  } catch (error) {
    //CONSOLE.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      messageAr: 'خطأ في جلب المستخدم',
      error: error.message
    });
  }
};

// Get customers only (clients)
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add store filter for isolation
    const filter = await addStoreFilter(req);
    filter.role = { $in: ['client', 'wholesaler'] }; // Only customers
    
    if (status) filter.status = status;

    const customers = await User.find(filter)
      .select('-password')
      .populate('store', 'name domain')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add owner flag for admin users
    const customersWithOwnerFlag = await Promise.all(customers.map(async (user) => {
      const userObj = user.toObject();
      if (user.role === 'admin') {
        try {
          const Owner = require('../Models/Owner');
          const owners = await Owner.find({ 
            userId: user._id, 
            status: 'active' 
          });
          userObj.isOwner = owners.length > 0;
        } catch (error) {
          userObj.isOwner = false;
        }
      } else {
        userObj.isOwner = false;
      }
      return userObj;
    }));

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: customersWithOwnerFlag,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    //CONSOLE.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      messageAr: 'خطأ في جلب العملاء',
      error: error.message
    });
  }
};

// Get store staff (admins and owners)
const getStoreStaff = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add store filter for isolation
    const filter = await addStoreFilter(req);
    filter.role = { $in: ['admin', 'superadmin'] }; // Only staff
    
    if (role) filter.role = role;

    const staff = await User.find(filter)
      .select('-password')
      .populate('store', 'name domain')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add owner flag for admin users
    const staffWithOwnerFlag = await Promise.all(staff.map(async (user) => {
      const userObj = user.toObject();
      if (user.role === 'admin') {
        try {
          const Owner = require('../Models/Owner');
          const owners = await Owner.find({ 
            userId: user._id, 
            status: 'active' 
          });
          userObj.isOwner = owners.length > 0;
        } catch (error) {
          userObj.isOwner = false;
        }
      } else {
        userObj.isOwner = false;
      }
      return userObj;
    }));

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: staffWithOwnerFlag,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    //CONSOLE.error('Get store staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store staff',
      messageAr: 'خطأ في جلب موظفي المتجر',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update an existing user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               role:
 *                 type: string
 *                 enum: [client, admin, superadmin]
 *                 example: "client"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 example: "active"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               isEmailVerified:
 *                 type: boolean
 *                 example: true
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [home, work, other]
 *                     street:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     zipCode:
 *                       type: string
 *                     country:
 *                       type: string
 *                     isDefault:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: "User updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
const updateUser = async (req, res) => {
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

    const { id } = req.params;
    const { firstName, lastName, email, phone, role, status, isActive, isEmailVerified, addresses, store } = req.body;

    // Add store filter for isolation
    const filter = await addStoreFilter(req, { _id: id });

    // Check if user exists
    const existingUser = await User.findOne(filter);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const normalizedEmail = normalizeEmail(email);
      if (normalizedEmail !== existingUser.email) {
        const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists',
            messageAr: 'البريد الإلكتروني موجود بالفعل'
          });
        }
      }
    }

    // Prepare update data
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) updateData.email = normalizeEmail(email);
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isEmailVerified !== undefined) updateData.isEmailVerified = isEmailVerified;

    // Handle addresses - filter out addresses with empty required fields
    if (addresses && Array.isArray(addresses)) {
      updateData.addresses = addresses.filter(addr => 
        addr.street && addr.street.trim() && 
        addr.city && addr.city.trim() && 
        addr.state && addr.state.trim() && 
        addr.zipCode && addr.zipCode.trim() && 
        addr.country && addr.country.trim()
      );
    }

    // Handle store update (only for admin/superadmin roles)
    if (store !== undefined && (role === 'admin' || role === 'client' || existingUser.role === 'admin' || existingUser.role === 'client')) {
      // If store is an object with _id, extract the _id
      updateData.store = typeof store === 'object' && store._id ? store._id : store;
    }

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('store', 'name domain');

    // Add owner flag for admin users
    const userObj = updatedUser.toObject();
    if (updatedUser.role === 'admin') {
      try {
        const Owner = require('../Models/Owner');
        const owners = await Owner.find({ 
          userId: updatedUser._id, 
          status: 'active' 
        });
        userObj.isOwner = owners.length > 0;
      } catch (error) {
        userObj.isOwner = false;
      }
    } else {
      userObj.isOwner = false;
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userObj
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      messageAr: 'خطأ في تحديث المستخدم',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: "User deleted successfully"
 *       404:
 *         description: User not found
 *       400:
 *         description: Cannot delete yourself or other admins
 *       500:
 *         description: Internal server error
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Add store filter for isolation
    const filter = await addStoreFilter(req, { _id: id });

    // Check if user exists
    const userToDelete = await User.findOne(filter);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Prevent user from deleting themselves
    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself',
        messageAr: 'لا يمكنك حذف نفسك'
      });
    }

    // Prevent non-superadmin from deleting other admins/superadmins
    if (req.user.role !== 'superadmin' && (userToDelete.role === 'admin' || userToDelete.role === 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete admin or superadmin users',
        messageAr: 'لا يمكنك حذف مستخدمي المدير أو المدير الأعلى'
      });
    }

    // Delete user
    await User.findOneAndDelete(filter);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      messageAr: 'خطأ في حذف المستخدم',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     description: Update the current authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 pattern: "^[\\+]?[1-9][\\d]{0,15}$"
 *                 example: "+1234567890"
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [home, work, other]
 *                     street:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     zipCode:
 *                       type: string
 *                     country:
 *                       type: string
 *                     isDefault:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - validation errors
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
const updateCurrentUserProfile = async (req, res) => {
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

    const userId = req.user._id; // Get user ID from token
    const { firstName, lastName, email, phone, addresses } = req.body;

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const normalizedEmail = normalizeEmail(email);
      if (normalizedEmail !== existingUser.email) {
        const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists',
            messageAr: 'البريد الإلكتروني موجود بالفعل'
          });
        }
      }
    }

    // Prepare update data (users can only update certain fields)
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) updateData.email = normalizeEmail(email);
    if (phone !== undefined) updateData.phone = phone;

    // Handle addresses - filter out addresses with empty required fields
    if (addresses && Array.isArray(addresses)) {
      updateData.addresses = addresses.filter(addr => 
        addr.street && addr.street.trim() && 
        addr.city && addr.city.trim() && 
        addr.state && addr.state.trim() && 
        addr.zipCode && addr.zipCode.trim() && 
        addr.country && addr.country.trim()
      );
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('store', 'name domain');

    // Add owner flag for admin users
    const userObj = updatedUser.toObject();
    if (updatedUser.role === 'admin') {
      try {
        const Owner = require('../Models/Owner');
        const owners = await Owner.find({ 
          userId: updatedUser._id, 
          status: 'active' 
        });
        userObj.isOwner = owners.length > 0;
      } catch (error) {
        userObj.isOwner = false;
      }
    } else {
      userObj.isOwner = false;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userObj
    });
  } catch (error) {
    console.error('Update current user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      messageAr: 'خطأ في تحديث الملف الشخصي',
      error: error.message
    });
  }
};

// Email verification functions
const sendEmailVerification = async (req, res) => {
  try {
    const { email, storeSlug } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        messageAr: 'البريد الإلكتروني مطلوب'
      });
    }

    // Validate storeSlug
    if (!storeSlug) {
      return res.status(400).json({
        success: false,
        message: 'Store slug is required',
        messageAr: 'رابط المتجر مطلوب'
      });
    }

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
        messageAr: 'المستخدم غير موجود بهذا البريد الإلكتروني'
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
        messageAr: 'البريد الإلكتروني محقق بالفعل'
      });
    }

    // Get store information
    let storeName = 'Our Store';
    let storeEmail = 'info@bringus.com';
    const store = await Store.findOne({ slug: storeSlug });
    if (store) {
      storeName = store.nameEn || store.nameAr || storeName;
      storeEmail = store.contact.email || storeEmail;
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Store OTP in user document with expiration (1 minute)
    const otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
    
    user.emailVerificationOTP = otp;
    user.emailVerificationExpiry = otpExpiry;
    await user.save();

    // Email content
    const emailSubject = `Email Verification - ${storeName}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Email Verification</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hello ${user.firstName} ${user.lastName},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for registering with <strong>${storeName}</strong>. To complete your registration, please use the following verification code:
          </p>
          
          <div style="background-color: #f0f8ff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <h1 style="color: #007bff; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <strong>Important:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <li>This code will expire in 1 minute</li>
            <li>Do not share this code with anyone</li>
            <li>If you didn't request this verification, please ignore this email</li>
          </ul>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            If you have any questions, please contact our support team.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              <strong>${storeName}</strong> Team
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email using Mailtrap service
    const emailService = require('../services/emailService');
    const emailResult = await emailService.sendVerificationEmail(email, otp, storeName, storeEmail);
    
    if (!emailResult.success) {
      console.log('⚠️ Email sending failed, but OTP is available in logs for testing');
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        email: user.email,
        expiresIn: '1 minute'
      }
    });

  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification code',
      messageAr: 'خطأ في إرسال رمز التحقق',
      error: error.message
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
        messageAr: 'البريد الإلكتروني ورمز التحقق مطلوبان'
      });
    }

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
        messageAr: 'البريد الإلكتروني محقق بالفعل'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.emailVerificationOTP || !user.emailVerificationExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.',
        messageAr: 'لم يتم العثور على رمز التحقق. يرجى طلب رمز جديد.'
      });
    }

    // Check if OTP is expired
    if (new Date() > user.emailVerificationExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        messageAr: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.'
      });
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        messageAr: 'رمز التحقق غير صحيح'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpiry = undefined;
    user.emailVerifiedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt
      }
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      messageAr: 'خطأ في التحقق من البريد الإلكتروني',
      error: error.message
    });
  }
};

const resendEmailVerification = async (req, res) => {
  try {
    const { email, storeSlug } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        messageAr: 'البريد الإلكتروني مطلوب'
      });
    }

    // Validate storeSlug
    if (!storeSlug) {
      return res.status(400).json({
        success: false,
        message: 'Store slug is required',
        messageAr: 'رابط المتجر مطلوب'
      });
    }

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
        messageAr: 'المستخدم غير موجود بهذا البريد الإلكتروني'
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
        messageAr: 'البريد الإلكتروني محقق بالفعل'
      });
    }

    // Check if there's a recent OTP request (prevent spam)
    if (user.emailVerificationExpiry && new Date() < user.emailVerificationExpiry) {
      const timeLeft = Math.ceil((user.emailVerificationExpiry - new Date()) / 1000 / 60);
      return res.status(400).json({
        success: false,
        message: `Please wait ${timeLeft} minutes before requesting a new verification code`,
        messageAr: `يرجى الانتظار ${timeLeft} دقائق قبل طلب رمز تحقق جديد`
      });
    }


    // Get store information
    let storeName = 'Our Store';
    let storeEmail = 'info@bringus.com';
    const store = await Store.findOne({ slug: storeSlug }); // get store by slug
    if (store) {
      storeName = store.nameEn || store.nameAr || storeName;
      storeEmail = store.contact.email || storeEmail;
    }

    // Generate new 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Store new OTP with expiration (1 minute)
    const otpExpiry = new Date(Date.now() + 1 * 60 * 1000);
    
    user.emailVerificationOTP = otp;
    user.emailVerificationExpiry = otpExpiry;
    await user.save();

    // Email content
    const emailSubject = `Email Verification - ${storeName}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Email Verification</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hello ${user.firstName} ${user.lastName},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            You requested a new verification code for your account at <strong>${storeName}</strong>. Please use the following verification code:
          </p>
          
          <div style="background-color: #f0f8ff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <h1 style="color: #007bff; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <strong>Important:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <li>This code will expire in 1 minute</li>
            <li>Do not share this code with anyone</li>
            <li>If you didn't request this verification, please ignore this email</li>
          </ul>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            If you have any questions, please contact our support team.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              <strong>${storeName}</strong> Team
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email using Mailtrap service
    const emailService = require('../services/emailService');
    const emailResult = await emailService.sendVerificationEmail(email, otp, storeName, storeEmail);
    
    if (!emailResult.success) {
      console.log('⚠️ Email sending failed, but OTP is available in logs for testing');
    }

   
    res.status(200).json({
      success: true,
      message: 'New verification code sent successfully',
      data: {
        email: user.email,
        expiresIn: '1 minute'
      }
    });


  } catch (error) {
    console.error('Resend email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification code',
      messageAr: 'خطأ في إرسال رمز التحقق',
      error: error.message
    });
  }

};

// Check email verification status
const checkEmailVerificationStatus = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        messageAr: 'البريد الإلكتروني مطلوب'
      });
    }

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
        messageAr: 'المستخدم غير موجود بهذا البريد الإلكتروني'
      });
    }

    // Check verification status
    const isVerified = user.isEmailVerified;
    const hasPendingOTP = user.emailVerificationOTP && user.emailVerificationExpiry && new Date() < user.emailVerificationExpiry;
    const otpExpired = user.emailVerificationOTP && user.emailVerificationExpiry && new Date() > user.emailVerificationExpiry;

    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        isEmailVerified: isVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        hasPendingVerification: hasPendingOTP,
        otpExpired: otpExpired,
        status: isVerified ? 'verified' : (hasPendingOTP ? 'pending' : 'not_verified')
      }
    });

  } catch (error) {
    console.error('Check email verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email verification status',
      messageAr: 'خطأ في التحقق من حالة التحقق من البريد الإلكتروني',
      error: error.message
    });
  }
};

// Forgot password - send reset email
const forgotPassword = async (req, res) => {
  try {
    const { email, storeSlug, baseUrl } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        messageAr: 'البريد الإلكتروني مطلوب'
      });
    }

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
        messageAr: 'المستخدم غير موجود بهذا البريد الإلكتروني'
      });
    }

    // Get store information
    let storeName = 'Our Store';
    let storeEmail = 'info@bringus.com';
    
    if (storeSlug) {
      const Store = require('../Models/Store');
      const store = await Store.findOne({ slug: storeSlug });
      if (store) {
        storeName = store.nameEn || store.nameAr || storeName;
        storeEmail = store.contact.email || storeEmail;
      }
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    const emailService = require('../services/emailService');
    const emailResult = await emailService.sendPasswordResetEmail(
      email, 
      resetToken, 
      storeName, 
      storeEmail, 
      baseUrl
    );

    if (!emailResult.success) {
      console.log('⚠️ Password reset email sending failed, but token is available in logs for testing');
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
      data: {
        email: user.email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email',
      messageAr: 'خطأ في إرسال بريد إعادة تعيين كلمة المرور',
      error: error.message
    });
  }
};

// Reset password using token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
        messageAr: 'الرمز المميز وكلمة المرور الجديدة مطلوبان'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        messageAr: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        messageAr: 'رمز إعادة التعيين غير صحيح أو منتهي الصلاحية'
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        email: user.email
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      messageAr: 'خطأ في إعادة تعيين كلمة المرور',
      error: error.message
    });
  }
};

// Request email change by userId (no auth required) - sends OTP to new email
const requestEmailChangeByUserId = async (req, res) => {
  try {
    const { userId, newEmail } = req.body;

    console.log(`📧 [requestEmailChangeByUserId] User ${userId} requesting email change to: ${newEmail}`);

    // Validate userId
    if (!userId || !userId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        messageAr: 'معرف المستخدم مطلوب'
      });
    }

    // Validate new email
    if (!newEmail || !newEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New email is required',
        messageAr: 'البريد الإلكتروني الجديد مطلوب'
      });
    }

    // Normalize new email
    const normalizedNewEmail = normalizeEmail(newEmail);

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Check if new email is same as current email
    if (normalizedNewEmail === user.email) {
      return res.status(400).json({
        success: false,
        message: 'New email is the same as current email',
        messageAr: 'البريد الإلكتروني الجديد هو نفس البريد الحالي'
      });
    }

    // Check if new email is already in use in the same store (CRITICAL SECURITY)
    if (user.store) {
      const existingUserInStore = await User.findOne({ 
        email: normalizedNewEmail,
        store: user.store
      });
      
      if (existingUserInStore) {
        return res.status(409).json({
          success: false,
          message: `This email is already registered in this store. Please use a different email.`,
          messageAr: `هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر. يرجى استخدام بريد إلكتروني مختلف.`,
          error: {
            code: 'DUPLICATE_EMAIL_IN_STORE'
          }
        });
      }
    } else {
      // For users without store (superadmin), check globally
      const existingUser = await User.findOne({ email: normalizedNewEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'This email is already in use',
          messageAr: 'هذا البريد الإلكتروني مستخدم بالفعل'
        });
      }
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Store OTP in user document with expiration (5 minutes for email change)
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    user.pendingEmail = normalizedNewEmail;
    user.pendingEmailOTP = otp;
    user.pendingEmailExpiry = otpExpiry;
    await user.save();

    console.log(`✅ [requestEmailChangeByUserId] OTP generated for new email: ${normalizedNewEmail.substring(0, 3)}***`);

    // Get store information
    let storeName = 'BringUs';
    let storeEmail = 'info@bringus.com';
    
    if (user.store) {
      const store = await Store.findById(user.store);
      if (store) {
        storeName = store.nameEn || store.nameAr || storeName;
        storeEmail = store.contact?.email || storeEmail;
      }
    }

    // Send OTP to NEW email
    const emailService = require('../services/emailService');
    const emailResult = await emailService.sendEmailChangeVerification(
      normalizedNewEmail, 
      otp, 
      storeName, 
      storeEmail,
      user.firstName,
      user.lastName
    );
    
    if (!emailResult.success) {
      console.error('❌ [requestEmailChangeByUserId] Failed to send email:', emailResult.error);
      
      // Clear pending email data if email failed to send
      user.pendingEmail = undefined;
      user.pendingEmailOTP = undefined;
      user.pendingEmailExpiry = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
        messageAr: 'فشل إرسال البريد الإلكتروني للتحقق. يرجى المحاولة مرة أخرى.',
        error: emailResult.error
      });
    }

    console.log(`📧 [requestEmailChangeByUserId] Verification email sent to: ${normalizedNewEmail.substring(0, 3)}***`);

    res.status(200).json({
      success: true,
      message: `Verification code has been sent to ${normalizedNewEmail}`,
      messageAr: `تم إرسال رمز التحقق إلى ${normalizedNewEmail}`,
      data: {
        userId: user._id,
        pendingEmail: normalizedNewEmail,
        expiresAt: otpExpiry,
        expiresInMinutes: 5
      }
    });

  } catch (error) {
    console.error('❌ [requestEmailChangeByUserId] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting email change',
      messageAr: 'خطأ في طلب تغيير البريد الإلكتروني',
      error: error.message
    });
  }
};

// Request email change - sends OTP to new email (requires auth)
const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    console.log(`📧 [requestEmailChange] User ${userId} requesting email change to: ${newEmail}`);

    // Validate new email
    if (!newEmail || !newEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New email is required',
        messageAr: 'البريد الإلكتروني الجديد مطلوب'
      });
    }

    // Normalize new email
    const normalizedNewEmail = normalizeEmail(newEmail);

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Check if new email is same as current email
    if (normalizedNewEmail === user.email) {
      return res.status(400).json({
        success: false,
        message: 'New email is the same as current email',
        messageAr: 'البريد الإلكتروني الجديد هو نفس البريد الحالي'
      });
    }

    // Check if new email is already in use in the same store (CRITICAL SECURITY)
    if (user.store) {
      const existingUserInStore = await User.findOne({ 
        email: normalizedNewEmail,
        store: user.store
      });
      
      if (existingUserInStore) {
        return res.status(409).json({
          success: false,
          message: `This email is already registered in this store. Please use a different email.`,
          messageAr: `هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر. يرجى استخدام بريد إلكتروني مختلف.`,
          error: {
            code: 'DUPLICATE_EMAIL_IN_STORE'
          }
        });
      }
    } else {
      // For users without store (superadmin), check globally
      const existingUser = await User.findOne({ email: normalizedNewEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'This email is already in use',
          messageAr: 'هذا البريد الإلكتروني مستخدم بالفعل'
        });
      }
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Store OTP in user document with expiration (5 minutes for email change)
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    user.pendingEmail = normalizedNewEmail;
    user.pendingEmailOTP = otp;
    user.pendingEmailExpiry = otpExpiry;
    await user.save();

    console.log(`✅ [requestEmailChange] OTP generated for new email: ${normalizedNewEmail.substring(0, 3)}***`);

    // Get store information
    let storeName = 'BringUs';
    let storeEmail = 'info@bringus.com';
    
    if (user.store) {
      const store = await Store.findById(user.store);
      if (store) {
        storeName = store.nameEn || store.nameAr || storeName;
        storeEmail = store.contact?.email || storeEmail;
      }
    }

    // Send OTP to NEW email
    const emailService = require('../services/emailService');
    const emailResult = await emailService.sendEmailChangeVerification(
      normalizedNewEmail, 
      otp, 
      storeName, 
      storeEmail,
      user.firstName,
      user.lastName
    );
    
    if (!emailResult.success) {
      console.error('❌ [requestEmailChange] Failed to send email:', emailResult.error);
      
      // Clear pending email data if email failed to send
      user.pendingEmail = undefined;
      user.pendingEmailOTP = undefined;
      user.pendingEmailExpiry = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
        messageAr: 'فشل إرسال البريد الإلكتروني للتحقق. يرجى المحاولة مرة أخرى.',
        error: emailResult.error
      });
    }

    console.log(`📧 [requestEmailChange] Verification email sent to: ${normalizedNewEmail.substring(0, 3)}***`);

    res.status(200).json({
      success: true,
      message: `Verification code has been sent to ${normalizedNewEmail}`,
      messageAr: `تم إرسال رمز التحقق إلى ${normalizedNewEmail}`,
      data: {
        pendingEmail: normalizedNewEmail,
        expiresAt: otpExpiry,
        expiresInMinutes: 5
      }
    });

  } catch (error) {
    console.error('❌ [requestEmailChange] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting email change',
      messageAr: 'خطأ في طلب تغيير البريد الإلكتروني',
      error: error.message
    });
  }
};

// Verify email change by userId (no auth required)
const verifyEmailChangeByUserId = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    console.log(`🔍 [verifyEmailChangeByUserId] User ${userId} verifying email change with OTP`);

    // Validate userId
    if (!userId || !userId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        messageAr: 'معرف المستخدم مطلوب'
      });
    }

    // Validate OTP
    if (!otp || !otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required',
        messageAr: 'رمز التحقق مطلوب'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Check if there's a pending email change
    if (!user.pendingEmail || !user.pendingEmailOTP || !user.pendingEmailExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No pending email change found. Please request email change first.',
        messageAr: 'لم يتم العثور على طلب تغيير بريد إلكتروني. يرجى طلب تغيير البريد الإلكتروني أولاً.'
      });
    }

    // Check if OTP is expired
    if (new Date() > user.pendingEmailExpiry) {
      console.log(`❌ [verifyEmailChangeByUserId] OTP expired for user ${userId}`);
      
      // Clear expired pending data
      user.pendingEmail = undefined;
      user.pendingEmailOTP = undefined;
      user.pendingEmailExpiry = undefined;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        messageAr: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.'
      });
    }

    // Verify OTP
    if (user.pendingEmailOTP !== otp.trim()) {
      console.log(`❌ [verifyEmailChangeByUserId] Invalid OTP for user ${userId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        messageAr: 'رمز التحقق غير صحيح'
      });
    }

    // Double-check email availability before updating
    if (user.store) {
      const existingUserInStore = await User.findOne({ 
        email: user.pendingEmail,
        store: user.store,
        _id: { $ne: userId }
      });
      
      if (existingUserInStore) {
        // Clear pending data
        user.pendingEmail = undefined;
        user.pendingEmailOTP = undefined;
        user.pendingEmailExpiry = undefined;
        await user.save();
        
        return res.status(409).json({
          success: false,
          message: `This email is already registered in this store.`,
          messageAr: `هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر.`,
          error: {
            code: 'DUPLICATE_EMAIL_IN_STORE'
          }
        });
      }
    }

    // All checks passed - update email
    const oldEmail = user.email;
    const newEmail = user.pendingEmail;
    
    user.email = newEmail;
    user.isEmailVerified = true; // New email is verified
    user.emailVerifiedAt = new Date();
    user.pendingEmail = undefined;
    user.pendingEmailOTP = undefined;
    user.pendingEmailExpiry = undefined;
    await user.save();

    console.log(`✅ [verifyEmailChangeByUserId] Email updated successfully from ${oldEmail} to ${newEmail}`);

    res.status(200).json({
      success: true,
      message: 'Email changed successfully',
      messageAr: 'تم تغيير البريد الإلكتروني بنجاح',
      data: {
        userId: user._id,
        oldEmail,
        newEmail,
        isEmailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt
      }
    });

  } catch (error) {
    console.error('❌ [verifyEmailChangeByUserId] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email change',
      messageAr: 'خطأ في التحقق من تغيير البريد الإلكتروني',
      error: error.message
    });
  }
};

// Verify email change with OTP (requires auth)
const verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    console.log(`🔍 [verifyEmailChange] User ${userId} verifying email change with OTP`);

    // Validate OTP
    if (!otp || !otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required',
        messageAr: 'رمز التحقق مطلوب'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Check if there's a pending email change
    if (!user.pendingEmail || !user.pendingEmailOTP || !user.pendingEmailExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No pending email change found. Please request email change first.',
        messageAr: 'لم يتم العثور على طلب تغيير بريد إلكتروني. يرجى طلب تغيير البريد الإلكتروني أولاً.'
      });
    }

    // Check if OTP is expired
    if (new Date() > user.pendingEmailExpiry) {
      console.log(`❌ [verifyEmailChange] OTP expired for user ${userId}`);
      
      // Clear expired pending data
      user.pendingEmail = undefined;
      user.pendingEmailOTP = undefined;
      user.pendingEmailExpiry = undefined;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        messageAr: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.'
      });
    }

    // Verify OTP
    if (user.pendingEmailOTP !== otp.trim()) {
      console.log(`❌ [verifyEmailChange] Invalid OTP for user ${userId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        messageAr: 'رمز التحقق غير صحيح'
      });
    }

    // Double-check email availability before updating
    if (user.store) {
      const existingUserInStore = await User.findOne({ 
        email: user.pendingEmail,
        store: user.store,
        _id: { $ne: userId }
      });
      
      if (existingUserInStore) {
        // Clear pending data
        user.pendingEmail = undefined;
        user.pendingEmailOTP = undefined;
        user.pendingEmailExpiry = undefined;
        await user.save();
        
        return res.status(409).json({
          success: false,
          message: `This email is already registered in this store.`,
          messageAr: `هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر.`,
          error: {
            code: 'DUPLICATE_EMAIL_IN_STORE'
          }
        });
      }
    }

    // All checks passed - update email
    const oldEmail = user.email;
    const newEmail = user.pendingEmail;
    
    user.email = newEmail;
    user.isEmailVerified = true; // New email is verified
    user.emailVerifiedAt = new Date();
    user.pendingEmail = undefined;
    user.pendingEmailOTP = undefined;
    user.pendingEmailExpiry = undefined;
    await user.save();

    console.log(`✅ [verifyEmailChange] Email updated successfully from ${oldEmail} to ${newEmail}`);

    res.status(200).json({
      success: true,
      message: 'Email changed successfully',
      messageAr: 'تم تغيير البريد الإلكتروني بنجاح',
      data: {
        oldEmail,
        newEmail,
        isEmailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt
      }
    });

  } catch (error) {
    console.error('❌ [verifyEmailChange] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email change',
      messageAr: 'خطأ في التحقق من تغيير البريد الإلكتروني',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/public/update-email/{userId}:
 *   patch:
 *     summary: Update user email by userId (Public API - No Auth Required)
 *     description: Directly update user email by userId without authentication or OTP verification
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID for validation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 example: "newemail@example.com"
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Internal server error
 */
const updateUserEmailByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { storeId } = req.query;
    const { newEmail } = req.body;

    console.log(`📧 [updateUserEmailByUserId] Updating email for user ${userId} in store ${storeId}`);

    // Validate required fields
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required',
        messageAr: 'معرف المتجر مطلوب'
      });
    }

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: 'New email is required',
        messageAr: 'البريد الإلكتروني الجديد مطلوب'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        messageAr: 'يرجى تقديم عنوان بريد إلكتروني صالح'
      });
    }

    // Find user by ID and storeId
    const user = await User.findOne({ _id: userId, store: storeId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this store',
        messageAr: 'المستخدم غير موجود في هذا المتجر'
      });
    }

    // Normalize the new email
    const normalizedNewEmail = normalizeEmail(newEmail);
    const oldEmail = user.email;

    // Check if new email is the same as current email
    if (normalizedNewEmail === normalizeEmail(oldEmail)) {
      return res.status(400).json({
        success: false,
        message: 'New email is the same as current email',
        messageAr: 'البريد الإلكتروني الجديد هو نفس البريد الإلكتروني الحالي'
      });
    }

    // Check if email is already in use by another user in the same store (any role)
    const existingUserWithEmail = await User.findOne({
      store: storeId,
      _id: { $ne: userId },
      $or: [
        { email: normalizedNewEmail },
        { email: newEmail.toLowerCase() }
      ]
    });

    if (existingUserWithEmail) {
      console.log(`⚠️ [updateUserEmailByUserId] Email ${normalizedNewEmail} already in use by user ${existingUserWithEmail._id}`);
      return res.status(409).json({
        success: false,
        message: 'This email is already registered in this store',
        messageAr: 'هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر',
        hint: 'Email must be unique across all users in the same store',
        hintAr: 'يجب أن يكون البريد الإلكتروني فريدًا لجميع المستخدمين في نفس المتجر'
      });
    }

    // Update user email
    user.email = normalizedNewEmail;
    user.isEmailVerified = false; // Reset email verification status
    user.emailVerifiedAt = null;
    await user.save();

    console.log(`✅ [updateUserEmailByUserId] Email updated successfully from ${oldEmail} to ${normalizedNewEmail}`);

    res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      messageAr: 'تم تحديث البريد الإلكتروني بنجاح',
      data: {
        userId: user._id,
        oldEmail: oldEmail,
        newEmail: normalizedNewEmail,
        isEmailVerified: user.isEmailVerified,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ [updateUserEmailByUserId] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating email',
      messageAr: 'خطأ في تحديث البريد الإلكتروني',
      error: error.message
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateCurrentUserProfile,
  deleteUser,
  getCustomers,
  getStoreStaff,
  sendEmailVerification,
  verifyEmail,
  resendEmailVerification,
  checkEmailVerificationStatus,
  forgotPassword,
  resetPassword,
  requestEmailChange,
  verifyEmailChange,
  requestEmailChangeByUserId,
  verifyEmailChangeByUserId,
  updateUserEmailByUserId
}; 