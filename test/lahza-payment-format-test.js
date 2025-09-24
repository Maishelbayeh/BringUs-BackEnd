const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api';
const TEST_STORE_ID = '687c9bb0a7b3f2a0831c4675'; // Replace with actual store ID

/**
 * Test Lahza Payment API with the new format
 */
async function testLahzaPaymentFormat() {
  console.log('🧪 Testing Lahza Payment API with New Format...\n');

  try {
    // Test 1: Initialize Payment with new format
    console.log('1️⃣ Testing Payment Initialization with New Format...');
    
    const paymentData = {
      amount: 99.99,
      currency: 'USD',
      email: 'moon95@gmail.com',
      customerName: 'أحمد محمد',
      customerPhone: '+972501234567',
      description: 'دفع مقابل طلب #12345',
      metadata: {
        userId: '687c9c02a7b3f2a0831c46be',
        orderId: '12345',
        productIds: ['abc123', 'def456']
      }
    };

    console.log('📤 Sending request with data:', JSON.stringify(paymentData, null, 2));

    const initResponse = await axios.post(
      `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
      paymentData
    );
    
    console.log('✅ Payment Initialized Successfully!');
    console.log('📋 Response:', JSON.stringify(initResponse.data, null, 2));
    
    // Check if the payload sent to Lahza matches expected format
    console.log('\n🔍 Expected Lahza API payload format:');
    console.log(JSON.stringify({
      amount: "9999",
      email: "moon95@gmail.com",
      currency: "USD",
      first_name: "أحمد",
      last_name: "محمد",
      callback_url: "http://localhost:5173/",
      metadata: JSON.stringify({
        storeId: TEST_STORE_ID,
        userId: "687c9c02a7b3f2a0831c46be",
        orderId: "12345",
        productIds: ["abc123", "def456"]
      })
    }, null, 2));

    const reference = initResponse.data.data?.reference;
    
    if (reference) {
      console.log('\n2️⃣ Testing Payment Verification...');
      try {
        const verifyResponse = await axios.post(
          `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/verify`,
          { reference }
        );
        console.log('✅ Payment Verified:', verifyResponse.data);
      } catch (error) {
        console.log('❌ Payment Verification Failed:', error.response?.data || error.message);
      }

      console.log('\n3️⃣ Testing Payment Status...');
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

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Test with different name formats
  console.log('4️⃣ Testing Different Name Formats...');
  
  const testCases = [
    {
      name: 'Single Name',
      customerName: 'أحمد',
      expected: { first_name: 'أحمد', last_name: '' }
    },
    {
      name: 'Two Names',
      customerName: 'أحمد محمد',
      expected: { first_name: 'أحمد', last_name: 'محمد' }
    },
    {
      name: 'Three Names',
      customerName: 'أحمد محمد علي',
      expected: { first_name: 'أحمد', last_name: 'محمد علي' }
    },
    {
      name: 'English Names',
      customerName: 'John Michael Smith',
      expected: { first_name: 'John', last_name: 'Michael Smith' }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing ${testCase.name}: "${testCase.customerName}"`);
    
    try {
      const testData = {
        amount: 50.00,
        currency: 'ILS',
        email: 'test@example.com',
        customerName: testCase.customerName,
        metadata: { test: true }
      };

      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        testData
      );
      
      console.log(`✅ ${testCase.name} - Payment initialized successfully`);
      console.log(`📋 Expected: ${JSON.stringify(testCase.expected)}`);
      
    } catch (error) {
      console.log(`❌ ${testCase.name} - Failed:`, error.response?.data?.message || error.message);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Test metadata formatting
  console.log('5️⃣ Testing Metadata Formatting...');
  
  try {
    const metadataTestData = {
      amount: 25.50,
      currency: 'ILS',
      email: 'metadata@test.com',
      customerName: 'Test User',
      metadata: {
        orderId: 'ORDER-123',
        userId: 'USER-456',
        items: ['item1', 'item2'],
        customData: {
          source: 'mobile_app',
          version: '1.0.0'
        }
      }
    };

    const response = await axios.post(
      `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
      metadataTestData
    );
    
    console.log('✅ Metadata test - Payment initialized successfully');
    console.log('📋 Metadata should be JSON string in Lahza payload');
    
  } catch (error) {
    console.log('❌ Metadata test - Failed:', error.response?.data?.message || error.message);
  }

  console.log('\n🏁 Lahza Payment Format Tests Completed!');
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Lahza Payment Format Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🏪 Test Store ID: ${TEST_STORE_ID}\n`);

  testLahzaPaymentFormat()
    .then(() => {
      console.log('\n✅ All format tests completed!');
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
    });
}

module.exports = {
  testLahzaPaymentFormat
};
