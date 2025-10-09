const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
    extractStoreId, 
    extractStoreIdOptional, 
    requireStoreId,
    getStoreIdFromToken,
    getStoreIdFromHeaders 
} = require('../middleware/storeAuth');
const Store = require('../Models/Store');

/**
 * @swagger
 * /api/store-info/current:
 *   get:
 *     summary: Get current store information from token
 *     description: Extract store ID from JWT token and return store details
 *     tags: [Store Info]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved store information
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
 *                     storeId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     storeName:
 *                       type: string
 *                       example: "My Store"
 *                     storeNameAr:
 *                       type: string
 *                       example: "متجري"
 *                     domain:
 *                       type: string
 *                       example: "mystore"
 *                     status:
 *                       type: string
 *                       example: "active"
 *       400:
 *         description: Store ID not found in token
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/current', 
    protect, 
    extractStoreId,
    async (req, res) => {
        try {
            const storeId = req.storeId;
            
            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID not found in token'
                });
            }

            const Store = require('../Models/Store');
            const store = await Store.findById(storeId);

            if (!store) {
                return res.status(404).json({
                    success: false,
                    message: 'Store not found',
                    messageAr: 'المتجر غير موجود'
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    storeId: storeId,
                    storeName: store.name,
                    storeNameAr: store.nameAr,
                    domain: store.domain,
                    status: store.status,
                    subscription: store.subscription
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching store info',
                messageAr: 'خطأ في جلب معلومات المتجر',
                error: error.message
            });
        }
    }
);

/**
 * @swagger
 * /api/store-info/optional:
 *   get:
 *     summary: Get store information if available (optional authentication)
 *     description: Extract store ID from JWT token if provided, works for both authenticated and guest users
 *     tags: [Store Info]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully processed request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 authenticated:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     storeName:
 *                       type: string
 *                       example: "My Store"
 *                     storeNameAr:
 *                       type: string
 *                       example: "متجري"
 *                     domain:
 *                       type: string
 *                       example: "mystore"
 *                     status:
 *                       type: string
 *                       example: "active"
 *       500:
 *         description: Internal server error
 */
router.get('/optional', 
    extractStoreIdOptional,
    async (req, res) => {
        try {
            const storeId = req.storeId;
            
            if (storeId) {
                // User is authenticated and has store ID
                const Store = require('../Models/Store');
                const store = await Store.findById(storeId);

                if (store) {
                    return res.status(200).json({
                        success: true,
                        authenticated: true,
                        data: {
                            storeId: storeId,
                            storeName: store.name,
                            storeNameAr: store.nameAr,
                            domain: store.domain,
                            status: store.status,
                            subscription: store.subscription
                        }
                    });
                }
            }

            // No store ID or store not found - return public info
            res.status(200).json({
                success: true,
                authenticated: false,
                message: 'No store information available for guest user'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error processing request',
                messageAr: 'خطأ في معالجة الطلب',
                error: error.message
            });
        }
    }
);

/**
 * @swagger
 * /api/store-info/validated:
 *   get:
 *     summary: Get validated store information
 *     description: Require and validate store ID from token, return detailed store information
 *     tags: [Store Info]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved validated store information
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
 *                     storeId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     storeName:
 *                       type: string
 *                       example: "My Store"
 *                     storeNameAr:
 *                       type: string
 *                       example: "متجري"
 *                     domain:
 *                       type: string
 *                       example: "mystore"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     subscription:
 *                       type: object
 *       400:
 *         description: Store ID not found in token or user data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
router.get('/validated', 
    protect,
    requireStoreId,
    async (req, res) => {
        try {
            const storeId = req.storeId;
            
            // Store ID is guaranteed to exist at this point
            const Store = require('../Models/Store');
            const store = await Store.findById(storeId);

            if (!store) {
                return res.status(404).json({
                    success: false,
                    message: 'Store not found',
                    messageAr: 'المتجر غير موجود'
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    storeId: storeId,
                    storeName: store.name,
                    storeNameAr: store.nameAr,
                    domain: store.domain,
                    status: store.status,
                    subscription: store.subscription,
                    createdAt: store.createdAt,
                    updatedAt: store.updatedAt
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching store info',
                messageAr: 'خطأ في جلب معلومات المتجر',
                error: error.message
            });
        }
    }
);

/**
 * @swagger
 * /api/store-info/token-debug:
 *   get:
 *     summary: Debug token information
 *     description: Extract and display all available information from the JWT token
 *     tags: [Store Info]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully extracted token information
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
 *                     storeIdFromHeaders:
 *                       type: string
 *                       nullable: true
 *                     storeIdFromToken:
 *                       type: string
 *                       nullable: true
 *                     hasToken:
 *                       type: boolean
 *                       example: true
 *                     tokenInfo:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/token-debug', 
    protect,
    async (req, res) => {
        try {
            // Method 1: Get store ID from request headers
            const storeIdFromHeaders = await getStoreIdFromHeaders(req.headers);
            
            // Method 2: Get store ID from token string
            const token = req.headers.authorization?.split(' ')[1];
            const storeIdFromToken = await getStoreIdFromToken(token);

            // Method 3: Get user info from request (set by protect middleware)
            const userInfo = req.user ? {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role,
                store: req.user.store
            } : null;

            res.status(200).json({
                success: true,
                data: {
                    storeIdFromHeaders,
                    storeIdFromToken,
                    hasToken: !!req.headers.authorization,
                    tokenInfo: {
                        authorizationHeader: req.headers.authorization ? 'Present' : 'Missing',
                        tokenLength: token ? token.length : 0,
                        userInfo
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error in token debug',
                messageAr: 'خطأ في تصحيح الرمز',
                error: error.message
            });
        }
    }
);

/**
 * @swagger
 * /api/store-info/update:
 *   patch:
 *     summary: Update store information
 *     description: Update store details including name, description, contact info, and settings
 *     tags: [Store Info]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nameAr:
 *                 type: string
 *                 example: "متجر القمر"
 *               nameEn:
 *                 type: string
 *                 example: "Moon Store"
 *               descriptionAr:
 *                 type: string
 *                 example: "وصف المتجر باللغة العربية"
 *               descriptionEn:
 *                 type: string
 *                 example: "Store description in English"
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     example: "store@example.com"
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
 *                     example: "USD"
 *                   mainColor:
 *                     type: string
 *                     example: "#007bff"
 *                   language:
 *                     type: string
 *                     example: "en"
 *                   timezone:
 *                     type: string
 *                     example: "America/New_York"
 *                   taxRate:
 *                     type: number
 *                     example: 0.1
 *                   shippingEnabled:
 *                     type: boolean
 *                     example: true
 *                   storeSocials:
 *                     type: object
 *                     properties:
 *                       facebook:
 *                         type: string
 *                         example: "https://facebook.com/store"
 *                       instagram:
 *                         type: string
 *                         example: "https://instagram.com/store"
 *                       twitter:
 *                         type: string
 *                         example: "https://twitter.com/store"
 *               whatsappNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               lahzaToken:
 *                 type: string
 *                 description: Lahza Merchant Code (can be sent at root level or inside settings)
 *                 example: "sk_test_aJgxg75kYKtW6qVuTgijJyzpuhszRSvc4"
 *               lahzaSecretKey:
 *                 type: string
 *                 description: Lahza Secret Key (can be sent at root level or inside settings)
 *                 example: "sk_test_aJgxg75kYKtW6qVuTgijJyzpuhszRSvc4"
 *     responses:
 *       200:
 *         description: Store information updated successfully
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
 *                   example: "Store information updated successfully"
 *                 messageAr:
 *                   type: string
 *                   example: "تم تحديث معلومات المتجر بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     nameAr:
 *                       type: string
 *                       example: "متجر القمر"
 *                     nameEn:
 *                       type: string
 *                       example: "Moon Store"
 *                     descriptionAr:
 *                       type: string
 *                       example: "وصف المتجر باللغة العربية"
 *                     descriptionEn:
 *                       type: string
 *                       example: "Store description in English"
 *                     slug:
 *                       type: string
 *                       example: "moon-store"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     contact:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           example: "store@example.com"
 *                         phone:
 *                           type: string
 *                           example: "+1234567890"
 *                         address:
 *                           type: object
 *                           properties:
 *                             street:
 *                               type: string
 *                               example: "123 Main St"
 *                             city:
 *                               type: string
 *                               example: "New York"
 *                             state:
 *                               type: string
 *                               example: "NY"
 *                             zipCode:
 *                               type: string
 *                               example: "10001"
 *                             country:
 *                               type: string
 *                               example: "USA"
 *                     settings:
 *                       type: object
 *                       properties:
 *                         currency:
 *                           type: string
 *                           example: "USD"
 *                         mainColor:
 *                           type: string
 *                           example: "#007bff"
 *                         language:
 *                           type: string
 *                           example: "en"
 *                         timezone:
 *                           type: string
 *                           example: "America/New_York"
 *                         taxRate:
 *                           type: number
 *                           example: 0.1
 *                         shippingEnabled:
 *                           type: boolean
 *                           example: true
 *                         storeSocials:
 *                           type: object
 *                           properties:
 *                             facebook:
 *                               type: string
 *                               example: "https://facebook.com/store"
 *                             instagram:
 *                               type: string
 *                               example: "https://instagram.com/store"
 *                             twitter:
 *                               type: string
 *                               example: "https://twitter.com/store"
 *                     whatsappNumber:
 *                       type: string
 *                       example: "+1234567890"
 *       400:
 *         description: Bad request - Invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - Insufficient permissions
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/update', 
    protect, 
    authorize('admin', 'superadmin'),
    extractStoreId,
    async (req, res) => {
        try {
            const storeId = req.storeId;
            
            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                    messageAr: 'معرف المتجر مطلوب',
                    error: 'No store context available'
                });
            }

            // Get the store
            const store = await Store.findById(storeId);
            if (!store) {
                return res.status(404).json({
                    success: false,
                    message: 'Store not found',
                    messageAr: 'المتجر غير موجود'
                });
            }

            // Prepare update data - only include fields that are provided
            const updateData = {};
            
            // Basic information
            if (req.body.nameAr !== undefined) {
                updateData.nameAr = req.body.nameAr.trim();
            }
            if (req.body.nameEn !== undefined) {
                updateData.nameEn = req.body.nameEn.trim();
            }
            if (req.body.descriptionAr !== undefined) {
                updateData.descriptionAr = req.body.descriptionAr.trim();
            }
            if (req.body.descriptionEn !== undefined) {
                updateData.descriptionEn = req.body.descriptionEn.trim();
            }

            // Contact information
            if (req.body.contact !== undefined) {
                updateData.contact = { ...store.contact, ...req.body.contact };
            }

            // Settings
            if (req.body.settings !== undefined) {
                updateData.settings = { ...store.settings, ...req.body.settings };
            }

            // Handle Lahza credentials sent at root level
            if (req.body.lahzaToken !== undefined || req.body.lahzaSecretKey !== undefined) {
                // Initialize settings if not already set
                if (!updateData.settings) {
                    updateData.settings = { ...store.settings };
                }
                
                if (req.body.lahzaToken !== undefined) {
                    updateData.settings.lahzaToken = req.body.lahzaToken;
                }
                
                if (req.body.lahzaSecretKey !== undefined) {
                    updateData.settings.lahzaSecretKey = req.body.lahzaSecretKey;
                }
            }

            // WhatsApp number
            if (req.body.whatsappNumber !== undefined) {
                updateData.whatsappNumber = req.body.whatsappNumber;
            }

            // Validate required fields if they're being updated
            if (updateData.nameAr && (!updateData.nameAr || updateData.nameAr.trim().length === 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Arabic name cannot be empty',
                    messageAr: 'الاسم العربي لا يمكن أن يكون فارغاً',
                    error: 'Invalid nameAr'
                });
            }

            if (updateData.nameEn && (!updateData.nameEn || updateData.nameEn.trim().length === 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'English name cannot be empty',
                    messageAr: 'الاسم الإنجليزي لا يمكن أن يكون فارغاً',
                    error: 'Invalid nameEn'
                });
            }

            if (updateData.contact && updateData.contact.email && (!updateData.contact.email || updateData.contact.email.trim().length === 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Contact email cannot be empty',
                    messageAr: 'البريد الإلكتروني للتواصل لا يمكن أن يكون فارغاً',
                    error: 'Invalid contact email'
                });
            }

            // Update the store
            const updatedStore = await Store.findByIdAndUpdate(
                storeId,
                updateData,
                { new: true, runValidators: true }
            ).select('-subscription -subscriptionHistory -lahzaToken -lahzaSecretKey');

            res.status(200).json({
                success: true,
                message: 'Store information updated successfully',
                messageAr: 'تم تحديث معلومات المتجر بنجاح',
                data: updatedStore
            });

        } catch (error) {
            console.error('Update store info error:', error);
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = {};
                Object.keys(error.errors).forEach(key => {
                    validationErrors[key] = error.errors[key].message;
                });
                
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    messageAr: 'فشل في التحقق من صحة البيانات',
                    error: 'Validation error',
                    details: validationErrors
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error updating store information',
                messageAr: 'خطأ في تحديث معلومات المتجر',
                error: error.message
            });
        }
    }
);

module.exports = router;
