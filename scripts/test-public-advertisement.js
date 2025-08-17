const axios = require('axios');

async function testPublicAdvertisement() {
  console.log('🧪 Testing Public Advertisement Route\n');

  const baseURL = 'http://localhost:5001';
  const storeId = '689cf88b3b39c7069a48cd0f'; // Replace with actual store ID

  console.log('📋 Test Details:');
  console.log(`   Base URL: ${baseURL}`);
  console.log(`   Store ID: ${storeId}`);
  console.log(`   Route: GET /api/advertisements/stores/${storeId}/advertisements/active`);
  console.log('   Authentication: None (Public Route)');

  try {
    console.log('\n📡 Making request...');
    
    const response = await axios.get(`${baseURL}/api/advertisements/stores/${storeId}/advertisements/active`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Request successful!');
    console.log(`📊 Status Code: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}`);
    
    if (response.data) {
      console.log('\n📄 Response Data:');
      console.log('   Success:', response.data.success);
      console.log('   Message:', response.data.message);
      
      if (response.data.data) {
        const ad = response.data.data;
        console.log('\n📢 Advertisement Details:');
        console.log('   ID:', ad._id);
        console.log('   Title:', ad.title);
        console.log('   Description:', ad.description);
        console.log('   Position:', ad.position);
        console.log('   Is Active:', ad.isActive);
        console.log('   Click Count:', ad.clickCount);
        console.log('   View Count:', ad.viewCount);
        console.log('   Priority:', ad.priority);
        
        if (ad.htmlContent) {
          console.log('   HTML Content: Available');
        }
        
        if (ad.backgroundImageUrl) {
          console.log('   Background Image:', ad.backgroundImageUrl);
        }
      }
    }

    console.log('\n🎉 Public route is working correctly!');
    console.log('💡 This route can be accessed without authentication');

  } catch (error) {
    console.log('\n❌ Request failed!');
    
    if (error.response) {
      console.log(`📊 Status Code: ${error.response.status}`);
      console.log(`📊 Status Text: ${error.response.statusText}`);
      
      if (error.response.data) {
        console.log('📄 Error Response:');
        console.log('   Success:', error.response.data.success);
        console.log('   Message:', error.response.data.message);
        
        if (error.response.data.error) {
          console.log('   Error:', error.response.data.error);
        }
      }
    } else if (error.request) {
      console.log('📡 No response received');
      console.log('   Error:', error.message);
    } else {
      console.log('❌ Request setup error');
      console.log('   Error:', error.message);
    }
    
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Make sure the server is running on port 5001');
    console.log('2. Check if the store ID is correct');
    console.log('3. Verify the route is properly configured');
    console.log('4. Check server logs for any errors');
  }
}

// Also test with a different store ID
async function testMultipleStores() {
  console.log('\n🧪 Testing Multiple Stores\n');

  const baseURL = 'http://localhost:5001';
  const storeIds = [
    '689cf88b3b39c7069a48cd0f',
    '68937385169af567de454f75'
  ];

  for (const storeId of storeIds) {
    console.log(`\n📧 Testing Store: ${storeId}`);
    
    try {
      const response = await axios.get(`${baseURL}/api/advertisements/stores/${storeId}/advertisements/active`, {
        timeout: 5000
      });

      if (response.data.success) {
        console.log(`✅ Store ${storeId}: Active advertisement found`);
        console.log(`   Title: ${response.data.data.title}`);
      } else {
        console.log(`⚠️  Store ${storeId}: ${response.data.message}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`❌ Store ${storeId}: No active advertisement found`);
      } else {
        console.log(`❌ Store ${storeId}: Error - ${error.message}`);
      }
    }
  }
}

// Run tests
async function runTests() {
  try {
    await testPublicAdvertisement();
    await testMultipleStores();
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

runTests();
