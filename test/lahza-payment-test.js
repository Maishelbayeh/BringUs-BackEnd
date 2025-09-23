const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api';
const TEST_STORE_ID = '60f7b3b3b3b3b3b3b3b3b3b3'; // Replace with actual store ID

/**
 * Test Lahza Payment API endpoints
 */
async function testLahzaPaymentAPI() {
  console.log('🧪 Starting Lahza Payment API Tests...\n');

  try {
    // Test 1: Test Connection
    console.log('1️⃣ Testing Lahza Connection...');
    try {
      const connectionResponse = await axios.get(`${BASE_URL}/lahza-payment/${TEST_STORE_ID}/test-connection`);
      console.log('✅ Connection Test:', connectionResponse.data);
    } catch (error) {
      console.log('❌ Connection Test Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Initialize Payment
    console.log('2️⃣ Testing Payment Initialization...');
    try {
      const initPaymentData = {
        amount: 100.50,
        currency: 'ILS',
        email: 'test@example.com',
        customerName: 'أحمد محمد',
        customerPhone: '+972501234567',
        description: 'دفع مقابل طلب #12345',
        metadata: {
          order_id: '12345',
          product_ids: ['abc123', 'def456']
        }
      };

      const initResponse = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        initPaymentData
      );
      
      console.log('✅ Payment Initialized:', initResponse.data);
      
      const reference = initResponse.data.data?.reference;
      
      if (reference) {
        console.log('\n3️⃣ Testing Payment Verification...');
        try {
          const verifyResponse = await axios.post(
            `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/verify`,
            { reference }
          );
          console.log('✅ Payment Verified:', verifyResponse.data);
        } catch (error) {
          console.log('❌ Payment Verification Failed:', error.response?.data || error.message);
        }

        console.log('\n4️⃣ Testing Payment Status...');
        try {
          const statusResponse = await axios.get(
            `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/status/${reference}`
          );
          console.log('✅ Payment Status:', statusResponse.data);
        } catch (error) {
          console.log('❌ Payment Status Failed:', error.response?.data || error.message);
        }
      }

    } catch (error) {
      console.log('❌ Payment Initialization Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Test with different currencies
    console.log('5️⃣ Testing with USD Currency...');
    try {
      const usdPaymentData = {
        amount: 50.00,
        currency: 'USD',
        email: 'test@example.com',
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        description: 'Payment for order #67890'
      };

      const usdResponse = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        usdPaymentData
      );
      
      console.log('✅ USD Payment Initialized:', usdResponse.data);
    } catch (error) {
      console.log('❌ USD Payment Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Test validation errors
    console.log('6️⃣ Testing Validation Errors...');
    try {
      const invalidData = {
        amount: -10, // Invalid negative amount
        email: 'invalid-email', // Invalid email format
        customerName: 'A' // Too short name
      };

      const validationResponse = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        invalidData
      );
      
      console.log('❌ Validation should have failed but got:', validationResponse.data);
    } catch (error) {
      console.log('✅ Validation Error Caught:', error.response?.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Test with non-existent store
    console.log('7️⃣ Testing with Non-existent Store...');
    try {
      const nonExistentStoreId = '000000000000000000000000';
      const response = await axios.get(`${BASE_URL}/lahza-payment/${nonExistentStoreId}/test-connection`);
      console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
      console.log('✅ Non-existent Store Error Caught:', error.response?.data);
    }

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }

  console.log('\n🏁 Lahza Payment API Tests Completed!');
}

/**
 * Test specific payment flow
 */
async function testPaymentFlow() {
  console.log('🔄 Testing Complete Payment Flow...\n');

  try {
    // Step 1: Initialize payment
    console.log('Step 1: Initializing payment...');
    const initData = {
      amount: 250.75,
      currency: 'ILS',
      email: 'customer@example.com',
      customerName: 'محمد أحمد',
      customerPhone: '+972501234567',
      description: 'دفع مقابل طلب #54321',
      metadata: {
        order_id: '54321',
        items: ['منتج 1', 'منتج 2'],
        total_items: 2
      }
    };

    const initResponse = await axios.post(
      `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
      initData
    );

    if (initResponse.data.success) {
      console.log('✅ Payment initialized successfully');
      console.log('📋 Payment Details:', {
        transaction_id: initResponse.data.data.transaction_id,
        reference: initResponse.data.data.reference,
        amount: initResponse.data.data.amount,
        currency: initResponse.data.data.currency,
        status: initResponse.data.data.status,
        payment_url: initResponse.data.data.payment_url
      });

      const reference = initResponse.data.data.reference;

      // Step 2: Check status
      console.log('\nStep 2: Checking payment status...');
      const statusResponse = await axios.get(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/status/${reference}`
      );

      if (statusResponse.data.success) {
        console.log('✅ Payment status retrieved');
        console.log('📊 Status Details:', {
          status: statusResponse.data.data.status,
          created_at: statusResponse.data.data.created_at,
          expires_at: statusResponse.data.data.expires_at
        });
      }

      // Step 3: Verify payment (simulate after customer pays)
      console.log('\nStep 3: Verifying payment...');
      const verifyResponse = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/verify`,
        { reference }
      );

      if (verifyResponse.data.success) {
        console.log('✅ Payment verified successfully');
        console.log('🎉 Final Payment Details:', {
          transaction_id: verifyResponse.data.data.transaction_id,
          status: verifyResponse.data.data.status,
          paid_at: verifyResponse.data.data.paid_at,
          gateway_response: verifyResponse.data.data.gateway_response
        });
      }

    } else {
      console.log('❌ Payment initialization failed:', initResponse.data);
    }

  } catch (error) {
    console.error('❌ Payment flow error:', error.response?.data || error.message);
  }
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Lahza Payment API Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🏪 Test Store ID: ${TEST_STORE_ID}\n`);

  testLahzaPaymentAPI()
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return testPaymentFlow();
    })
    .then(() => {
      console.log('\n✅ All tests completed!');
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
    });
}

module.exports = {
  testLahzaPaymentAPI,
  testPaymentFlow
};
