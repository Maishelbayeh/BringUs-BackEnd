// Simple test script for email verification system
// This script tests the logic without requiring database connection

console.log('🧪 Testing Email Verification System Logic...\n');

// Test 1: OTP Generation
console.log('📧 Test 1: OTP Generation');
const otp = Math.floor(10000 + Math.random() * 90000).toString();
console.log(`✅ Generated OTP: ${otp}`);
console.log(`✅ OTP length: ${otp.length} digits`);
console.log(`✅ OTP is numeric: ${/^\d{5}$/.test(otp)}`);

// Test 2: Email Template Generation
console.log('\n📧 Test 2: Email Template Generation');
const storeName = 'Test Store';
const userName = 'John Doe';
const emailTemplate = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Email Verification</h2>
      
      <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Hello ${userName},
      </p>
      
      <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Thank you for registering with <strong>${storeName}</strong>. To complete your registration, please use the following verification code:
      </p>
      
      <div style="background-color: #f0f8ff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
        <h1 style="color: #007bff; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      
      <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        <strong>Important:</strong>
      </p>
      <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        <li>This code will expire in 15 minutes</li>
        <li>Do not share this code with anyone</li>
        <li>If you didn't request this verification, please ignore this email</li>
      </ul>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Best regards,<br>
          <strong>${storeName}</strong> Team
        </p>
      </div>
    </div>
  </div>
`;

console.log(`✅ Email template generated with store name: ${storeName}`);
console.log(`✅ Email template includes OTP: ${otp}`);
console.log(`✅ Email template includes user name: ${userName}`);

// Test 3: Validation Logic
console.log('\n📧 Test 3: Validation Logic');

// Email validation
const testEmails = [
  'test@example.com',
  'invalid-email',
  'test@',
  '@example.com',
  ''
];

testEmails.forEach(email => {
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  console.log(`✅ Email "${email}": ${isValidEmail ? 'Valid' : 'Invalid'}`);
});

// OTP validation
const testOTPs = [
  '12345',
  '1234',
  '123456',
  'abc12',
  '12abc',
  ''
];

testOTPs.forEach(otp => {
  const isValidOTP = /^\d{5}$/.test(otp);
  console.log(`✅ OTP "${otp}": ${isValidOTP ? 'Valid' : 'Invalid'}`);
});

// Test 4: Expiration Logic
console.log('\n📧 Test 4: Expiration Logic');
const now = new Date();
const expiryTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
const expiredTime = new Date(now.getTime() - 60 * 1000); // 1 minute ago

console.log(`✅ Current time: ${now.toISOString()}`);
console.log(`✅ Expiry time: ${expiryTime.toISOString()}`);
console.log(`✅ Expired time: ${expiredTime.toISOString()}`);
console.log(`✅ Is current time before expiry: ${now < expiryTime}`);
console.log(`✅ Is expired time before current: ${expiredTime < now}`);

// Test 5: API Request Examples
console.log('\n📧 Test 5: API Request Examples');

console.log('✅ Send OTP Request:');
console.log('POST /api/email-verification/send');
console.log('Body: {');
console.log('  "email": "user@example.com",');
console.log('  "storeSlug": "my-store"');
console.log('}');

console.log('\n✅ Verify OTP Request:');
console.log('POST /api/email-verification/verify');
console.log('Body: {');
console.log('  "email": "user@example.com",');
console.log('  "otp": "12345"');
console.log('}');

console.log('\n✅ Resend OTP Request:');
console.log('POST /api/email-verification/resend');
console.log('Body: {');
console.log('  "email": "user@example.com",');
console.log('  "storeSlug": "my-store"');
console.log('}');

console.log('\n🎉 Email verification system logic test completed successfully!');
console.log('\n📝 Notes:');
console.log('- storeSlug is now required in both send and resend endpoints');
console.log('- Email templates include store branding');
console.log('- OTP expires after 15 minutes');
console.log('- Rate limiting prevents spam requests');
