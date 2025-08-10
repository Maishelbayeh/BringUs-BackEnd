const TermsConditions = require('../Models/TermsConditions');
const { success, error } = require('../utils/response');

/**
 * @swagger
 * components:
 *   schemas:
 *     TermsConditions:
 *       type: object
 *       required:
 *         - title
 *         - htmlContent
 *         - store
 *       properties:
 *         title:
 *           type: string
 *           description: Terms title
 *           example: "Terms & Conditions"
 *         htmlContent:
 *           type: string
 *           description: HTML content of terms
 *           example: "<h2>Terms & Conditions</h2><ul><li>All users must be 18+ years old.</li></ul>"
 *         version:
 *           type: string
 *           description: Version number
 *           example: "1.0"
 *         isActive:
 *           type: boolean
 *           description: Whether the terms are active
 *           example: true
 *         effectiveDate:
 *           type: string
 *           format: date
 *           description: When terms become effective
 *           example: "2024-01-01"
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: When terms expire
 *           example: "2024-12-31"
 *         language:
 *           type: string
 *           enum: [en, ar, fr, es]
 *           description: Language of terms
 *           example: "en"
 *         category:
 *           type: string
 *           enum: [general, privacy, shipping, returns, payment, custom]
 *           description: Category of terms
 *           example: "general"
 *         requiresConsent:
 *           type: boolean
 *           description: Whether user consent is required
 *           example: true
 *         consentText:
 *           type: string
 *           description: Text for consent checkbox
 *           example: "I agree to the Terms & Conditions"
 */

// Get terms by store ID
const getTermsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    const terms = await TermsConditions.findOne({ 
      store: storeId,
      isActive: true 
    }).sort({ createdAt: -1 });

    if (!terms) {
      return success(res, { 
        data: null, 
        message: 'No terms & conditions found for this store' 
      });
    }

    return success(res, { 
      data: terms, 
      message: 'Terms & conditions retrieved successfully' 
    });

  } catch (err) {
    //CONSOLE.error('Get terms by store error:', err);
    return error(res, { message: 'Failed to fetch terms & conditions', statusCode: 500 });
  }
};

// Create new terms
const createTerms = async (req, res) => {
  try {
    const { storeId } = req.params;
    const termsData = req.body;

    // Add store ID and user who created it (if authenticated)
    termsData.store = storeId;
    if (req.user && req.user._id) {
      termsData.updatedBy = req.user._id;
    }

    // Deactivate other terms for this store
    await TermsConditions.updateMany(
      { store: storeId, isActive: true },
      { isActive: false }
    );

    // Set new terms as active
    termsData.isActive = true;

    const terms = await TermsConditions.create(termsData);

    return success(res, { 
      data: terms, 
      message: 'Terms & conditions created successfully', 
      statusCode: 201 
    });

  } catch (err) {
    //CONSOLE.error('Create terms error:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return error(res, { message: errors.join(', '), statusCode: 400 });
    }
    
    return error(res, { message: 'Failed to create terms & conditions', statusCode: 500 });
  }
};

// Update terms by ID
const updateTerms = async (req, res) => {
  try {
    const { storeId, termsId } = req.params;
    const updateData = req.body;

    // Add user who updated it (if authenticated)
    if (req.user && req.user._id) {
      updateData.updatedBy = req.user._id;
    }
    updateData.lastUpdated = new Date();

    // Find terms
    const terms = await TermsConditions.findOne({ 
      _id: termsId, 
      store: storeId 
    });

    if (!terms) {
      return error(res, { message: 'Terms & conditions not found', statusCode: 404 });
    }

    // Update terms
    const updatedTerms = await TermsConditions.findByIdAndUpdate(
      termsId,
      updateData,
      { new: true, runValidators: true }
    );

    return success(res, { 
      data: updatedTerms, 
      message: 'Terms & conditions updated successfully' 
    });

  } catch (err) {
    //CONSOLE.error('Update terms error:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return error(res, { message: errors.join(', '), statusCode: 400 });
    }
    
    return error(res, { message: 'Failed to update terms & conditions', statusCode: 500 });
  }
};

module.exports = {
  getTermsByStore,
  createTerms,
  updateTerms
}; 