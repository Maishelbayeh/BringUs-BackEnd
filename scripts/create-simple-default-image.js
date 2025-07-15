const https = require('https');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const fs = require('fs');
const path = require('path');

async function downloadAndUploadDefaultImage() {
  try {
    // استخدام صورة افتراضية من placeholder.com
    const imageUrl = 'https://placehold.co/300x300/f3f4f6/6b7280/png?text=No+Image';
    
    console.log('📥 Downloading default image from:', imageUrl);
    
    // تحميل الصورة
    const imageBuffer = await new Promise((resolve, reject) => {
      https.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }
        
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
    
    console.log('✅ Image downloaded successfully');
    
    // رفع الصورة إلى Cloudflare
    const result = await uploadToCloudflare(imageBuffer, 'default-product.png', 'defaults');
    
    console.log('✅ Default image uploaded to Cloudflare successfully!');
    console.log('📸 Image URL:', result.url);
    console.log('🔑 Image Key:', result.key);
    
    // حفظ الصورة محلياً أيضاً
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const localPath = path.join(publicDir, 'default-product.png');
    fs.writeFileSync(localPath, imageBuffer);
    console.log('💾 Image saved locally at:', localPath);
    
    return result.url;
  } catch (error) {
    console.error('❌ Error downloading/uploading default image:', error);
    
    // إذا فشل التحميل، أنشئ صورة افتراضية بسيطة جداً
    console.log('🔄 Creating a simple fallback image...');
    
    // إنشاء صورة SVG بسيطة
    const svgContent = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="#f3f4f6"/>
        <rect x="10" y="10" width="280" height="280" fill="none" stroke="#d1d5db" stroke-width="2"/>
        <text x="150" y="140" font-family="Arial" font-size="24" fill="#6b7280" text-anchor="middle">📷</text>
        <text x="150" y="180" font-family="Arial" font-size="16" fill="#6b7280" text-anchor="middle">No Image</text>
        <text x="150" y="200" font-family="Arial" font-size="12" fill="#6b7280" text-anchor="middle">Available</text>
      </svg>
    `;
    
    const svgBuffer = Buffer.from(svgContent, 'utf8');
    
    // رفع SVG إلى Cloudflare
    const result = await uploadToCloudflare(svgBuffer, 'default-product.svg', 'defaults');
    
    console.log('✅ Fallback SVG image uploaded successfully!');
    console.log('📸 Image URL:', result.url);
    
    return result.url;
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  downloadAndUploadDefaultImage()
    .then((url) => {
      console.log('🎉 Default image creation completed!');
      console.log('🔗 Use this URL for default product images:', url);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create default image:', error);
      process.exit(1);
    });
}

module.exports = { downloadAndUploadDefaultImage }; 