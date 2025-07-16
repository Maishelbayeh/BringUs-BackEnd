const mongoose = require('mongoose');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const Unit = require('../Models/Unit');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storeId = '687505893fbf3098648bfe16';

const createProductsWithColors = async () => {
  try {
    //CONSOLE.log('🚀 Creating products with colors...\n');

    // Get or create test category
    let testCategory = await Category.findOne({ 
      store: storeId, 
      nameEn: 'Test Category' 
    });
    
    if (!testCategory) {
      testCategory = new Category({
        nameAr: 'فئة تجريبية',
        nameEn: 'Test Category',
        store: storeId,
        isActive: true
      });
      await testCategory.save();
      //CONSOLE.log('✅ Created test category');
    }

    // Get or create test unit
    let testUnit = await Unit.findOne({ 
      store: storeId, 
      nameEn: 'Piece' 
    });
    
    if (!testUnit) {
      testUnit = new Unit({
        nameAr: 'قطعة',
        nameEn: 'Piece',
        symbol: 'pc',
        store: storeId,
        isActive: true
      });
      await testUnit.save();
      //CONSOLE.log('✅ Created test unit');
    }

    // Clear existing test products
    await Product.deleteMany({ 
      store: storeId, 
      nameEn: { $regex: /^Test Product/ } 
    });
    //CONSOLE.log('✅ Cleared existing test products');

    // Create products with different color combinations
    const productsWithColors = [
      {
        nameAr: 'قميص تجريبي 1',
        nameEn: 'Test Product 1',
        descriptionAr: 'قميص بألوان متعددة',
        descriptionEn: 'Shirt with multiple colors',
        price: 50,
        category: testCategory._id,
        unit: testUnit._id,
        store: storeId,
        availableQuantity: 10,
        stock: 10,
        visibility: 'Y',
        maintainStock: 'Y',
        colors: [
          ['#FF0000'],                    // Single red
          ['#00FF00', '#0000FF'],         // Green and blue
          ['#FFFF00', '#FF00FF', '#00FFFF'] // Yellow, magenta, cyan
        ]
      },
      {
        nameAr: 'قميص تجريبي 2',
        nameEn: 'Test Product 2',
        descriptionAr: 'قميص بألوان بسيطة',
        descriptionEn: 'Shirt with simple colors',
        price: 30,
        category: testCategory._id,
        unit: testUnit._id,
        store: storeId,
        availableQuantity: 5,
        stock: 5,
        visibility: 'Y',
        maintainStock: 'Y',
        colors: [
          ['#000000'],                    // Black
          ['#FFFFFF'],                    // White
          ['rgb(128, 128, 128)']         // Gray using RGB
        ]
      },
      {
        nameAr: 'قميص تجريبي 3',
        nameEn: 'Test Product 3',
        descriptionAr: 'قميص بألوان متدرجة',
        descriptionEn: 'Shirt with gradient colors',
        price: 75,
        category: testCategory._id,
        unit: testUnit._id,
        store: storeId,
        availableQuantity: 15,
        stock: 15,
        visibility: 'Y',
        maintainStock: 'Y',
        colors: [
          ['#FF6B6B', '#4ECDC4'],         // Red to teal
          ['#45B7D1', '#96CEB4', '#FFEAA7'], // Blue to green to yellow
          ['rgba(255, 0, 0, 0.8)', 'rgba(0, 255, 0, 0.8)'] // Transparent red and green
        ]
      }
    ];

    // Create products
    for (const productData of productsWithColors) {
      const product = new Product(productData);
      await product.save();
      //CONSOLE.log(`✅ Created product: ${product.nameEn}`);
      //CONSOLE.log(`   Colors: ${product.colors.length} variants`);
      product.colors.forEach((variant, idx) => {
        //CONSOLE.log(`     Variant ${idx + 1}: [${variant.join(', ')}]`);
      });
    }

    //CONSOLE.log('\n🎉 Successfully created products with colors!');
    //CONSOLE.log(`📊 Total products created: ${productsWithColors.length}`);

  } catch (error) {
    //CONSOLE.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

createProductsWithColors(); 