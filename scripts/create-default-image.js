const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');

async function createAndUploadDefaultImage() {
  try {
    // إنشاء Canvas بسيط
    const canvas = createCanvas(300, 300);
    const ctx = canvas.getContext('2d');

    // تعيين خلفية رمادية فاتحة
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 300, 300);

    // إضافة إطار رمادي
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 280, 280);

    // إضافة أيقونة الكاميرا
    ctx.fillStyle = '#9ca3af';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷', 150, 120);

    // إضافة نص
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.fillText('No Image', 150, 200);
    ctx.font = '12px Arial';
    ctx.fillText('Available', 150, 220);

    // تحويل Canvas إلى buffer
    const buffer = canvas.toBuffer('image/png');

    // رفع الصورة إلى Cloudflare
    const result = await uploadToCloudflare(buffer, 'default-product.png', 'defaults');
    
    console.log('✅ Default image created and uploaded successfully!');
    console.log('📸 Image URL:', result.url);
    console.log('🔑 Image Key:', result.key);
    
    // حفظ الصورة محلياً أيضاً
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const localPath = path.join(publicDir, 'default-product.png');
    fs.writeFileSync(localPath, buffer);
    console.log('💾 Image saved locally at:', localPath);
    
    return result.url;
  } catch (error) {
    console.error('❌ Error creating default image:', error);
    throw error;
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  createAndUploadDefaultImage()
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

module.exports = { createAndUploadDefaultImage }; 