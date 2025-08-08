const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const ProductController = require('../Controllers/ProductController');

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
      .populate('specifications', 'descriptionAr descriptionEn')
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
    //CONSOLE.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// ========== VARIANT ROUTES (MUST BE BEFORE /:id ROUTE) ========== //

// Create variant product
/**
 * @swagger
 * /api/products/{productId}/variants:
 *   post:
 *     summary: Create a variant product
 *     description: Create a new product that is a variant of an existing product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Parent product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nameAr
 *               - nameEn
 *               - price
 *               - storeId
 *             properties:
 *               nameAr:
 *                 type: string
 *                 description: Arabic product name
 *               nameEn:
 *                 type: string
 *                 description: English product name
 *               descriptionAr:
 *                 type: string
 *                 description: Arabic description
 *               descriptionEn:
 *                 type: string
 *                 description: English description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price
 *               compareAtPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Compare at price
 *               costPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Cost price
 *               barcodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of barcodes
 *               stock:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 description: Stock quantity
 *               storeId:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 description: Store ID
 *     responses:
 *       201:
 *         description: Variant created successfully
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
 *                   example: Variant created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Parent product not found
 */
router.post('/:productId/variants', [
  body('nameAr').notEmpty().withMessage('Arabic name is required'),
  body('nameEn').notEmpty().withMessage('English name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('storeId').isMongoId().withMessage('Valid store ID is required'),
  body('barcodes').optional().isArray().withMessage('Barcodes must be an array'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], ProductController.createVariant);

// Get variants of a product
/**
 * @swagger
 * /api/products/{productId}/variants:
 *   get:
 *     summary: Get variants of a product
 *     description: Retrieve all variant products of a specific parent product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Parent product ID
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Variants retrieved successfully
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
 *                 count:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 */
router.get('/:productId/variants', [
  query('storeId').isMongoId().withMessage('Valid store ID is required')
], ProductController.getVariants);

// Add new variant to existing product
/**
 * @swagger
 * /api/products/{productId}/add-variant:
 *   post:
 *     summary: Add new variant to existing product
 *     description: Create a new variant product and add it to an existing parent product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Parent product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nameAr
 *               - nameEn
 *               - price
 *               - storeId
 *             properties:
 *               nameAr:
 *                 type: string
 *                 description: Arabic variant name
 *               nameEn:
 *                 type: string
 *                 description: English variant name
 *               descriptionAr:
 *                 type: string
 *                 description: Arabic description
 *               descriptionEn:
 *                 type: string
 *                 description: English description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Variant price
 *               compareAtPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Compare at price
 *               costPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Cost price
 *               barcodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of barcodes
 *               availableQuantity:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 description: Available quantity
 *               storeId:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 description: Store ID
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: Main variant image
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional variant images
 *     responses:
 *       201:
 *         description: Variant added successfully
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
 *                   example: Variant added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Parent product not found
 */
router.post('/:productId/add-variant', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), [
  body('nameAr').notEmpty().withMessage('Arabic name is required'),
  body('nameEn').notEmpty().withMessage('English name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('storeId').isMongoId().withMessage('Valid store ID is required'),
  body('barcodes').optional().isArray().withMessage('Barcodes must be an array'),
  body('availableQuantity').optional().isInt({ min: 0 }).withMessage('Available quantity must be a non-negative integer')
], ProductController.addVariant);

// Delete variant
/**
 * @swagger
 * /api/products/{productId}/variants/{variantId}:
 *   delete:
 *     summary: Delete variant
 *     description: Delete a specific variant from a parent product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Parent product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Variant product ID to delete
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Variant deleted successfully
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
 *                   example: Variant deleted successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product or variant not found
 */
router.delete('/:productId/variants/:variantId', [
  query('storeId').isMongoId().withMessage('Valid store ID is required')
], ProductController.deleteVariant);

// Update variant
/**
 * @swagger
 * /api/products/{productId}/variants/{variantId}:
 *   put:
 *     summary: Update variant
 *     description: Update a specific variant of a parent product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Parent product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Variant product ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               nameAr:
 *                 type: string
 *                 description: Arabic variant name
 *               nameEn:
 *                 type: string
 *                 description: English variant name
 *               descriptionAr:
 *                 type: string
 *                 description: Arabic description
 *               descriptionEn:
 *                 type: string
 *                 description: English description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Variant price
 *               compareAtPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Compare at price
 *               costPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Cost price
 *               barcodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of barcodes
 *               availableQuantity:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 description: Available quantity
 *               storeId:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 description: Store ID
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: Main variant image
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional variant images
 *               specifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of specification IDs
 *               specificationValues:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     specificationId:
 *                       type: string
 *                     valueId:
 *                       type: string
 *                     value:
 *                       type: string
 *                     title:
 *                       type: string
 *                 description: Array of specification values
 *     responses:
 *       200:
 *         description: Variant updated successfully
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
 *                   example: Variant updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product or variant not found
 */
router.put('/:productId/variants/:variantId', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), [
  body('storeId').isMongoId().withMessage('Valid store ID is required'),
  body('nameAr').optional().notEmpty().withMessage('Arabic name cannot be empty'),
  body('nameEn').optional().notEmpty().withMessage('English name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('barcodes').optional().isArray().withMessage('Barcodes must be an array'),
  body('availableQuantity').optional().isInt({ min: 0 }).withMessage('Available quantity must be a non-negative integer')
], ProductController.updateVariant);

// ========== GENERAL PRODUCT ROUTES ========== //

// Get products with variants
/**
 * @swagger
 * /api/products/with-variants:
 *   get:
 *     summary: Get products with variants
 *     description: Retrieve all products that have variants
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by store ID
 *     responses:
 *       200:
 *         description: Products with variants retrieved successfully
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
 *                 count:
 *                   type: integer
 *                   example: 5
 */
router.get('/with-variants', ProductController.getWithVariants);

// Get variant products only
/**
 * @swagger
 * /api/products/variants-only:
 *   get:
 *     summary: Get variant products only
 *     description: Retrieve all products that are variants (have a parent product)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by store ID
 *     responses:
 *       200:
 *         description: Variant products retrieved successfully
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
 *                 count:
 *                   type: integer
 *                   example: 10
 */
router.get('/variants-only', ProductController.getVariantsOnly);

/**
 * @swagger
 * /api/products/by-store/{storeId}:
 *   get:
 *     summary: Get all products by storeId
 *     description: Retrieve all products for a specific store by storeId
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           example: '687c9bb0a7b3f2a0831c4675'
 *         description: Store ID (MongoDB ObjectId)
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
 *                 count:
 *                   type: integer
 *                   example: 10
 *       400:
 *         description: Bad request - storeId missing or invalid
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
router.get('/by-store/:storeId', ProductController.getByStoreId);

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
      .populate('specifications', 'descriptionAr descriptionEn')
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
    //CONSOLE.error('Get product error:', error);
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
 *                   type: string
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
router.post(
  '/',
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  ProductController.create
);

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
 *                   type: string
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
router.put(
  '/:id',
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  ProductController.update
);

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
    //CONSOLE.error('Delete product error:', error);
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
    //CONSOLE.error('Get featured products error:', error);
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
    //CONSOLE.error('Get sale products error:', error);
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
 *                 pattern: '^[a-fA-F0-9]{24}$'
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
    //CONSOLE.error('Upload main image error:', err);
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
 *                 pattern: '^[a-fA-F0-9]{24}$'
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
    //CONSOLE.error('Upload gallery images error:', err);
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
 *                 pattern: '^[a-fA-F0-9]{24}$'
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
    //CONSOLE.error('Upload single image error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed',
      message: err.message 
    });
  }
});

/**
 * @swagger
 * /api/products/{productId}/colors:
 *   post:
 *     summary: Add colors to product
 *     description: Add new colors to an existing product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - colors
 *             properties:
 *               storeId:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 example: '687c9bb0a7b3f2a0831c4675'
 *                 description: Store ID
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [['#FF0000', '#00FF00'], ['#0000FF']]
 *                 description: Array of color arrays to add
 *     responses:
 *       200:
 *         description: Colors added successfully
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
 *                   example: 'Colors added successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 */
router.post('/:productId/colors', ProductController.addColors);

/**
 * @swagger
 * /api/products/{productId}/colors:
 *   delete:
 *     summary: Remove colors from product
 *     description: Remove specific colors from a product by their indexes
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - colorIndexes
 *             properties:
 *               storeId:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 example: '687c9bb0a7b3f2a0831c4675'
 *                 description: Store ID
 *               colorIndexes:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [0, 2]
 *                 description: Array of color indexes to remove
 *     responses:
 *       200:
 *         description: Colors removed successfully
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
 *                   example: 'Colors removed successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 */
router.delete('/:productId/colors', ProductController.removeColors);

/**
 * @swagger
 * /api/products/{productId}/colors:
 *   put:
 *     summary: Replace all colors for product
 *     description: Replace all existing colors with new colors
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - colors
 *             properties:
 *               storeId:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 example: '687c9bb0a7b3f2a0831c4675'
 *                 description: Store ID
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [['#FF0000', '#00FF00'], ['#0000FF']]
 *                 description: New colors array to replace existing colors
 *     responses:
 *       200:
 *         description: Colors replaced successfully
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
 *                   example: 'Colors replaced successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 */
router.put('/:productId/colors', ProductController.replaceColors);

module.exports = router; 