const axios = require('axios');

async function testSimpleLogin() {
  try {
    console.log('🧪 Testing Simple Login...\n');

    // Test 1: Login with storeSlug
    console.log('📋 Test 1: Login with storeSlug');
    const loginData1 = {
      email: "maiperfuim@gmail.com",
      password: "123123",
      storeSlug: "my-perfume-house" // Replace with actual store slug from your database
    };

    console.log('Login Data:', JSON.stringify(loginData1, null, 2));

    try {
      const response1 = await axios.post('http://localhost:5001/api/auth/login', loginData1, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('\n✅ Login successful!');
      console.log(`Status: ${response1.status}`);
      console.log('Response:');
      console.log(`   Success: ${response1.data.success}`);
      console.log(`   Message: ${response1.data.message}`);
      console.log(`   User ID: ${response1.data.user.id}`);
      console.log(`   User Email: ${response1.data.user.email}`);
      console.log(`   User Role: ${response1.data.user.role}`);
      console.log(`   Store: ${response1.data.user.store?.nameEn || response1.data.user.store?.nameAr || 'No store'}`);
      console.log(`   Token: ${response1.data.token ? 'Present' : 'Missing'}`);

    } catch (error) {
      console.log('\n❌ Login failed:');
      console.log(`Status: ${error.response?.status}`);
      console.log('Error:', error.response?.data?.message || error.message);
      
      if (error.response?.status === 400) {
        console.log('💡 This might be because the store slug is incorrect');
        console.log('💡 Check your database for the correct store slug');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Login without storeSlug (for superadmin)
    console.log('📋 Test 2: Login without storeSlug (superadmin)');
    const loginData2 = {
      email: "superadmin@gmail.com", // Replace with actual superadmin email
      password: "123123"
      // No storeSlug
    };

    console.log('Login Data:', JSON.stringify(loginData2, null, 2));

    try {
      const response2 = await axios.post('http://localhost:5001/api/auth/login', loginData2, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('\n✅ Superadmin login successful!');
      console.log(`Status: ${response2.status}`);
      console.log('Response:');
      console.log(`   Success: ${response2.data.success}`);
      console.log(`   Message: ${response2.data.message}`);
      console.log(`   User ID: ${response2.data.user.id}`);
      console.log(`   User Email: ${response2.data.user.email}`);
      console.log(`   User Role: ${response2.data.user.role}`);

    } catch (error) {
      console.log('\n❌ Superadmin login failed:');
      console.log(`Status: ${error.response?.status}`);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Login test completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testSimpleLogin();
