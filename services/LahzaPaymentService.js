const axios = require('axios');
const Store = require('../Models/Store');

/**
 * Lahza Payment Service
 * Handles all interactions with Lahza payment gateway
 */
class LahzaPaymentService {
  constructor() {
    this.baseUrl = 'https://api.lahza.io/transaction';
    this.callbackUrl = 'http://localhost:5173/';
  }

  /**
   * Get Lahza secret key for a store
   */
  async getStoreSecretKey(storeId) {
    try {
      const store = await Store.findById(storeId).select('lahzaSecretKey');
      return store?.lahzaSecretKey || null;
    } catch (error) {
      console.error('Error getting Lahza secret key:', error);
      return null;
    }
  }

  /**
   * Convert amount to smallest unit (cents for ILS)
   */
  convertToSmallestUnit(amount, currency = 'ILS') {
    switch (currency.toUpperCase()) {
      case 'ILS':
        return Math.round(amount * 100); // Convert to agorot
      case 'USD':
        return Math.round(amount * 100); // Convert to cents
      case 'EUR':
        return Math.round(amount * 100); // Convert to cents
      default:
        return Math.round(amount * 100); // Default to cents
    }
  }

  /**
   * Convert from smallest unit back to normal amount
   */
  convertFromSmallestUnit(amount, currency = 'ILS') {
    switch (currency.toUpperCase()) {
      case 'ILS':
        return amount / 100; // Convert from agorot
      case 'USD':
        return amount / 100; // Convert from cents
      case 'EUR':
        return amount / 100; // Convert from cents
      default:
        return amount / 100; // Default from cents
    }
  }

  /**
   * Initialize payment with Lahza
   */
  async initializePayment(storeId, paymentData) {
    try {
      const secretKey = await this.getStoreSecretKey(storeId);
      if (!secretKey) {
        throw new Error('Store does not have Lahza secret key configured');
      }

      const {
        amount,
        currency = 'ILS',
        email,
        customerName,
        customerPhone,
        description,
        metadata = {}
      } = paymentData;

      // Convert amount to smallest unit
      const convertedAmount = this.convertToSmallestUnit(amount, currency);

      // Split customer name into first and last name
      const nameParts = customerName ? customerName.trim().split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Prepare metadata as JSON string
      const metadataString = JSON.stringify({
        storeId: storeId,
        ...metadata
      });

      const payload = {
        amount: convertedAmount.toString(),
        email: email,
        currency: currency,
        first_name: firstName,
        last_name: lastName,
        callback_url: this.callbackUrl,
        metadata: metadataString
      };

      console.log('🚀 Initializing Lahza payment:', payload);

      const response = await axios.post(
        `${this.baseUrl}/initialize`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Lahza payment initialized:', response.data);

      if (response.data.status === true && response.data.data) {
        return {
          success: true,
          data: {
            transaction_id: response.data.data.id,
            reference: response.data.data.reference,
            amount: response.data.data.amount,
            currency: response.data.data.currency,
            status: response.data.data.status,
            payment_url: response.data.data.payment_url,
            authorization_url: response.data.data.authorization_url,
            customer: {
              name: response.data.data.customer?.name,
              email: response.data.data.customer?.email,
              phone: response.data.data.customer?.phone
            },
            metadata: response.data.data.metadata,
            created_at: response.data.data.created_at,
            expires_at: response.data.data.expires_at
          }
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to initialize payment',
          data: response.data
        };
      }

    } catch (error) {
      console.error('❌ Lahza payment initialization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Verify payment with Lahza
   */
  async verifyPayment(storeId, reference) {
    try {
      const secretKey = await this.getStoreSecretKey(storeId);
      if (!secretKey) {
        throw new Error('Store does not have Lahza secret key configured');
      }

      console.log('🔍 Verifying Lahza payment:', { reference, storeId });

      const response = await axios.get(
        `${this.baseUrl}/verify/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Lahza payment verification:', response.data);

      if (response.data.status === true && response.data.data) {
        const paymentData = response.data.data;
        
        return {
          success: true,
          data: {
            transaction_id: paymentData.id,
            reference: paymentData.reference,
            amount: paymentData.amount,
            currency: paymentData.currency,
            status: paymentData.status,
            gateway_response: paymentData.gateway_response,
            customer: {
              name: paymentData.customer?.name,
              email: paymentData.customer?.email,
              phone: paymentData.customer?.phone
            },
            metadata: paymentData.metadata,
            created_at: paymentData.created_at,
            paid_at: paymentData.paid_at,
            authorization: paymentData.authorization
          }
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Payment verification failed',
          data: response.data
        };
      }

    } catch (error) {
      console.error('❌ Lahza payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(storeId, reference) {
    try {
      const secretKey = await this.getStoreSecretKey(storeId);
      if (!secretKey) {
        throw new Error('Store does not have Lahza secret key configured');
      }

      console.log('📊 Getting payment status:', { reference, storeId });

      const response = await axios.get(
        `${this.baseUrl}/status/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Payment status retrieved:', response.data);

      if (response.data.status === true && response.data.data) {
        const paymentData = response.data.data;
        
        return {
          success: true,
          data: {
            transaction_id: paymentData.id,
            reference: paymentData.reference,
            amount: paymentData.amount,
            currency: paymentData.currency,
            status: paymentData.status,
            gateway_response: paymentData.gateway_response,
            customer: {
              name: paymentData.customer?.name,
              email: paymentData.customer?.email,
              phone: paymentData.customer?.phone
            },
            metadata: paymentData.metadata,
            created_at: paymentData.created_at,
            paid_at: paymentData.paid_at,
            expires_at: paymentData.expires_at
          }
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to get payment status',
          data: response.data
        };
      }

    } catch (error) {
      console.error('❌ Get payment status error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Test connection to Lahza
   */
  async testConnection(storeId) {
    try {
      const secretKey = await this.getStoreSecretKey(storeId);
      if (!secretKey) {
        throw new Error('Store does not have Lahza secret key configured');
      }

      console.log('🧪 Testing Lahza connection for store:', storeId);

      // Test with a minimal amount
      const testData = {
        amount: '100', // 1 ILS in cents
        email: 'test@example.com',
        currency: 'ILS',
        first_name: 'Test',
        last_name: 'Customer',
        callback_url: this.callbackUrl,
        metadata: JSON.stringify({
          storeId: storeId,
          test: true
        })
      };

      const response = await axios.post(
        `${this.baseUrl}/initialize`,
        testData,
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Lahza connection test successful:', response.data);

      return {
        success: true,
        data: {
          status: response.data.status,
          message: response.data.message,
          store_id: storeId,
          configured: true
        }
      };

    } catch (error) {
      console.error('❌ Lahza connection test failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Charge authorization (for subscription renewals)
   */
  async chargeAuthorization(storeId, amount, email, authorizationCode, currency = 'ILS') {
    try {
      const secretKey = await this.getStoreSecretKey(storeId);
      if (!secretKey) {
        throw new Error('Store does not have Lahza secret key configured');
      }

      const convertedAmount = this.convertToSmallestUnit(amount, currency);

      const response = await axios.post(
        `${this.baseUrl}/charge_authorization`,
        {
          amount: convertedAmount.toString(),
          email: email,
          authorization_code: authorizationCode
        },
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Lahza charge authorization:', response.data);
      
      if (response.data.status === true && response.data.data?.status === 'success') {
        return {
          success: true,
          data: response.data,
          transactionId: response.data.data?.id || null,
          reference: response.data.data?.reference || null,
          authorizationCode: response.data.data?.authorization?.authorization_code || null,
          amount: response.data.data?.amount || null,
          currency: response.data.data?.currency || null,
          gatewayResponse: response.data.data?.gateway_response || null
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Transaction failed',
          data: response.data
        };
      }
    } catch (error) {
      console.error('❌ Lahza charge authorization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data || null
      };
    }
  }
}

module.exports = new LahzaPaymentService();
