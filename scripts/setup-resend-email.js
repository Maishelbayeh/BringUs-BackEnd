const fs = require('fs');
const path = require('path');

function setupResendEmail() {
  console.log('📧 Resend Email Service Setup\n');

  console.log('🔧 Resend is a modern email API service that offers:');
  console.log('   ✅ 3000 free emails per month');
  console.log('   ✅ 99.9% delivery rate');
  console.log('   ✅ Easy setup');
  console.log('   ✅ Great developer experience\n');

  console.log('📋 Setup Steps:');
  console.log('1. Go to https://resend.com');
  console.log('2. Sign up for a free account');
  console.log('3. Verify your domain or use their sandbox domain');
  console.log('4. Get your API key from the dashboard');
  console.log('5. Add the configuration to your .env file\n');

  const resendConfig = `
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=maishelbayeh@icloud.com
RESEND_FROM_NAME=BringUs Store

# Optional: Custom domain (if you have one)
# RESEND_DOMAIN=yourdomain.com
`;

  console.log('📝 Add this configuration to your .env file:\n');
  console.log(resendConfig);

  console.log('🔐 Important Notes:');
  console.log('- Replace "re_your_api_key_here" with your actual Resend API key');
  console.log('- The from email (maishelbayeh@icloud.com) must be verified in Resend');
  console.log('- For testing, you can use Resend\'s sandbox domain');
  console.log('- Free tier includes 3000 emails per month');

  console.log('\n📧 Domain Verification:');
  console.log('1. In Resend dashboard, go to Domains');
  console.log('2. Add your domain or use sandbox domain');
  console.log('3. Follow the DNS setup instructions');
  console.log('4. Wait for verification (usually takes a few minutes)');

  console.log('\n🧪 Testing:');
  console.log('After setup, the system will automatically use Resend for sending emails');
  console.log('Check the server logs for email sending status');

  // Check if .env file exists
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log('\n✅ .env file found');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasResendConfig = envContent.includes('RESEND_');
    
    if (hasResendConfig) {
      console.log('✅ Resend configuration found in .env file');
    } else {
      console.log('⚠️  No Resend configuration found in .env file');
      console.log('💡 Add the configuration above to your .env file');
    }
  } else {
    console.log('\n⚠️  .env file not found');
    console.log('💡 Create a .env file in the root directory and add the configuration above');
  }

  console.log('\n🎉 Resend setup guide completed!');
  console.log('\n📞 Next steps:');
  console.log('1. Sign up at https://resend.com');
  console.log('2. Get your API key');
  console.log('3. Add the configuration to .env file');
  console.log('4. Restart your server');
  console.log('5. Test email sending');
}

// Run the setup
setupResendEmail();
