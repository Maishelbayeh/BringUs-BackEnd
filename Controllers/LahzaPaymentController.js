const { validationResult } = require('express-validator');
const LahzaPaymentService = require('../services/LahzaPaymentService');

/**
 * Initialize payment with Lahza
 */
exports.initializePayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId } = req.params;
    const { amount, currency = 'ILS', email, customerName, customerPhone, description, metadata = {} } = req.body;

    // Use LahzaPaymentService to initialize payment
    const result = await LahzaPaymentService.initializePayment(storeId, {
      amount,
      currency,
      email,
      customerName,
      customerPhone,
      description,
      metadata
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to initialize payment',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Lahza payment initialization error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error initializing payment',
      error: error.message
    });
  }
};

/**
 * Verify payment with Lahza
 */
exports.verifyPayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId } = req.params;
    const { reference } = req.body;

    // Use LahzaPaymentService to verify payment
    const result = await LahzaPaymentService.verifyPayment(storeId, reference);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Payment verification failed',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Lahza payment verification error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

/**
 * Get payment status
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { storeId, reference } = req.params;

    // Use LahzaPaymentService to get payment status
    const result = await LahzaPaymentService.getPaymentStatus(storeId, reference);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to get payment status',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Get payment status error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting payment status',
      error: error.message
    });
  }
};

/**
 * Test Lahza connection
 */
exports.testConnection = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Use LahzaPaymentService to test connection
    const result = await LahzaPaymentService.testConnection(storeId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Lahza connection test successful',
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Lahza connection test failed',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Lahza connection test error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lahza connection test failed',
      error: error.message
    });
  }
};
