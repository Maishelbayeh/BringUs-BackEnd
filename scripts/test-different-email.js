const https = require('https');

async function testDifferentEmail() {
  console.log('🧪 Testing Email to Different Address\n');

  const apiKey = 're_Xq863joq_7xQ9AmRmUuqVpB2HTqamyx22';
  
  // Test with different email addresses
  const testEmails = [
    'mayshelbayeh5@gmail.com',
    'maishelbayeh@icloud.com'
  ];

  for (const email of testEmails) {
    console.log(`\n📧 Testing email to: ${email}`);
    
    const testEmail = {
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Test Email - ${new Date().toLocaleTimeString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Test Email</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hello,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              This is a test email sent at <strong>${new Date().toLocaleString()}</strong>
            </p>
            
            <div style="background-color: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #155724; margin-top: 0;">✅ Email Test Successful</h3>
              <p style="color: #155724; margin-bottom: 0;">
                If you received this email, Resend is working correctly!
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong>Test Details:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <li>From: onboarding@resend.dev</li>
              <li>To: ${email}</li>
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

    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve({ statusCode: res.statusCode, response });
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(postData);
        req.end();
      });

      if (result.statusCode === 200 || result.statusCode === 201) {
        console.log(`✅ Email sent successfully to ${email}`);
        console.log(`📧 Email ID: ${result.response.id}`);
        console.log(`📧 Status: ${result.response.status || 'sent'}`);
      } else {
        console.log(`❌ Failed to send email to ${email}`);
        console.log(`📊 Status Code: ${result.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ Error sending email to ${email}:`, error.message);
    }
  }

  console.log('\n🔍 Troubleshooting Tips:');
  console.log('1. Check spam/junk folders in both email accounts');
  console.log('2. Check Gmail\'s "Promotions" tab');
  console.log('3. Add onboarding@resend.dev to your contacts');
  console.log('4. Check email provider\'s spam settings');
  console.log('5. Try checking email on mobile app');
  
  console.log('\n📧 Common Issues:');
  console.log('- Gmail filters Resend emails to spam initially');
  console.log('- iCloud may have stricter filtering');
  console.log('- Some email providers block new domains');
}

// Run the test
testDifferentEmail().catch(console.error);
