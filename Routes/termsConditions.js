const express = require('express');
const { body } = require('express-validator');
const {
  getTermsByStore,
  createTerms,
  updateTerms
} = require('../Controllers/TermsConditionsController');
const { protect } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');

const router = express.Router();

// Apply authentication and store access middleware to all routes
router.use(protect);
router.use('/stores/:storeId', verifyStoreAccess);

// Validation middleware for terms creation/update
const validateTerms = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  
  body('htmlContent')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('HTML content is required and cannot exceed 10000 characters'),
  
  body('language')
    .optional()
    .isIn(['en', 'ar', 'fr', 'es'])
    .withMessage('Language must be one of: en, ar, fr, es'),
  
  body('category')
    .optional()
    .isIn(['general', 'privacy', 'shipping', 'returns', 'payment', 'custom'])
    .withMessage('Category must be one of: general, privacy, shipping, returns, payment, custom')
];

/**
 * @swagger
 * /api/terms-conditions/stores/{storeId}/terms:
 *   get:
 *     summary: Get terms & conditions for a store
 *     description: Retrieve the active terms & conditions for a specific store
 *     tags: [Terms & Conditions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/stores/:storeId/terms', getTermsByStore);

/**
 * @swagger
 * /api/terms-conditions/stores/{storeId}/terms:
 *   post:
 *     summary: Create terms & conditions
 *     description: Create new terms & conditions for a store
 *     tags: [Terms & Conditions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - htmlContent
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Terms & Conditions"
 *               htmlContent:
 *                 type: string
 *                 example: "<h2>Terms & Conditions</h2><ul><li>All users must be 18+ years old.</li></ul>"
 *               language:
 *                 type: string
 *                 enum: [en, ar, fr, es]
 *                 example: "en"
 *               category:
 *                 type: string
 *                 enum: [general, privacy, shipping, returns, payment, custom]
 *                 example: "general"
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 */
router.post('/stores/:storeId/terms', validateTerms, createTerms);

/**
 * @swagger
 * /api/terms-conditions/stores/{storeId}/terms/{id}:
 *   put:
 *     summary: Update terms & conditions
 *     description: Update existing terms & conditions
 *     tags: [Terms & Conditions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Terms ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               htmlContent:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [en, ar, fr, es]
 *               category:
 *                 type: string
 *                 enum: [general, privacy, shipping, returns, payment, custom]
 *     responses:
 *       200:
 *         description: Updated successfully
 *       404:
 *         description: Not found
 *       400:
 *         description: Validation error
 */
router.put('/stores/:storeId/terms/:termsId', validateTerms, updateTerms);

module.exports = router; 