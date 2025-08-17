const fs = require('fs');
const path = require('path');

function setupEmailConfig() {
  console.log('📧 Email Configuration Setup\n');

  console.log('🔧 To enable email sending, you need to configure SMTP settings.');
  console.log('📝 Add these environment variables to your .env file:\n');

  const emailConfig = `
# Email Configuration (SMTP)
# For Gmail:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# For Outlook/Hotmail:
# SMTP_HOST=smtp-mail.outlook.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@outlook.com
# SMTP_PASS=your-password
# SMTP_FROM=your-email@outlook.com

# For Yahoo:
# SMTP_HOST=smtp.mail.yahoo.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@yahoo.com
# SMTP_PASS=your-app-password
# SMTP_FROM=your-email@yahoo.com
`;

  console.log(emailConfig);

  console.log('📋 Instructions:');
  console.log('1. Choose your email provider (Gmail, Outlook, Yahoo, etc.)');
  console.log('2. Uncomment the relevant configuration above');
  console.log('3. Replace the placeholder values with your actual email credentials');
  console.log('4. For Gmail, you need to use an "App Password" instead of your regular password');
  console.log('5. Save the .env file and restart your server');

  console.log('\n🔐 Gmail App Password Setup:');
  console.log('1. Go to your Google Account settings');
  console.log('2. Enable 2-Step Verification if not already enabled');
  console.log('3. Go to Security > App passwords');
  console.log('4. Generate a new app password for "Mail"');
  console.log('5. Use this app password as SMTP_PASS');

  console.log('\n⚠️  Important Notes:');
  console.log('- Never commit your .env file to version control');
  console.log('- Use app passwords for Gmail (not your regular password)');
  console.log('- Make sure your email provider allows SMTP access');
  console.log('- Some email providers may require enabling "Less secure app access"');

  console.log('\n🧪 Testing:');
  console.log('After setup, try registering a new user to test email sending');
  console.log('Check the server logs for email sending status');

  // Check if .env file exists
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log('\n✅ .env file found');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasEmailConfig = envContent.includes('SMTP_');
    
    if (hasEmailConfig) {
      console.log('✅ Email configuration found in .env file');
    } else {
      console.log('⚠️  No email configuration found in .env file');
      console.log('💡 Add the configuration above to your .env file');
    }
  } else {
    console.log('\n⚠️  .env file not found');
    console.log('💡 Create a .env file in the root directory and add the configuration above');
  }

  console.log('\n🎉 Email configuration setup guide completed!');
}

// Run the setup
setupEmailConfig();
