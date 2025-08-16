const axios = require('axios');

async function testAPIEmailUniqueness() {
  try {
    console.log('🧪 Testing Email Uniqueness via API...\n');

    const baseUserData = {
      firstName: "test",
      lastName: "user",
      password: "123123",
      phone: "+972592678828",
      addresses: [
        {
          type: "home",
          street: "Zwatta",
          city: "Nablu",
          state: "Nablu",
          zipCode: "",
          country: "فلسطين",
          isDefault: true
        }
      ],
      status: "active"
    };

    const storeId = "689cf88b3b39c7069a48cd0f";
    const testEmail = "testuniqueness@example.com";

    console.log(`📋 Test Configuration:`);
    console.log(`   Store ID: ${storeId}`);
    console.log(`   Test Email: ${testEmail}`);

    // Test 1: Create user with client role
    console.log('\n📋 Test 1: Creating user with client role...');
    const user1Data = {
      ...baseUserData,
      email: testEmail,
      role: "client",
      store: storeId
    };

    try {
      const response1 = await axios.post('http://localhost:5001/api/auth/register', user1Data);
      console.log('✅ User 1 created successfully (client role)');
      console.log(`   User ID: ${response1.data.user.id}`);
      console.log(`   Store: ${response1.data.user.store}`);
    } catch (error) {
      console.log('❌ User 1 creation failed:', error.response?.data?.message || error.message);
    }

    // Test 2: Create user with same email, same store, different role (admin)
    console.log('\n📋 Test 2: Creating user with same email, same store, admin role...');
    const user2Data = {
      ...baseUserData,
      email: testEmail,
      role: "admin",
      store: storeId
    };

    try {
      const response2 = await axios.post('http://localhost:5001/api/auth/register', user2Data);
      console.log('✅ User 2 created successfully (admin role)');
      console.log(`   User ID: ${response2.data.user.id}`);
      console.log(`   Store: ${response2.data.user.store}`);
    } catch (error) {
      console.log('❌ User 2 creation failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Try to create user with same email, same store, same role (should fail)
    console.log('\n📋 Test 3: Trying to create user with same email, same store, same role (should fail)...');
    const user3Data = {
      ...baseUserData,
      email: testEmail,
      role: "client",
      store: storeId
    };

    try {
      const response3 = await axios.post('http://localhost:5001/api/auth/register', user3Data);
      console.log('❌ User 3 creation should have failed but succeeded');
    } catch (error) {
      console.log('✅ User 3 creation correctly failed');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 4: Create user with different email, same store, same role
    console.log('\n📋 Test 4: Creating user with different email, same store, same role...');
    const user4Data = {
      ...baseUserData,
      email: "different@example.com",
      role: "client",
      store: storeId
    };

    try {
      const response4 = await axios.post('http://localhost:5001/api/auth/register', user4Data);
      console.log('✅ User 4 created successfully (different email)');
      console.log(`   User ID: ${response4.data.user.id}`);
      console.log(`   Store: ${response4.data.user.store}`);
    } catch (error) {
      console.log('❌ User 4 creation failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 API Email Uniqueness Test Completed!');
    console.log('\n📝 Expected Results:');
    console.log('- ✅ Same email can exist with different roles in same store');
    console.log('- ✅ Same email cannot exist with same role in same store');
    console.log('- ✅ Different emails can exist with same role in same store');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPIEmailUniqueness();
