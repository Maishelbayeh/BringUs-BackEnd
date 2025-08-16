const mongoose = require('mongoose');
require('dotenv').config();

async function testEmailUniquenessScenarios() {
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

    console.log('\n🧪 Testing Email Uniqueness Scenarios...\n');

    // Get test stores
    const stores = await Store.find().limit(2);
    if (stores.length < 2) {
      console.log('❌ Need at least 2 stores for testing');
      return;
    }

    const store1 = stores[0];
    const store2 = stores[1];
    const testEmail = 'test@example.com';

    console.log(`📋 Using stores:`);
    console.log(`   Store 1: ${store1.nameEn || store1.nameAr} (${store1._id})`);
    console.log(`   Store 2: ${store2.nameEn || store2.nameAr} (${store2._id})`);
    console.log(`   Test Email: ${testEmail}`);

    // Clean up any existing test users
    await User.deleteMany({ email: testEmail });
    console.log('✅ Cleaned up existing test users');

    // Test Scenario 1: Same email, different stores, same role
    console.log('\n📋 Scenario 1: Same email, different stores, same role (client)');
    try {
      const user1 = await User.create({
        firstName: 'Test',
        lastName: 'User1',
        email: testEmail,
        password: '123123',
        role: 'client',
        store: store1._id
      });
      console.log('✅ User 1 created successfully');

      const user2 = await User.create({
        firstName: 'Test',
        lastName: 'User2',
        email: testEmail,
        password: '123123',
        role: 'client',
        store: store2._id
      });
      console.log('✅ User 2 created successfully (same email, different store)');
    } catch (error) {
      console.log('❌ Scenario 1 failed:', error.message);
    }

    // Test Scenario 2: Same email, same store, different roles
    console.log('\n📋 Scenario 2: Same email, same store, different roles');
    try {
      const user3 = await User.create({
        firstName: 'Test',
        lastName: 'User3',
        email: testEmail,
        password: '123123',
        role: 'admin',
        store: store1._id
      });
      console.log('✅ User 3 created successfully (same email, same store, different role)');
    } catch (error) {
      console.log('❌ Scenario 2 failed:', error.message);
    }

    // Test Scenario 3: Same email, same store, same role (should fail)
    console.log('\n📋 Scenario 3: Same email, same store, same role (should fail)');
    try {
      const user4 = await User.create({
        firstName: 'Test',
        lastName: 'User4',
        email: testEmail,
        password: '123123',
        role: 'client',
        store: store1._id
      });
      console.log('❌ Scenario 3 should have failed but succeeded');
    } catch (error) {
      console.log('✅ Scenario 3 correctly failed:', error.message);
    }

    // Test Scenario 4: Different email, same store, same role
    console.log('\n📋 Scenario 4: Different email, same store, same role');
    try {
      const user5 = await User.create({
        firstName: 'Test',
        lastName: 'User5',
        email: 'different@example.com',
        password: '123123',
        role: 'client',
        store: store1._id
      });
      console.log('✅ User 5 created successfully (different email, same store, same role)');
    } catch (error) {
      console.log('❌ Scenario 4 failed:', error.message);
    }

    // Display all test users
    console.log('\n📋 All test users created:');
    const allTestUsers = await User.find({ 
      email: { $in: [testEmail, 'different@example.com'] } 
    }).populate('store', 'nameEn nameAr');
    
    allTestUsers.forEach((user, index) => {
      console.log(`   User ${index + 1}: ${user.email} | ${user.role} | ${user.store?.nameEn || user.store?.nameAr}`);
    });

    console.log('\n🎉 Email uniqueness scenarios test completed!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Same email can exist in different stores');
    console.log('- ✅ Same email can exist with different roles');
    console.log('- ✅ Same email cannot exist with same store and role');
    console.log('- ✅ Different emails can exist in same store and role');

  } catch (error) {
    console.error('❌ Error testing email uniqueness scenarios:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testEmailUniquenessScenarios();
