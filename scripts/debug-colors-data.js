const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Debug colors data
async function debugColorsData() {
  try {
    await connectDB();
    
    const Product = require('../Models/Product');
    
    console.log('🔍 Debugging Colors Data\n');
    
    // Get total products count
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total Products in Database: ${totalProducts}`);
    
    if (totalProducts === 0) {
      console.log('❌ No products found in database');
      return;
    }
    
    // Get sample products with colors
    const productsWithColors = await Product.find({ 
      colors: { $exists: true, $ne: null, $ne: '' } 
    }).limit(5);
    
    console.log(`\n🎨 Products with Colors: ${productsWithColors.length}`);
    
    if (productsWithColors.length > 0) {
      console.log('\n📦 Sample Products with Colors:');
      productsWithColors.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.nameEn || product.nameAr}`);
        console.log(`      Colors (raw): ${product.colors}`);
        console.log(`      Colors (type): ${typeof product.colors}`);
        
        try {
          const parsedColors = JSON.parse(product.colors);
          console.log(`      Colors (parsed): ${JSON.stringify(parsedColors)}`);
          console.log(`      Colors (parsed type): ${Array.isArray(parsedColors) ? 'Array' : typeof parsedColors}`);
        } catch (error) {
          console.log(`      Colors (parse error): ${error.message}`);
        }
        console.log('');
      });
    }
    
    // Check for products with specific color
    const productsWithSpecificColor = await Product.find({ 
      colors: { $regex: '#6B7280', $options: 'i' } 
    }).limit(3);
    
    console.log(`\n🔍 Products with #6B7280 color: ${productsWithSpecificColor.length}`);
    
    if (productsWithSpecificColor.length > 0) {
      console.log('   Found products:');
      productsWithSpecificColor.forEach((product, index) => {
        console.log(`     ${index + 1}. ${product.nameEn || product.nameAr}`);
        console.log(`        Colors: ${product.colors}`);
      });
    }
    
    // Check for products with different color formats
    const colorFormats = [
      { pattern: /#6B7280/i, name: 'Hex #6B7280' },
      { pattern: /rgb\(107,\s*114,\s*128\)/i, name: 'RGB format' },
      { pattern: /rgba\(107,\s*114,\s*128,\s*[\d.]+\s*\)/i, name: 'RGBA format' }
    ];
    
    console.log('\n🎨 Color Format Analysis:');
    for (const format of colorFormats) {
      const count = await Product.countDocuments({ 
        colors: { $regex: format.pattern } 
      });
      console.log(`   ${format.name}: ${count} products`);
    }
    
    // Check for products with empty or null colors
    const productsWithEmptyColors = await Product.countDocuments({
      $or: [
        { colors: null },
        { colors: '' },
        { colors: '[]' },
        { colors: { $exists: false } }
      ]
    });
    
    console.log(`\n📭 Products with empty/null colors: ${productsWithEmptyColors}`);
    
    // Check for products with invalid JSON colors
    const productsWithInvalidColors = await Product.find({ 
      colors: { $exists: true, $ne: null, $ne: '' } 
    }).limit(10);
    
    let invalidCount = 0;
    productsWithInvalidColors.forEach(product => {
      try {
        JSON.parse(product.colors);
      } catch {
        invalidCount++;
        console.log(`   Invalid JSON: ${product.nameEn || product.nameAr} - ${product.colors}`);
      }
    });
    
    console.log(`\n❌ Products with invalid JSON colors: ${invalidCount}`);
    
    console.log('\n✅ Colors Data Debug Complete!');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugColorsData();
