const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const multer = require('multer');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     description: Retrieve products with optional filtering, sorting, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, name_asc, name_desc, rating_desc, newest]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product names and descriptions
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by store ID
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                     $ref: '#/components/schemas/Product'
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
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get single product by ID
 *     description: Retrieve a specific product by its ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Store ID for filtering
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product with all required and optional fields
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nameAr
 *               - nameEn
 *               - descriptionAr
 *               - descriptionEn
 *               - price
 *               - category
 *               - unit
 *               - storeId
 *             properties:
 *               nameAr:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: 'سامسونج جالاكسي S22'
 *                 description: Arabic product name
 *               nameEn:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: 'Samsung Galaxy S22'
 *                 description: English product name
 *               descriptionAr:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: 'هاتف ذكي سامسونج'
 *                 description: Arabic product description
 *               descriptionEn:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: 'Samsung smartphone'
 *                 description: English product description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 2500
 *                 description: Product price
 *               compareAtPrice:
 *                 type: number
 *                 minimum: 0
 *                 example: 2700
 *                 description: Compare at price
 *               costPrice:
 *                 type: number
 *                 minimum: 0
 *                 example: 2000
 *                 description: Cost price
 *               barcode:
 *                 type: string
 *                 example: '1234567890123'
 *                 description: Product barcode
 *               category:
 *                 type: string
 *                 format: uuid
 *                 example: '507f1f77bcf86cd799439014'
 *                 description: Category ID
 *               unit:
 *                 type: string
 *                 format: uuid
 *                 example: '507f1f77bcf86cd799439016'
 *                 description: Unit ID
 *               storeId:
 *                 type: string
 *                 format: uuid
 *                 example: '507f1f77bcf86cd799439012'
 *                 description: Store ID
 *               availableQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 example: 980
 *                 description: Available quantity
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 example: 980
 *                 description: Stock quantity
 *               productLabels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ['507f1f77bcf86cd799439015']
 *                 description: Array of product label IDs
 *               specifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ['507f1f77bcf86cd799439017']
 *                 description: Array of product specification IDs
 *               colors:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: string
 *                 example: [['#000000'], ['#FFFFFF', '#FF0000']]
 *                 description: Array of color arrays
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['https://example.com/image1.jpg']
 *                 description: Array of image URLs
 *               mainImage:
 *                 type: string
 *                 example: 'https://example.com/main-image.jpg'
 *                 description: Main image URL
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: 'Material'
 *                     value:
 *                       type: string
 *                       example: 'Cotton'
 *                 description: Array of product attributes
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['phone', 'samsung', 'smartphone']
 *                 description: Array of product tags
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 example: 0.2
 *                 description: Product weight
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   length:
 *                     type: number
 *                     minimum: 0
 *                     example: 70
 *                   width:
 *                     type: number
 *                     minimum: 0
 *                     example: 50
 *                   height:
 *                     type: number
 *                     minimum: 0
 *                     example: 5
 *                 description: Product dimensions
 *               productOrder:
 *                 type: integer
 *                 default: 0
 *                 example: 1
 *                 description: Product order for sorting
 *               visibility:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *                 description: Product visibility
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *                 description: Product active status
 *               isFeatured:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *                 description: Featured product status
 *               isOnSale:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *                 description: Sale status
 *               salePercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 10
 *                 description: Sale percentage
 *               lowStockThreshold:
 *                 type: number
 *                 minimum: 0
 *                 default: 5
 *                 example: 5
 *                 description: Low stock threshold
 *               seo:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     maxLength: 60
 *                     example: 'Samsung Galaxy S22 - Premium Smartphone'
 *                   description:
 *                     type: string
 *                     maxLength: 160
 *                     example: 'High-quality Samsung smartphone'
 *                   keywords:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ['samsung', 'smartphone', 'galaxy']
 *                 description: SEO information
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: 'Product created successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     description: Update an existing product with new data
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nameAr:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: 'سامسونج جالاكسي S22'
 *                 description: Arabic product name
 *               nameEn:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: 'Samsung Galaxy S22'
 *                 description: English product name
 *               descriptionAr:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: 'هاتف ذكي سامسونج'
 *                 description: Arabic product description
 *               descriptionEn:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: 'Samsung smartphone'
 *                 description: English product description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 2500
 *                 description: Product price
 *               compareAtPrice:
 *                 type: number
 *                 minimum: 0
 *                 example: 2700
 *                 description: Compare at price
 *               costPrice:
 *                 type: number
 *                 minimum: 0
 *                 example: 2000
 *                 description: Cost price
 *               barcode:
 *                 type: string
 *                 example: '1234567890123'
 *                 description: Product barcode
 *               category:
 *                 type: string
 *                 format: uuid
 *                 example: '507f1f77bcf86cd799439014'
 *                 description: Category ID
 *               unit:
 *                 type: string
 *                 format: uuid
 *                 example: '507f1f77bcf86cd799439016'
 *                 description: Unit ID
 *               storeId:
 *                 type: string
 *                 format: uuid
 *                 example: '507f1f77bcf86cd799439012'
 *                 description: Store ID
 *               availableQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 980
 *                 description: Available quantity
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 example: 980
 *                 description: Stock quantity
 *               productLabels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ['507f1f77bcf86cd799439015']
 *                 description: Array of product label IDs
 *               specifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ['507f1f77bcf86cd799439017']
 *                 description: Array of product specification IDs
 *               colors:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: string
 *                 example: [['#000000'], ['#FFFFFF', '#FF0000']]
 *                 description: Array of color arrays
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['https://example.com/image1.jpg']
 *                 description: Array of image URLs
 *               mainImage:
 *                 type: string
 *                 example: 'https://example.com/main-image.jpg'
 *                 description: Main image URL
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: 'Material'
 *                     value:
 *                       type: string
 *                       example: 'Cotton'
 *                 description: Array of product attributes
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['phone', 'samsung', 'smartphone']
 *                 description: Array of product tags
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 example: 0.2
 *                 description: Product weight
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   length:
 *                     type: number
 *                     minimum: 0
 *                     example: 70
 *                   width:
 *                     type: number
 *                     minimum: 0
 *                     example: 50
 *                   height:
 *                     type: number
 *                     minimum: 0
 *                     example: 5
 *                 description: Product dimensions
 *               productOrder:
 *                 type: integer
 *                 example: 1
 *                 description: Product order for sorting
 *               visibility:
 *                 type: boolean
 *                 example: true
 *                 description: Product visibility
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: Product active status
 *               isFeatured:
 *                 type: boolean
 *                 example: false
 *                 description: Featured product status
 *               isOnSale:
 *                 type: boolean
 *                 example: false
 *                 description: Sale status
 *               salePercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 10
 *                 description: Sale percentage
 *               lowStockThreshold:
 *                 type: number
 *                 minimum: 0
 *                 example: 5
 *                 description: Low stock threshold
 *               seo:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     maxLength: 60
 *                     example: 'Samsung Galaxy S22 - Premium Smartphone'
 *                   description:
 *                     type: string
 *                     maxLength: 160
 *                     example: 'High-quality Samsung smartphone'
 *                   keywords:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ['samsung', 'smartphone', 'galaxy']
 *                 description: SEO information
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: 'Product updated successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product by its ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Store ID for filtering
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: 'Product deleted successfully'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get featured products
 *     description: Retrieve all featured products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
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
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products/sale:
 *   get:
 *     summary: Get products on sale
 *     description: Retrieve all products that are currently on sale
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Sale products retrieved successfully
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
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products/upload-main-image:
 *   post:
 *     summary: Upload product main image
 *     description: Upload a main image for a product to Cloudflare R2
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - storeId
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product main image file
 *               storeId:
 *                 type: string
 *                 format: uuid
 *                 example: '507f1f77bcf86cd799439012'
 *                 description: Store ID for organizing uploads
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
 *                 image:
 *                   type: string
 *                   example: 'products/507f1f77bcf86cd799439012/main/image.jpg'
 *                   description: Image key in storage
 *                 imageUrl:
 *                   type: string
 *                   example: 'https://example.com/products/507f1f77bcf86cd799439012/main/image.jpg'
 *                   description: Public URL for the uploaded image
 *       400:
 *         description: Bad request - no file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products/upload-gallery-images:
 *   post:
 *     summary: Upload product gallery images
 *     description: Upload multiple images for product gallery to Cloudflare R2
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *               - storeId
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product gallery image files (max 10)
 *               storeId:
 *                 type: string
 *                 format: uuid
 *                 example: '507f1f77bcf86cd799439012'
 *                 description: Store ID for organizing uploads
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       image:
 *                         type: string
 *                         example: 'products/507f1f77bcf86cd799439012/gallery/image1.jpg'
 *                         description: Image key in storage
 *                       imageUrl:
 *                         type: string
 *                         example: 'https://example.com/products/507f1f77bcf86cd799439012/gallery/image1.jpg'
 *                         description: Public URL for the uploaded image
 *       400:
 *         description: Bad request - no files uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products/upload-single-image:
 *   post:
 *     summary: Upload single product image for gallery
 *     description: Upload a single image for product gallery to Cloudflare R2
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - storeId
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product gallery image file
 *               storeId:
 *                 type: string
 *                 format: uuid
 *                 example: '507f1f77bcf86cd799439012'
 *                 description: Store ID for organizing uploads
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
 *                 image:
 *                   type: string
 *                   example: 'products/507f1f77bcf86cd799439012/gallery/image.jpg'
 *                   description: Image key in storage
 *                 imageUrl:
 *                   type: string
 *                   example: 'https://example.com/products/507f1f77bcf86cd799439012/gallery/image.jpg'
 *                   description: Public URL for the uploaded image
 *       400:
 *         description: Bad request - no file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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