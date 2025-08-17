const https = require('https');

async function testResendEmail() {
  console.log('🧪 Testing Resend Email Service (Simple Version)\n');

  const apiKey = 're_Xq863joq_7xQ9AmRmUuqVpB2HTqamyx22';
  const testEmail = {
    from: 'onboarding@resend.dev',
    to: 'mayshelbayeh5@gmail.com',
    subject: 'Test Email from BringUs Store',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Email Verification Test</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hello Test User,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            This is a test email from <strong>BringUs Store</strong> to verify that Resend is working correctly.
          </p>
          
          <div style="background-color: #f0f8ff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <h1 style="color: #007bff; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">12345</h1>
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
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            If you received this email, Resend is working correctly! 🎉
          </p>
          
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

  console.log('📧 Sending test email...');
  console.log(`   From: ${testEmail.from}`);
  console.log(`   To: ${testEmail.to}`);
  console.log(`   Subject: ${testEmail.subject}`);

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
            console.log('\n✅ Email sent successfully!');
            console.log('📧 Email ID:', response.id);
            console.log('📧 Status:', response.status || 'sent');
            
            console.log('\n🎉 Resend is working correctly!');
            console.log('💡 You can now test user registration to see email verification in action.');
          } else {
            console.error('\n❌ Failed to send email');
            console.log('📊 Status Code:', res.statusCode);
            console.log('📊 Response:', response);
          }
          
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

    req.write(postData);
    req.end();
  });
}

// Run the test
testResendEmail().catch(console.error);
