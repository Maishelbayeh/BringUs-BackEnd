const express = require('express');
const router = express.Router();

const CategoryController = require('../Controllers/CategoryController');
const ProductLabelController = require('../Controllers/ProductLabelController');
const ProductSpecificationController = require('../Controllers/ProductSpecificationController');
// const ProductVariantController = require('../Controllers/ProductVariantController');
const UnitController = require('../Controllers/UnitController');
const ProductController = require('../Controllers/ProductController');

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Category management
 *   - name: ProductLabels
 *     description: Product label management
 *   - name: ProductSpecifications
 *     description: Product specification management
 *   - name: ProductVariants
 *     description: Product variant management
 *   - name: Units
 *     description: Product unit management
 *   - name: Products
 *     description: Product management
 */

/**
 * @swagger
 * /api/meta/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID to filter categories
 *         example: 687505893fbf3098648bfe16
 *     responses:
 *       200:
 *         description: List of categories
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nameAr:
 *                 type: string
 *                 example: "إلكترونيات"
 *               nameEn:
 *                 type: string
 *                 example: "Electronics"
 *               slug:
 *                 type: string
 *                 example: "electronics"
 *               descriptionAr:
 *                 type: string
 *                 example: "كل ما يتعلق بالأجهزة الإلكترونية"
 *               descriptionEn:
 *                 type: string
 *                 example: "All about electronics"
 *               parent:
 *                 type: string
 *                 example: "<parentCategoryId>"
 *               storeId:
 *                 type: string
 *                 description: Store ID (required)
 *                 example: "<storeId>"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               isFeatured:
 *                 type: boolean
 *                 example: false
 *               sortOrder:
 *                 type: integer
 *                 example: 1
 *               icon:
 *                 type: string
 *                 example: "📱"
 *             required:
 *               - nameAr
 *               - nameEn
 *               - storeId
 *     responses:
 *       201:
 *         description: Category created
 */
/**
 * @swagger
 * /api/meta/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         description: Category not found
 *   put:
 *     summary: Update category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Category not found
 *   delete:
 *     summary: Delete category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 *       404:
 *         description: Category not found
 */

/**
 * @swagger
 * /api/meta/product-labels:
 *   get:
 *     summary: Get all product labels
 *     tags: [ProductLabels]
 *     responses:
 *       200:
 *         description: List of product labels
 *   post:
 *     summary: Create a new product label
 *     tags: [ProductLabels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductLabel'
 *     responses:
 *       201:
 *         description: Product label created
 */
/**
 * @swagger
 * /api/meta/product-labels/{id}:
 *   get:
 *     summary: Get product label by ID
 *     tags: [ProductLabels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     responses:
 *       200:
 *         description: Product label found
 *       404:
 *         description: Product label not found
 *   put:
 *     summary: Update product label by ID
 *     tags: [ProductLabels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductLabel'
 *     responses:
 *       200:
 *         description: Product label updated
 *       404:
 *         description: Product label not found
 *   delete:
 *     summary: Delete product label by ID (with protection)
 *     description: Deletes a product label only if it's not being used by any products in the same store
 *     tags: [ProductLabels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product label ID
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         example: "507f1f77bcf86cd799439012"
 *         description: Store ID (required for security and validation)
 *     responses:
 *       200:
 *         description: Product label deleted successfully
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
 *                   example: "Product label deleted successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم حذف تسمية المنتج بنجاح"
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
 *                   example: "Store ID is required"
 *                 message:
 *                   type: string
 *                   example: "Please provide storeId as query parameter"
 *                 messageAr:
 *                   type: string
 *                   example: "يرجى تقديم معرف المتجر كمعامل استعلام"
 *       404:
 *         description: Product label not found
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
 *                   example: "Product label not found"
 *                 message:
 *                   type: string
 *                   example: "Product label not found"
 *                 messageAr:
 *                   type: string
 *                   example: "تسمية المنتج غير موجودة"
 *       409:
 *         description: Cannot delete - label is being used by products
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
 *                   example: "Cannot delete product label"
 *                 message:
 *                   type: string
 *                   example: "Cannot delete product label. It is being used by 3 product(s)"
 *                 messageAr:
 *                   type: string
 *                   example: "لا يمكن حذف تسمية المنتج. يتم استخدامها من قبل 3 منتج"
 *                 details:
 *                   type: object
 *                   properties:
 *                     connectedProducts:
 *                       type: number
 *                       example: 3
 *                     productIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"]
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
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 *                 message:
 *                   type: string
 *                   example: "Error deleting product label"
 *                 messageAr:
 *                   type: string
 *                   example: "خطأ في حذف تسمية المنتج"
 */

/**
 * @swagger
 * /api/meta/stores/{storeId}/product-labels:
 *   get:
 *     summary: Get all product labels for a specific store
 *     tags: [ProductLabels]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID to filter product labels
 *     responses:
 *       200:
 *         description: List of product labels for the store
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
 *                     $ref: '#/components/schemas/ProductLabel'
 *                 count:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Invalid store ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "storeId is required"
 *                 message:
 *                   type: string
 *                   example: "Store ID is required"
 *                 messageAr:
 *                   type: string
 *                   example: "معرف المتجر مطلوب"
 */

/**
 * @swagger
 * /api/meta/stores/{storeId}/product-labels/active:
 *   get:
 *     summary: Get only active product labels for a specific store
 *     description: Returns only product labels with isActive=true for the specified store, sorted by sortOrder
 *     tags: [ProductLabels]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID to filter active product labels
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: List of active product labels for the store
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
 *                   example: "Active product labels retrieved successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم جلب تسميات المنتج النشطة بنجاح"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductLabel'
 *                 count:
 *                   type: number
 *                   example: 2
 *       400:
 *         description: Invalid store ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "storeId is required"
 *                 message:
 *                   type: string
 *                   example: "Store ID is required"
 *                 messageAr:
 *                   type: string
 *                   example: "معرف المتجر مطلوب"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 *                 message:
 *                   type: string
 *                   example: "Error fetching active product labels"
 *                 messageAr:
 *                   type: string
 *                   example: "خطأ في جلب تسميات المنتج النشطة"
 */

/**
 * @swagger
 * /api/meta/product-specifications:
 *   get:
 *     summary: Get all product specifications
 *     tags: [ProductSpecifications]
 *     responses:
 *       200:
 *         description: List of product specifications
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
 *                     $ref: '#/components/schemas/ProductSpecification'
 *                 count:
 *                   type: number
 *                   example: 5
 *   post:
 *     summary: Create a new product specification
 *     tags: [ProductSpecifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titleAr
 *               - titleEn
 *               - values
 *               - storeId
 *             properties:
 *               titleAr:
 *                 type: string
 *                 example: "اللون"
 *                 maxLength: 100
 *                 description: Arabic title of the specification
 *               titleEn:
 *                 type: string
 *                 example: "Color"
 *                 maxLength: 100
 *                 description: English title of the specification
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - valueAr
 *                     - valueEn
 *                   properties:
 *                     valueAr:
 *                       type: string
 *                       example: "أحمر"
 *                       maxLength: 200
 *                       description: Arabic value of the specification option
 *                     valueEn:
 *                       type: string
 *                       example: "Red"
 *                       maxLength: 200
 *                       description: English value of the specification option
 *                 example:
 *                   - valueAr: "أحمر"
 *                     valueEn: "Red"
 *                   - valueAr: "أزرق"
 *                     valueEn: "Blue"
 *                   - valueAr: "أخضر"
 *                     valueEn: "Green"
 *               category:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439014"
 *                 description: Category ID (optional)
 *               storeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *                 description: Store ID (required)
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 default: true
 *               sortOrder:
 *                 type: number
 *                 example: 1
 *                 default: 0
 *     responses:
 *       201:
 *         description: Product specification created successfully
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
 *                   example: "Product specification created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ProductSpecification'
 *       400:
 *         description: Validation error
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
 *                   example: "Missing required fields"
 *                 details:
 *                   type: object
 *                   properties:
 *                     titleAr:
 *                       type: string
 *                       example: "Arabic title is required"
 *                     titleEn:
 *                       type: string
 *                       example: "English title is required"
 *                     values:
 *                       type: string
 *                       example: "Values array is required and must not be empty"
 */
/**
 * @swagger
 * /api/meta/product-specifications/{id}:
 *   get:
 *     summary: Get product specification by ID
 *     tags: [ProductSpecifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product specification ID
 *     responses:
 *       200:
 *         description: Product specification found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductSpecification'
 *       404:
 *         description: Product specification not found
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
 *                   example: "Product specification not found"
 *   put:
 *     summary: Update product specification by ID
 *     tags: [ProductSpecifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product specification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               titleAr:
 *                 type: string
 *                 example: "اللون"
 *                 maxLength: 100
 *                 description: Arabic title of the specification
 *               titleEn:
 *                 type: string
 *                 example: "Color"
 *                 maxLength: 100
 *                 description: English title of the specification
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - valueAr
 *                     - valueEn
 *                   properties:
 *                     valueAr:
 *                       type: string
 *                       example: "أحمر"
 *                       maxLength: 200
 *                       description: Arabic value of the specification option
 *                     valueEn:
 *                       type: string
 *                       example: "Red"
 *                       maxLength: 200
 *                       description: English value of the specification option
 *                 example:
 *                   - valueAr: "أحمر"
 *                     valueEn: "Red"
 *                   - valueAr: "أزرق"
 *                     valueEn: "Blue"
 *                   - valueAr: "أخضر"
 *                     valueEn: "Green"
 *               category:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439014"
 *                 description: Category ID (optional)
 *               storeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *                 description: Store ID (required)
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               sortOrder:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Product specification updated successfully
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
 *                   example: "Product specification updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ProductSpecification'
 *       400:
 *         description: Validation error
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
 *                   example: "Validation failed"
 *       404:
 *         description: Product specification not found
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
 *                   example: "Product specification not found"
 *   delete:
 *     summary: Delete product specification by ID (with protection)
 *     description: Deletes a product specification only if it's not being used by any products in the same store
 *     tags: [ProductSpecifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Product specification ID
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         example: "507f1f77bcf86cd799439012"
 *         description: Store ID (required for security and validation)
 *     responses:
 *       200:
 *         description: Product specification deleted successfully
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
 *                   example: "Product specification deleted successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم حذف مواصفات المنتج بنجاح"
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
 *                   example: "Store ID is required"
 *                 message:
 *                   type: string
 *                   example: "Please provide storeId as query parameter"
 *                 messageAr:
 *                   type: string
 *                   example: "يرجى تقديم معرف المتجر كمعامل استعلام"
 *       404:
 *         description: Product specification not found
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
 *                   example: "Product specification not found"
 *                 message:
 *                   type: string
 *                   example: "Product specification not found"
 *                 messageAr:
 *                   type: string
 *                   example: "مواصفات المنتج غير موجودة"
 *       409:
 *         description: Cannot delete - specification is being used by products
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
 *                   example: "Cannot delete specification"
 *                 message:
 *                   type: string
 *                   example: "Cannot delete specification. It is being used by 5 product(s)"
 *                 messageAr:
 *                   type: string
 *                   example: "لا يمكن حذف المواصفة. يتم استخدامها من قبل 5 منتج"
 *                 details:
 *                   type: object
 *                   properties:
 *                     connectedProducts:
 *                       type: number
 *                       example: 5
 *                     productIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"]
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
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 *                 message:
 *                   type: string
 *                   example: "Error deleting product specification"
 *                 messageAr:
 *                   type: string
 *                   example: "خطأ في حذف مواصفات المنتج"
 */

/**
 * @swagger
 * /api/meta/product-specifications/by-store:
 *   get:
 *     summary: Get all product specifications for a specific store
 *     tags: [ProductSpecifications]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID to filter product specifications
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: List of product specifications for the store
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
 *                     $ref: '#/components/schemas/ProductSpecification'
 *                 count:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: storeId is required
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
 *                   example: "storeId is required"
 *                 message:
 *                   type: string
 *                   example: "Store ID is required"
 *                 messageAr:
 *                   type: string
 *                   example: "معرف المتجر مطلوب"
 */

/**
 * @swagger
 * /api/meta/stores/{storeId}/product-specifications/active:
 *   get:
 *     summary: Get only active product specifications for a specific store
 *     description: Returns only product specifications with isActive=true for the specified store
 *     tags: [ProductSpecifications]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID to filter active product specifications
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: List of active product specifications for the store
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
 *                   example: "Active product specifications retrieved successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم جلب المواصفات النشطة بنجاح"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductSpecification'
 *                 count:
 *                   type: number
 *                   example: 2
 *       400:
 *         description: Invalid store ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "storeId is required"
 *                 message:
 *                   type: string
 *                   example: "Store ID is required"
 *                 messageAr:
 *                   type: string
 *                   example: "معرف المتجر مطلوب"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 *                 message:
 *                   type: string
 *                   example: "Error fetching active product specifications"
 *                 messageAr:
 *                   type: string
 *                   example: "خطأ في جلب المواصفات النشطة"
 */
router.get('/product-specifications/by-store', require('../Controllers/ProductSpecificationController').getByStoreId);

/**
 * @swagger
 * /api/meta/stores/{storeId}/units/active:
 *   get:
 *     summary: Get only active units for a specific store
 *     description: Returns only units with isActive=true for the specified store
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID to filter active units
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: List of active units for the store
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
 *                   example: "Active units retrieved successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم جلب الوحدات النشطة بنجاح"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Unit'
 *                 count:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Invalid store ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "storeId is required"
 *                 message:
 *                   type: string
 *                   example: "Store ID is required"
 *                 messageAr:
 *                   type: string
 *                   example: "معرف المتجر مطلوب"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 *                 message:
 *                   type: string
 *                   example: "Error fetching active units"
 *                 messageAr:
 *                   type: string
 *                   example: "خطأ في جلب الوحدات النشطة"
 */

/**
 * @swagger
 * /api/meta/product-variants:
 *   get:
 *     summary: Get all product variants
 *     tags: [ProductVariants]
 *     responses:
 *       200:
 *         description: List of product variants
 *   post:
 *     summary: Create a new product variant
 *     tags: [ProductVariants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariant'
 *     responses:
 *       201:
 *         description: Product variant created
 */
/**
 * @swagger
 * /api/meta/product-variants/{id}:
 *   get:
 *     summary: Get product variant by ID
 *     tags: [ProductVariants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     responses:
 *       200:
 *         description: Product variant found
 *       404:
 *         description: Product variant not found
 *   put:
 *     summary: Update product variant by ID
 *     tags: [ProductVariants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariant'
 *     responses:
 *       200:
 *         description: Product variant updated
 *       404:
 *         description: Product variant not found
 *   delete:
 *     summary: Delete product variant by ID
 *     tags: [ProductVariants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product variant deleted
 *       404:
 *         description: Product variant not found
 */

// /**
//  * @swagger
//  * /api/meta/product-variants/by-store:
//  *   get:
//  *     summary: Get all product variants for a specific store
//  *     tags: [ProductVariants]
//  *     parameters:
//  *       - in: query
//  *         name: storeId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Store ID to filter product variants
//  *     responses:
//  *       200:
//  *         description: List of product variants for the store
//  *       400:
//  *         description: storeId is required
//  */
// router.get('/product-variants/by-store', ProductVariantController.getByStoreId);

/**
 * @swagger
 * /api/meta/variants/{storeId}:
 *   get:
 *     summary: Get all product variants for a specific store (by storeId param)
 *     tags: [ProductVariants]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID to filter product variants
 *     responses:
 *       200:
 *         description: List of product variants for the store
 *       400:
 *         description: storeId is required
 */
// router.get('/variants/:storeId', (req, res) => {
//   // إعادة استخدام نفس الدالة لكن مع req.params
//   req.query.storeId = req.params.storeId;
//   require('../Controllers/ProductVariantController').getByStoreId(req, res);
// });

/**
 * @swagger
 * /api/meta/units:
 *   get:
 *     summary: Get all units
 *     tags: [Units]
 *     responses:
 *       200:
 *         description: List of units
 *   post:
 *     summary: Create a new unit
 *     tags: [Units]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Unit'
 *     responses:
 *       201:
 *         description: Unit created
 */
/**
 * @swagger
 * /api/meta/units/{id}:
 *   get:
 *     summary: Get unit by ID
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     responses:
 *       200:
 *         description: Unit found
 *       404:
 *         description: Unit not found
 *   put:
 *     summary: Update unit by ID
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Unit'
 *     responses:
 *       200:
 *         description: Unit updated
 *       404:
 *         description: Unit not found
 *   delete:
 *     summary: Delete unit by ID (with protection)
 *     description: Deletes a unit only if it's not being used by any products in the same store
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Unit ID
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         example: "507f1f77bcf86cd799439012"
 *         description: Store ID (required for security and validation)
 *     responses:
 *       200:
 *         description: Unit deleted successfully
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
 *                   example: "Unit deleted successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم حذف الوحدة بنجاح"
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
 *                   example: "Store ID is required"
 *                 message:
 *                   type: string
 *                   example: "Please provide storeId as query parameter"
 *                 messageAr:
 *                   type: string
 *                   example: "يرجى تقديم معرف المتجر كمعامل استعلام"
 *       404:
 *         description: Unit not found
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
 *                   example: "Unit not found"
 *                 message:
 *                   type: string
 *                   example: "Unit not found"
 *                 messageAr:
 *                   type: string
 *                   example: "الوحدة غير موجودة"
 *       409:
 *         description: Cannot delete - unit is being used by products
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
 *                   example: "Cannot delete unit"
 *                 message:
 *                   type: string
 *                   example: "Cannot delete unit. It is being used by 4 product(s)"
 *                 messageAr:
 *                   type: string
 *                   example: "لا يمكن حذف الوحدة. يتم استخدامها من قبل 4 منتج"
 *                 details:
 *                   type: object
 *                   properties:
 *                     connectedProducts:
 *                       type: number
 *                       example: 4
 *                     productIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"]
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
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 *                 message:
 *                   type: string
 *                   example: "Error deleting unit"
 *                 messageAr:
 *                   type: string
 *                   example: "خطأ في حذف الوحدة"
 */

/**
 * @swagger
 * /api/meta/stores/{storeId}/units:
 *   get:
 *     summary: Get all units for a specific store
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Store ID to filter units
 *     responses:
 *       200:
 *         description: List of units for the store
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Unit'
 *       400:
 *         description: storeId is required
 */
router.get('/stores/:storeId/units', UnitController.getByStoreId);

/**
 * @swagger
 * /api/meta/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created
 */
/**
 * @swagger
 * /api/meta/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */

// Category routes
router.get('/categories', CategoryController.getAll);
router.get('/categories/:id', CategoryController.getById);
router.post('/categories', CategoryController.create);
router.put('/categories/:id', CategoryController.update);
router.delete('/categories/:id', CategoryController.delete);

// Advanced category routes
router.get('/categories/:id/details', CategoryController.getCategoryDetails);
router.get('/categories/tree', CategoryController.getCategoryTree);

// Store-specific category routes
router.get('/stores/:storeId/categories', CategoryController.getAll);
router.post('/stores/:storeId/categories', CategoryController.create);
router.get('/stores/:storeId/categories/tree', CategoryController.getCategoryTree);

// ProductLabel routes
router.get('/product-labels', ProductLabelController.getAll);
router.get('/product-labels/:id', ProductLabelController.getById);
router.get('/stores/:storeId/product-labels', ProductLabelController.getByStoreId);
router.get('/stores/:storeId/product-labels/active', ProductLabelController.getActiveByStoreId);
router.post('/product-labels', ProductLabelController.create);
router.put('/product-labels/:id', ProductLabelController.update);
router.delete('/product-labels/:id', ProductLabelController.delete);

// ProductSpecification routes
router.get('/product-specifications', ProductSpecificationController.getAll);
router.get('/product-specifications/:id', ProductSpecificationController.getById);
router.get('/stores/:storeId/product-specifications/active', ProductSpecificationController.getActiveByStoreId);
router.post('/product-specifications', ProductSpecificationController.create);
router.put('/product-specifications/:id', ProductSpecificationController.update);
router.delete('/product-specifications/:id', ProductSpecificationController.delete);

// ProductVariant routes
// router.get('/product-variants', ProductVariantController.getAll);
// router.get('/product-variants/:id', ProductVariantController.getById);
// router.post('/product-variants', ProductVariantController.create);
// router.put('/product-variants/:id', ProductVariantController.update);
// router.delete('/product-variants/:id', ProductVariantController.delete);

// Unit routes
router.get('/units', UnitController.getAll);
router.get('/units/:id', UnitController.getById);
router.get('/stores/:storeId/units/active', UnitController.getActiveByStoreId);
router.post('/units', UnitController.create);
router.put('/units/:id', UnitController.update);
router.delete('/units/:id', UnitController.delete);
// Add store-specific unit route
// router.get('/stores/:storeId/units', UnitController.getByStoreId); // This line is now redundant as it's handled above

// Product routes
router.get('/products', ProductController.getAll);
router.get('/products/:id', ProductController.getById);
router.post('/products', ProductController.create);
router.put('/products/:id', ProductController.update);
router.delete('/products/:id', ProductController.delete);

// إضافة مسارات جديدة للصفات والألوان
router.get('/products/:productId/options', ProductController.getProductOptions);
router.post('/products/:productId/calculate-price', ProductController.calculateProductPrice);

module.exports = router; 