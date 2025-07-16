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
    //CONSOLE.log('=== Creating Test Categories and Units ===\n');
    
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
      //CONSOLE.log('✅ Created test category:', testCategory._id);
    } else {
      //CONSOLE.log('✅ Test category already exists:', testCategory._id);
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
      //CONSOLE.log('✅ Created test unit:', testUnit._id);
    } else {
      //CONSOLE.log('✅ Test unit already exists:', testUnit._id);
    }
    
    //CONSOLE.log('\n=== Test Data Summary ===');
    //CONSOLE.log(`Category ID: ${testCategory._id}`);
    //CONSOLE.log(`Unit ID: ${testUnit._id}`);
    //CONSOLE.log(`Store ID: ${storeId}`);
    
    return {
      categoryId: testCategory._id,
      unitId: testUnit._id,
      storeId: storeId
    };
    
  } catch (error) {
    //CONSOLE.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    mongoose.connection.close();
    //CONSOLE.log('Database connection closed.');
  }
}

// Run the script
createTestData()
  .then((data) => {
    //CONSOLE.log('\n✅ Test data creation completed successfully!');
    //CONSOLE.log('You can now use these IDs in your product creation:');
    //CONSOLE.log(`Category: ${data.categoryId}`);
    //CONSOLE.log(`Unit: ${data.unitId}`);
    //CONSOLE.log(`Store: ${data.storeId}`);
  })
  .catch((error) => {
    //CONSOLE.error('❌ Failed to create test data:', error);
    process.exit(1);
  }); 