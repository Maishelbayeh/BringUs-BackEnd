const mongoose = require('mongoose');
const Product = require('../Models/Product');
require('dotenv').config();

async function fixProductAttributes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find products with invalid attributes (string instead of array)
    const productsWithInvalidAttributes = await Product.find({
      $or: [
        { attributes: { $type: 'string' } },
        { attributes: '' },
        { attributes: null }
      ]
    });

    console.log(`🔍 Found ${productsWithInvalidAttributes.length} products with invalid attributes`);

    if (productsWithInvalidAttributes.length === 0) {
      console.log('✅ No products with invalid attributes found');
      return;
    }

    // Fix each product
    let fixedCount = 0;
    for (const product of productsWithInvalidAttributes) {
      console.log(`🔧 Fixing product: ${product.nameEn} (${product._id})`);
      console.log(`   Current attributes:`, product.attributes);
      
      // Reset attributes to empty array
      product.attributes = [];
      
      // Save the product
      await product.save();
      fixedCount++;
      
      console.log(`   ✅ Fixed - attributes now:`, product.attributes);
    }

    console.log(`\n🎉 Successfully fixed ${fixedCount} products`);
    
    // Verify the fix
    const remainingInvalidProducts = await Product.find({
      $or: [
        { attributes: { $type: 'string' } },
        { attributes: '' },
        { attributes: null }
      ]
    });

    if (remainingInvalidProducts.length === 0) {
      console.log('✅ Verification passed - no products with invalid attributes remain');
    } else {
      console.log(`⚠️ Warning: ${remainingInvalidProducts.length} products still have invalid attributes`);
    }

  } catch (error) {
    console.error('❌ Error fixing product attributes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixProductAttributes();
