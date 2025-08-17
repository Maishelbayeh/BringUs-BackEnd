const https = require('https');

async function testEmailSolutions() {
  console.log('🔍 Testing Email Solutions and Troubleshooting\n');

  const apiKey = 're_Xq863joq_7xQ9AmRmUuqVpB2HTqamyx22';
  
  // Test different email providers
  const testEmails = [
    'mayshelbayeh5@gmail.com',
    's12457383@stu.najah.edu',
    'test@yahoo.com'
  ];

  console.log('📧 Testing different email providers...\n');

  for (const email of testEmails) {
    console.log(`\n📧 Testing: ${email}`);
    
    const testEmail = {
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Email Test - ${new Date().toLocaleTimeString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Email Delivery Test</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              This is a test email to check delivery to different email providers.
            </p>
            
            <div style="background-color: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #155724; margin-top: 0;">✅ Test Successful</h3>
              <p style="color: #155724; margin-bottom: 0;">
                If you received this email, Resend is working with this provider!
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong>Test Details:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <li>Provider: ${email.split('@')[1]}</li>
              <li>Time: ${new Date().toLocaleString()}</li>
              <li>Service: Resend</li>
            </ul>
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
        console.log(`✅ Success: ${email}`);
        console.log(`   ID: ${result.response.id}`);
        console.log(`   Status: ${result.response.status || 'sent'}`);
      } else {
        console.log(`❌ Failed: ${email}`);
        console.log(`   Status Code: ${result.statusCode}`);
        console.log(`   Response: ${JSON.stringify(result.response)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${email} - ${error.message}`);
    }
  }

  console.log('\n🔍 Solutions for Email Delivery Issues:');
  console.log('\n1. **Gmail Issues:**');
  console.log('   - Check spam/junk folder');
  console.log('   - Check "Promotions" tab');
  console.log('   - Add onboarding@resend.dev to contacts');
  console.log('   - Mark emails as "Not Spam"');
  
  console.log('\n2. **iCloud Issues (403 Error):**');
  console.log('   - iCloud blocks many email services');
  console.log('   - Consider using Gmail or Outlook');
  console.log('   - Or verify domain in Resend dashboard');
  
  console.log('\n3. **Alternative Solutions:**');
  console.log('   - Use Gmail for testing');
  console.log('   - Use Outlook/Hotmail');
  console.log('   - Use Yahoo Mail');
  console.log('   - Consider SendGrid or Mailgun');
  
  console.log('\n4. **Domain Verification:**');
  console.log('   - Verify your own domain in Resend');
  console.log('   - This improves delivery rates');
  console.log('   - Reduces spam filtering');
  
  console.log('\n💡 **Recommendation:**');
  console.log('Use Gmail for testing as it has better delivery rates with Resend.');
  console.log('For production, verify your own domain in Resend dashboard.');
}

// Also test with a simple text email
async function testSimpleEmail() {
  console.log('\n📧 Testing Simple Text Email...\n');

  const apiKey = 're_Xq863joq_7xQ9AmRmUuqVpB2HTqamyx22';
  
  const testEmail = {
    from: 'onboarding@resend.dev',
    to: 'mayshelbayeh5@gmail.com',
    subject: 'Simple Test Email',
    text: 'This is a simple text email test. If you received this, Resend is working!'
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
      console.log('✅ Simple text email sent successfully!');
      console.log(`📧 Email ID: ${result.response.id}`);
      console.log('💡 Check your Gmail inbox (including spam folder)');
    } else {
      console.log('❌ Failed to send simple email');
      console.log(`📊 Status Code: ${result.statusCode}`);
    }
  } catch (error) {
    console.log('❌ Error sending simple email:', error.message);
  }
}

// Run both tests
async function runTests() {
  try {
    await testEmailSolutions();
    await testSimpleEmail();
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

runTests();
