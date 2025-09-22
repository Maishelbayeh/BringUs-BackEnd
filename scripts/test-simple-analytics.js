const axios = require('axios');

async function testSimpleAnalytics() {
  console.log('🧪 Simple Analytics Test\n');

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

  try {
    // Test Order Percentage
    console.log('📊 Testing Order Percentage...');
    const response1 = await axios.get(`${baseURL}/api/orders/analytics/order-percentage`, { headers });
    console.log('✅ Order Percentage:');
    console.log(`   Guest: ${response1.data.data.percentages.guest}%`);
    console.log(`   Logged Users: ${response1.data.data.percentages.loggedUsers}%`);

    // Test Top Users
    console.log('\n👥 Testing Top Users...');
    const response2 = await axios.get(`${baseURL}/api/orders/analytics/top-users`, { headers });
    console.log('✅ Top Users:');
    console.log(`   Found ${response2.data.data.length} users`);

    // Test Categories Revenue
    console.log('\n💰 Testing Categories Revenue...');
    const response3 = await axios.get(`${baseURL}/api/orders/analytics/categories-revenue`, { headers });
    console.log('✅ Categories Revenue:');
    console.log(`   Found ${response3.data.data.length} categories`);

    console.log('\n🎉 All Analytics APIs are working!');

  } catch (error) {
    console.log('❌ Test failed:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

testSimpleAnalytics();
