const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { uploadToCloudflare } = require('./utils/cloudflareUploader');

/**
 * Script to download a user icon and upload it as default avatar
 */
async function createUserIcon() {
  try {
    console.log('🔍 Fetching user icon...');
    
    // Using a free user icon from UI Avatars (creates a simple user silhouette)
    // Alternative free icon sources:
    // - https://api.dicebear.com/7.x/avataaars/png?seed=default (cartoon avatar)
    // - https://ui-avatars.com/api/?name=User&size=500&background=6366f1&color=fff (initials)
    // - https://api.dicebear.com/7.x/initials/png?seed=User (initials style)
    
    // Using a simple user icon (person silhouette)
    const iconUrl = 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=default&backgroundColor=6366f1&size=500';
    
    console.log(`📥 Downloading from: ${iconUrl}`);
    
    const response = await axios({
      method: 'GET',
      url: iconUrl,
      responseType: 'arraybuffer'
    });
    
    const imageBuffer = Buffer.from(response.data);
    console.log(`✅ Icon downloaded successfully`);
    console.log(`   File size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    // Save temporarily to verify
    const tempPath = path.join(__dirname, 'config', 'temp-user-icon.png');
    fs.writeFileSync(tempPath, imageBuffer);
    console.log(`💾 Saved temporary copy to: ${tempPath}`);
    
    // Upload to Cloudflare R2
    console.log('🔄 Uploading to Cloudflare R2...');
    const result = await uploadToCloudflare(
      imageBuffer,
      'user-icon.png',
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
    console.log('\n🎉 User icon upload complete!');
    console.log('\n📋 Configuration:');
    console.log(JSON.stringify(defaultImages.defaultProfileImage, null, 2));
    console.log(`\n🔗 Preview the icon: ${result.url}`);
    console.log(`\n📝 Note: Temporary file saved at: ${tempPath}`);
    console.log('   You can delete it or keep it for reference.');
    
  } catch (error) {
    console.error('❌ Error creating user icon:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the script
createUserIcon();

