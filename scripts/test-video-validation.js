const mongoose = require('mongoose');
require('dotenv').config();

async function testVideoValidation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Import the Product model
    const Product = require('../Models/Product');

    console.log('\n🧪 Testing video validation with different values...\n');

    // Test cases
    const testCases = [
      { value: null, description: 'null value' },
      { value: undefined, description: 'undefined value' },
      { value: '', description: 'empty string' },
      { value: 'null', description: 'string "null"' },
      { value: 'undefined', description: 'string "undefined"' },
      { value: '   ', description: 'whitespace only' },
      { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'valid YouTube URL' },
      { value: 'https://www.facebook.com/videos/123456789', description: 'valid Facebook URL' },
      { value: 'invalid-url', description: 'invalid URL' }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.description}`);
        console.log(`Value: ${JSON.stringify(testCase.value)}`);
        
        // Create a test product with the video URL
        const testProduct = new Product({
          nameAr: 'اختبار',
          nameEn: 'Test',
          descriptionAr: 'اختبار',
          descriptionEn: 'Test',
          price: 100,
          category: new mongoose.Types.ObjectId(),
          categories: [new mongoose.Types.ObjectId()],
          store: new mongoose.Types.ObjectId(),
          unit: new mongoose.Types.ObjectId(),
          videoUrl: testCase.value
        });

        // Try to validate
        await testProduct.validate();
        console.log('✅ Validation PASSED');
        
      } catch (error) {
        console.log('❌ Validation FAILED:', error.message);
      }
      
      console.log('---');
    }

    console.log('\n🎉 Video validation test completed!');

  } catch (error) {
    console.error('❌ Error testing video validation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testVideoValidation();

