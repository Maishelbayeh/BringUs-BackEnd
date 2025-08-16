const axios = require('axios');

async function testSimpleRegistration() {
  try {
    console.log('🧪 Testing Simple Registration with OTP...\n');

    // Using your actual test data
    const testData = {
      firstName: "mai",
      lastName: "shelbayeh",
      email: "maiperfuim@gmail.com",
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
    console.log(`   Email: ${testData.email}`);
    console.log(`   Store: ${testData.store}`);
    console.log(`   Role: ${testData.role}`);

    console.log('\n📋 Making registration request...');
    const response = await axios.post('http://localhost:5001/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Registration Successful!');
    console.log(`Status: ${response.status}`);
    
    if (response.data.success) {
      console.log('✅ User created successfully');
      console.log(`   User ID: ${response.data.user.id}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Store: ${response.data.user.store}`);
      console.log(`   Role: ${response.data.user.role}`);
      
      // Check OTP status
      if (response.data.emailVerification) {
        console.log('\n📧 Email Verification:');
        console.log(`   Sent: ${response.data.emailVerification.sent}`);
        console.log(`   Message: ${response.data.emailVerification.message}`);
        
        if (response.data.emailVerification.sent) {
          console.log('\n🎉 SUCCESS! OTP sent to email');
          console.log('📝 Check your email for the 5-digit verification code');
          console.log('⏰ The code expires in 15 minutes');
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Registration failed:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Error:', error.response.data.message || error.response.data.error);
      
      if (error.response.status === 409) {
        console.log('💡 This means the user already exists with this email in this store and role');
        console.log('💡 Try with a different email or role');
      }
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

// Run the test
testSimpleRegistration();
