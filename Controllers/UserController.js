const User = require('../Models/User');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');

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
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, role, store, addresses, status } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Prepare user data
    const userData = {
      firstName,
      lastName,
      email,
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
        addr.zipCode && addr.zipCode.trim() && 
        addr.country && addr.country.trim()
      );
        } else {
      userData.addresses = [];
    }
    // Add store if provided and user is admin or client
    if (store && (userData.role === 'admin' || userData.role === 'client')) {
      // If store is an object with _id, extract the _id
      userData.store = typeof store === 'object' && store._id ? store._id : store;
    }
    
    // Validate store requirement for admin and client roles
    if ((userData.role === 'admin' || userData.role === 'client') && !userData.store) {
      return res.status(400).json({
        success: false,
        message: 'Store is required for admin and client roles'
      });
    }

    // Create user
    const user = await User.create(userData);

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
      message: 'User created successfully',
      data: userResponse,
      token
    });
  } catch (error) {
    //CONSOLE.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
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
        message: 'User not found'
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
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
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
        message: 'User not found'
      });
    }

    // Prevent user from deleting themselves
    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }

    // Prevent non-superadmin from deleting other admins/superadmins
    if (req.user.role !== 'superadmin' && (userToDelete.role === 'admin' || userToDelete.role === 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete admin or superadmin users'
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
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Prepare update data (users can only update certain fields)
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
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
  getStoreStaff
}; 