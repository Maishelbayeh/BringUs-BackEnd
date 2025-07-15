const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/';
const STORE_ID = '687505893fbf3098648bfe16';

// دالة لإنشاء صورة تجريبية بسيطة
function createTestImage() {
  const svgContent = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#ff6b6b"/>
      <text x="50" y="50" font-family="Arial" font-size="12" fill="white" text-anchor="middle">Test</text>
    </svg>
  `;
  
  const tempPath = path.join(__dirname, 'test-image.svg');
  fs.writeFileSync(tempPath, svgContent);
  return tempPath;
}

// اختبار رفع صورة واحدة
async function testSingleImageUpload() {
  try {
    console.log('🧪 Testing single image upload...');
    
    const imagePath = createTestImage();
    const formData = new FormData();
    
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('storeId', STORE_ID);
    formData.append('folder', 'test');
    
    const response = await axios.post(`${BASE_URL}stores/upload-image`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('✅ Single image upload successful:', response.data);
    
    // تنظيف الملف المؤقت
    fs.unlinkSync(imagePath);
    
    return response.data.data.url;
    
  } catch (error) {
    console.error('❌ Single image upload failed:', error.response?.data || error.message);
    throw error;
  }
}

// اختبار رفع صور متعددة
async function testMultipleImagesUpload() {
  try {
    console.log('🧪 Testing multiple images upload...');
    
    const formData = new FormData();
    
    // إنشاء 3 صور تجريبية
    for (let i = 1; i <= 3; i++) {
      const imagePath = createTestImage();
      formData.append('images', fs.createReadStream(imagePath));
      
      // تنظيف الملف بعد إضافته للـ FormData
      setTimeout(() => fs.unlinkSync(imagePath), 100);
    }
    
    formData.append('storeId', STORE_ID);
    formData.append('folder', 'test-multiple');
    
    const response = await axios.post(`${BASE_URL}stores/upload-multiple-images`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('✅ Multiple images upload successful:', response.data);
    
    return response.data.data.map(img => img.url);
    
  } catch (error) {
    console.error('❌ Multiple images upload failed:', error.response?.data || error.message);
    throw error;
  }
}

// اختبار رفع صورة بدون storeId (يجب أن يفشل)
async function testUploadWithoutStoreId() {
  try {
    console.log('🧪 Testing upload without storeId (should fail)...');
    
    const imagePath = createTestImage();
    const formData = new FormData();
    
    formData.append('image', fs.createReadStream(imagePath));
    // لا نضيف storeId
    
    const response = await axios.post(`${BASE_URL}stores/upload-image`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('❌ Upload without storeId should have failed but succeeded:', response.data);
    
    // تنظيف الملف المؤقت
    fs.unlinkSync(imagePath);
    
  } catch (error) {
    console.log('✅ Upload without storeId correctly failed:', error.response?.data?.error);
    
    // تنظيف الملف المؤقت إذا كان موجوداً
    try {
      fs.unlinkSync(path.join(__dirname, 'test-image.svg'));
    } catch (e) {
      // الملف غير موجود، لا مشكلة
    }
  }
}

// اختبار رفع ملف بدون صورة (يجب أن يفشل)
async function testUploadWithoutImage() {
  try {
    console.log('🧪 Testing upload without image (should fail)...');
    
    const formData = new FormData();
    formData.append('storeId', STORE_ID);
    formData.append('folder', 'test');
    
    const response = await axios.post(`${BASE_URL}stores/upload-image`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('❌ Upload without image should have failed but succeeded:', response.data);
    
  } catch (error) {
    console.log('✅ Upload without image correctly failed:', error.response?.data?.error);
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 Starting upload API tests...\n');
  
  try {
    // اختبار 1: رفع صورة واحدة
    const singleImageUrl = await testSingleImageUpload();
    console.log(`📸 Single image URL: ${singleImageUrl}\n`);
    
    // اختبار 2: رفع صور متعددة
    const multipleImageUrls = await testMultipleImagesUpload();
    console.log(`📸 Multiple images URLs:`, multipleImageUrls);
    console.log(`📊 Total uploaded: ${multipleImageUrls.length} images\n`);
    
    // اختبار 3: رفع بدون storeId
    await testUploadWithoutStoreId();
    console.log('');
    
    // اختبار 4: رفع بدون صورة
    await testUploadWithoutImage();
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

// تشغيل الاختبارات إذا تم تشغيل الملف مباشرة
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSingleImageUpload,
  testMultipleImagesUpload,
  testUploadWithoutStoreId,
  testUploadWithoutImage,
  runAllTests
}; 