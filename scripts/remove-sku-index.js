const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function removeSkuIndex() {
  try {
    console.log('=== Removing SKU Index from Products Collection ===\n');
    
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)}`);
    });
    
    // Find SKU index
    const skuIndex = indexes.find(index => 
      Object.keys(index.key).includes('sku')
    );
    
    if (skuIndex) {
      console.log('\nFound SKU index:', JSON.stringify(skuIndex.key));
      
      // Drop the SKU index
      await collection.dropIndex(skuIndex.name);
      console.log('✅ Successfully removed SKU index');
    } else {
      console.log('\n✅ No SKU index found');
    }
    
    // Show updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('\nUpdated indexes:');
    updatedIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n✅ SKU index removal completed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing SKU index:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the script
removeSkuIndex(); 