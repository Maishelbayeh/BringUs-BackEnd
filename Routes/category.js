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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category tree',
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category list',
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching categories by parent',
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
        message: 'Please provide storeId in query parameters'
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
        message: 'Category not found'
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category details',
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
        message: 'Store not found'
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
          message: 'Parent category not found or does not belong to this store'
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating category',
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
        message: 'Store not found'
      });
    }

    // Check if parent exists and belongs to the same store
    if (req.body.parent) {
      if (req.body.parent === req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }

      const parentCategory = await Category.findOne({ 
        _id: req.body.parent, 
        store: req.body.storeId 
      });
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found or does not belong to this store'
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating category',
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
        message: 'Store ID is required'
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
        message: 'Cannot delete category with subcategories'
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
        message: 'Cannot delete category with products'
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
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
        message: 'Please provide storeId in query parameters'
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
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching featured categories',
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
        message: 'Please provide storeId in the URL parameter'
      });
    }
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
        message: 'The specified store does not exist'
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
// استخدم memoryStorage بدلاً من diskStorage
const imageStorage = multer.memoryStorage();
const uploadCategoryImage = multer({ storage: imageStorage });

// @desc    Upload category image only
// @route   POST /api/categories/upload-image
// @access  Private (Admin only)
// يعيد فقط اسم الصورة (image) + رابط العرض (imageUrl)
router.post('/upload-image', [protect, authorize('admin', 'superadmin')], uploadCategoryImage.single('image'), async (req, res) => {
  try {
    const { storeId } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
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
        details: validationErrors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed',
      message: err.message 
    });
  }
});

module.exports = router; 