const { validationResult } = require('express-validator');
const LahzaPaymentService = require('../services/LahzaPaymentService');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const Store = require('../Models/Store');

/**
 * Get user info from token
 */
const getUserFromToken = async (req) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('nameAr nameEn email phone');
    
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

/**
 * Get store info for payment
 */
const getStoreInfo = async (storeId) => {
  try {
    const store = await Store.findById(storeId).select('nameAr nameEn contact settings');
    
    if (!store) {
      return null;
    }

    return {
      nameAr: store.nameAr,
      nameEn: store.nameEn,
      email: store.contact?.email,
      phone: store.contact?.phone,
      currency: store.settings?.currency || 'ILS',
      mainColor: store.settings?.mainColor || '#000000',
      language: store.settings?.language || 'en'
    };
  } catch (error) {
    console.error('Error getting store info:', error);
    return null;
  }
};

/**
 * Initialize payment with Lahza
 */
exports.initializePayment = async (req, res) => {
  try {
    // Print request body for debugging
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Request headers:', req.headers);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل في التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    const { storeId } = req.params;
    const { amount, currency, email, customerName, customerPhone, description, metadata = {} } = req.body;

    // Get store info
    const storeInfo = await getStoreInfo(storeId);
    console.log('🏪 Store info:', storeInfo);

    // Get user info from token
    const user = await getUserFromToken(req);
    console.log('👤 User from token:', user);

    // Use data in priority: body > user token > store info > defaults
    const finalEmail = email || (user ? user.email : null) || (storeInfo ? storeInfo.email : null) || 'customer@example.com';
    const finalCustomerName = customerName || (user ? (user.nameAr || user.nameEn) : null) || (storeInfo ? storeInfo.nameAr : null) || 'Customer';
    const finalCustomerPhone = customerPhone || (user ? user.phone : null) || (storeInfo ? storeInfo.phone : null) || '+1234567890';
    const finalCurrency = currency || (storeInfo ? storeInfo.currency : null) || 'ILS';

    // Prepare metadata with store and user info
    const finalMetadata = {
      storeId: storeId,
      storeName: storeInfo ? storeInfo.nameAr : 'Unknown Store',
      storeEmail: storeInfo ? storeInfo.email : null,
      ...metadata
    };

    // Add user info to metadata if available
    if (user) {
      finalMetadata.userId = user._id;
      finalMetadata.userName = user.nameAr || user.nameEn;
    }

    console.log('📝 Final payment data:', {
      amount,
      currency: finalCurrency,
      email: finalEmail,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      description,
      metadata: finalMetadata
    });

    // Use LahzaPaymentService to initialize payment
    const result = await LahzaPaymentService.initializePayment(storeId, {
      amount,
      currency: finalCurrency,
      email: finalEmail,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      description,
      metadata: finalMetadata
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
        messageAr: result.error || 'فشل في تهيئة الدفع',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Lahza payment initialization error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error initializing payment',
      messageAr: 'خطأ في تهيئة الدفع',
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
        message: 'Validation failed',
        messageAr: 'فشل في التحقق من صحة البيانات',
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
        messageAr: result.error || 'فشل في التحقق من الدفع',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Lahza payment verification error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      messageAr: 'خطأ في التحقق من الدفع',
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
        messageAr: result.error || 'فشل في الحصول على حالة الدفع',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Get payment status error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting payment status',
      messageAr: 'خطأ في الحصول على حالة الدفع',
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
        messageAr: result.error || 'فشل في اختبار الاتصال بـ Lahza',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Lahza connection test error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lahza connection test failed',
      messageAr: 'فشل في اختبار الاتصال بـ Lahza',
      error: error.message
    });
  }
};
