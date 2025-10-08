const express = require('express');
const { body, validationResult } = require('express-validator');
const CategoryController = require('../Controllers/CategoryController');
const { protect, authorize } = require('../middleware/auth');
const Category = require('../Models/Category');
const Product = require('../Models/Product');
const Store = require('../Models/Store');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');

// Configure multer with file validation for category images
const imageStorage = multer.memoryStorage();
const uploadCategoryImage = multer({
  storage: imageStorage,
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

const router = express.Router();

// @desc    Get all categories for a store
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    await CategoryController.getAll(req, res);
  } catch (error) {
    //CONSOLE.error('Get all categories error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      messageAr: 'خطأ في جلب الفئات',
      error: error.message
    });
  }
});

// @desc    Get category tree (hierarchical) for a store
// @route   GET /api/categories/tree
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    await CategoryController.getCategoryTree(req, res);
  } catch (error) {
    //CONSOLE.error('Get category tree error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category tree',
      messageAr: 'خطأ في جلب شجرة الفئات',
      error: error.message
    });
  }
});

// @desc    Get hierarchical category list (flat structure with levels)
// @route   GET /api/categories/list
// @access  Public
router.get('/list', async (req, res) => {
  try {
    await CategoryController.getCategoryList(req, res);
  } catch (error) {
    //CONSOLE.error('Get category list error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category list',
      messageAr: 'خطأ في جلب قائمة الفئات',
      error: error.message
    });
  }
});

// @desc    Get categories by parent (including nested subcategories)
// @route   GET /api/categories/by-parent
// @access  Public
router.get('/by-parent', async (req, res) => {
  try {
    await CategoryController.getCategoriesByParent(req, res);
  } catch (error) {
    //CONSOLE.error('Get categories by parent error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching categories by parent',
      messageAr: 'خطأ في جلب الفئات حسب الفئة الأب',
      error: error.message
    });
  }
});

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters',
        messageAr: 'يرجى تقديم معرف المتجر في معاملات الاستعلام'
      });
    }

    const category = await Category.findOne({ 
      slug: req.params.slug,
      store: storeId,
      isActive: true 
    }).populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        messageAr: 'الفئة غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    //CONSOLE.error('Get category by slug error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      messageAr: 'خطأ في جلب الفئة',
      error: error.message
    });
  }
});

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    await CategoryController.getById(req, res);
  } catch (error) {
    //CONSOLE.error('Get category by ID error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      messageAr: 'خطأ في جلب الفئة',
      error: error.message
    });
  }
});

// @desc    Get category details with children and products
// @route   GET /api/categories/:id/details
// @access  Public
router.get('/:id/details', async (req, res) => {
  try {
    await CategoryController.getCategoryDetails(req, res);
  } catch (error) {
    //CONSOLE.error('Get category details error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category details',
      messageAr: 'خطأ في جلب تفاصيل الفئة',
      error: error.message
    });
  }
});

// @desc    Create new category (Admin only)
// @route   POST /api/categories
// @access  Private (Admin only)
router.post('/', [
  protect,
  authorize('admin', 'superadmin'),
  body('nameAr').trim().isLength({ min: 1, max: 50 }).withMessage('Arabic name is required and must be less than 50 characters'),
  body('nameEn').trim().isLength({ min: 1, max: 50 }).withMessage('English name is required and must be less than 50 characters'),
  body('storeId').notEmpty().withMessage('Store ID is required'),
  body('descriptionAr').optional().isLength({ max: 500 }).withMessage('Arabic description must be less than 500 characters'),
  body('descriptionEn').optional().isLength({ max: 500 }).withMessage('English description must be less than 500 characters'),
  body('parent').optional().isMongoId().withMessage('Parent must be a valid category ID'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Verify store exists
    const store = await Store.findById(req.body.storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }

    // Check if parent exists and belongs to the same store
    if (req.body.parent) {
      const parentCategory = await Category.findOne({ 
        _id: req.body.parent, 
        store: req.body.storeId 
      });
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found or does not belong to this store',
        messageAr: 'الفئة الأب غير موجودة أو لا تنتمي لهذا المتجر'
        });
      }
    }

    await CategoryController.create(req, res);
  } catch (error) {
    //CONSOLE.error('Create category error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      messageAr: 'خطأ في إنشاء الفئة',
      error: error.message
    });
  }
});

// @desc    Update category (Admin only)
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
router.put('/:id', [
  protect,
  authorize('admin', 'superadmin'),
  body('nameAr').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Arabic name must be less than 50 characters'),
  body('nameEn').optional().trim().isLength({ min: 1, max: 50 }).withMessage('English name must be less than 50 characters'),
  body('storeId').notEmpty().withMessage('Store ID is required'),
  body('descriptionAr').optional().isLength({ max: 500 }).withMessage('Arabic description must be less than 500 characters'),
  body('descriptionEn').optional().isLength({ max: 500 }).withMessage('English description must be less than 500 characters'),
  body('parent').optional().isMongoId().withMessage('Parent must be a valid category ID'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Verify store exists
    const store = await Store.findById(req.body.storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }

    // Check if parent exists and belongs to the same store
    if (req.body.parent) {
      if (req.body.parent === req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent',
        messageAr: 'لا يمكن للفئة أن تكون أبًا لنفسها'
        });
      }

      const parentCategory = await Category.findOne({ 
        _id: req.body.parent, 
        store: req.body.storeId 
      });
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found or does not belong to this store',
        messageAr: 'الفئة الأب غير موجودة أو لا تنتمي لهذا المتجر'
        });
      }
    }

    await CategoryController.update(req, res);
  } catch (error) {
    //CONSOLE.error('Update category error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      messageAr: 'خطأ في تحديث الفئة',
      error: error.message
    });
  }
});

// @desc    Delete category (Admin only)
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
router.delete('/:id', [
  protect,
  authorize('admin', 'superadmin')
], async (req, res) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required',
        messageAr: 'معرف المتجر مطلوب'
      });
    }

    // Check if category has children
    const hasChildren = await Category.exists({ 
      parent: req.params.id, 
      store: storeId 
    });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories',
        messageAr: 'لا يمكن حذف فئة تحتوي على فئات فرعية'
      });
    }

    // Check if category has products
    const hasProducts = await Product.exists({ 
      category: req.params.id, 
      store: storeId 
    });
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with products',
        messageAr: 'لا يمكن حذف فئة تحتوي على منتجات'
      });
    }

    await CategoryController.delete(req, res);
  } catch (error) {
    //CONSOLE.error('Delete category error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      messageAr: 'خطأ في حذف الفئة',
      error: error.message
    });
  }
});

// @desc    Get featured categories for a store
// @route   GET /api/categories/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters',
        messageAr: 'يرجى تقديم معرف المتجر في معاملات الاستعلام'
      });
    }

    const categories = await Category.find({ 
      store: storeId,
      isActive: true, 
      isFeatured: true 
    })
      .populate('parent', 'name slug')
      .sort({ sortOrder: 1, nameEn: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    //CONSOLE.error('Get featured categories error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching featured categories',
      messageAr: 'خطأ في جلب الفئات المميزة',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/categories/store/{storeId}:
 *   get:
 *     summary: Get all categories for a specific store
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID to filter categories
 *         example: 687505893fbf3098648bfe16
 *     responses:
 *       200:
 *         description: List of categories for the store
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
 *                     $ref: '#/components/schemas/Category'
 *                 count:
 *                   type: integer
 *                   example: 9
 *       400:
 *         description: Store ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Store ID is required
 *                 message:
 *                   type: string
 *                   example: Please provide storeId in the URL parameter
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Store not found
 *                 message:
 *                   type: string
 *                   example: The specified store does not exist
 */
// @desc    Get all categories for a specific store by storeId
// @route   GET /api/categories/store/:storeId
// @access  Public
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in the URL parameter',
        messageAr: 'يرجى تقديم معرف المتجر في معامل URL'
      });
    }
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
        message: 'The specified store does not exist',
        messageAr: 'المتجر المحدد غير موجود'
      });
    }
    const categories = await Category.find({ store: storeId })
      .populate('parent')
      .populate('store', 'name domain');
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (err) {
    //CONSOLE.error('Get categories by storeId error:', err);
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ========== رفع صورة الكاتيجوري فقط ========== //

// @desc    Upload category image only
// @route   POST /api/categories/upload-image
// @access  Private (Admin only)
// يعيد فقط اسم الصورة (image) + رابط العرض (imageUrl)
router.post('/upload-image', [protect, authorize('admin', 'superadmin')], uploadCategoryImage.single('image'), handleMulterError, async (req, res) => {
  try {
    const { storeId } = req.body;
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded',
        messageAr: 'لم يتم رفع ملف'
      });
    }
    // رفع الصورة إلى Cloudflare R2
    const folder = storeId ? `categories/${storeId}` : 'categories';
    const result = await uploadToCloudflare(req.file.buffer, req.file.originalname, folder);
    res.json({ success: true, image: result.key, imageUrl: result.url });
  } catch (err) {
    //CONSOLE.error('Upload image error:', err);
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed',
      messageAr: 'فشل الرفع',
      error: err.message 
    });
  }
});

module.exports = router; 