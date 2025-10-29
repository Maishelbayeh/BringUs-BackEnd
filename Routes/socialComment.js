// monjed start  editing

const express = require('express');
const router = express.Router();
const multer = require('multer');

const SocialCommentController = require('../Controllers/SocialCommentController');
const { protect } = require('../middleware/auth');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const { socialCommentValidation, createSocialCommentValidation } = require('../validators/socialComment.validator');

// Configure multer for memory storage with file validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files (PNG, JPG, JPEG)
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('UNSUPPORTED_FILE_TYPE'), false);
    }
  },
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB',
        messageAr: 'حجم الملف يتجاوز 10 ميجابايت',
        error: err.message
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      messageAr: 'خطأ في رفع الملف',
      error: err.message
    });
  } else if (err) {
    if (err.message === 'UNSUPPORTED_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Only PNG, JPG, and JPEG formats are allowed.',
        messageAr: 'نوع الملف غير مدعوم. يُسمح فقط بتنسيقات PNG و JPG و JPEG.',
        error: 'Invalid file format'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      messageAr: 'خطأ في معالجة الملف',
      error: err.message
    });
  }
  next();
};

// Middleware to set current store for social comments and check permissions
const setCurrentStoreAndCheckPermissions = async (req, res, next) => {
  try {
    // Check if user is admin or superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        messageAr: 'مطلوب وصول المسؤول'
      });
    }

    const Store = require('../Models/Store');
    const Owner = require('../Models/Owner');
    
    // Get the target store ID from request body, params, or user token
    const targetStoreId = req.body.store || req.body.storeId || req.params.storeId || req.user.store || req.user.storeId;
    
    console.log(`🔍 [setCurrentStoreAndCheckPermissions] User: ${req.user.email}, Role: ${req.user.role}`);
    console.log(`🔍 [setCurrentStoreAndCheckPermissions] Target Store ID: ${targetStoreId}`);
    console.log(`🔍 [setCurrentStoreAndCheckPermissions] req.user.store: ${req.user.store}`);

    // Superadmin can access any store
    if (req.user.role === 'superadmin') {
      if (targetStoreId) {
        // Verify the specific store exists
        const store = await Store.findById(targetStoreId);
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found',
            messageAr: 'المتجر غير موجود'
          });
        }
        req.store = store;
      } else {
        // If no specific store requested, use the first active store
        const store = await Store.findOne({ status: 'active' });
        if (store) {
          req.store = store;
        }
      }
      req.owner = {
        permissions: ['manage_store', 'manage_users', 'manage_products', 'manage_categories', 'manage_orders', 'manage_inventory', 'view_analytics', 'manage_settings'],
        isPrimaryOwner: true
      };
      return next();
    }

    // For admin users, check if they have access to the specific store
    if (req.user.role === 'admin') {
      let owner;
      let storeToUse = null;
      
      if (targetStoreId) {
        // Check if admin has access to the specific store via Owner table
        owner = await Owner.findOne({
          userId: req.user._id,
          storeId: targetStoreId,
          status: 'active'
        }).populate('storeId');

        // If no owner record found, check if user.store matches targetStoreId
        if (!owner && req.user.store && req.user.store.toString() === targetStoreId.toString()) {
          console.log(`✅ Admin has access to store via user.store: ${targetStoreId}`);
          const store = await Store.findById(targetStoreId);
          if (store) {
            storeToUse = store;
            // Create virtual owner object for admins without Owner record
            req.owner = {
              userId: req.user._id,
              storeId: store._id,
              permissions: ['manage_store', 'manage_users', 'manage_products', 'manage_categories', 'manage_orders', 'manage_inventory', 'view_analytics', 'manage_settings'],
              isPrimaryOwner: false,
              status: 'active'
            };
          }
        } else if (owner) {
          storeToUse = owner.storeId;
          req.owner = owner;
        }

        if (!storeToUse) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this store',
            messageAr: 'ليس لديك صلاحية للوصول إلى هذا المتجر'
          });
        }
      } else {
        // If no specific store, try to get from Owner table first
        owner = await Owner.findOne({
          userId: req.user._id,
          status: 'active'
        }).populate('storeId');

        if (owner) {
          storeToUse = owner.storeId;
          req.owner = owner;
        } else if (req.user.store) {
          // Fallback to user.store if no Owner record
          console.log(`✅ Using user.store as fallback: ${req.user.store}`);
          const store = await Store.findById(req.user.store);
          if (store) {
            storeToUse = store;
            // Create virtual owner object
            req.owner = {
              userId: req.user._id,
              storeId: store._id,
              permissions: ['manage_store', 'manage_users', 'manage_products', 'manage_categories', 'manage_orders', 'manage_inventory', 'view_analytics', 'manage_settings'],
              isPrimaryOwner: false,
              status: 'active'
            };
          }
        }

        if (!storeToUse) {
          return res.status(403).json({
            success: false,
            message: 'No store access found',
            messageAr: 'لا يوجد وصول للمتجر'
          });
        }
      }

      req.store = storeToUse;
    }

    next();
  } catch (error) {
    console.error('setCurrentStoreAndCheckPermissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      messageAr: 'خطأ في الخادم',
      error: error.message
    });
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     SocialComment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60f7c0b8b4d1c80015e4d123"
 *         store:
 *           type: string
 *           example: "60f7c0b8b4d1c80015e4d456"
 *         platform:
 *           type: string
 *           enum: [Facebook, Instagram, Twitter, LinkedIn, TikTok]
 *           example: "Instagram"
 *         image:
 *           type: string
 *           example: "https://example.com/image.jpg"
 *         personName:
 *           type: string
 *           example: "Jane Doe"
 *         personTitle:
 *           type: string
 *           example: "Marketing Manager"
 *         comment:
 *           type: string
 *           example: "This is a wonderful service! Highly recommended."
 *         active:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/social-comments:
 *   get:
 *     summary: Get all social media testimonials for the current store
 *     tags: [SocialComment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of testimonials
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
 *                     $ref: '#/components/schemas/SocialComment'
 *       500:
 *         description: Server error
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
 *                   example: "Failed to fetch testimonials"
 */
router.get(
  '/',
  protect,
  setCurrentStoreAndCheckPermissions,
  SocialCommentController.getSocialComments
);

/**
 * @swagger
 * /api/social-comments:
 *   post:
 *     summary: Create a new social media testimonial
 *     tags: [SocialComment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SocialComment'
 *     responses:
 *       201:
 *         description: Testimonial created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SocialComment'
 *       400:
 *         description: Bad request
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
 *                   example: "Validation error"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to create testimonial"
 */
router.post(
  '/',
  protect,
  setCurrentStoreAndCheckPermissions,
  createSocialCommentValidation,
  SocialCommentController.createSocialComment
);

/**
 * @swagger
 * /api/social-comments/{id}:
 *   put:
 *     summary: Update a social media testimonial
 *     tags: [SocialComment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimonial ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SocialComment'
 *     responses:
 *       200:
 *         description: Testimonial updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SocialComment'
 *       400:
 *         description: Bad request
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
 *                   example: "Validation error"
 *       404:
 *         description: Not found
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
 *                   example: "Testimonial not found"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to update testimonial"
 */
router.put(
  '/:id',
  protect,
  setCurrentStoreAndCheckPermissions,
  socialCommentValidation,
  SocialCommentController.updateSocialComment
);

/**
 * @swagger
 * /api/social-comments/{id}:
 *   delete:
 *     summary: Delete a social media testimonial
 *     tags: [SocialComment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Testimonial ID
 *     responses:
 *       200:
 *         description: Testimonial deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SocialComment'
 *       404:
 *         description: Not found
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
 *                   example: "Testimonial not found"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to delete testimonial"
 */
router.delete(
  '/:id',
  protect,
  setCurrentStoreAndCheckPermissions,
  SocialCommentController.deleteSocialComment
);

/**
 * @swagger
 * /api/social-comments/upload-image:
 *   post:
 *     summary: Upload image for social comment
 *     tags: [SocialComment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
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
 *                     url:
 *                       type: string
 *                       example: "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/social-comments/1234567890-image.jpg"
 *                     key:
 *                       type: string
 *                       example: "social-comments/1234567890-image.jpg"
 *       400:
 *         description: Bad request
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
 *                   example: "Only image files are allowed"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to upload image"
 */
router.post(
  '/upload-image',
  protect,
  setCurrentStoreAndCheckPermissions,
  upload.single('image'),
  handleMulterError,
  SocialCommentController.uploadImage
);

/**
 * @swagger
 * /api/social-comments/by-store/{storeId}:
 *   get:
 *     summary: Get all social comments for a specific store by storeId
 *     tags: [SocialComment]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: List of testimonials
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
 *                     $ref: '#/components/schemas/SocialComment'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get(
  '/by-store/:storeId',
  SocialCommentController.getSocialCommentsByStoreId
);

module.exports = router;

// monjed end editing 