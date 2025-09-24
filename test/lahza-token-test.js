const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api';
const TEST_STORE_ID = '687c9bb0a7b3f2a0831c4675';

/**
 * Test Lahza Payment API with token authentication
 */
async function testLahzaWithToken() {
  console.log('🧪 Testing Lahza Payment with Token...\n');

  try {
    // Test 1: Without token (should fail)
    console.log('1️⃣ Testing without token (should fail)...');
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: 99.99,
          currency: 'USD'
        }
      );
      console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
      console.log('✅ Expected error:', error.response?.data?.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: With token but minimal data
    console.log('2️⃣ Testing with token and minimal data...');
    
    // You need to replace this with a real token from your authentication
    const testToken = 'YOUR_JWT_TOKEN_HERE';
    
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: 99.99,
          currency: 'USD'
        },
        {
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Success with token:', response.data);
    } catch (error) {
      console.log('❌ Error with token:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: With token and override data
    console.log('3️⃣ Testing with token and override data...');
    
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: 150.50,
          currency: 'ILS',
          email: 'override@example.com',
          customerName: 'Override Name',
          metadata: {
            orderId: '12345',
            source: 'mobile_app'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Success with override data:', response.data);
    } catch (error) {
      console.log('❌ Error with override data:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n🏁 Token tests completed!');
}

/**
 * Test with curl command
 */
function generateCurlCommands() {
  console.log('📋 Curl Commands for Testing:\n');

  console.log('1️⃣ Without token (will fail):');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": 99.99,
    "currency": "USD"
  }'`);

  console.log('\n2️⃣ With token (replace YOUR_TOKEN):');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -d '{
    "amount": 99.99,
    "currency": "USD"
  }'`);

  console.log('\n3️⃣ With token and override data:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -d '{
    "amount": 150.50,
    "currency": "ILS",
    "email": "override@example.com",
    "customerName": "Override Name",
    "metadata": {
      "orderId": "12345",
      "source": "mobile_app"
    }
  }'`);
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Lahza Payment Token Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🏪 Test Store ID: ${TEST_STORE_ID}\n`);

  generateCurlCommands();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  testLahzaWithToken()
    .then(() => {
      console.log('\n✅ All token tests completed!');
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
    });
}

module.exports = {
  testLahzaWithToken,
  generateCurlCommands
};
