const mongoose = require('mongoose');
const Product = require('./Models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testProductColors = async () => {
  try {
    console.log('🔍 Testing Product Colors...\n');

    // Check if there are any products with colors
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products:`);
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.nameEn} (${product.nameAr})`);
      console.log(`   ID: ${product._id}`);
      
      if (product.colors && product.colors.length > 0) {
        console.log(`   🎨 Colors (${product.colors.length} variants):`);
        product.colors.forEach((colorVariant, idx) => {
          console.log(`     Variant ${idx + 1}: [${colorVariant.join(', ')}]`);
        });
      } else {
        console.log(`   ❌ No colors`);
      }
    });

    // Test specific product
    const testProduct = await Product.findOne({}).populate('category productLabels unit');
    if (testProduct) {
      console.log(`\n🔍 Sample Product Details:`);
      console.log(`   Name: ${testProduct.nameEn} (${testProduct.nameAr})`);
      console.log(`   Category: ${testProduct.category?.nameEn || 'No category'}`);
      console.log(`   Colors: ${JSON.stringify(testProduct.colors)}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

testProductColors(); 