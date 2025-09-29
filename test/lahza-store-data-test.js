const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api';
const TEST_STORE_ID = '687c9bb0a7b3f2a0831c4675';

/**
 * Test Lahza Payment API with store data extraction
 */
async function testLahzaWithStoreData() {
  console.log('🧪 Testing Lahza Payment with Store Data Extraction...\n');

  try {
    // Test 1: Only amount (should extract from store)
    console.log('1️⃣ Testing with only amount (extract from store)...');
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: 99.99
        }
      );
      console.log('✅ Success with store data extraction:', response.data);
      
      // Check if metadata contains store info
      if (response.data.data && response.data.data.metadata) {
        console.log('📋 Metadata from store:', response.data.data.metadata);
      }
    } catch (error) {
      console.log('❌ Error with store data extraction:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Amount + currency (override store currency)
    console.log('2️⃣ Testing with amount + currency override...');
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: 150.50,
          currency: 'USD' // Override store currency
        }
      );
      console.log('✅ Success with currency override:', response.data);
    } catch (error) {
      console.log('❌ Error with currency override:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: With custom metadata (should merge with store data)
    console.log('3️⃣ Testing with custom metadata...');
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: 250.75,
          currency: 'ILS',
          metadata: {
            orderId: '12345',
            source: 'mobile_app',
            customField: 'test_value'
          }
        }
      );
      console.log('✅ Success with custom metadata:', response.data);
      
      if (response.data.data && response.data.data.metadata) {
        console.log('📋 Merged metadata:', response.data.data.metadata);
      }
    } catch (error) {
      console.log('❌ Error with custom metadata:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Test the exact format you want
    console.log('4️⃣ Testing exact format you requested...');
    try {
      
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize`,
        {
          amount: "9999",
          callback_url: "http://localhost:5173/"
        }
      );
      console.log('✅ Success with exact format:', response.data);
      
      // Show the payload that would be sent to Lahza
      if (response.data.data) {
        console.log('📋 Lahza payload format:');
        console.log(JSON.stringify({
          amount: response.data.data.amount,
          email: response.data.data.customer?.email,
          currency: response.data.data.currency,
          first_name: response.data.data.customer?.name?.split(' ')[0] || 'أحمد',
          last_name: response.data.data.customer?.name?.split(' ').slice(1).join(' ') || 'محمد',
          callback_url: "http://localhost:5173/",
          metadata: JSON.stringify(response.data.data.metadata)
        }, null, 2));
      }
    } catch (error) {
      console.log('❌ Error with exact format:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n🏁 Store data extraction tests completed!');
}

/**
 * Test with different stores
 */
async function testWithDifferentStores() {
  console.log('🧪 Testing with Different Stores...\n');

  const testStores = [
    { id: '687c9bb0a7b3f2a0831c4675', name: 'Test Store 1' },
    // Add more store IDs if you have them
  ];

  for (const store of testStores) {
    console.log(`🏪 Testing with store: ${store.name} (${store.id})`);
    
    try {
      const response = await axios.post(
        `${BASE_URL}/lahza-payment/${store.id}/initialize`,
        {
          amount: 100.00
        }
      );
      
      console.log(`✅ Success for ${store.name}:`, {
        storeId: response.data.data?.metadata?.storeId,
        storeName: response.data.data?.metadata?.storeName,
        currency: response.data.data?.currency,
        email: response.data.data?.customer?.email
      });
      
    } catch (error) {
      console.log(`❌ Error for ${store.name}:`, error.response?.data?.message || error.message);
    }
    
    console.log('');
  }
}

/**
 * Generate curl commands with store data
 */
function generateStoreDataCurlCommands() {
  console.log('📋 Curl Commands with Store Data Extraction:\n');

  console.log('1️⃣ Minimal (extract from store):');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": 99.99
  }'`);

  console.log('\n2️⃣ With currency override:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": 99.99,
    "currency": "USD"
  }'`);

  console.log('\n3️⃣ With custom metadata (will merge with store data):');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": 150.50,
    "currency": "ILS",
    "metadata": {
      "orderId": "12345",
      "userId": "687c9c02a7b3f2a0831c46be",
      "source": "mobile_app"
    }
  }'`);

  console.log('\n4️⃣ Your exact format (will extract store data):');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/lahza-payment/${TEST_STORE_ID}/initialize' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": "9999",
    "callback_url": "http://localhost:5173/"
  }'`);
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Lahza Payment Store Data Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🏪 Test Store ID: ${TEST_STORE_ID}\n`);

  generateStoreDataCurlCommands();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  testLahzaWithStoreData()
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return testWithDifferentStores();
    })
    .then(() => {
      console.log('\n✅ All store data tests completed!');
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
    });
}

module.exports = {
  testLahzaWithStoreData,
  testWithDifferentStores,
  generateStoreDataCurlCommands
};
