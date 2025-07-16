const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function dropSkuIndex() {
  try {
    //CONSOLE.log('=== Dropping SKU Index from Products Collection ===\n');
    
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
    const db = mongoose.connection.db;
    
    // Drop the SKU index using MongoDB command
    const result = await db.command({
      dropIndexes: 'products',
      index: 'sku_1'
    });
    
    //CONSOLE.log('✅ SKU index dropped successfully!');
    //CONSOLE.log('Result:', result);
    
    // Verify the index is gone
    const indexes = await db.collection('products').indexes();
    //CONSOLE.log('\nRemaining indexes:');
    indexes.forEach((index, i) => {
      //CONSOLE.log(`${i + 1}. ${JSON.stringify(index.key)}`);
    });
    
    //CONSOLE.log('\n✅ SKU index removal completed successfully!');
    
  } catch (error) {
    if (error.message.includes('index not found')) {
      //CONSOLE.log('✅ SKU index was already removed or never existed');
    } else {
      //CONSOLE.error('❌ Error dropping SKU index:', error.message);
    }
  } finally {
    mongoose.connection.close();
    //CONSOLE.log('Database connection closed.');
  }
}

// Run the script
dropSkuIndex(); 