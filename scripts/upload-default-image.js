const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const fs = require('fs');
const path = require('path');

async function uploadDefaultImage() {
  try {
    // مسار الصورة الافتراضية في مجلد public
    const defaultImagePath = path.join(__dirname, '../public/default-product.png');
    
    // إذا لم تكن الصورة موجودة، أنشئ صورة افتراضية بسيطة
    if (!fs.existsSync(defaultImagePath)) {
      //CONSOLE.log('Default image not found, creating a simple placeholder...');
      
      // إنشاء صورة افتراضية بسيطة باستخدام Canvas أو استخدام صورة من الإنترنت
      const defaultImageUrl = 'https://via.placeholder.com/300x300/e5e7eb/6b7280?text=No+Image';
      
      // تحميل الصورة من الإنترنت
      const https = require('https');
      const imageBuffer = await new Promise((resolve, reject) => {
        https.get(defaultImageUrl, (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        });
      });
      
      // رفع الصورة إلى Cloudflare
      const result = await uploadToCloudflare(imageBuffer, 'default-product.png', 'defaults');
      
      //CONSOLE.log('✅ Default image uploaded successfully!');
      //CONSOLE.log('📸 Image URL:', result.url);
      //CONSOLE.log('🔑 Image Key:', result.key);
      
      return result.url;
    } else {
      // قراءة الصورة الموجودة
      const imageBuffer = fs.readFileSync(defaultImagePath);
      
      // رفع الصورة إلى Cloudflare
      const result = await uploadToCloudflare(imageBuffer, 'default-product.png', 'defaults');
      
      //CONSOLE.log('✅ Default image uploaded successfully!');
      //CONSOLE.log('📸 Image URL:', result.url);
      //CONSOLE.log('🔑 Image Key:', result.key);
      
      return result.url;
    }
  } catch (error) {
    //CONSOLE.error('❌ Error uploading default image:', error);
    throw error;
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  uploadDefaultImage()
    .then((url) => {
      //CONSOLE.log('🎉 Default image upload completed!');
      //CONSOLE.log('🔗 Use this URL for default product images:', url);
      process.exit(0);
    })
    .catch((error) => {
      //CONSOLE.error('💥 Failed to upload default image:', error);
      process.exit(1);
    });
}

module.exports = { uploadDefaultImage }; 