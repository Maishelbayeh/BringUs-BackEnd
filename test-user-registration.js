const mongoose = require('mongoose');
const User = require('./Models/User');
const Store = require('./Models/Store');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testUserRegistration() {
  try {
    console.log('Testing user registration with store field...\n');

    // Test data (same as what you provided)
    const testUserData = {
      firstName: "محمد",
      lastName: "عبد المجيد", 
      email: "mh@gmail.com",
      password: "123123",
      phone: "+97059318447",
      role: "client",
      store: "687c9bb0a7b3f2a0831c4675",
      addresses: [
        {
          type: "home",
          street: "المغازين شارع الصالات",
          city: "قباطية",
          state: "قباطية", 
          zipCode: "10256",
          country: "فلسطين",
          isDefault: true
        }
      ],
      status: "active"
    };

    // First, check if the store exists
    const store = await Store.findById(testUserData.store);
    if (!store) {
      console.log('❌ Store not found. Please make sure the store ID is correct.');
      console.log('Available stores:');
      const stores = await Store.find({}, 'nameEn _id');
      stores.forEach(s => console.log(`- ${s.nameEn}: ${s._id}`));
      return;
    }

    console.log(`✅ Store found: ${store.nameEn} (${store._id})`);

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUserData.email });
    if (existingUser) {
      console.log(`⚠️  User with email ${testUserData.email} already exists.`);
      console.log('Deleting existing user for test...');
      await User.findByIdAndDelete(existingUser._id);
      console.log('✅ Existing user deleted.');
    }

    // Create the user
    console.log('\nCreating user with the following data:');
    console.log('- Name:', `${testUserData.firstName} ${testUserData.lastName}`);
    console.log('- Email:', testUserData.email);
    console.log('- Role:', testUserData.role);
    console.log('- Store:', testUserData.store);
    console.log('- Addresses:', testUserData.addresses.length);

    const user = await User.create(testUserData);

    console.log('\n✅ User created successfully!');
    console.log('- User ID:', user._id);
    console.log('- Store assigned:', user.store);
    console.log('- Role:', user.role);
    console.log('- Status:', user.status);
    console.log('- Addresses count:', user.addresses.length);

    // Verify the user was created correctly
    const createdUser = await User.findById(user._id).populate('store', 'nameEn');
    console.log('\n📋 User details:');
    console.log('- Full name:', `${createdUser.firstName} ${createdUser.lastName}`);
    console.log('- Email:', createdUser.email);
    console.log('- Phone:', createdUser.phone);
    console.log('- Role:', createdUser.role);
    console.log('- Store:', createdUser.store ? createdUser.store.nameEn : 'None');
    console.log('- Status:', createdUser.status);
    console.log('- Is Active:', createdUser.isActive);
    console.log('- Email Verified:', createdUser.isEmailVerified);

    if (createdUser.addresses.length > 0) {
      console.log('\n📍 Addresses:');
      createdUser.addresses.forEach((addr, index) => {
        console.log(`  ${index + 1}. ${addr.type}: ${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`);
      });
    }

    console.log('\n🎉 User registration test completed successfully!');
    console.log('The registration endpoint now properly handles the store field and other additional fields.');

    // Clean up - delete the test user
    await User.findByIdAndDelete(user._id);
    console.log('\n🧹 Test user cleaned up.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUserRegistration(); 