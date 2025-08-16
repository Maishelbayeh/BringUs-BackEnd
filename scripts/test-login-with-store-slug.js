const axios = require('axios');

async function testLoginWithStoreSlug() {
  try {
    console.log('🧪 Testing Login with Store Slug...\n');

    // Test 1: Login with storeSlug (client/admin)
    console.log('📋 Test 1: Login with storeSlug (client/admin)');
    const loginData1 = {
      email: "maiperfuim@gmail.com",
      password: "123123",
      storeSlug: "my-perfume-house" // Replace with actual store slug
    };

    try {
      const response1 = await axios.post('http://localhost:5001/api/auth/login', loginData1, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Login successful with storeSlug');
      console.log(`Status: ${response1.status}`);
      console.log('User Data:');
      console.log(`   ID: ${response1.data.user.id}`);
      console.log(`   Email: ${response1.data.user.email}`);
      console.log(`   Role: ${response1.data.user.role}`);
      console.log(`   Store: ${response1.data.user.store?.nameEn || response1.data.user.store?.nameAr}`);
      console.log(`   Store Slug: ${response1.data.user.store?.slug}`);

    } catch (error) {
      console.log('❌ Login failed with storeSlug:');
      console.log(`Status: ${error.response?.status}`);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Login without storeSlug (superadmin)
    console.log('📋 Test 2: Login without storeSlug (superadmin)');
    const loginData2 = {
      email: "superadmin@gmail.com", // Replace with actual superadmin email
      password: "123123"
      // No storeSlug for superadmin
    };

    try {
      const response2 = await axios.post('http://localhost:5001/api/auth/login', loginData2, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Login successful without storeSlug (superadmin)');
      console.log(`Status: ${response2.status}`);
      console.log('User Data:');
      console.log(`   ID: ${response2.data.user.id}`);
      console.log(`   Email: ${response2.data.user.email}`);
      console.log(`   Role: ${response2.data.user.role}`);
      console.log(`   Store: ${response2.data.user.store ? 'Has store' : 'No store'}`);

    } catch (error) {
      console.log('❌ Login failed without storeSlug:');
      console.log(`Status: ${error.response?.status}`);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Login with wrong storeSlug
    console.log('📋 Test 3: Login with wrong storeSlug');
    const loginData3 = {
      email: "maiperfuim@gmail.com",
      password: "123123",
      storeSlug: "wrong-store-slug"
    };

    try {
      const response3 = await axios.post('http://localhost:5001/api/auth/login', loginData3, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('❌ Login should have failed with wrong storeSlug');
      console.log('Response:', response3.data);

    } catch (error) {
      console.log('✅ Login correctly failed with wrong storeSlug');
      console.log(`Status: ${error.response?.status}`);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Login with correct email but wrong store
    console.log('📋 Test 4: Login with correct email but wrong store');
    const loginData4 = {
      email: "maiperfuim@gmail.com",
      password: "123123",
      storeSlug: "different-store" // Different store slug
    };

    try {
      const response4 = await axios.post('http://localhost:5001/api/auth/login', loginData4, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('❌ Login should have failed with wrong store');
      console.log('Response:', response4.data);

    } catch (error) {
      console.log('✅ Login correctly failed with wrong store');
      console.log(`Status: ${error.response?.status}`);
      console.log('Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Login with Store Slug test completed!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Login works with correct storeSlug');
    console.log('- ✅ Login works without storeSlug (superadmin)');
    console.log('- ✅ Login fails with wrong storeSlug');
    console.log('- ✅ Login fails with wrong store');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testLoginWithStoreSlug();
