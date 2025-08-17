const fs = require('fs');
const path = require('path');

function addResendConfig() {
  console.log('🔧 Adding Resend Configuration to .env file\n');

  const envPath = path.join(__dirname, '..', '.env');
  const resendConfig = `
# Resend Email Configuration
RESEND_API_KEY=re_Xq863joq_7xQ9AmRmUuqVpB2HTqamyx22
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=BringUs Store
`;

  try {
    let envContent = '';
    
    // Check if .env file exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ .env file found');
      
      // Check if Resend config already exists
      if (envContent.includes('RESEND_API_KEY')) {
        console.log('⚠️  Resend configuration already exists in .env file');
        console.log('💡 Updating existing configuration...');
        
        // Remove existing Resend config
        const lines = envContent.split('\n');
        const filteredLines = lines.filter(line => 
          !line.startsWith('RESEND_') && 
          !line.startsWith('# Resend') &&
          line.trim() !== ''
        );
        envContent = filteredLines.join('\n');
      }
    } else {
      console.log('📝 Creating new .env file');
    }

    // Add Resend config to the end
    const newEnvContent = envContent + resendConfig;
    
    // Write to .env file
    fs.writeFileSync(envPath, newEnvContent);
    
    console.log('✅ Resend configuration added successfully!');
    console.log('\n📧 Configuration added:');
    console.log('   - RESEND_API_KEY=re_Xq863joq_7xQ9AmRmUuqVpB2HTqamyx22');
    console.log('   - RESEND_FROM_EMAIL=onboarding@resend.dev');
    console.log('   - RESEND_FROM_NAME=BringUs Store');
    
    console.log('\n🎉 Next steps:');
    console.log('1. Restart your server to load the new environment variables');
    console.log('2. Test email sending by registering a new user');
    console.log('3. Check server logs for email sending status');
    
    console.log('\n📧 Email will be sent from: onboarding@resend.dev');
    console.log('📧 To: user email address');
    console.log('📧 Subject: Email Verification - [Store Name]');
    
  } catch (error) {
    console.error('❌ Error adding Resend configuration:', error.message);
  }
}

// Run the script
addResendConfig();
