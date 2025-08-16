const mongoose = require('mongoose');
require('dotenv').config();

async function getStoreSlug() {
  try {
    const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the Store model
    const Store = require('../Models/Store');

    console.log('\n🔍 Fetching all stores...');
    const stores = await Store.find({}).select('nameEn nameAr slug _id status');

    if (stores.length === 0) {
      console.log('❌ No stores found in database');
      return;
    }

    console.log(`\n📋 Found ${stores.length} store(s):`);
    console.log('='.repeat(80));
    
    stores.forEach((store, index) => {
      console.log(`${index + 1}. Store Details:`);
      console.log(`   ID: ${store._id}`);
      console.log(`   Name (EN): ${store.nameEn || 'N/A'}`);
      console.log(`   Name (AR): ${store.nameAr || 'N/A'}`);
      console.log(`   Slug: ${store.slug || 'N/A'}`);
      console.log(`   Status: ${store.status || 'N/A'}`);
      console.log('   ' + '-'.repeat(40));
    });

    // Find the specific store for the user
    console.log('\n🔍 Looking for store with ID: 689cf88b3b39c7069a48cd0f');
    const specificStore = await Store.findById('689cf88b3b39c7069a48cd0f');
    
    if (specificStore) {
      console.log('\n✅ Found the specific store:');
      console.log(`   ID: ${specificStore._id}`);
      console.log(`   Name (EN): ${specificStore.nameEn || 'N/A'}`);
      console.log(`   Name (AR): ${specificStore.nameAr || 'N/A'}`);
      console.log(`   Slug: ${specificStore.slug || 'N/A'}`);
      console.log(`   Status: ${specificStore.status || 'N/A'}`);
      
      console.log('\n📝 For login, use this storeSlug:');
      console.log(`   storeSlug: "${specificStore.slug}"`);
    } else {
      console.log('\n❌ Store with ID 689cf88b3b39c7069a48cd0f not found');
    }

    // Also check for users
    console.log('\n🔍 Checking users...');
    const User = require('../Models/User');
    const users = await User.find({}).select('firstName lastName email role store status');

    console.log(`\n📋 Found ${users.length} user(s):`);
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User Details:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Store: ${user.store || 'No store'}`);
      console.log(`   Status: ${user.status || 'N/A'}`);
      console.log('   ' + '-'.repeat(40));
    });

    console.log('\n🎉 Database inspection completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
getStoreSlug();
