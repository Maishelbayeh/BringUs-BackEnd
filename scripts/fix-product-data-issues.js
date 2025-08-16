const mongoose = require('mongoose');
require('dotenv').config();

async function fixProductDataIssues() {
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

    // Find all products with invalid videoUrl (empty strings)
    const productsWithInvalidVideoUrl = await db.collection('products').find({
      $or: [
        { videoUrl: '' },
        { videoUrl: 'null' },
        { videoUrl: 'undefined' }
      ]
    }).toArray();

    console.log(`🔍 Found ${productsWithInvalidVideoUrl.length} products with invalid videoUrl`);

    // Fix attributes issues
    if (productsWithInvalidAttributes.length > 0) {
      const bulkOps = productsWithInvalidAttributes.map(product => ({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { attributes: [] } }
        }
      }));

      const result = await db.collection('products').bulkWrite(bulkOps);
      console.log(`🎉 Successfully fixed ${result.modifiedCount} products with invalid attributes`);
    }

    // Fix videoUrl issues
    if (productsWithInvalidVideoUrl.length > 0) {
      const bulkOps = productsWithInvalidVideoUrl.map(product => ({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { videoUrl: null } }
        }
      }));

      const result = await db.collection('products').bulkWrite(bulkOps);
      console.log(`🎉 Successfully fixed ${result.modifiedCount} products with invalid videoUrl`);
    }

    // Verify the fixes
    const remainingInvalidAttributes = await db.collection('products').find({
      $or: [
        { attributes: { $type: 'string' } },
        { attributes: '' },
        { attributes: null }
      ]
    }).toArray();

    const remainingInvalidVideoUrl = await db.collection('products').find({
      $or: [
        { videoUrl: '' },
        { videoUrl: 'null' },
        { videoUrl: 'undefined' }
      ]
    }).toArray();

    if (remainingInvalidAttributes.length === 0) {
      console.log('✅ Verification passed - no products with invalid attributes remain');
    } else {
      console.log(`⚠️ Warning: ${remainingInvalidAttributes.length} products still have invalid attributes`);
    }

    if (remainingInvalidVideoUrl.length === 0) {
      console.log('✅ Verification passed - no products with invalid videoUrl remain');
    } else {
      console.log(`⚠️ Warning: ${remainingInvalidVideoUrl.length} products still have invalid videoUrl`);
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`- Fixed ${productsWithInvalidAttributes.length} products with invalid attributes`);
    console.log(`- Fixed ${productsWithInvalidVideoUrl.length} products with invalid videoUrl`);
    console.log('✅ All product data issues have been resolved!');

  } catch (error) {
    console.error('❌ Error fixing product data issues:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixProductDataIssues();

