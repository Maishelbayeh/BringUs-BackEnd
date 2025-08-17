const https = require('https');

async function checkEmailStatus() {
  console.log('🔍 Checking Email Status and Troubleshooting\n');

  const apiKey = 're_Xq863joq_7xQ9AmRmUuqVpB2HTqamyx22';
  const emailId = 'ec9f7fb4-0f71-48bc-bbe6-ccfbe5bd03c1'; // From the test

  console.log('📊 Checking email delivery status...');
  console.log('📧 Email ID:', emailId);

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: `/emails/${emailId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log('\n📊 Email Status Details:');
          console.log('   ID:', response.id);
          console.log('   From:', response.from);
          console.log('   To:', response.to);
          console.log('   Subject:', response.subject);
          console.log('   Status:', response.status);
          console.log('   Created At:', response.created_at);
          
          if (response.last_event) {
            console.log('   Last Event:', response.last_event);
          }
          
          console.log('\n🔍 Troubleshooting Steps:');
          console.log('1. Check your spam/junk folder');
          console.log('2. Check if the email is in Gmail\'s "Promotions" tab');
          console.log('3. Add onboarding@resend.dev to your contacts');
          console.log('4. Check if your email provider is blocking Resend');
          
          console.log('\n📧 Common Issues:');
          console.log('- Gmail sometimes filters Resend emails to spam');
          console.log('- Some email providers block emails from new domains');
          console.log('- Check your email provider\'s spam settings');
          
          resolve(response);
        } catch (error) {
          console.error('\n❌ Error parsing response:', error.message);
          console.log('📊 Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ Request error:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Also send a new test email with different content
async function sendTestEmail() {
  console.log('\n📧 Sending a new test email...\n');

  const apiKey = 're_Xq863joq_7xQ9AmRmUuqVpB2HTqamyx22';
  const testEmail = {
    from: 'onboarding@resend.dev',
    to: 'maishelbayeh@icloud.com',
    subject: 'Test Email - Please Check Spam Folder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Test Email - Check Spam Folder</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hello,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            This is a test email to check if emails from Resend are being delivered.
          </p>
          
          <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #856404; margin-top: 0;">Important:</h3>
            <p style="color: #856404; margin-bottom: 0;">
              If you don't see this email in your inbox, please check your spam/junk folder.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <strong>Test Details:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <li>From: onboarding@resend.dev</li>
            <li>To: mayshelbayeh5@gmail.com</li>
            <li>Service: Resend</li>
            <li>Time: ${new Date().toLocaleString()}</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              <strong>BringUs Store</strong> Team
            </p>
          </div>
        </div>
      </div>
    `
  };

  const postData = JSON.stringify(testEmail);

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ New test email sent successfully!');
            console.log('📧 Email ID:', response.id);
            console.log('📧 Status:', response.status || 'sent');
            console.log('\n💡 Please check your email (including spam folder)');
          } else {
            console.error('❌ Failed to send test email');
            console.log('📊 Status Code:', res.statusCode);
            console.log('📊 Response:', response);
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          console.log('📊 Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run both checks
async function runChecks() {
  try {
    await checkEmailStatus();
    await sendTestEmail();
  } catch (error) {
    console.error('Error running checks:', error.message);
  }
}

runChecks();
