const axios = require('axios');
const { validationResult } = require('express-validator');

/**
 * Connect Plus API Configuration
 */
const CONNECT_PLUS_CONFIG = {
  BASE_URL: 'https://api.connect-plus.app/integration',
  ENDPOINTS: {
    ADD_ORDERS: '/add_orders',
    GET_PRODUCTS: '/get_products',
    GET_VARIANTS: '/get_product_variants',
    GET_DELIVERY_COMPANIES: '/get_connected_companies',
    GET_DELIVERY_FEE: '/get_delivery_fee',
    GET_AREA_SUB_AREA: '/get_area_sub_area'
  }
};

/**
 * Get Connect Plus token from environment or store settings
 */
const getConnectPlusToken = () => {
  return process.env.CONNECT_PLUS_TOKEN || 'your-connect-plus-token-here';
};

/**
 * Add orders to Connect Plus
 */
exports.addOrders = async (req, res) => {
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

    const { orders_list } = req.body;
    const token = getConnectPlusToken();

    console.log('📦 Adding orders to Connect Plus:', { ordersCount: orders_list?.length || 0 });

    const response = await axios.post(
      `${CONNECT_PLUS_CONFIG.BASE_URL}${CONNECT_PLUS_CONFIG.ENDPOINTS.ADD_ORDERS}`,
      { orders_list },
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Orders added successfully:', response.data);

    return res.status(200).json({
      success: true,
      message: 'Orders added to Connect Plus successfully',
      data: response.data
    });

  } catch (error) {
    console.error('❌ Connect Plus add orders error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error adding orders to Connect Plus',
      messageAr: 'خطأ في إضافة الطلبات إلى Connect Plus',
      error: error.response?.data?.message || error.message,
      details: error.response?.data || null
    });
  }
};

/**
 * Get products from Connect Plus
 */
exports.getProducts = async (req, res) => {
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

    const { size = 30, filters = [] } = req.body;
    const token = getConnectPlusToken();

    console.log('📦 Getting products from Connect Plus:', { size, filtersCount: filters.length });

    const response = await axios.post(
      `${CONNECT_PLUS_CONFIG.BASE_URL}${CONNECT_PLUS_CONFIG.ENDPOINTS.GET_PRODUCTS}`,
      { size, filters },
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Products retrieved successfully:', { count: response.data?.data?.length || 0 });

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: response.data
    });

  } catch (error) {
    console.error('❌ Connect Plus get products error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting products from Connect Plus',
      messageAr: 'خطأ في جلب المنتجات من Connect Plus',
      error: error.response?.data?.message || error.message,
      details: error.response?.data || null
    });
  }
};

/**
 * Get product variants from Connect Plus
 */
exports.getVariants = async (req, res) => {
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

    const { size = 30, filters = [] } = req.body;
    const token = getConnectPlusToken();

    console.log('📦 Getting variants from Connect Plus:', { size, filtersCount: filters.length });

    const response = await axios.post(
      `${CONNECT_PLUS_CONFIG.BASE_URL}${CONNECT_PLUS_CONFIG.ENDPOINTS.GET_VARIANTS}`,
      { size, filters },
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Variants retrieved successfully:', { count: response.data?.data?.length || 0 });

    return res.status(200).json({
      success: true,
      message: 'Product variants retrieved successfully',
      data: response.data
    });

  } catch (error) {
    console.error('❌ Connect Plus get variants error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting variants from Connect Plus',
      messageAr: 'خطأ في جلب متغيرات المنتج من Connect Plus',
      error: error.response?.data?.message || error.message,
      details: error.response?.data || null
    });
  }
};

/**
 * Get delivery companies from Connect Plus
 */
exports.getDeliveryCompanies = async (req, res) => {
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

    const { size = 30, filters = [] } = req.body;
    const token = getConnectPlusToken();

    console.log('🚚 Getting delivery companies from Connect Plus:', { size, filtersCount: filters.length });

    const response = await axios.post(
      `${CONNECT_PLUS_CONFIG.BASE_URL}${CONNECT_PLUS_CONFIG.ENDPOINTS.GET_DELIVERY_COMPANIES}`,
      { size, filters },
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Delivery companies retrieved successfully:', { count: response.data?.data?.length || 0 });

    return res.status(200).json({
      success: true,
      message: 'Delivery companies retrieved successfully',
      data: response.data
    });

  } catch (error) {
    console.error('❌ Connect Plus get delivery companies error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting delivery companies from Connect Plus',
      messageAr: 'خطأ في جلب شركات التوصيل من Connect Plus',
      error: error.response?.data?.message || error.message,
      details: error.response?.data || null
    });
  }
};

/**
 * Get delivery fee from Connect Plus
 */
exports.getDeliveryFee = async (req, res) => {
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

    const { connection, area } = req.body;
    const token = getConnectPlusToken();

    console.log('💰 Getting delivery fee from Connect Plus:', { connection, area });

    const response = await axios.post(
      `${CONNECT_PLUS_CONFIG.BASE_URL}${CONNECT_PLUS_CONFIG.ENDPOINTS.GET_DELIVERY_FEE}`,
      { connection, area },
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Delivery fee retrieved successfully:', response.data);

    return res.status(200).json({
      success: true,
      message: 'Delivery fee retrieved successfully',
      data: response.data
    });

  } catch (error) {
    console.error('❌ Connect Plus get delivery fee error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting delivery fee from Connect Plus',
      messageAr: 'خطأ في جلب رسوم التوصيل من Connect Plus',
      error: error.response?.data?.message || error.message,
      details: error.response?.data || null
    });
  }
};

/**
 * Get area and sub area from Connect Plus
 */
exports.getAreaSubArea = async (req, res) => {
  try {
    const { code = 'PS' } = req.query;
    const token = getConnectPlusToken();

    console.log('📍 Getting area and sub area from Connect Plus:', { code });

    const response = await axios.get(
      `${CONNECT_PLUS_CONFIG.BASE_URL}${CONNECT_PLUS_CONFIG.ENDPOINTS.GET_AREA_SUB_AREA}`,
      {
        params: { code },
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Area and sub area retrieved successfully:', { count: response.data?.data?.length || 0 });

    return res.status(200).json({
      success: true,
      message: 'Area and sub area retrieved successfully',
      data: response.data
    });

  } catch (error) {
    console.error('❌ Connect Plus get area sub area error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting area and sub area from Connect Plus',
      messageAr: 'خطأ في جلب المنطقة والمنطقة الفرعية من Connect Plus',
      error: error.response?.data?.message || error.message,
      details: error.response?.data || null
    });
  }
};

/**
 * Test Connect Plus connection
 */
exports.testConnection = async (req, res) => {
  try {
    const token = getConnectPlusToken();

    console.log('🧪 Testing Connect Plus connection...');

    // Test with a simple request
    const response = await axios.get(
      `${CONNECT_PLUS_CONFIG.BASE_URL}${CONNECT_PLUS_CONFIG.ENDPOINTS.GET_AREA_SUB_AREA}`,
      {
        params: { code: 'PS' },
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Connect Plus connection test successful');

    return res.status(200).json({
      success: true,
      message: 'Connect Plus connection test successful',
      data: {
        status: 'connected',
        token: token ? 'configured' : 'not_configured',
        response: response.data
      }
    });

  } catch (error) {
    console.error('❌ Connect Plus connection test failed:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Connect Plus connection test failed',
      messageAr: 'فشل في اختبار الاتصال بـ Connect Plus',
      error: error.response?.data?.message || error.message,
      details: error.response?.data || null
    });
  }
};
