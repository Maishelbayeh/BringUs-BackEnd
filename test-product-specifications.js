const mongoose = require('mongoose');
const Product = require('./Models/Product');
const ProductSpecification = require('./Models/ProductSpecification');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testProductSpecifications = async () => {
  try {
    console.log('🔍 Testing Product Specifications...\n');

    // Check if there are any product specifications
    const specs = await ProductSpecification.find({});
    console.log(`📊 Found ${specs.length} product specifications:`);
    specs.forEach(spec => {
      console.log(`  - ${spec.descriptionEn} (${spec.descriptionAr}) - ID: ${spec._id}`);
    });

    // Check if there are any products
    const products = await Product.find({});
    console.log(`\n📦 Found ${products.length} products:`);
    
    // Check each product's specifications
    for (const product of products) {
      console.log(`\n  Product: ${product.nameEn}`);
      console.log(`    Specifications field:`, product.specifications);
      
      if (product.specifications && product.specifications.length > 0) {
        console.log(`    Has ${product.specifications.length} specifications`);
      } else {
        console.log(`    No specifications assigned`);
      }
    }

    // Test population
    console.log('\n🔍 Testing population...');
    const populatedProducts = await Product.find({})
      .populate('specifications')
      .limit(2);
    
    populatedProducts.forEach(product => {
      console.log(`\n  Product: ${product.nameEn}`);
      console.log(`    Populated specifications:`, product.specifications);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

testProductSpecifications(); 