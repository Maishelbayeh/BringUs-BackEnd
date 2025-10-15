const nodemailer = require('nodemailer');

// Mailtrap configuration for testing
const createMailtrapTransport = () => {
  return nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "e8f0f4883569b6",
      pass: "fc10bc372ea30c"
    }
  });
};

// Email service class
class EmailService {
  constructor() {
    this.transport = createMailtrapTransport();
  }

  // Send email verification OTP
  async sendVerificationEmail(email, otp, storeName = 'Our Store', storeEmail = 'info@bringus.com') {
    try {
      const emailSubject = `Email Verification - ${storeName}`;
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Email Verification</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hello,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for registering with ${storeName}. To complete your registration, please use the verification code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f0f8ff; border-radius: 8px; border: 2px dashed #007bff;">
              <h1 style="color: #007bff; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <li>This code will expire in 1 minute</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this verification, please ignore this email</li>
            </ul>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              If you have any questions, please contact our support team.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                <strong>${storeName}</strong> Team
              </p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: `"${storeName}" <${storeEmail}>`,
        to: email,
        subject: emailSubject,
        html: emailBody
      };

      const result = await this.transport.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully via Mailtrap to ${email}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📧 OTP: ${otp}`);
      
      return {
        success: true,
        messageId: result.messageId,
        otp: otp
      };

    } catch (error) {
      console.error('❌ Failed to send email via Mailtrap:', error.message);
      console.log(`📧 OTP for ${email}: ${otp} (available in logs for testing)`);
      
      return {
        success: false,
        error: error.message,
        otp: otp // Still return OTP for testing purposes
      };
    }
  }

  // Send email change verification OTP
  async sendEmailChangeVerification(email, otp, storeName = 'Our Store', storeEmail = 'info@bringus.com', firstName = '', lastName = '') {
    try {
      const emailSubject = `Email Change Verification - ${storeName}`;
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Email Change Verification</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hello ${firstName} ${lastName},
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              You requested to change your email address for your <strong>${storeName}</strong> account. To confirm this change, please use the verification code below:
            </p>
            
            <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <h1 style="color: #856404; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong>⚠️ Important Security Notice:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <li><strong>This code will expire in 5 minutes</strong></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this change, someone may be trying to access your account</li>
              <li>After verification, your email will be changed to: <strong>${email}</strong></li>
            </ul>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this email change, please contact our support team immediately and change your password.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                <strong>${storeName}</strong> Team
              </p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: `"${storeName}" <${storeEmail}>`,
        to: email,
        subject: emailSubject,
        html: emailBody
      };

      const result = await this.transport.sendMail(mailOptions);
      
      console.log(`✅ Email change verification sent successfully via Mailtrap to ${email}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📧 OTP: ${otp}`);
      
      return {
        success: true,
        messageId: result.messageId,
        otp: otp
      };

    } catch (error) {
      console.error('❌ Failed to send email change verification via Mailtrap:', error.message);
      console.log(`📧 OTP for ${email}: ${otp} (available in logs for testing)`);
      
      return {
        success: false,
        error: error.message,
        otp: otp // Still return OTP for testing purposes
      };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken, storeName = 'Our Store', storeEmail = 'info@bringus.com', baseUrl = null) {
    try {
      const emailSubject = `Password Reset - ${storeName}`;
      const frontendUrl = baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Password Reset</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hello,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              You requested to reset your password for your ${storeName} account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/reset-password?token=${resetToken}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <li>This link will expire in 10 minutes</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>For security, this link can only be used once</li>
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

      const mailOptions = {
        from: `"${storeName}" <${storeEmail}>`,
        to: email,
        subject: emailSubject,
        html: emailBody
      };

      const result = await this.transport.sendMail(mailOptions);
      
      console.log(`✅ Password reset email sent successfully via Mailtrap to ${email}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Failed to send password reset email via Mailtrap:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test email service connection
  async testConnection() {
    try {
      await this.transport.verify();
      console.log('✅ Mailtrap connection verified successfully');
      return { success: true, message: 'Connection verified' };
    } catch (error) {
      console.error('❌ Mailtrap connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send test email
  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: '"BringUs Test" <test@bringus.com>',
        to: toEmail,
        subject: 'Test Email from BringUs',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Test Email</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              This is a test email from BringUs backend to verify Mailtrap configuration.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you receive this email, the email service is working correctly! 🎉
            </p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                <strong>BringUs</strong> Team
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transport.sendMail(mailOptions);
      
      console.log(`✅ Test email sent successfully to ${toEmail}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Failed to send test email:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
