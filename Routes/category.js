const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../Models/Category');
const Product = require('../Models/Product');

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// @desc    Get category tree (hierarchical)
// @route   GET /api/categories/tree
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .sort({ sortOrder: 1, name: 1 });

    // Build tree structure
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => String(item.parent) === String(parentId))
        .map(item => ({
          ...item.toObject(),
          children: buildTree(items, item._id)
        }));
    };

    const categoryTree = buildTree(categories);

    res.status(200).json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category tree',
      error: error.message
    });
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (!category.isActive) {
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
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug,
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
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Category name is required and must be less than 50 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('parent').optional().isMongoId().withMessage('Parent must be a valid category ID'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      parent,
      icon,
      sortOrder = 0,
      isFeatured = false
    } = req.body;

    // Check if parent exists
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Calculate level
    const level = parent ? 1 : 0;

    const category = await Category.create({
      name,
      slug,
      description,
      parent,
      level,
      icon,
      sortOrder,
      isFeatured
    });

    const populatedCategory = await Category.findById(category._id)
      .populate('parent', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Category name must be less than 50 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('parent').optional().isMongoId().withMessage('Parent must be a valid category ID'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if parent exists and is not the same as current category
    if (req.body.parent) {
      if (req.body.parent === req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }

      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Generate new slug if name is being updated
    if (req.body.name && req.body.name !== category.name) {
      const newSlug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existingCategory = await Category.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      req.body.slug = newSlug;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has children
    const hasChildren = await Category.exists({ parent: req.params.id });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories'
      });
    }

    // Check if category has products
    const hasProducts = await Product.exists({ category: req.params.id });
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with products'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
});

// @desc    Get featured categories
// @route   GET /api/categories/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true, isFeatured: true })
      .populate('parent', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get featured categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured categories',
      error: error.message
    });
  }
});

module.exports = router; 