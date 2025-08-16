# Email Verification System

## Overview

This system provides email verification functionality using 5-digit OTP (One-Time Password) codes. It includes personalized email templates with store branding and comprehensive validation.

## Features

- ✅ **5-digit OTP generation** with 15-minute expiration
- ✅ **Personalized email templates** with store name
- ✅ **Comprehensive validation** and error handling
- ✅ **Resend functionality** with rate limiting
- ✅ **Store isolation** support
- ✅ **Swagger documentation** for all endpoints

## API Endpoints

### 1. Send Email Verification OTP

**Endpoint:** `POST /api/email-verification/send`

**Request Body:**
```json
{
  "email": "user@example.com",
  "storeSlug": "my-store" // Required
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "data": {
    "email": "user@example.com",
    "expiresIn": "15 minutes"
  }
}
```

### 2. Verify Email with OTP

**Endpoint:** `POST /api/email-verification/verify`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email": "user@example.com",
    "isEmailVerified": true,
    "emailVerifiedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Resend Email Verification OTP

**Endpoint:** `POST /api/email-verification/resend`

**Request Body:**
```json
{
  "email": "user@example.com",
  "storeSlug": "my-store" // Required
}
```

**Response:**
```json
{
  "success": true,
  "message": "New verification code sent successfully",
  "data": {
    "email": "user@example.com",
    "expiresIn": "15 minutes"
  }
}
```

## Database Schema Updates

### User Model Fields

```javascript
// New fields added to User model
emailVerificationOTP: String,        // 5-digit OTP code
emailVerificationExpiry: Date,       // OTP expiration time
emailVerifiedAt: Date,               // When email was verified
```

## Email Template

The system generates beautiful HTML email templates with:

- **Store branding** (name from storeSlug)
- **Personalized greeting** with user's name
- **Large, prominent OTP display**
- **Security instructions**
- **Professional styling**

### Example Email Content

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Email Verification</h2>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hello John Doe,
    </p>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Thank you for registering with <strong>My Store</strong>. To complete your registration, please use the following verification code:
    </p>
    
    <div style="background-color: #f0f8ff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
      <h1 style="color: #007bff; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">12345</h1>
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
        <strong>My Store</strong> Team
      </p>
    </div>
  </div>
</div>
```

## Security Features

### OTP Generation
- **5-digit numeric codes** (10000-99999)
- **15-minute expiration** time
- **Automatic cleanup** after verification

### Rate Limiting
- **Prevents spam** by limiting resend requests
- **Time-based restrictions** on new OTP requests
- **User-friendly error messages** with wait times

### Validation
- **Email format validation**
- **OTP format validation** (exactly 5 digits)
- **Expiration checking**
- **Store slug validation** (string format)

## Error Handling

### Common Error Responses

```json
// User not found
{
  "success": false,
  "message": "User not found with this email"
}

// Email already verified
{
  "success": false,
  "message": "Email is already verified"
}

// Invalid OTP
{
  "success": false,
  "message": "Invalid verification code"
}

// Expired OTP
{
  "success": false,
  "message": "Verification code has expired. Please request a new one."
}

// Too frequent requests
{
  "success": false,
  "message": "Please wait 5 minutes before requesting a new verification code"
}

// Store not found
{
  "success": false,
  "message": "Store not found with this slug"
}
```

## Configuration

### Environment Variables

To enable actual email sending, configure these environment variables:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourstore.com

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
```

### Email Service Setup

Currently, the system logs OTP codes to console. To enable actual email sending:

1. **Uncomment the nodemailer code** in `UserController.js`
2. **Configure SMTP settings** in environment variables
3. **Test with a real email service** (Gmail, SendGrid, etc.)

## Testing

### Run Test Script

```bash
node scripts/test-email-verification-simple.js
```

This script will:
- Create test users and stores
- Test OTP generation and verification
- Test expiration and validation
- Clean up test data

### Manual Testing

1. **Create a user** with `isEmailVerified: false`
2. **Send verification OTP** using the API
3. **Check console logs** for OTP code
4. **Verify email** with the OTP
5. **Confirm verification status**

## Integration

### Frontend Integration

```javascript
// Send verification OTP
const sendOTP = async (email, storeSlug) => {
  const response = await fetch('/api/email-verification/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, storeSlug })
  });
  return response.json();
};

// Verify email
const verifyEmail = async (email, otp) => {
  const response = await fetch('/api/email-verification/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  return response.json();
};

// Resend OTP
const resendOTP = async (email, storeSlug) => {
  const response = await fetch('/api/email-verification/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, storeSlug })
  });
  return response.json();
};
```

### React Component Example

```jsx
import React, { useState } from 'react';

const EmailVerification = ({ email, storeSlug }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email-verification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, storeSlug })
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('Error sending verification code');
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('Error verifying email');
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={sendOTP} disabled={loading}>
        Send Verification Code
      </button>
      <input
        type="text"
        placeholder="Enter 5-digit code"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength={5}
      />
      <button onClick={verifyOTP} disabled={loading}>
        Verify Email
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};
```

## Troubleshooting

### Common Issues

1. **OTP not received**: Check console logs for OTP codes
2. **Email sending fails**: Configure SMTP settings
3. **Validation errors**: Check request body format
4. **Expired OTP**: Request new OTP using resend endpoint
5. **Store not found**: Verify store slug exists in database

### Debug Mode

Enable debug logging by checking console output:

```javascript
// OTP generation logs
console.log(`📧 Email verification OTP for ${email}: ${otp}`);
console.log(`📧 Store: ${storeName}`);
```

## Future Enhancements

- [ ] **SMS verification** as alternative
- [ ] **Email template customization** per store
- [ ] **Analytics tracking** for verification rates
- [ ] **Bulk verification** for admin users
- [ ] **Webhook notifications** for verification events

