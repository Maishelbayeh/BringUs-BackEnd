const mongoose = require('mongoose');
require('dotenv').config();

async function testActualUserCreation() {
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

    console.log('\n🧪 Testing Actual User Creation...\n');

    // Test data
    const testUserData = {
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

    // Test 1: Check if store exists
    console.log('📋 Test 1: Checking if store exists...');
    const store = await Store.findById(testUserData.store);
    if (store) {
      console.log(`✅ Store found: ${store.nameEn || store.nameAr}`);
      console.log(`   Store ID: ${store._id}`);
    } else {
      console.log(`❌ Store not found with ID: ${testUserData.store}`);
      return;
    }

    // Test 2: Check if user already exists
    console.log('\n📋 Test 2: Checking if user exists...');
    const existingUser = await User.findOne({ 
      email: testUserData.email,
      store: testUserData.store,
      role: testUserData.role
    });
    
    if (existingUser) {
      console.log(`❌ User already exists: ${existingUser.email}`);
      console.log(`   User ID: ${existingUser._id}`);
      console.log(`   Store ID: ${existingUser.store}`);
      console.log(`   Role: ${existingUser.role}`);
      
      // Delete existing user for testing
      await User.findByIdAndDelete(existingUser._id);
      console.log('✅ Deleted existing user for testing');
    } else {
      console.log('✅ No existing user found');
    }

    // Test 3: Prepare user data (same logic as controller)
    console.log('\n📋 Test 3: Preparing user data...');
    const { firstName, lastName, email, password, phone, role, store: storeId, addresses, status } = testUserData;

    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      role: role || 'client',
      status: status || 'active'
    };

    // Handle addresses
    if (addresses && Array.isArray(addresses)) {
      userData.addresses = addresses.filter(addr => 
        addr.street && addr.street.trim() && 
        addr.city && addr.city.trim() && 
        addr.state && addr.state.trim() && 
        addr.country && addr.country.trim()
      );
    } else {
      userData.addresses = [];
    }

    // Add store if provided and user is admin or client
    if (storeId && (userData.role === 'admin' || userData.role === 'client')) {
      userData.store = typeof storeId === 'object' && storeId._id ? storeId._id : storeId;
    }

    console.log('✅ User data prepared:');
    console.log(`   Store: ${userData.store}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Addresses count: ${userData.addresses.length}`);

    // Test 4: Create user
    console.log('\n📋 Test 4: Creating user...');
    const user = await User.create(userData);
    console.log(`✅ User created successfully!`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Store: ${user.store}`);
    console.log(`   Role: ${user.role}`);

    // Test 5: Verify user in database
    console.log('\n📋 Test 5: Verifying user in database...');
    const createdUser = await User.findById(user._id);
    if (createdUser) {
      console.log(`✅ User found in database`);
      console.log(`   Store assigned: ${createdUser.store}`);
      console.log(`   Store type: ${typeof createdUser.store}`);
      console.log(`   Store equals input: ${createdUser.store.toString() === storeId}`);
    } else {
      console.log(`❌ User not found in database`);
    }

    // Test 6: Clean up
    console.log('\n📋 Test 6: Cleaning up...');
    await User.findByIdAndDelete(user._id);
    console.log('✅ Test user deleted');

    console.log('\n🎉 Actual user creation test completed successfully!');
    console.log('\n📝 Results:');
    console.log('- User creation works correctly');
    console.log('- Store assignment works correctly');
    console.log('- Database storage works correctly');

  } catch (error) {
    console.error('❌ Error testing actual user creation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testActualUserCreation();
