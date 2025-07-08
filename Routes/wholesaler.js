const express = require('express');
const router = express.Router();
const WholesalerController = require('../Controllers/WholesalerController');
const { protect } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');

// Apply authentication middleware to all routes
router.use(protect);

// Apply store access middleware to all routes
router.use('/stores/:storeId', verifyStoreAccess);

// Get all wholesalers for a store
router.get('/stores/:storeId/wholesalers', WholesalerController.getAllWholesalers);

// Get wholesaler statistics
router.get('/stores/:storeId/wholesalers/stats', WholesalerController.getWholesalerStats);

// Get single wholesaler
router.get('/stores/:storeId/wholesalers/:wholesalerId', WholesalerController.getWholesalerById);

// Create new wholesaler
router.post('/stores/:storeId/wholesalers', WholesalerController.createWholesaler);

// Update wholesaler
router.put('/stores/:storeId/wholesalers/:wholesalerId', WholesalerController.updateWholesaler);

// Delete wholesaler
router.delete('/stores/:storeId/wholesalers/:wholesalerId', WholesalerController.deleteWholesaler);

// Verify wholesaler
router.patch('/stores/:storeId/wholesalers/:wholesalerId/verify', WholesalerController.verifyWholesaler);

// Update wholesaler status
router.patch('/stores/:storeId/wholesalers/:wholesalerId/status', WholesalerController.updateWholesalerStatus);

// Bulk operations
router.patch('/stores/:storeId/wholesalers/bulk/status', WholesalerController.bulkUpdateStatus);
router.delete('/stores/:storeId/wholesalers/bulk', WholesalerController.bulkDelete);

module.exports = router; 