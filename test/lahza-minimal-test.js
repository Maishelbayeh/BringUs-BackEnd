const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api';
const TEST_STORE_ID = '687c9bb0a7b3f2a0831c4675';

/**
 * Test Lahza Payment API with minimal data
 */
async function testLahzaMinimal() {
  console.log('🧪 Testing Lahza Payment with Minimal Data...\n');

  try {
    // Test 1: Only amount (should work with defaults)
    console.log('1️⃣ Testing with only amount...');
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: 99.99
        }
      );
      console.log('✅ Success with only amount:', response.data);
    } catch (error) {
      console.log('❌ Error with only amount:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Amount + currency
    console.log('2️⃣ Testing with amount + currency...');
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: 150.50,
          currency: 'USD'
        }
      );
      console.log('✅ Success with amount + currency:', response.data);
    } catch (error) {
      console.log('❌ Error with amount + currency:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Amount + custom email/name
    console.log('3️⃣ Testing with custom email/name...');
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: 250.75,
          currency: 'ILS',
          email: 'custom@example.com',
          customerName: 'Custom User',
          metadata: {
            orderId: '12345',
            source: 'test'
          }
        }
      );
      console.log('✅ Success with custom data:', response.data);
    } catch (error) {
      console.log('❌ Error with custom data:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Test the exact curl command from user
    console.log('4️⃣ Testing exact user curl command...');
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: "9999",
          callback_url: "http://localhost:5173/"
        }
      );
      console.log('✅ Success with user curl data:', response.data);
    } catch (error) {
      console.log('❌ Error with user curl data:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n🏁 Minimal tests completed!');
}

/**
 * Generate updated curl commands
 */
function generateUpdatedCurlCommands() {
  console.log('📋 Updated Curl Commands:\n');

  console.log('1️⃣ Minimal (only amount):');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": 99.99
  }'`);

  console.log('\n2️⃣ With currency:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": 99.99,
    "currency": "USD"
  }'`);

  console.log('\n3️⃣ User\'s exact command (should work now):');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": "9999",
    "callback_url": "http://localhost:5173/"
  }'`);

  console.log('\n4️⃣ With custom data:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": 150.50,
    "currency": "ILS",
    "email": "moon95@gmail.com",
    "customerName": "أحمد محمد",
    "metadata": {
      "orderId": "12345",
      "userId": "687c9c02a7b3f2a0831c46be"
    }
  }'`);
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Lahza Payment Minimal Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🏪 Test Store ID: ${TEST_STORE_ID}\n`);

  generateUpdatedCurlCommands();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  testLahzaMinimal()
    .then(() => {
      console.log('\n✅ All minimal tests completed!');
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
    });
}

module.exports = {
  testLahzaMinimal,
  generateUpdatedCurlCommands
};
