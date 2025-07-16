const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const fs = require('fs');
const path = require('path');

async function testStoreSliderUpload() {
  try {
    //CONSOLE.log('🚀 بدء اختبار رفع صورة Store Slider...');
    
    // قراءة صورة تجريبية من مجلد public
    const imagePath = path.join(__dirname, '../public/placeholder-image.png');
    
    if (!fs.existsSync(imagePath)) {
      //CONSOLE.log('⚠️  لم يتم العثور على placeholder-image.png، جاري إنشاء صورة تجريبية...');
      
      // إنشاء صورة تجريبية بسيطة (1x1 pixel PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xCF, 0x00,
        0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      // حفظ الصورة التجريبية
      fs.writeFileSync(imagePath, testImageBuffer);
      //CONSOLE.log('✅ تم إنشاء صورة تجريبية');
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    const originalName = 'test-slider-image.png';
    const storeId = '507f1f77bcf86cd799439012'; // store ID تجريبي
    const folder = `store-sliders/${storeId}`;
    
    //CONSOLE.log(`📁 رفع الصورة إلى مجلد: ${folder}`);
    //CONSOLE.log(`📄 اسم الملف: ${originalName}`);
    //CONSOLE.log(`📏 حجم الملف: ${imageBuffer.length} bytes`);
    
    // رفع الصورة إلى Cloudflare R2
    const result = await uploadToCloudflare(imageBuffer, originalName, folder);
    
    //CONSOLE.log('✅ تم رفع الصورة بنجاح!');
    //CONSOLE.log('📊 النتائج:');
    //CONSOLE.log(`   🔑 Key: ${result.key}`);
    //CONSOLE.log(`   🌐 URL: ${result.url}`);
    //CONSOLE.log(`   📁 المجلد: ${folder}`);
    
    // اختبار الوصول للصورة
    //CONSOLE.log('\n🔍 اختبار الوصول للصورة...');
    const https = require('https');
    
    const testUrl = new Promise((resolve, reject) => {
      https.get(result.url, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      }).on('error', reject);
    });
    
    await testUrl;
    //CONSOLE.log('✅ الصورة متاحة للوصول العام!');
    
  } catch (error) {
    //CONSOLE.error('❌ خطأ في اختبار رفع الصورة:', error.message);
    //CONSOLE.error('🔍 تفاصيل الخطأ:', error);
  }
}

// تشغيل الاختبار
testStoreSliderUpload(); 