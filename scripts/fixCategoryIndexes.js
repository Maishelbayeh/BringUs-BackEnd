const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    //CONSOLE.log('✅ Connected to MongoDB');
  } catch (error) {
    //CONSOLE.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function fixCategoryIndexes() {
  try {
    await connectDB();
    
    //CONSOLE.log('🔧 Fixing category indexes...\n');
    
    // Get the categories collection
    const db = mongoose.connection.db;
    const categoriesCollection = db.collection('categories');
    
    // List all current indexes
    //CONSOLE.log('📋 Current indexes:');
    const indexes = await categoriesCollection.indexes();
    indexes.forEach((index, i) => {
      //CONSOLE.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });
    
    // Drop problematic indexes
    const indexesToDrop = [];
    
    // Check for old 'name' index
    const nameIndex = indexes.find(index => 
      Object.keys(index.key).length === 1 && 
      Object.keys(index.key)[0] === 'name'
    );
    
    if (nameIndex) {
      indexesToDrop.push(nameIndex.name);
      //CONSOLE.log(`\n🗑️  Found old 'name' index: ${nameIndex.name}`);
    }
    
    // Check for old 'slug' index (should be compound with store)
    const oldSlugIndex = indexes.find(index => 
      Object.keys(index.key).length === 1 && 
      Object.keys(index.key)[0] === 'slug'
    );
    
    if (oldSlugIndex) {
      indexesToDrop.push(oldSlugIndex.name);
      //CONSOLE.log(`\n🗑️  Found old 'slug' index: ${oldSlugIndex.name}`);
    }
    
    // Drop problematic indexes
    for (const indexName of indexesToDrop) {
      try {
        await categoriesCollection.dropIndex(indexName);
        //CONSOLE.log(`✅ Dropped index: ${indexName}`);
      } catch (error) {
        //CONSOLE.log(`⚠️  Could not drop index ${indexName}: ${error.message}`);
      }
    }
    
    // Recreate the correct indexes
    //CONSOLE.log('\n🔨 Recreating correct indexes...');
    
    // Compound index for slug and store
    try {
      await categoriesCollection.createIndex(
        { slug: 1, store: 1 }, 
        { unique: true, name: 'slug_store_unique' }
      );
      //CONSOLE.log('✅ Created compound index: { slug: 1, store: 1 }');
    } catch (error) {
      if (error.code === 85) {
        //CONSOLE.log('✅ Compound index { slug: 1, store: 1 } already exists');
      } else {
        throw error;
      }
    }
    
    // Text index for search
    await categoriesCollection.createIndex(
      { nameAr: 'text', nameEn: 'text', descriptionAr: 'text', descriptionEn: 'text' },
      { name: 'text_search' }
    );
    //CONSOLE.log('✅ Created text index for search');
    
    // Store index
    await categoriesCollection.createIndex(
      { store: 1 },
      { name: 'store_index' }
    );
    //CONSOLE.log('✅ Created store index');
    
    // Store and parent index
    await categoriesCollection.createIndex(
      { store: 1, parent: 1 },
      { name: 'store_parent_index' }
    );
    //CONSOLE.log('✅ Created store_parent index');
    
    // List final indexes
    //CONSOLE.log('\n📋 Final indexes:');
    const finalIndexes = await categoriesCollection.indexes();
    finalIndexes.forEach((index, i) => {
      //CONSOLE.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });
    
    //CONSOLE.log('\n🎉 Index fixing completed successfully!');
    
  } catch (error) {
    //CONSOLE.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    //CONSOLE.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  fixCategoryIndexes();
}

module.exports = { fixCategoryIndexes }; 