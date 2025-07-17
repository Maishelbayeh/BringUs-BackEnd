const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Test image upload for social comments
async function testImageUpload() {
  try {
    console.log('🚀 Testing image upload for social comments...');
    
    // Create form data
    const form = new FormData();
    
    // Add a test image (you can replace this with any image path)
    const imagePath = path.join(__dirname, '../public/placeholder-image.png');
    
    if (!fs.existsSync(imagePath)) {
      console.log('⚠️  Test image not found, creating a dummy image...');
      // Create a simple test image if it doesn't exist
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      fs.writeFileSync(imagePath, testImageBuffer);
    }
    
    form.append('image', fs.createReadStream(imagePath));
    
    // Make the request
    const response = await axios.post('http://localhost:5000/api/social-comments/upload-image', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer your-test-token-here' // Replace with actual token
      }
    });
    
    console.log('✅ Image upload successful!');
    console.log('📋 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Image upload failed:', error.response?.data || error.message);
  }
}

// Run the test
testImageUpload(); 