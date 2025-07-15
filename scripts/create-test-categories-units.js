const mongoose = require('mongoose');
const Category = require('../Models/Category');
const Unit = require('../Models/Unit');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storeId = '687505893fbf3098648bfe16';

async function createTestData() {
  try {
    console.log('=== Creating Test Categories and Units ===\n');
    
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
    // Create test category if it doesn't exist
    let testCategory = await Category.findOne({ 
      store: storeId, 
      nameEn: 'Test Category' 
    });
    
    if (!testCategory) {
      testCategory = new Category({
        nameAr: 'فئة تجريبية',
        nameEn: 'Test Category',
        slug: 'test-category',
        descriptionAr: 'فئة تجريبية للمنتجات',
        descriptionEn: 'Test category for products',
        store: storeId,
        level: 0,
        isActive: true
      });
      await testCategory.save();
      console.log('✅ Created test category:', testCategory._id);
    } else {
      console.log('✅ Test category already exists:', testCategory._id);
    }
    
    // Create test unit if it doesn't exist
    let testUnit = await Unit.findOne({ 
      nameEn: 'Piece' 
    });
    
    if (!testUnit) {
      testUnit = new Unit({
        nameAr: 'قطعة',
        nameEn: 'Piece',
        symbol: 'pc',
        isActive: true
      });
      await testUnit.save();
      console.log('✅ Created test unit:', testUnit._id);
    } else {
      console.log('✅ Test unit already exists:', testUnit._id);
    }
    
    console.log('\n=== Test Data Summary ===');
    console.log(`Category ID: ${testCategory._id}`);
    console.log(`Unit ID: ${testUnit._id}`);
    console.log(`Store ID: ${storeId}`);
    
    return {
      categoryId: testCategory._id,
      unitId: testUnit._id,
      storeId: storeId
    };
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the script
createTestData()
  .then((data) => {
    console.log('\n✅ Test data creation completed successfully!');
    console.log('You can now use these IDs in your product creation:');
    console.log(`Category: ${data.categoryId}`);
    console.log(`Unit: ${data.unitId}`);
    console.log(`Store: ${data.storeId}`);
  })
  .catch((error) => {
    console.error('❌ Failed to create test data:', error);
    process.exit(1);
  }); 