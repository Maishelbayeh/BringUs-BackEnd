const axios = require('axios');

async function testOTPVerification() {
  try {
    console.log('🧪 Testing OTP Verification...\n');

    // Test data
    const testData = {
      email: "mayshelbayeh5@gmail.com", // Use the email from the logs
      otp: "93621" // Use the OTP from the logs
    };

    console.log('📋 Test Data:');
    console.log(`   Email: ${testData.email}`);
    console.log(`   OTP: ${testData.otp}`);

    console.log('\n📋 Making OTP verification request...');
    const response = await axios.post('http://localhost:5001/api/email-verification/verify', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ OTP Verification Successful!');
    console.log(`Status: ${response.status}`);
    console.log('Response:');
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Message: ${response.data.message}`);
    
    if (response.data.data) {
      console.log(`   Email: ${response.data.data.email}`);
      console.log(`   Is Email Verified: ${response.data.data.isEmailVerified}`);
      console.log(`   Email Verified At: ${response.data.data.emailVerifiedAt}`);
    }

    console.log('\n🎉 Email verification completed successfully!');
    console.log('📝 The user can now use all features that require email verification');

  } catch (error) {
    console.error('\n❌ OTP Verification failed:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Error:', error.response.data.message || error.response.data.error);
      
      if (error.response.status === 400) {
        console.log('\n💡 Possible reasons:');
        console.log('   - OTP has expired (15 minutes)');
        console.log('   - OTP is incorrect');
        console.log('   - Email is already verified');
        console.log('   - No OTP found for this email');
      }
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

// Run the test
testOTPVerification();
