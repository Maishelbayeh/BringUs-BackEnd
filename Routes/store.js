const express = require('express');
const router = express.Router();
const StoreController = require('../Controllers/StoreController');
const { protect, authorize, isActive } = require('../middleware/auth');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const { 
  hasStoreAccess, 
  hasPermission, 
  isPrimaryOwner, 
  isAdmin, 
  isSuperAdmin 
} = require('../middleware/permissions');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// All routes require authentication (applied after public routes)

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *     responses:
 *       200:
 *         description: Store retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Protected below

/**
 * @swagger
 * /api/stores/slug/{slug}:
 *   get:
 *     summary: Get store by slug (Public)
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: "mystore"
 *         description: "Store slug"
 *     responses:
 *       200:
 *         description: Store retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/slug/:slug', StoreController.getStoreBySlug);

/**
 * @swagger
 * /api/stores:
 *   post:
 *     summary: Create a new store (Public - No authentication required)
 *     tags: [Stores]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nameAr
 *               - nameEn
 *               - slug
 *               - contact
 *             properties:
 *               nameAr:
 *                 type: string
 *                 maxLength: 100
 *                 example: "متجري"
 *                 description: "Store name in Arabic"
 *               nameEn:
 *                 type: string
 *                 maxLength: 100
 *                 example: "My Store"
 *                 description: "Store name in English"
 *               descriptionAr:
 *                 type: string
 *                 maxLength: 500
 *                 example: "متجر رائع"
 *                 description: "Store description in Arabic"
 *               descriptionEn:
 *                 type: string
 *                 maxLength: 500
 *                 example: "A great store"
 *                 description: "Store description in English"
 *               slug:
 *                 type: string
 *                 example: "mystore"
 *                 description: "Unique store slug"
 *               whatsappNumber:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: "WhatsApp contact number"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: "Store logo image"
 *               contact:
 *                 type: object
 *                 required:
 *                   - email
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "contact@mystore.com"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: "123 Main St"
 *                       city:
 *                         type: string
 *                         example: "New York"
 *                       state:
 *                         type: string
 *                         example: "NY"
 *                       zipCode:
 *                         type: string
 *                         example: "10001"
 *                       country:
 *                         type: string
 *                         example: "USA"
 *               settings:
 *                 type: object
 *                 properties:
 *                   currency:
 *                     type: string
 *                     example: "ILS"
 *                     description: "Store currency"
 *                   mainColor:
 *                     type: string
 *                     example: "#000000"
 *                     description: "Main store color"
 *                   language:
 *                     type: string
 *                     example: "en"
 *                     description: "Default language"
 *                   storeDiscount:
 *                     type: number
 *                     example: 0
 *                     description: "Store-wide discount percentage"
 *                   timezone:
 *                     type: string
 *                     example: "UTC"
 *                     description: "Store timezone"
 *                   taxRate:
 *                     type: number
 *                     example: 0
 *                     description: "Tax rate percentage"
 *                   shippingEnabled:
 *                     type: boolean
 *                     example: true
 *                     description: "Enable shipping"
 *                   storeSocials:
 *                     type: object
 *                     properties:
 *                       facebook:
 *                         type: string
 *                         example: "https://facebook.com/mystore"
 *                       instagram:
 *                         type: string
 *                         example: "https://instagram.com/mystore"
 *                       twitter:
 *                         type: string
 *                         example: "https://twitter.com/mystore"
 *                       youtube:
 *                         type: string
 *                         example: "https://youtube.com/mystore"
 *                       linkedin:
 *                         type: string
 *                         example: "https://linkedin.com/mystore"
 *                       telegram:
 *                         type: string
 *                         example: "https://t.me/mystore"
 *                       snapchat:
 *                         type: string
 *                         example: "mystore"
 *                       pinterest:
 *                         type: string
 *                         example: "https://pinterest.com/mystore"
 *                       tiktok:
 *                         type: string
 *                         example: "https://tiktok.com/@mystore"
 *     responses:
 *       201:
 *         description: Store created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Slug already exists or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', upload.single('logo'), StoreController.createStore);

router.use(protect);
router.use(isActive);

router.get('/:id', StoreController.getStore);

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stores (Superadmin only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All stores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Superadmin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', isSuperAdmin, StoreController.getAllStores);



/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Update store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nameAr:
 *                 type: string
 *                 maxLength: 100
 *                 example: "متجري المحدث"
 *                 description: "Store name in Arabic"
 *               nameEn:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Updated Store Name"
 *                 description: "Store name in English"
 *               descriptionAr:
 *                 type: string
 *                 maxLength: 500
 *                 example: "متجر محدث"
 *                 description: "Store description in Arabic"
 *               descriptionEn:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated store description"
 *                 description: "Store description in English"
 *               slug:
 *                 type: string
 *                 example: "updatedstore"
 *                 description: "Store slug"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 example: "active"
 *               whatsappNumber:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: "WhatsApp contact number"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: "Store logo image"
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "newcontact@store.com"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: "123 Main St"
 *                       city:
 *                         type: string
 *                         example: "New York"
 *                       state:
 *                         type: string
 *                         example: "NY"
 *                       zipCode:
 *                         type: string
 *                         example: "10001"
 *                       country:
 *                         type: string
 *                         example: "USA"
 *               settings:
 *                 type: object
 *                 properties:
 *                   currency:
 *                     type: string
 *                     example: "ILS"
 *                     description: "Store currency"
 *                   mainColor:
 *                     type: string
 *                     example: "#FF0000"
 *                     description: "Main store color"
 *                   language:
 *                     type: string
 *                     example: "ar"
 *                     description: "Default language"
 *                   storeDiscount:
 *                     type: number
 *                     example: 10
 *                     description: "Store-wide discount percentage"
 *                   timezone:
 *                     type: string
 *                     example: "Asia/Dubai"
 *                     description: "Store timezone"
 *                   taxRate:
 *                     type: number
 *                     example: 5
 *                     description: "Tax rate percentage"
 *                   shippingEnabled:
 *                     type: boolean
 *                     example: true
 *                     description: "Enable shipping"
 *                   storeSocials:
 *                     type: object
 *                     properties:
 *                       facebook:
 *                         type: string
 *                         example: "https://facebook.com/updatedstore"
 *                       instagram:
 *                         type: string
 *                         example: "https://instagram.com/updatedstore"
 *                       twitter:
 *                         type: string
 *                         example: "https://twitter.com/updatedstore"
 *                       youtube:
 *                         type: string
 *                         example: "https://youtube.com/updatedstore"
 *                       linkedin:
 *                         type: string
 *                         example: "https://linkedin.com/updatedstore"
 *                       telegram:
 *                         type: string
 *                         example: "https://t.me/updatedstore"
 *                       snapchat:
 *                         type: string
 *                         example: "updatedstore"
 *                       pinterest:
 *                         type: string
 *                         example: "https://pinterest.com/updatedstore"
 *                       tiktok:
 *                         type: string
 *                         example: "https://tiktok.com/@updatedstore"
 *     responses:
 *       200:
 *         description: Store updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Slug already exists or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied or permission required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', hasStoreAccess, upload.single('logo'), StoreController.updateStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Delete store (Primary owner only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *     responses:
 *       200:
 *         description: Store deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Primary owner access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', hasStoreAccess, isPrimaryOwner, StoreController.deleteStore);

/**
 * @swagger
 * /api/stores/{storeId}/stats:
 *   get:
 *     summary: Get store statistics
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *     responses:
 *       200:
 *         description: Store statistics retrieved successfully
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
 *                     ownersCount:
 *                       type: number
 *                       example: 5
 *       403:
 *         description: Access denied or permission required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:storeId/stats', hasStoreAccess, hasPermission('view_analytics'), StoreController.getStoreStats);

/**
 * @swagger
 * /api/stores/{storeId}/customers:
 *   get:
 *     summary: Get customers by store ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Page number"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Number of customers per page"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, banned]
 *         description: "Filter by customer status"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Search in first name, last name, email, or phone"
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
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
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     active:
 *                       type: integer
 *                       example: 45
 *                     inactive:
 *                       type: integer
 *                       example: 3
 *                     banned:
 *                       type: integer
 *                       example: 2
 *                     emailVerified:
 *                       type: integer
 *                       example: 40
 *       403:
 *         description: Access denied or permission required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:storeId/customers', StoreController.getCustomersByStoreId);

/**
 * @swagger
 * /api/stores/{storeId}/guests:
 *   get:
 *     summary: Get guest customers by store ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Page number"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Number of guests per page"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Search term for guest name, email, or phone"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [lastOrderDate, firstOrderDate, totalSpent, orderCount]
 *           default: "lastOrderDate"
 *         description: "Sort field"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *         description: "Sort order"
 *     responses:
 *       200:
 *         description: Guest customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       orderCount:
 *                         type: number
 *                       totalSpent:
 *                         type: number
 *                       lastOrderDate:
 *                         type: string
 *                         format: date-time
 *                       firstOrderDate:
 *                         type: string
 *                         format: date-time
 *                       isGuest:
 *                         type: boolean
 *                         default: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     totalSpent:
 *                       type: number
 *                     averageOrderValue:
 *                       type: number
 *                     averageOrdersPerGuest:
 *                       type: number
 *                     recentGuests:
 *                       type: number
 *                     topSpenders:
 *                       type: array
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:storeId/guests', StoreController.getGuestsByStoreId);

/**
 * @swagger
 * /api/stores/{storeId}/customers/{customerId}:
 *   get:
 *     summary: Get customer by ID within store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: "Customer ID"
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied or permission required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:storeId/customers/:customerId', hasStoreAccess, hasPermission('manage_users'), StoreController.getCustomerById);

/**
 * @swagger
 * /api/stores/{storeId}/customers/{customerId}:
 *   put:
 *     summary: Update customer within store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: "Customer ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Updated First Name"
 *               lastName:
 *                 type: string
 *                 example: "Updated Last Name"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *                 example: "active"
 *               isEmailVerified:
 *                 type: boolean
 *                 example: true
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied or permission required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:storeId/customers/:customerId', hasStoreAccess, hasPermission('manage_users'), StoreController.updateCustomer);



/**
 * @swagger
 * /api/stores/{storeId}/customers/{customerId}:
 *   delete:
 *     summary: Delete customer within store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439013"
 *         description: "Customer ID"
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied or permission required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:storeId/customers/:customerId', hasStoreAccess, hasPermission('manage_users'), StoreController.deleteCustomer);

/**
 * @swagger
 * /api/stores/upload-image:
 *   post:
 *     summary: Upload image to Cloudflare R2
 *     tags: [Stores]
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
 * 
 *               - storeId
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: "Image file to upload"
 *               storeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *                 description: "Store ID for organizing images"
 *               folder:
 *                 type: string
 *                 example: "products"
 *                 description: "Optional folder name (default: '')"
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
 *                       example: "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/products/1234567890-123456789.png"
 *                     key:
 *                       type: string
 *                       example: "products/1234567890-123456789.png"
 *       400:
 *         description: Invalid file or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/upload-image', protect, isActive, upload.single('image'), async (req, res) => {
  try {
    // التحقق من وجود الملف
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // التحقق من وجود storeId
    if (!req.body.storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required'
      });
    }

    const { storeId } = req.body;
    const folder = req.body.folder || 'general'; // مجلد افتراضي إذا لم يتم تحديده

    // رفع الصورة إلى Cloudflare
    const result = await uploadToCloudflare(
      req.file.buffer,
      req.file.originalname,
      `${storeId}/${folder}`
    );

    //CONSOLE.log('✅ Image uploaded successfully:', result);

    res.status(200).json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    //CONSOLE.error('❌ Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/stores/upload-multiple-images:
 *   post:
 *     summary: Upload multiple images to Cloudflare R2
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
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
 *                 description: "Multiple image files to upload"
 *               storeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *                 description: "Store ID for organizing images"
 *               folder:
 *                 type: string
 *                 example: "products"
 *                 description: "Optional folder name (default: '')"
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         example: "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/products/1234567890-123456789.png"
 *                       key:
 *                         type: string
 *                         example: "products/1234567890-123456789.png"
 *                       originalName:
 *                         type: string
 *                         example: "product1.png"
 *                       size:
 *                         type: number
 *                         example: 1024000
 *                       mimetype:
 *                         type: string
 *                         example: "image/png"
 *       400:
 *         description: Invalid files or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/upload-multiple-images', protect, isActive, upload.array('images', 10), async (req, res) => {
  try {
    // التحقق من وجود الملفات
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    // التحقق من وجود storeId
    if (!req.body.storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required'
      });
    }

    const { storeId } = req.body;
    const folder = req.body.folder || 'general'; // مجلد افتراضي إذا لم يتم تحديده

    // رفع جميع الصور
    const uploadPromises = req.files.map(file => 
      uploadToCloudflare(
        file.buffer,
        file.originalname,
        `${storeId}/${folder}`
      )
    );

    const results = await Promise.all(uploadPromises);

    // تنسيق النتائج
    const formattedResults = results.map((result, index) => ({
      url: result.url,
      key: result.key,
      originalName: req.files[index].originalname,
      size: req.files[index].size,
      mimetype: req.files[index].mimetype
    }));

    //CONSOLE.log('✅ Multiple images uploaded successfully:', formattedResults.length);

    res.status(200).json({
      success: true,
      data: formattedResults
    });

  } catch (error) {
    //CONSOLE.error('❌ Error uploading multiple images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload images',
      details: error.message
    });
  }
});

module.exports = router; 