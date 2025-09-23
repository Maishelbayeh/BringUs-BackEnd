const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const ProductController = require('../Controllers/ProductController');
const { protect } = require('../middleware/auth');
const { addStoreFilter } = require('../middleware/storeIsolation');

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
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Filter by category ID (MongoDB ObjectId)
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
 *           enum: [price_asc, price_desc, name_asc, name_desc, name_ar_asc, name_ar_desc, rating_desc, newest, oldest]
 *           default: newest
 *         description: Sort order - price_asc (price ascending), price_desc (price descending), name_asc (English name ascending), name_desc (English name descending), name_ar_asc (Arabic name ascending), name_ar_desc (Arabic name descending), rating_desc (rating descending), newest (newest first), oldest (oldest first)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product names and descriptions
 *       - in: query
 *         name: colors
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by colors (array of color hex codes)
 *       - in: query
 *         name: productLabels
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by product label IDs (array of label IDs)
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Filter by store ID (MongoDB ObjectId)
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
  query('category').optional().custom((value) => {
    // دعم فئة واحدة أو عدة فئات مفصولة بـ ||
    if (typeof value === 'string') {
      const categories = value.split('||');
      return categories.every(cat => /^[a-fA-F0-9]{24}$/.test(cat.trim()));
    }
    return true;
  }).withMessage('Invalid category ID(s). Use format: categoryId1||categoryId2||categoryId3'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'rating_desc', 'newest', 'oldest']).withMessage('Invalid sort option'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('colors').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        // If not JSON, treat as single color
        return true;
      }
    }
    return Array.isArray(value);
  }).withMessage('Colors must be an array or valid JSON string'),
  query('productLabels').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        // If not JSON, treat as single label
        return true;
      }
    }
    return Array.isArray(value);
  }).withMessage('Product labels must be an array or valid JSON string'),
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
      colors,
      productLabels,
      storeId
    } = req.query;

    // Build comprehensive filter object
    const filter = { isActive: true };

    // تطبيق جميع الفلاتر معاً
    console.log('🔍 Building comprehensive filter with multiple criteria...');

    // Add store filter if provided
    if (storeId) {
      filter.store = storeId;
      console.log('🏪 Applied store filter:', storeId);
    }

    // 1. فلترة الفئات (دعم متعدد)
    if (category) {
      if (category.includes('||')) {
        const categoryIds = category.split('||').map(cat => cat.trim());
        filter.category = { $in: categoryIds };
        console.log('📂 Applied multi-category filter:', categoryIds);
      } else {
        filter.category = category;
        console.log('📂 Applied single category filter:', category);
      }
    }

    // 2. فلترة السعر
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = parseFloat(minPrice);
        console.log('💰 Applied min price filter:', minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = parseFloat(maxPrice);
        console.log('💰 Applied max price filter:', maxPrice);
      }
    }

    // 3. فلترة البحث
    if (search) {
      filter.$text = { $search: search };
      console.log('🔍 Applied search filter:', search);
    }

    // 4. فلترة الألوان (في قاعدة البيانات)
    if (colors && Array.isArray(colors) && colors.length > 0) {
      // البحث في JSON string للألوان - استخدام regex للبحث في النص
      const colorRegex = colors.map(color => 
        new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      );
      filter.colors = { $regex: { $in: colorRegex } };
      console.log('🎨 Applied colors filter:', colors);
    }

    // 5. فلترة العلامات (في قاعدة البيانات)
    if (productLabels && Array.isArray(productLabels) && productLabels.length > 0) {
      filter.productLabels = { $in: productLabels };
      console.log('🏷️ Applied product labels filter:', productLabels);
    }

    console.log('✅ Final filter object:', JSON.stringify(filter, null, 2));

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
    let products = await Product.find(filter)
      .populate('category', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('specifications', 'descriptionAr descriptionEn')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain')
      .sort(sortObj);

    // تم دمج الفلاتر الإضافية في الفلتر الأساسي لتحسين الأداء
    console.log('✅ All filters applied at database level for better performance');

    // Apply pagination after filtering
    const total = products.length;
    products = products.slice(skip, skip + parseInt(limit));

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
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Variant product ID to delete (MongoDB ObjectId)
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
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Variant product ID to update (MongoDB ObjectId)
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
 * /api/products/{storeId}/with-variants:
 *   get:
 *     summary: Get products with variants
 *     description: Retrieve all products that have variants for a specific store
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
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
 *       400:
 *         description: Bad request - storeId missing or invalid
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/with-variants', ProductController.getWithVariants);

// Get variant products only
/**
 * @swagger
 * /api/products/{storeId}/variants-only:
 *   get:
 *     summary: Get variant products only
 *     description: Retrieve all products that are variants (have a parent product) for a specific store
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
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
 *       400:
 *         description: Bad request - storeId missing or invalid
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/variants-only', ProductController.getVariantsOnly);

// Get all products without variants (for product display page)
/**
 * @swagger
 * /api/products/{storeId}/without-variants:
 *   get:
 *     summary: Get all products without variants
 *     description: Retrieve all products for a specific store, excluding variant products (products that are variants of other products)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
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
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Filter by category ID (MongoDB ObjectId)
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
 *           enum: [price_asc, price_desc, name_asc, name_desc, name_ar_asc, name_ar_desc, rating_desc, newest, oldest]
 *           default: newest
 *         description: Sort order - price_asc (price ascending), price_desc (price descending), name_asc (English name ascending), name_desc (English name descending), name_ar_asc (Arabic name ascending), name_ar_desc (Arabic name descending), rating_desc (rating descending), newest (newest first), oldest (oldest first)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product names and descriptions
 *       - in: query
 *         name: colors
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by colors (array of color hex codes)
 *       - in: query
 *         name: productLabels
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by product label IDs (array of label IDs)
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
 *         description: Bad request - storeId missing or invalid
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/without-variants', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().custom((value) => {
    // دعم فئة واحدة أو عدة فئات مفصولة بـ ||
    if (typeof value === 'string') {
      const categories = value.split('||');
      return categories.every(cat => /^[a-fA-F0-9]{24}$/.test(cat.trim()));
    }
    return true;
  }).withMessage('Invalid category ID(s). Use format: categoryId1||categoryId2||categoryId3'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'name_ar_asc', 'name_ar_desc', 'newest', 'oldest']).withMessage('Invalid sort option'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('colors').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        // If not JSON, treat as single color
        return true;
      }
    }
    return Array.isArray(value);
  }).withMessage('Colors must be an array or valid JSON string'),
  query('productLabels').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        // If not JSON, treat as single label
        return true;
      }
    }
    return Array.isArray(value);
  }).withMessage('Product labels must be an array or valid JSON string')
], ProductController.getWithoutVariants);

// Get product details with variants
/**
 * @swagger
 * /api/products/{storeId}/{productId}/with-variants:
 *   get:
 *     summary: Get product details with variants
 *     description: Retrieve detailed information about a specific product including all its variants for a specific store
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Product details with variants retrieved successfully
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
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *                     variants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                       description: Array of variant products
 *                     variantsCount:
 *                       type: integer
 *                       example: 3
 *                       description: Number of variants
 *       400:
 *         description: Bad request - storeId missing or invalid
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/:productId/with-variants', ProductController.getProductWithVariants);

// Get specific variant details
/**
 * @swagger
 * /api/products/{storeId}/{productId}/variants/{variantId}:
 *   get:
 *     summary: Get specific variant details
 *     description: Retrieve detailed information about a specific variant of a product for a specific store
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Parent product ID (MongoDB ObjectId)
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Variant product ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Variant details retrieved successfully
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
 *                     parentProduct:
 *                       $ref: '#/components/schemas/Product'
 *                       description: Parent product information
 *                     variant:
 *                       $ref: '#/components/schemas/Product'
 *                       description: Variant product details
 *       400:
 *         description: Bad request - storeId missing or invalid
 *       404:
 *         description: Product or variant not found
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/:productId/variants/:variantId', ProductController.getVariantDetails);

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

// Get almost sold products
/**
 * @swagger
 * /api/products/{storeId}/almost-sold:
 *   get:
 *     summary: Get almost sold products
 *     description: Retrieve products that are almost sold out (stock or available quantity <= lowStockThreshold). Excludes products with stock = 0 (sold out).
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID (MongoDB ObjectId)
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
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Custom threshold for almost sold (overrides lowStockThreshold)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [stock, availableQuantity, nameEn, nameAr, price, createdAt]
 *           default: stock
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order - price_asc (price ascending), price_desc (price descending), name_asc (English name ascending), name_desc (English name descending), name_ar_asc (Arabic name ascending), name_ar_desc (Arabic name descending), rating_desc (rating descending), newest (newest first), oldest (oldest first)
 *       - in: query
 *         name: specification
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Filter by specific product specification ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Almost sold products retrieved successfully
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Product'
 *                       - type: object
 *                         properties:
 *                           isAlmostSold:
 *                             type: boolean
 *                             example: true
 *                           stockDifference:
 *                             type: integer
 *                             example: -2
 *                             description: Difference between current stock and threshold
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     totalItems:
 *                       type: integer
 *                       example: 45
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 20
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalAlmostSold:
 *                       type: integer
 *                       example: 45
 *                     threshold:
 *                       type: string
 *                       example: "lowStockThreshold"
 *                     message:
 *                       type: string
 *                       example: "Found 45 products that are almost sold out"
 *       400:
 *         description: Bad request - storeId missing or invalid
 *       500:
 *         description: Internal server error
 */
router.get('/:storeId/almost-sold', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer'),
  query('sortBy').optional().isIn(['stock', 'availableQuantity', 'nameEn', 'nameAr', 'price', 'createdAt']).withMessage('Invalid sortBy field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('specification').optional().isMongoId().withMessage('Specification must be a valid MongoDB ObjectId')
], ProductController.getAlmostSoldProducts);

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
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product ID (MongoDB ObjectId)
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID for filtering (MongoDB ObjectId)
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
 *                   pattern: '^[a-fA-F0-9]{24}$'
 *                 example: ['507f1f77bcf86cd799439015']
 *                 description: Array of product label IDs (MongoDB ObjectId)
 *               specifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^[a-fA-F0-9]{24}$'
 *                 example: ['507f1f77bcf86cd799439017']
 *                 description: Array of product specification IDs (MongoDB ObjectId)
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
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product ID (MongoDB ObjectId)
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
 *                   pattern: '^[a-fA-F0-9]{24}$'
 *                 example: ['507f1f77bcf86cd799439015']
 *                 description: Array of product label IDs (MongoDB ObjectId)
 *               specifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^[a-fA-F0-9]{24}$'
 *                 example: ['507f1f77bcf86cd799439017']
 *                 description: Array of product specification IDs (MongoDB ObjectId)
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
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product ID (MongoDB ObjectId)
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID for filtering (MongoDB ObjectId)
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

/**
 * @swagger
 * /api/products/{productId}/views:
 *   post:
 *     summary: Increment product views
 *     description: Increment the view count for a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product ID
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Product views incremented successfully
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
 *                   example: 'Product views incremented successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: '687c9bb0a7b3f2a0831c4675'
 *                     views:
 *                       type: number
 *                       example: 150
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 */
router.post('/:productId/views', ProductController.incrementViews);

module.exports = router; 