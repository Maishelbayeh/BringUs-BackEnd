const mongoose = require('mongoose');
const Product = require('./Models/Product');
const ProductLabel = require('./Models/ProductLabel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testProductLabels = async () => {
  try {
    console.log('🔍 Testing Product Labels...\n');

    // Check if there are any product labels
    const labels = await ProductLabel.find({});
    console.log(`📊 Found ${labels.length} product labels:`);
    labels.forEach(label => {
      console.log(`  - ${label.nameEn} (${label.nameAr}) - ID: ${label._id}`);
    });

    // Check if there are any products
    const products = await Product.find({});
    console.log(`\n📦 Found ${products.length} products:`);
    
    // Check each product's labels
    for (const product of products) {
      console.log(`\n  Product: ${product.nameEn}`);
      console.log(`    ProductLabels field:`, product.productLabels);
      
      if (product.productLabels && product.productLabels.length > 0) {
        console.log(`    Has ${product.productLabels.length} labels`);
      } else {
        console.log(`    No labels assigned`);
      }
    }

    // Test population
    console.log('\n🔍 Testing population...');
    const populatedProducts = await Product.find({})
      .populate('productLabels')
      .limit(2);
    
    populatedProducts.forEach(product => {
      console.log(`\n  Product: ${product.nameEn}`);
      console.log(`    Populated labels:`, product.productLabels);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

testProductLabels(); 