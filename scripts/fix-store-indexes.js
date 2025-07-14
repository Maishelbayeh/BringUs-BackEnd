const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

async function fixStoreIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const storesCollection = db.collection('stores');

    console.log('📋 Current indexes:');
    const indexes = await storesCollection.indexes();
    indexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
    });

    // Check if domain index exists
    const domainIndex = indexes.find(index => 
      Object.keys(index.key).includes('domain')
    );

    if (domainIndex) {
      console.log('🗑️  Dropping old domain index...');
      await storesCollection.dropIndex('domain_1');
      console.log('✅ Domain index dropped');
    } else {
      console.log('ℹ️  No domain index found');
    }

    // Check if slug index exists
    const slugIndex = indexes.find(index => 
      Object.keys(index.key).includes('slug')
    );

    if (!slugIndex) {
      console.log('📝 Creating slug index...');
      await storesCollection.createIndex({ slug: 1 }, { unique: true });
      console.log('✅ Slug index created');
    } else {
      console.log('ℹ️  Slug index already exists');
    }

    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await storesCollection.indexes();
    updatedIndexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
    });

    console.log('\n🎉 Store indexes fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing store indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixStoreIndexes(); 