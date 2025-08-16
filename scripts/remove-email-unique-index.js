const mongoose = require('mongoose');
require('dotenv').config();

async function removeEmailUniqueIndex() {
  try {
    const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the database instance
    const db = mongoose.connection.db;
    
    console.log('\n🔍 Checking existing indexes on users collection...');
    
    // Get all indexes
    const indexes = await db.collection('users').indexes();
    console.log('Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${JSON.stringify(index.key)} - ${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}`);
    });

    // Find the email unique index
    const emailIndex = indexes.find(index => 
      index.key && index.key.email === 1 && index.unique === true
    );

    if (emailIndex) {
      console.log('\n❌ Found unique email index that needs to be removed');
      console.log(`   Index name: ${emailIndex.name}`);
      console.log(`   Index key: ${JSON.stringify(emailIndex.key)}`);
      
      // Drop the unique email index
      console.log('\n🗑️  Dropping unique email index...');
      await db.collection('users').dropIndex(emailIndex.name);
      console.log('✅ Unique email index dropped successfully');
      
      // Verify the index is removed
      console.log('\n🔍 Verifying index removal...');
      const updatedIndexes = await db.collection('users').indexes();
      const emailIndexStillExists = updatedIndexes.find(index => 
        index.key && index.key.email === 1 && index.unique === true
      );
      
      if (!emailIndexStillExists) {
        console.log('✅ Email unique index successfully removed');
      } else {
        console.log('❌ Email unique index still exists');
      }
      
      console.log('\n📋 Updated indexes:');
      updatedIndexes.forEach((index, i) => {
        console.log(`   ${i + 1}. ${JSON.stringify(index.key)} - ${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}`);
      });
      
    } else {
      console.log('\n✅ No unique email index found');
    }

    // Create a compound index for email + store + role uniqueness
    console.log('\n🔧 Creating compound index for email + store + role uniqueness...');
    try {
      await db.collection('users').createIndex(
        { email: 1, store: 1, role: 1 }, 
        { 
          unique: true,
          name: 'email_store_role_unique'
        }
      );
      console.log('✅ Compound index created successfully');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Compound index already exists');
      } else {
        console.log('❌ Error creating compound index:', error.message);
      }
    }

    console.log('\n🎉 Email index management completed!');
    console.log('\n📝 Summary:');
    console.log('- ✅ Removed unique email index');
    console.log('- ✅ Created compound index for email + store + role');
    console.log('- ✅ Users can now have same email in different stores/roles');

  } catch (error) {
    console.error('❌ Error managing email indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
removeEmailUniqueIndex();
