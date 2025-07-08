const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:5001/api';

// Store ID to test with
const STORE_ID = '686a719956a82bfcc93a2e2d';

async function testDeliveryMethodsAPI() {
  console.log('🧪 Testing Delivery Methods API...\n');

  try {
    // Test 1: Get all delivery methods for a store (public endpoint)
    console.log('1️⃣ Testing GET /api/delivery-methods/store/{storeId}');
    const response1 = await axios.get(`${BASE_URL}/delivery-methods/store/${STORE_ID}`);
    console.log('✅ Success:', response1.data.success);
    console.log('📊 Found', response1.data.data.length, 'delivery methods');
    console.log('📋 Methods:', response1.data.data.map(m => `${m.locationEn} (${m.price} ILS)`));
    console.log('');

    // Test 2: Get only active delivery methods
    console.log('2️⃣ Testing GET /api/delivery-methods/store/{storeId}?isActive=true');
    const response2 = await axios.get(`${BASE_URL}/delivery-methods/store/${STORE_ID}?isActive=true`);
    console.log('✅ Success:', response2.data.success);
    console.log('📊 Found', response2.data.data.length, 'active delivery methods');
    console.log('');

    // Test 3: Get only default delivery method
    console.log('3️⃣ Testing GET /api/delivery-methods/store/{storeId}?isDefault=true');
    const response3 = await axios.get(`${BASE_URL}/delivery-methods/store/${STORE_ID}?isDefault=true`);
    console.log('✅ Success:', response3.data.success);
    console.log('📊 Found', response3.data.data.length, 'default delivery method(s)');
    if (response3.data.data.length > 0) {
      console.log('🏆 Default method:', response3.data.data[0].locationEn);
    }
    console.log('');

    // Test 4: Test with non-existent store
    console.log('4️⃣ Testing GET /api/delivery-methods/store/nonexistent');
    try {
      await axios.get(`${BASE_URL}/delivery-methods/store/nonexistent`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent store');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDeliveryMethodsAPI(); 