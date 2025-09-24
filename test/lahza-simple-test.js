const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api';
const TEST_STORE_ID = '687c9bb0a7b3f2a0831c4675';

/**
 * Simple test for Lahza Payment API
 */
async function testLahzaSimple() {
  console.log('🧪 Simple Lahza Payment Test...\n');

  try {
    // Test with minimal required data
    const paymentData = {
      amount: 99.99,
      currency: 'USD',
      email: 'test@example.com',
      customerName: 'أحمد محمد'
    };

    console.log('📤 Sending request with data:', JSON.stringify(paymentData, null, 2));

    const response = await axios.post(
      `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
      paymentData
    );
    
    console.log('✅ Success!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Error occurred:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Message:', error.message);
    }
  }
}

// Run test
if (require.main === module) {
  testLahzaSimple();
}

module.exports = { testLahzaSimple };
