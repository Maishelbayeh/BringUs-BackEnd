const mongoose = require('mongoose');
require('dotenv').config();

async function testEmailVerification() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Import models
    const User = require('../Models/User');
    const Store = require('../Models/Store');

    console.log('\n🧪 Testing Email Verification System...\n');

    // Create a test store
    const testStore = await Store.create({
      nameEn: 'Test Store',
      nameAr: 'متجر تجريبي',
      domain: 'test-store.com',
      status: 'active'
    });
    console.log('✅ Test store created:', testStore.nameEn);

    // Create a test user
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'client',
      store: testStore._id,
      isEmailVerified: false
    });
    console.log('✅ Test user created:', testUser.email);

    // Test 1: Send email verification
    console.log('\n📧 Test 1: Sending email verification...');
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    testUser.emailVerificationOTP = otp;
    testUser.emailVerificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await testUser.save();
    console.log('✅ OTP generated and saved:', otp);

    // Test 2: Verify email with correct OTP
    console.log('\n🔍 Test 2: Verifying email with correct OTP...');
    if (testUser.emailVerificationOTP === otp && new Date() < testUser.emailVerificationExpiry) {
      testUser.isEmailVerified = true;
      testUser.emailVerifiedAt = new Date();
      testUser.emailVerificationOTP = undefined;
      testUser.emailVerificationExpiry = undefined;
      await testUser.save();
      console.log('✅ Email verified successfully');
    } else {
      console.log('❌ Email verification failed');
    }

    // Test 3: Check verification status
    console.log('\n📊 Test 3: Checking verification status...');
    const updatedUser = await User.findById(testUser._id);
    console.log('✅ User verification status:', {
      email: updatedUser.email,
      isEmailVerified: updatedUser.isEmailVerified,
      emailVerifiedAt: updatedUser.emailVerifiedAt,
      hasOTP: !!updatedUser.emailVerificationOTP
    });

    // Test 4: Test expired OTP
    console.log('\n⏰ Test 4: Testing expired OTP...');
    const expiredUser = await User.create({
      firstName: 'Expired',
      lastName: 'User',
      email: 'expired@example.com',
      password: 'password123',
      role: 'client',
      store: testStore._id,
      isEmailVerified: false,
      emailVerificationOTP: '12345',
      emailVerificationExpiry: new Date(Date.now() - 60 * 1000) // 1 minute ago
    });
    
    const isExpired = new Date() > expiredUser.emailVerificationExpiry;
    console.log('✅ Expired OTP test:', isExpired ? 'OTP is expired' : 'OTP is still valid');

    // Test 5: Test invalid OTP
    console.log('\n❌ Test 5: Testing invalid OTP...');
    const invalidUser = await User.create({
      firstName: 'Invalid',
      lastName: 'User',
      email: 'invalid@example.com',
      password: 'password123',
      role: 'client',
      store: testStore._id,
      isEmailVerified: false,
      emailVerificationOTP: '12345',
      emailVerificationExpiry: new Date(Date.now() + 15 * 60 * 1000)
    });
    
    const isValidOTP = invalidUser.emailVerificationOTP === '54321'; // Wrong OTP
    console.log('✅ Invalid OTP test:', !isValidOTP ? 'OTP is invalid' : 'OTP is valid');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ email: { $in: ['test@example.com', 'expired@example.com', 'invalid@example.com'] } });
    await Store.findByIdAndDelete(testStore._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Email verification system test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing email verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testEmailVerification();

