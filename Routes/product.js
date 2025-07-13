const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const multer = require('multer');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');

const router = express.Router();

// @desc    Get all products with filtering and pagination
// @route   GET /api/products
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'rating_desc', 'newest']).withMessage('Invalid sort option'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('storeId').optional().isMongoId().withMessage('Invalid store ID')
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
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      search,
      storeId
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Add store filter if provided
    if (storeId) {
      filter.store = storeId;
    }

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'name_asc':
        sortObj = { nameEn: 1 };
        break;
      case 'name_desc':
        sortObj = { nameEn: -1 };
        break;
      case 'rating_desc':
        sortObj = { rating: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .populate('category', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Product.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', [
  query('storeId').optional().isMongoId().withMessage('Invalid store ID')
], async (req, res) => {
  try {
    const { storeId } = req.query;
    
    // Build filter
    const filter = { _id: req.params.id };
    if (storeId) {
      filter.store = storeId;
    }

    const product = await Product.findOne(filter)
      .populate('category', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
router.post('/', [
  body('nameAr').trim().isLength({ min: 1, max: 100 }).withMessage('Arabic product name is required and must be less than 100 characters'),
  body('nameEn').trim().isLength({ min: 1, max: 100 }).withMessage('English product name is required and must be less than 100 characters'),
  body('descriptionAr').trim().isLength({ min: 1, max: 2000 }).withMessage('Arabic description is required and must be less than 2000 characters'),
  body('descriptionEn').trim().isLength({ min: 1, max: 2000 }).withMessage('English description is required and must be less than 2000 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('unit').isMongoId().withMessage('Valid unit ID is required'),
  body('storeId').isMongoId().withMessage('Valid store ID is required'),
  body('availableQuantity').optional().isInt({ min: 0 }).withMessage('Available quantity must be a non-negative integer'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('productLabels').optional().isArray().withMessage('Product labels must be an array'),
  body('colors').optional().isArray().withMessage('Colors must be an array')
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
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      price,
      category,
      unit,
      storeId,
      availableQuantity = 0,
      stock = 0,
      productLabels = [],
      colors = [],
      images = [],
      mainImage,
      barcode,
      compareAtPrice,
      costPrice,
      productOrder = 0,
      visibility = true,
      isActive = true,
      isFeatured = false,
      isOnSale = false,
      salePercentage = 0,
      attributes = [],
      specifications = [],
      tags = [],
      weight,
      dimensions,
      rating = 0,
      numReviews = 0,
      views = 0,
      soldCount = 0,
      seo
    } = req.body;

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Create product data
    const productData = {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      price,
      category,
      unit,
      store: storeId,
      availableQuantity,
      stock,
      productLabels,
      colors,
      images,
      mainImage,
      barcode,
      compareAtPrice,
      costPrice,
      productOrder,
      visibility,
      isActive,
      isFeatured,
      isOnSale,
      salePercentage,
      attributes,
      specifications,
      tags,
      weight,
      dimensions,
      rating,
      numReviews,
      views,
      soldCount,
      seo
    };

    const product = await Product.create(productData);

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
router.put('/:id', [
  body('nameAr').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Arabic product name must be less than 100 characters'),
  body('nameEn').optional().trim().isLength({ min: 1, max: 100 }).withMessage('English product name must be less than 100 characters'),
  body('descriptionAr').optional().trim().isLength({ min: 1, max: 2000 }).withMessage('Arabic description must be less than 2000 characters'),
  body('descriptionEn').optional().trim().isLength({ min: 1, max: 2000 }).withMessage('English description must be less than 2000 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').optional().isMongoId().withMessage('Valid category ID is required'),
  body('unit').optional().isMongoId().withMessage('Valid unit ID is required'),
  body('storeId').optional().isMongoId().withMessage('Valid store ID is required'),
  body('availableQuantity').optional().isInt({ min: 0 }).withMessage('Available quantity must be a non-negative integer'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('productLabels').optional().isArray().withMessage('Product labels must be an array'),
  body('colors').optional().isArray().withMessage('Colors must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId } = req.body;
    
    // Build update filter
    const filter = { _id: req.params.id };
    if (storeId) {
      filter.store = storeId;
    }

    const product = await Product.findOne(filter);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if category exists if provided
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Prepare update data
    const updateData = { ...req.body };
    if (storeId) {
      updateData.store = storeId;
      delete updateData.storeId;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'nameAr nameEn')
     .populate('productLabels', 'nameAr nameEn color')
     .populate('unit', 'nameAr nameEn symbol')
     .populate('store', 'name domain');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
router.delete('/:id', [
  query('storeId').optional().isMongoId().withMessage('Invalid store ID')
], async (req, res) => {
  try {
    const { storeId } = req.query;
    
    // Build delete filter
    const filter = { _id: req.params.id };
    if (storeId) {
      filter.store = storeId;
    }

    const product = await Product.findOne(filter);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
});

// @desc    Get products on sale
// @route   GET /api/products/sale
// @access  Public
router.get('/sale', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isOnSale: true })
      .populate('category', 'name slug')
      .sort({ salePercentage: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get sale products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sale products',
      error: error.message
    });
  }
});

// ========== رفع صور المنتجات ========== //
// استخدم memoryStorage بدلاً من diskStorage
const imageStorage = multer.memoryStorage();
const uploadProductImage = multer({ storage: imageStorage });

// @desc    Upload product main image
// @route   POST /api/products/upload-main-image
// @access  Private (Admin only)
// يعيد فقط اسم الصورة (image) + رابط العرض (imageUrl)
router.post('/upload-main-image', uploadProductImage.single('image'), async (req, res) => {
  try {
    const { storeId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // رفع الصورة إلى Cloudflare R2
    const folder = storeId ? `products/${storeId}/main` : 'products/main';
    const result = await uploadToCloudflare(req.file.buffer, req.file.originalname, folder);
    
    res.json({ 
      success: true, 
      image: result.key, 
      imageUrl: result.url 
    });
  } catch (err) {
    console.error('Upload main image error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed',
      message: err.message 
    });
  }
});

// @desc    Upload product gallery images
// @route   POST /api/products/upload-gallery-images
// @access  Private (Admin only)
// يعيد array من الصور مع أسمائها وروابطها
router.post('/upload-gallery-images', uploadProductImage.array('images', 10), async (req, res) => {
  try {
    const { storeId } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    // رفع الصور إلى Cloudflare R2
    const folder = storeId ? `products/${storeId}/gallery` : 'products/gallery';
    const uploadPromises = req.files.map(file => 
      uploadToCloudflare(file.buffer, file.originalname, folder)
    );
    
    const results = await Promise.all(uploadPromises);
    
    const images = results.map(result => ({
      image: result.key,
      imageUrl: result.url
    }));
    
    res.json({ 
      success: true, 
      images: images 
    });
  } catch (err) {
    console.error('Upload gallery images error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed',
      message: err.message 
    });
  }
});

// @desc    Upload single product image (for gallery)
// @route   POST /api/products/upload-single-image
// @access  Private (Admin only)
// يعيد صورة واحدة مع اسمها ورابطها
router.post('/upload-single-image', uploadProductImage.single('image'), async (req, res) => {
  try {
    const { storeId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // رفع الصورة إلى Cloudflare R2
    const folder = storeId ? `products/${storeId}/gallery` : 'products/gallery';
    const result = await uploadToCloudflare(req.file.buffer, req.file.originalname, folder);
    
    res.json({ 
      success: true, 
      image: result.key, 
      imageUrl: result.url 
    });
  } catch (err) {
    console.error('Upload single image error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed',
      message: err.message 
    });
  }
});

module.exports = router; 