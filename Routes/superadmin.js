const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superadminAuth');
const SuperAdminController = require('../Controllers/SuperAdminController');

// All routes require authentication and superadmin role
router.use(protect);
router.use(requireSuperAdmin);

// Get all stores with owners information
router.get('/stores', SuperAdminController.getAllStores);

// Get store by ID with owners information
router.get('/stores/:storeId', SuperAdminController.getStoreById);

// Update store status
router.patch('/stores/:storeId/status', SuperAdminController.updateStoreStatus);

// Get stores statistics
router.get('/statistics', SuperAdminController.getStoresStatistics);

module.exports = router;
