const mongoose = require('mongoose');
require('dotenv').config();

async function fixAllProductAttributes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the database connection
    const db = mongoose.connection.db;
    
    // Find all products with invalid attributes (string instead of array)
    const productsWithInvalidAttributes = await db.collection('products').find({
      $or: [
        { attributes: { $type: 'string' } },
        { attributes: '' },
        { attributes: null }
      ]
    }).toArray();

    console.log(`🔍 Found ${productsWithInvalidAttributes.length} products with invalid attributes`);

    if (productsWithInvalidAttributes.length === 0) {
      console.log('✅ No products with invalid attributes found');
      return;
    }

    // Fix all products at once using bulk operations
    const bulkOps = productsWithInvalidAttributes.map(product => ({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { attributes: [] } }
      }
    }));

    if (bulkOps.length > 0) {
      const result = await db.collection('products').bulkWrite(bulkOps);
      console.log(`🎉 Successfully fixed ${result.modifiedCount} products`);
    }

    // Verify the fix
    const remainingInvalidProducts = await db.collection('products').find({
      $or: [
        { attributes: { $type: 'string' } },
        { attributes: '' },
        { attributes: null }
      ]
    }).toArray();

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
fixAllProductAttributes();

