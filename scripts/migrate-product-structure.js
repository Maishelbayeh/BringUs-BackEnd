const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Product = require('../Models/Product');

async function migrateProductStructure() {
  try {
    console.log('🔍 Starting product structure migration...');
    
    // Get all products
    const products = await Product.find({});
    console.log(`🔍 Found ${products.length} products to migrate`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      const updates = {};
      let needsUpdate = false;
      
      // 1. تحديث categories إذا لم تكن موجودة
      if (!product.categories || product.categories.length === 0) {
        if (product.category) {
          updates.categories = [product.category];
          needsUpdate = true;
          console.log(`🔍 Adding categories for product ${product._id}: [${product.category}]`);
        }
      }
      
      // 2. تحديث specificationValues لإضافة quantity و price
      if (product.specificationValues && Array.isArray(product.specificationValues)) {
        const updatedSpecValues = product.specificationValues.map(spec => {
          if (!spec.quantity || spec.quantity === undefined) {
            spec.quantity = product.availableQuantity || 0; // استخدام الكمية المتاحة كـ default
          }
          if (!spec.price || spec.price === undefined) {
            spec.price = 0; // سعر افتراضي 0
          }
          return spec;
        });
        
        if (JSON.stringify(updatedSpecValues) !== JSON.stringify(product.specificationValues)) {
          updates.specificationValues = updatedSpecValues;
          needsUpdate = true;
          console.log(`🔍 Updated specification values for product ${product._id}`);
        }
      }
      
      // 3. تحديث colors لتصبح JSON string
      if (product.colors && Array.isArray(product.colors)) {
        updates.colors = JSON.stringify(product.colors);
        needsUpdate = true;
        console.log(`🔍 Converting colors to JSON for product ${product._id}`);
      }
      
      // 4. تحديث availableQuantity إذا لم تكن موجودة
      if (!product.availableQuantity && product.availableQuantity !== 0) {
        updates.availableQuantity = product.stock || 0;
        needsUpdate = true;
        console.log(`🔍 Setting availableQuantity for product ${product._id}: ${product.stock || 0}`);
      }
      
      // تحديث المنتج إذا كان هناك تغييرات
      if (needsUpdate) {
        await Product.findByIdAndUpdate(product._id, updates, { new: true });
        updatedCount++;
        console.log(`✅ Updated product ${product._id}`);
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} products out of ${products.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
migrateProductStructure(); 