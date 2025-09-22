const axios = require('axios');

async function testAnalyticsAPIs() {
  console.log('🧪 Testing Analytics APIs\n');

  const baseURL = 'http://localhost:5001';
  const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

  if (token === 'YOUR_JWT_TOKEN_HERE') {
    console.log('❌ Please replace YOUR_JWT_TOKEN_HERE with a real token');
    console.log('💡 You can get a token by:');
    console.log('   1. Registering a new user');
    console.log('   2. Logging in with existing user');
    console.log('   3. Copying the token from the response');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Test 1: Order Percentage API
  console.log('📊 Testing Order Percentage API...');
  try {
    const response1 = await axios.get(`${baseURL}/api/orders/analytics/order-percentage`, { headers });
    console.log('✅ Order Percentage Response:');
    console.log(`   Total Orders: ${response1.data.data.totalOrders}`);
    console.log(`   Guest Orders: ${response1.data.data.guestOrders}`);
    console.log(`   Logged User Orders: ${response1.data.data.loggedUserOrders}`);
    console.log(`   Guest Percentage: ${response1.data.data.percentages.guest}%`);
    console.log(`   Logged Users Percentage: ${response1.data.data.percentages.loggedUsers}%`);
  } catch (error) {
    console.log('❌ Order Percentage API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Top Users API
  console.log('👥 Testing Top Users API...');
  try {
    const response2 = await axios.get(`${baseURL}/api/orders/analytics/top-users`, { headers });
    console.log('✅ Top Users Response:');
    console.log(`   Found ${response2.data.data.length} users`);
    
    if (response2.data.data.length > 0) {
      console.log('   Top User:');
      const topUser = response2.data.data[0];
      console.log(`     Name: ${topUser.firstName} ${topUser.lastName}`);
      console.log(`     Email: ${topUser.email}`);
      console.log(`     Products Sold: ${topUser.totalProductsSold}`);
      console.log(`     Orders: ${topUser.orderCount}`);
      console.log(`     Revenue: $${topUser.totalRevenue}`);
    }
  } catch (error) {
    console.log('❌ Top Users API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Categories Revenue API
  console.log('💰 Testing Categories Revenue API...');
  try {
    const response3 = await axios.get(`${baseURL}/api/orders/analytics/categories-revenue`, { headers });
    console.log('✅ Categories Revenue Response:');
    console.log(`   Found ${response3.data.data.length} categories`);
    
    if (response3.data.data.length > 0) {
      console.log('   Top Category:');
      const topCategory = response3.data.data[0];
      console.log(`     Name (EN): ${topCategory.categoryNameEn}`);
      console.log(`     Name (AR): ${topCategory.categoryNameAr}`);
      console.log(`     Revenue: $${topCategory.totalRevenue}`);
      console.log(`     Quantity: ${topCategory.totalQuantity}`);
      console.log(`     Orders: ${topCategory.orderCount}`);
    }
  } catch (error) {
    console.log('❌ Categories Revenue API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
  }

  console.log('\n🎉 Analytics APIs Test Complete!');
  console.log('\n📋 API Endpoints Created:');
  console.log('   1. GET /api/orders/analytics/order-percentage');
  console.log('   2. GET /api/orders/analytics/top-users');
  console.log('   3. GET /api/orders/analytics/categories-revenue');
}

// Test without authentication (should fail)
async function testWithoutAuth() {
  console.log('\n🧪 Testing Without Authentication\n');

  const baseURL = 'http://localhost:5001';

  const endpoints = [
    '/api/orders/analytics/order-percentage',
    '/api/orders/analytics/top-users',
    '/api/orders/analytics/categories-revenue'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${baseURL}${endpoint}`, { timeout: 5000 });
      console.log(`⚠️  ${endpoint} - Unexpected success without authentication`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`✅ ${endpoint} - Correctly rejected without authentication`);
      } else {
        console.log(`❌ ${endpoint} - Unexpected error: ${error.message}`);
      }
    }
  }
}

// Run all tests
async function runTests() {
  try {
    await testAnalyticsAPIs();
    await testWithoutAuth();
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

runTests();
