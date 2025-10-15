const fs = require('fs');
const path = require('path');
const { uploadToCloudflare } = require('./utils/cloudflareUploader');

/**
 * Script to upload default avatar image to Cloudflare R2
 */
async function uploadDefaultAvatar() {
  try {
    console.log('📤 Starting default avatar upload...');
    
    // Path to the image file to use as default avatar
    const imagePath = path.join(__dirname, 'config', 'category.jpg');
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Image file not found at:', imagePath);
      console.log('Please add a default-avatar.png or default-avatar.jpg file to the config folder');
      process.exit(1);
    }

    // Read the image file as a buffer
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`✅ Image file loaded: ${imagePath}`);
    console.log(`   File size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // Upload to Cloudflare R2 in the default-images folder
    console.log('🔄 Uploading to Cloudflare R2...');
    const result = await uploadToCloudflare(
      imageBuffer,
      'default-avatar.png', // Using .png extension for better compatibility
      'default-images'
    );

    console.log('✅ Upload successful!');
    console.log('   URL:', result.url);
    console.log('   Key:', result.key);
    
    // Update the default-images.json file
    const defaultImagesPath = path.join(__dirname, 'config', 'default-images.json');
    const defaultImages = require(defaultImagesPath);
    
    defaultImages.defaultProfileImage = {
      url: result.url,
      key: result.key,
      uploadedAt: new Date().toISOString(),
      size: imageBuffer.length
    };
    
    // Write updated config
    fs.writeFileSync(
      defaultImagesPath,
      JSON.stringify(defaultImages, null, 2),
      'utf8'
    );
    
    console.log('✅ Updated config/default-images.json');
    console.log('\n🎉 Default avatar upload complete!');
    console.log('\n📋 Configuration:');
    console.log(JSON.stringify(defaultImages.defaultProfileImage, null, 2));
    
  } catch (error) {
    console.error('❌ Error uploading default avatar:', error);
    process.exit(1);
  }
}

// Run the upload
uploadDefaultAvatar();

