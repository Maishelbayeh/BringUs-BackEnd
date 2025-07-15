const axios = require('axios');

// Test the set-default API (simplified - no store filtering needed)
async function testSetDefaultAPI() {
  const BASE_URL = 'http://localhost:5001/api';
  const DELIVERY_METHOD_ID = '686cc4aedd388afb6a5bc099';
  
  // You'll need to get a valid JWT token first
  const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

  console.log('🧪 Testing Set Default Delivery Method API (Simplified)...\n');

  try {
    // Test 1: Set delivery method as default
    console.log('1️⃣ Testing PATCH /api/delivery-methods/{id}/set-default');
    console.log('💡 Note: No store filtering needed since ID is unique across table');
    
    const response = await axios.patch(
      `${BASE_URL}/delivery-methods/${DELIVERY_METHOD_ID}/set-default`,
      {}, // Empty body
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Success!');
      console.log('📋 Response:', response.data);
    } else {
      console.log('❌ Failed:', response.data.message);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n💡 You need to authenticate first. Get a JWT token by logging in.');
      }
    }
  }
}

// Alternative: Test without authentication (this won't work but shows the error)
async function testWithoutAuth() {
  const BASE_URL = 'http://localhost:5001/api';
  const DELIVERY_METHOD_ID = '686cc4aedd388afb6a5bc099';

  console.log('🧪 Testing Set Default API without authentication...\n');

  try {
    const response = await axios.patch(
      `${BASE_URL}/delivery-methods/${DELIVERY_METHOD_ID}/set-default`,
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Expected error (no auth):', error.response?.status, error.response?.data?.message);
  }
}

// Test the public endpoint to get delivery methods first
async function testGetDeliveryMethods() {
  const BASE_URL = 'http://localhost:5001/api';
  const STORE_ID = '687505893fbf3098648bfe16';

  console.log('🧪 Testing Get Delivery Methods (Public)...\n');

  try {
    const response = await axios.get(`${BASE_URL}/delivery-methods/store/${STORE_ID}`);
    
    if (response.data.success) {
      console.log('✅ Success!');
      console.log(`📊 Found ${response.data.data.length} delivery methods`);
      
      if (response.data.data.length > 0) {
        console.log('📋 Available delivery methods:');
        response.data.data.forEach((method, index) => {
          console.log(`${index + 1}. ${method.locationEn} (ID: ${method._id}) - Default: ${method.isDefault}`);
        });
      }
    } else {
      console.log('❌ Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  
  await testGetDeliveryMethods();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testWithoutAuth();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Uncomment when you have a valid JWT token
  // await testSetDefaultAPI();
}

runAllTests(); 