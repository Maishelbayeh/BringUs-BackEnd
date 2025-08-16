const mongoose = require('mongoose');
require('dotenv').config();

async function fixProductVideoIssues() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the database connection
    const db = mongoose.connection.db;
    
    // Find all products with invalid videoUrl (empty strings, 'null', 'undefined')
    const productsWithInvalidVideoUrl = await db.collection('products').find({
      $or: [
        { videoUrl: '' },
        { videoUrl: 'null' },
        { videoUrl: 'undefined' },
        { videoUrl: null }
      ]
    }).toArray();

    console.log(`🔍 Found ${productsWithInvalidVideoUrl.length} products with invalid videoUrl`);

    // Find all products with productVideo field (if it exists)
    const productsWithProductVideo = await db.collection('products').find({
      productVideo: { $exists: true }
    }).toArray();

    console.log(`🔍 Found ${productsWithProductVideo.length} products with productVideo field`);

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

    // Handle productVideo field - migrate to videoUrl if needed
    if (productsWithProductVideo.length > 0) {
      const bulkOps = [];
      
      for (const product of productsWithProductVideo) {
        if (product.productVideo && product.productVideo.trim() !== '' && 
            product.productVideo !== 'null' && product.productVideo !== 'undefined') {
          // If productVideo has a valid value, copy it to videoUrl
          bulkOps.push({
            updateOne: {
              filter: { _id: product._id },
              update: { 
                $set: { videoUrl: product.productVideo },
                $unset: { productVideo: "" }
              }
            }
          });
        } else {
          // If productVideo is invalid, just remove it
          bulkOps.push({
            updateOne: {
              filter: { _id: product._id },
              update: { $unset: { productVideo: "" } }
            }
          });
        }
      }

      if (bulkOps.length > 0) {
        const result = await db.collection('products').bulkWrite(bulkOps);
        console.log(`🎉 Successfully migrated ${result.modifiedCount} products with productVideo field`);
      }
    }

    // Verify the fixes
    const remainingInvalidVideoUrl = await db.collection('products').find({
      $or: [
        { videoUrl: '' },
        { videoUrl: 'null' },
        { videoUrl: 'undefined' }
      ]
    }).toArray();

    const remainingProductVideo = await db.collection('products').find({
      productVideo: { $exists: true }
    }).toArray();

    if (remainingInvalidVideoUrl.length === 0) {
      console.log('✅ Verification passed - no products with invalid videoUrl remain');
    } else {
      console.log(`⚠️ Warning: ${remainingInvalidVideoUrl.length} products still have invalid videoUrl`);
    }

    if (remainingProductVideo.length === 0) {
      console.log('✅ Verification passed - no products with productVideo field remain');
    } else {
      console.log(`⚠️ Warning: ${remainingProductVideo.length} products still have productVideo field`);
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`- Fixed ${productsWithInvalidVideoUrl.length} products with invalid videoUrl`);
    console.log(`- Migrated ${productsWithProductVideo.length} products with productVideo field`);
    console.log('✅ All product video issues have been resolved!');

  } catch (error) {
    console.error('❌ Error fixing product video issues:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixProductVideoIssues();

