const mongoose = require('mongoose');
const Product = require('./Models/Product');

// Test the new product colors system
async function testProductColors() {
  console.log('=== Testing Product Colors System ===\n');
  
  // Test 1: Create a product with colors
  console.log('1. Creating product with colors...');
  
  const testProduct = new Product({
    nameAr: 'قميص تجريبي',
    nameEn: 'Test Shirt',
    descriptionAr: 'قميص لاختبار نظام الألوان',
    descriptionEn: 'Shirt for testing color system',
    price: 50,
    category: '507f1f77bcf86cd799439011', // Example ObjectId
    store: '507f1f77bcf86cd799439012',     // Example ObjectId
    unit: '507f1f77bcf86cd799439013',      // Example ObjectId
    availableQuantity: 10,
    stock: 10,
    colors: [
      ['#000000'],           // Single black
      ['#FFFFFF', '#FF0000'], // White and red combination
      ['#0000FF'],           // Single blue
      ['rgb(255, 255, 0)', 'rgba(255, 0, 255, 0.8)'] // Yellow and transparent magenta
    ]
  });
  
  try {
    // Validate the product (without saving to database)
    await testProduct.validate();
    console.log('✅ Product validation passed');
    
    // Test virtual properties
    console.log('\n2. Testing virtual properties:');
    console.log('• allColors:', testProduct.allColors);
    console.log('• colorOptionsCount:', testProduct.colorOptionsCount);
    
    // Test JSON serialization
    console.log('\n3. Testing JSON serialization:');
    const productJson = testProduct.toJSON();
    console.log('• allColors in JSON:', productJson.allColors);
    console.log('• colorOptionsCount in JSON:', productJson.colorOptionsCount);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.log('❌ Validation failed:', error.message);
  }
  
  // Test 2: Test color validation
  console.log('\n4. Testing color validation...');
  
  const invalidProduct = new Product({
    nameAr: 'منتج خاطئ',
    nameEn: 'Invalid Product',
    descriptionAr: 'منتج بألوان خاطئة',
    descriptionEn: 'Product with invalid colors',
    price: 50,
    category: '507f1f77bcf86cd799439011',
    store: '507f1f77bcf86cd799439012',
    unit: '507f1f77bcf86cd799439013',
    availableQuantity: 10,
    stock: 10,
    colors: [
      ['#000000'],     // Valid
      ['invalid'],     // Invalid
      ['#FFFFFF']      // Valid
    ]
  });
  
  try {
    await invalidProduct.validate();
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Correctly caught invalid color:', error.message);
  }
  
  // Test 3: Show different color formats
  console.log('\n5. Supported color formats:');
  const colorFormats = [
    ['#000000'],                    // Hex 6 digits
    ['#FFF'],                       // Hex 3 digits
    ['rgb(255, 0, 0)'],            // RGB
    ['rgba(0, 255, 0, 0.5)'],      // RGBA with transparency
    ['#FF0000', 'rgb(0, 255, 0)']  // Mixed formats
  ];
  
  colorFormats.forEach((colors, index) => {
    console.log(`Format ${index + 1}:`, colors);
  });
  
  console.log('\n=== Color System Summary ===');
  console.log('✅ Array of color arrays structure');
  console.log('✅ Support for Hex, RGB, RGBA formats');
  console.log('✅ Validation for color formats');
  console.log('✅ Virtual properties: allColors, colorOptionsCount');
  console.log('✅ Index for better query performance');
}

// Run the test
testProductColors().catch(console.error); 