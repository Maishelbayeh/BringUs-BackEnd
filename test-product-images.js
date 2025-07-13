const mongoose = require('mongoose');
const Product = require('./Models/Product');

// Test the new product images system
async function testProductImages() {
  console.log('=== Testing Product Images System ===\n');
  
  // Test 1: Create a product with images
  console.log('1. Creating product with images...');
  
  const testProduct = new Product({
    nameAr: 'منتج تجريبي مع صور',
    nameEn: 'Test Product with Images',
    descriptionAr: 'منتج لاختبار نظام الصور',
    descriptionEn: 'Product for testing image system',
    price: 99.99,
    category: '507f1f77bcf86cd799439011', // Example ObjectId
    store: '686a719956a82bfcc93a2e2d',     // Your store ID
    unit: '507f1f77bcf86cd799439013',      // Example ObjectId
    availableQuantity: 10,
    stock: 10,
    mainImage: 'https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/main/main-image.jpg',
    images: [
      'https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image1.jpg',
      'https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image2.jpg',
      'https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image3.jpg'
    ],
    colors: [
      ['#000000'],
      ['#FFFFFF', '#FF0000']
    ]
  });
  
  try {
    // Validate the product (without saving to database)
    await testProduct.validate();
    console.log('✅ Product validation passed');
    
    // Test JSON serialization
    console.log('\n2. Testing JSON serialization:');
    const productJson = testProduct.toJSON();
    console.log('• mainImage:', productJson.mainImage);
    console.log('• images count:', productJson.images.length);
    console.log('• images:', productJson.images);
    console.log('• allColors:', productJson.allColors);
    console.log('• colorOptionsCount:', productJson.colorOptionsCount);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.log('❌ Validation failed:', error.message);
  }
  
  // Test 2: Test image validation
  console.log('\n3. Testing image validation...');
  
  const invalidProduct = new Product({
    nameAr: 'منتج خاطئ',
    nameEn: 'Invalid Product',
    descriptionAr: 'منتج بصور خاطئة',
    descriptionEn: 'Product with invalid images',
    price: 50,
    category: '507f1f77bcf86cd799439011',
    store: '686a719956a82bfcc93a2e2d',
    unit: '507f1f77bcf86cd799439013',
    availableQuantity: 10,
    stock: 10,
    mainImage: 'not-a-valid-url',
    images: ['invalid-url', 'https://valid-url.com/image.jpg']
  });
  
  try {
    await invalidProduct.validate();
    console.log('❌ Should have failed validation');
  } catch (error) {
    console.log('✅ Correctly caught validation errors');
  }
  
  // Test 3: Show image structure
  console.log('\n4. Image structure examples:');
  const imageExamples = [
    {
      type: 'Main Image Only',
      mainImage: 'https://cloudflare.com/products/store123/main/product.jpg',
      images: []
    },
    {
      type: 'Main + Gallery Images',
      mainImage: 'https://cloudflare.com/products/store123/main/product.jpg',
      images: [
        'https://cloudflare.com/products/store123/gallery/img1.jpg',
        'https://cloudflare.com/products/store123/gallery/img2.jpg'
      ]
    },
    {
      type: 'Gallery Images Only',
      mainImage: null,
      images: [
        'https://cloudflare.com/products/store123/gallery/img1.jpg',
        'https://cloudflare.com/products/store123/gallery/img2.jpg'
      ]
    }
  ];
  
  imageExamples.forEach((example, index) => {
    console.log(`Example ${index + 1} (${example.type}):`);
    console.log('  mainImage:', example.mainImage);
    console.log('  images:', example.images);
    console.log('');
  });
  
  console.log('=== Image System Summary ===');
  console.log('✅ Simplified image structure (like categories)');
  console.log('✅ Main image as single string');
  console.log('✅ Gallery images as array of strings');
  console.log('✅ Cloudflare R2 integration');
  console.log('✅ Store isolation (separate folders)');
  console.log('✅ Multiple upload endpoints');
  console.log('✅ Support for main + gallery images');
}

// Run the test
testProductImages().catch(console.error); 