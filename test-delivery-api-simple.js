const axios = require('axios');

// Test the new delivery methods API
async function testDeliveryAPI() {
  const BASE_URL = 'http://localhost:5001/api';
  const STORE_ID = '687505893fbf3098648bfe16';

  console.log('🧪 Testing Delivery Methods API...\n');

  try {
    // Test 1: Get all delivery methods for the store
    console.log('1️⃣ Testing GET /api/delivery-methods/store/{storeId}');
    const response1 = await axios.get(`${BASE_URL}/delivery-methods/store/${STORE_ID}`);
    
    if (response1.data.success) {
      console.log('✅ Success!');
      console.log(`📊 Found ${response1.data.data.length} delivery methods`);
      
      if (response1.data.data.length > 0) {
        console.log('📋 First method:', {
          location: response1.data.data[0].locationEn,
          price: response1.data.data[0].price,
          isActive: response1.data.data[0].isActive,
          isDefault: response1.data.data[0].isDefault
        });
      }
    } else {
      console.log('❌ Failed:', response1.data.message);
    }
    console.log('');

    // Test 2: Get only active delivery methods
    console.log('2️⃣ Testing GET /api/delivery-methods/store/{storeId}?isActive=true');
    const response2 = await axios.get(`${BASE_URL}/delivery-methods/store/${STORE_ID}?isActive=true`);
    
    if (response2.data.success) {
      console.log('✅ Success!');
      console.log(`📊 Found ${response2.data.data.length} active delivery methods`);
    } else {
      console.log('❌ Failed:', response2.data.message);
    }
    console.log('');

    // Test 3: Get only default delivery method
    console.log('3️⃣ Testing GET /api/delivery-methods/store/{storeId}?isDefault=true');
    const response3 = await axios.get(`${BASE_URL}/delivery-methods/store/${STORE_ID}?isDefault=true`);
    
    if (response3.data.success) {
      console.log('✅ Success!');
      console.log(`📊 Found ${response3.data.data.length} default delivery method(s)`);
      if (response3.data.data.length > 0) {
        console.log('🏆 Default method:', response3.data.data[0].locationEn);
      }
    } else {
      console.log('❌ Failed:', response3.data.message);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDeliveryAPI(); 