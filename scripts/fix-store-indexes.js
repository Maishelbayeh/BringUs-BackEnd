const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

async function fixStoreIndexes() {
  try {
    //CONSOLE.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    //CONSOLE.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const storesCollection = db.collection('stores');

    //CONSOLE.log('📋 Current indexes:');
    const indexes = await storesCollection.indexes();
    indexes.forEach(index => {
      //CONSOLE.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
    });

    // Check if domain index exists
    const domainIndex = indexes.find(index => 
      Object.keys(index.key).includes('domain')
    );

    if (domainIndex) {
      //CONSOLE.log('🗑️  Dropping old domain index...');
      await storesCollection.dropIndex('domain_1');
      //CONSOLE.log('✅ Domain index dropped');
    } else {
      //CONSOLE.log('ℹ️  No domain index found');
    }

    // Check if slug index exists
    const slugIndex = indexes.find(index => 
      Object.keys(index.key).includes('slug')
    );

    if (!slugIndex) {
      //CONSOLE.log('📝 Creating slug index...');
      await storesCollection.createIndex({ slug: 1 }, { unique: true });
      //CONSOLE.log('✅ Slug index created');
    } else {
      //CONSOLE.log('ℹ️  Slug index already exists');
    }

    //CONSOLE.log('\n📋 Updated indexes:');
    const updatedIndexes = await storesCollection.indexes();
    updatedIndexes.forEach(index => {
      //CONSOLE.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
    });

    //CONSOLE.log('\n🎉 Store indexes fixed successfully!');
  } catch (error) {
    //CONSOLE.error('❌ Error fixing store indexes:', error);
  } finally {
    await mongoose.disconnect();
    //CONSOLE.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixStoreIndexes(); 