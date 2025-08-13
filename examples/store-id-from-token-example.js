/**
 * Example: Extract Store ID from JWT Token
 * 
 * This file demonstrates how to use the new middleware to extract store ID from JWT tokens
 * in different scenarios.
 */

const { 
    extractStoreId, 
    extractStoreIdOptional, 
    requireStoreId,
    getStoreIdFromToken,
    getStoreIdFromHeaders 
} = require('../middleware/storeAuth');

// Example 1: Using middleware in routes
const express = require('express');
const router = express.Router();

/**
 * Route that requires store ID from token
 * This route will fail if no valid token with store ID is provided
 */
router.get('/store-info', 
    extractStoreId, // Extract store ID from token
    async (req, res) => {
        try {
            // Store ID is now available in req.storeId
            const storeId = req.storeId;
            
            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID not found in token'
                });
            }

            // Use the store ID to fetch store information
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
                    status: store.status
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
 * Route that optionally uses store ID from token
 * This route works even without a token
 */
router.get('/optional-store-info', 
    extractStoreIdOptional, // Extract store ID if token exists
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
                            status: store.status
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
 * Route that requires store ID and validates it
 * This route ensures a valid store ID is present
 */
router.get('/validated-store-info', 
    requireStoreId, // Require and validate store ID
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

// Example 2: Using utility functions in controllers
async function exampleControllerFunction(req, res) {
    try {
        // Method 1: Get store ID from request headers
        const storeIdFromHeaders = await getStoreIdFromHeaders(req.headers);
        
        // Method 2: Get store ID from token string
        const token = req.headers.authorization?.split(' ')[1];
        const storeIdFromToken = await getStoreIdFromToken(token);

        // Method 3: Use middleware to get store ID
        // (This would be done in the route definition)

        res.status(200).json({
            success: true,
            data: {
                storeIdFromHeaders,
                storeIdFromToken,
                headers: req.headers.authorization ? 'Token provided' : 'No token'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in controller',
            error: error.message
        });
    }
}

// Example 3: Testing the middleware with different scenarios
async function testStoreIdExtraction() {
    const testCases = [
        {
            name: 'Valid token with store ID',
            headers: {
                authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkNzFhNzFhNzFhNzFhNzFhNzFhNzFhIiwicm9sZSI6ImFkbWluIiwic3RvcmVJZCI6IjVkNzFhNzFhNzFhNzFhNzFhNzFhNzFhNyIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxNjM1MTczNjkwfQ.example'
            }
        },
        {
            name: 'Valid token without store ID',
            headers: {
                authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkNzFhNzFhNzFhNzFhNzFhNzFhNzFhIiwicm9sZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTYzNTE3MzY5MH0.example'
            }
        },
        {
            name: 'No authorization header',
            headers: {}
        },
        {
            name: 'Invalid token format',
            headers: {
                authorization: 'InvalidToken'
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`\nTesting: ${testCase.name}`);
        try {
            const storeId = await getStoreIdFromHeaders(testCase.headers);
            console.log(`Result: ${storeId || 'No store ID found'}`);
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }
}

// Example 4: API endpoint that uses store ID for data isolation
router.get('/store-products', 
    requireStoreId, // Ensure store ID is available
    async (req, res) => {
        try {
            const storeId = req.storeId;
            const { page = 1, limit = 10 } = req.query;

            // Use store ID to filter products
            const Product = require('../Models/Product');
            const products = await Product.find({ store: storeId })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('category', 'name nameAr')
                .sort({ createdAt: -1 });

            const total = await Product.countDocuments({ store: storeId });

            res.status(200).json({
                success: true,
                data: {
                    products,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    },
                    storeId
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching products',
                error: error.message
            });
        }
    }
);

// Example 5: Middleware chain with store ID extraction
router.post('/store-action', 
    requireStoreId, // First, ensure store ID exists
    async (req, res, next) => {
        // Additional validation based on store ID
        const storeId = req.storeId;
        
        // Check if store is active
        const Store = require('../Models/Store');
        const store = await Store.findById(storeId);
        
        if (!store || store.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Store is not active'
            });
        }
        
        // Add store object to request for later use
        req.store = store;
        next();
    },
    async (req, res) => {
        // Main route logic
        const { storeId, store } = req;
        
        res.status(200).json({
            success: true,
            message: 'Action completed successfully',
            data: {
                storeId,
                storeName: store.name,
                action: req.body.action
            }
        });
    }
);

module.exports = {
    router,
    exampleControllerFunction,
    testStoreIdExtraction
};

// Usage examples:
// 1. In your main app.js or server.js:
// const { router } = require('./examples/store-id-from-token-example');
// app.use('/api/store', router);

// 2. Test the extraction:
// const { testStoreIdExtraction } = require('./examples/store-id-from-token-example');
// testStoreIdExtraction();
