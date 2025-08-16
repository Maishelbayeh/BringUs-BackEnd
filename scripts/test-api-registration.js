const axios = require('axios');

async function testRegistrationAPI() {
  try {
    console.log('🧪 Testing Registration API...\n');

    const testData = {
      firstName: "test",
      lastName: "user",
      email: "testuser@example.com",
      password: "123123",
      phone: "+972592678828",
      role: "client",
      store: "689cf88b3b39c7069a48cd0f",
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

    console.log('📋 Test Data:');
    console.log(JSON.stringify(testData, null, 2));

    console.log('\n📋 Making API request...');
    const response = await axios.post('http://localhost:5001/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ API Response:');
    console.log(`Status: ${response.status}`);
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Check if store is in response
    if (response.data.user && response.data.user.store) {
      console.log('\n✅ Store is included in response!');
      console.log(`Store ID: ${response.data.user.store}`);
    } else {
      console.log('\n❌ Store is NOT included in response!');
    }

  } catch (error) {
    console.error('\n❌ API Error:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Error Data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

// Run the test
testRegistrationAPI();
