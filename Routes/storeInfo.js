const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    extractStoreId, 
    extractStoreIdOptional, 
    requireStoreId,
    getStoreIdFromToken,
    getStoreIdFromHeaders 
} = require('../middleware/storeAuth');

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
                    message: 'Store not found'
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
                    message: 'Store not found'
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
                error: error.message
            });
        }
    }
);

module.exports = router;
