// src/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure email transporter based on environment
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Only disable certificate validation in development
    if (process.env.NODE_ENV === 'development') {
      emailConfig.tls = {
        rejectUnauthorized: false // Accept self-signed certificates in development only
      };
    }

    // For development, you can use ethereal email service
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log('⚠️  Email service: Using development mode (emails won\'t be sent)');
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    } else {
      this.transporter = nodemailer.createTransport(emailConfig);
    }

    // Verify SMTP configuration
    this.verifyTransporter();
  }

  async verifyTransporter() {
    try {
      await this.transporter.verify();
    } catch (error) {
      console.error('❌ Email service: SMTP configuration error:', error.message);
    }
  }

  /**
   * Send password reset OTP email
   * @param {string} email - Recipient email address
   * @param {string} otp - 6-digit OTP code
   * @param {string} firstName - User's first name
   * @param {number} expiryMinutes - OTP expiry time in minutes
   */
  async sendPasswordResetOTP(email, otp, firstName, expiryMinutes = 10) {
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'OHMS - Eye Hospital',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
      },
      to: email,
      subject: '🔐 Password Reset OTP - OHMS Eye Hospital',
      html: this.getPasswordResetTemplate(firstName, otp, expiryMinutes),
      text: `Hello ${firstName},\n\nYour password reset OTP is: ${otp}\n\nThis OTP will expire in ${expiryMinutes} minutes.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nOHMS Eye Hospital Team`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset OTP sent to ${email}`);

      // In development, log the preview URL for ethereal email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
      }

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(result) : null
      };
    } catch (error) {
      console.error('❌ Failed to send password reset OTP:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send OTP email for patient registration
   * @param {string} email - Patient's email address
   * @param {string} otp - 4-digit OTP code
   * @param {string} purpose - Purpose of the OTP (e.g., 'Patient Registration')
   * @param {number} expiryMinutes - OTP expiry time in minutes
   * @param {string} firstName - Patient's first name (optional)
   */
  async sendOTPEmail(email, otp, purpose = 'Patient Registration', expiryMinutes = 10, firstName = null) {
    const displayName = firstName || email.split('@')[0];

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'OHMS - Eye Hospital',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
      },
      to: email,
      subject: `🏥 Your ${purpose} OTP - OHMS Eye Hospital`,
      html: this.getPatientOTPTemplate(displayName, otp, purpose, expiryMinutes),
      text: `Hello ${displayName},\n\nThank you for choosing OHMS Eye Hospital!\n\nYour ${purpose} OTP is: ${otp}\n\nThis OTP will expire in ${expiryMinutes} minutes.\n\nPlease enter this OTP to complete your registration.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nOHMS Eye Hospital Team`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ ${purpose} OTP sent to ${email}`);

      // In development, log the preview URL for ethereal email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
      }

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(result) : null
      };
    } catch (error) {
      console.error(`❌ Failed to send ${purpose} OTP:`, error);
      throw new Error(`Failed to send ${purpose} OTP email`);
    }
  }

  /**
   * Send welcome email to new patient with credentials
   * @param {string} email - Patient's email address
   * @param {string} firstName - Patient's first name
   * @param {string} lastName - Patient's last name
   * @param {number} patientNumber - Generated patient number
   * @param {string} temporaryPassword - Generated temporary password
   * @param {string} mrn - Medical Record Number
   */
  async sendPatientWelcomeEmail(email, firstName, lastName, patientNumber, temporaryPassword, mrn) {
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'OHMS - Eye Hospital',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
      },
      to: email,
      subject: `🎉 Welcome to OHMS Eye Hospital - Your Patient Account`,
      html: this.getPatientWelcomeTemplate(firstName, lastName, patientNumber, temporaryPassword, mrn, email),
      text: `Hello ${firstName} ${lastName},\n\nWelcome to OHMS Eye Hospital!\n\nYour patient account has been successfully created.\n\nYour login credentials:\nPatient Number: ${patientNumber}\nEmail: ${email}\nTemporary Password: ${temporaryPassword}\n\nPlease change your password after first login for security.\n\nBest regards,\nOHMS Eye Hospital Team`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Patient welcome email sent to ${email} (${firstName} ${lastName} - ${patientNumber})`);

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
      }

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(result) : null
      };
    } catch (error) {
      console.error('❌ Failed to send patient welcome email:', error);
      throw new Error('Failed to send patient welcome email');
    }
  }

  /**
   * Send welcome email to new staff member with credentials
   * @param {string} email - Staff member's email address
   * @param {string} firstName - Staff member's first name
   * @param {string} lastName - Staff member's last name
   * @param {string} staffType - Staff role/type
   * @param {string} employeeId - Generated employee ID
   * @param {string} defaultPassword - Generated default password
   * @param {string} department - Staff department
   */
  async sendStaffWelcomeEmail(email, firstName, lastName, staffType, employeeId, defaultPassword, department) {
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'OHMS - Eye Hospital',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
      },
      to: email,
      subject: `🎉 Welcome to OHMS Eye Hospital - Your ${staffType.charAt(0).toUpperCase() + staffType.slice(1)} Account`,
      html: this.getStaffWelcomeTemplate(firstName, lastName, staffType, employeeId, defaultPassword, department, email),
      text: `Hello ${firstName} ${lastName},\n\nWelcome to OHMS Eye Hospital!\n\nYou have been successfully registered as a ${staffType} in the ${department} department.\n\nYour login credentials:\nEmployee ID: ${employeeId}\nPassword: ${defaultPassword}\n\nPlease change your password after first login for security.\n\nBest regards,\nOHMS Eye Hospital Team`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Staff welcome email sent to ${email} (${firstName} ${lastName} - ${staffType})`);

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
      }

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(result) : null
      };
    } catch (error) {
      console.error('❌ Failed to send staff welcome email:', error);
      throw new Error('Failed to send staff welcome email');
    }
  }

  /**
   * Send welcome email to new super admin
   * @param {string} email - Recipient email address
   * @param {string} firstName - User's first name
   * @param {string} temporaryPassword - Temporary password (optional)
   */
  async sendWelcomeEmail(email, firstName, temporaryPassword = null) {
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'OHMS - Eye Hospital',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
      },
      to: email,
      subject: '👋 Welcome to OHMS - Eye Hospital Management System',
      html: this.getWelcomeTemplate(firstName, temporaryPassword),
      text: `Hello ${firstName},\n\nWelcome to OHMS Eye Hospital Management System!\n\nYour super admin account has been created successfully.\n${temporaryPassword ? `\nTemporary Password: ${temporaryPassword}\nPlease change your password after first login.` : ''}\n\nBest regards,\nOHMS Eye Hospital Team`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
      }

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(result) : null
      };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Send password change confirmation email
   * @param {string} email - Recipient email address
   * @param {string} firstName - User's first name
   */
  async sendPasswordChangeConfirmation(email, firstName) {
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'OHMS - Eye Hospital',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
      },
      to: email,
      subject: '🔒 Password Changed Successfully - OHMS',
      html: this.getPasswordChangeTemplate(firstName),
      text: `Hello ${firstName},\n\nYour password has been changed successfully.\n\nIf you didn't make this change, please contact support immediately.\n\nBest regards,\nOHMS Eye Hospital Team`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password change confirmation sent to ${email}`);

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
      }

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ Failed to send password change confirmation:', error);
      throw new Error('Failed to send password change confirmation');
    }
  }

  /**
   * HTML template for patient registration OTP email
   */
  getPatientOTPTemplate(displayName, otp, purpose, expiryMinutes) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${purpose} OTP</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: #f8f9fa; 
        }
        .email-container { 
          background: white; 
          border-radius: 15px; 
          overflow: hidden; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
          position: relative; 
        }
        .header::before { 
          content: ''; 
          position: absolute; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill="rgba(255,255,255,0.2)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>'); 
          opacity: 0.3; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 2.2em; 
          font-weight: 700; 
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3); 
          position: relative; 
          z-index: 1; 
        }
        .header p { 
          margin: 10px 0 0 0; 
          font-size: 1.1em; 
          opacity: 0.9; 
          position: relative; 
          z-index: 1; 
        }
        .content { 
          padding: 40px 30px; 
        }
        .welcome-section { 
          text-align: center; 
          margin-bottom: 30px; 
        }
        .welcome-section h2 { 
          color: #28a745; 
          font-size: 1.6em; 
          margin-bottom: 10px; 
        }
        .welcome-section p { 
          color: #6c757d; 
          font-size: 1.1em; 
          margin: 0; 
        }
        .otp-section { 
          background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%); 
          border: 2px solid #28a745; 
          border-radius: 15px; 
          padding: 30px; 
          margin: 30px 0; 
          text-align: center; 
          position: relative; 
        }
        .otp-section::before { 
          content: '🔐'; 
          position: absolute; 
          top: -20px; 
          left: 50%; 
          transform: translateX(-50%); 
          background: white; 
          padding: 10px 15px; 
          border-radius: 50%; 
          font-size: 1.5em; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .otp-label { 
          color: #28a745; 
          font-size: 1.2em; 
          font-weight: 600; 
          margin-bottom: 15px; 
          margin-top: 10px; 
        }
        .otp-code { 
          background: white; 
          border: 3px solid #28a745; 
          border-radius: 12px; 
          padding: 20px; 
          margin: 15px 0; 
          font-size: 2.5em; 
          font-weight: bold; 
          color: #28a745; 
          letter-spacing: 8px; 
          font-family: 'Courier New', monospace; 
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2); 
        }
        .expiry-info { 
          color: #dc3545; 
          font-weight: 600; 
          background: #fff5f5; 
          border: 1px solid #fecaca; 
          border-radius: 8px; 
          padding: 12px; 
          margin-top: 15px; 
          display: inline-block; 
        }
        .info-cards { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
          margin: 30px 0; 
        }
        .info-card { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 12px; 
          border-left: 4px solid #28a745; 
          text-align: center; 
        }
        .info-card h4 { 
          margin: 0 0 10px 0; 
          color: #28a745; 
          font-size: 1.1em; 
        }
        .info-card p { 
          margin: 0; 
          color: #6c757d; 
          font-size: 0.95em; 
        }
        .security-notice { 
          background: #fff3cd; 
          border: 1px solid #ffeaa7; 
          border-radius: 10px; 
          padding: 20px; 
          margin: 25px 0; 
        }
        .security-notice h4 { 
          color: #856404; 
          margin: 0 0 10px 0; 
          font-size: 1.1em; 
        }
        .security-list { 
          margin: 10px 0; 
          padding-left: 20px; 
          color: #856404; 
        }
        .security-list li { 
          margin: 5px 0; 
        }
        .next-steps { 
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); 
          border-radius: 12px; 
          padding: 25px; 
          margin: 25px 0; 
        }
        .next-steps h3 { 
          color: #1565c0; 
          margin: 0 0 15px 0; 
        }
        .steps-list { 
          counter-reset: step-counter; 
          list-style: none; 
          padding: 0; 
        }
        .steps-list li { 
          counter-increment: step-counter; 
          margin: 10px 0; 
          padding: 10px 15px 10px 45px; 
          background: white; 
          border-radius: 8px; 
          position: relative; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .steps-list li::before { 
          content: counter(step-counter); 
          position: absolute; 
          left: 15px; 
          top: 50%; 
          transform: translateY(-50%); 
          background: #28a745; 
          color: white; 
          width: 20px; 
          height: 20px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          font-size: 0.8em; 
        }
        .footer { 
          background: #28a745; 
          color: white; 
          padding: 25px; 
          text-align: center; 
        }
        .footer p { 
          margin: 5px 0; 
          opacity: 0.9; 
        }
        @media (max-width: 600px) {
          .info-cards { grid-template-columns: 1fr; }
          .content { padding: 25px 20px; }
          .header { padding: 30px 20px; }
          .otp-code { font-size: 2em; letter-spacing: 4px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏥 OHMS Eye Hospital</h1>
          <p>Your Vision, Our Mission</p>
        </div>
        
        <div class="content">
          <div class="welcome-section">
            <h2>Hello ${displayName}!</h2>
            <p>Thank you for choosing OHMS Eye Hospital for your healthcare needs.</p>
          </div>

          <div class="otp-section">
            <div class="otp-label">Your ${purpose} OTP</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry-info">
              ⏱️ Expires in ${expiryMinutes} minutes
            </div>
          </div>

          <div class="info-cards">
            <div class="info-card">
              <h4>🔒 Secure Process</h4>
              <p>Your OTP is encrypted and secure for your protection</p>
            </div>
            <div class="info-card">
              <h4>⚡ Quick Verification</h4>
              <p>Enter this code to complete your registration instantly</p>
            </div>
          </div>

          <div class="next-steps">
            <h3>🚀 Complete Your Registration</h3>
            <ol class="steps-list">
              <li>Return to the registration form</li>
              <li>Enter the OTP code above</li>
              <li>Complete your profile setup</li>
              <li>Start accessing our healthcare services</li>
            </ol>
          </div>

          <div class="security-notice">
            <h4>🛡️ Security & Privacy</h4>
            <ul class="security-list">
              <li><strong>Never share</strong> this OTP with anyone</li>
              <li>OHMS staff will <strong>never ask</strong> for your OTP</li>
              <li>If you didn't request this, please <strong>ignore this email</strong></li>
              <li>This OTP is <strong>single-use only</strong> and expires automatically</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <p style="margin: 0; color: #28a745; font-weight: 600;">
              🌟 Welcome to OHMS Eye Hospital - Where Excellence Meets Eye Care!
            </p>
          </div>

          <p style="text-align: center; margin: 20px 0;">
            If you have any questions or need assistance, please contact our support team at 
            <strong style="color: #28a745;">support@ohmseyehospital.com</strong>
          </p>
          
          <p style="text-align: center; font-weight: 600; color: #28a745;">
            Best regards,<br>
            <strong>OHMS Eye Hospital Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>OHMS Eye Hospital Management System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} OHMS Eye Hospital. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * HTML template for patient welcome email with credentials
   */
  getPatientWelcomeTemplate(firstName, lastName, patientNumber, temporaryPassword, mrn, email) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to OHMS Eye Hospital</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 650px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: #f5f7fa; 
        }
        .email-container { 
          background: white; 
          border-radius: 15px; 
          overflow: hidden; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
          position: relative; 
        }
        .header::before { 
          content: ''; 
          position: absolute; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>'); 
          opacity: 0.3; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 2.5em; 
          font-weight: 700; 
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3); 
          position: relative; 
          z-index: 1; 
        }
        .header p { 
          margin: 10px 0 0 0; 
          font-size: 1.2em; 
          opacity: 0.9; 
          position: relative; 
          z-index: 1; 
        }
        .content { 
          padding: 40px 30px; 
        }
        .welcome-message { 
          text-align: center; 
          margin-bottom: 30px; 
        }
        .welcome-message h2 { 
          color: #28a745; 
          font-size: 1.8em; 
          margin-bottom: 10px; 
        }
        .patient-badge { 
          display: inline-block; 
          background: linear-gradient(45deg, #28a745, #20c997); 
          color: white; 
          padding: 8px 20px; 
          border-radius: 25px; 
          font-weight: 600; 
          margin: 10px 0; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
        }
        .credentials-section { 
          background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%); 
          border: 2px solid #28a745; 
          border-radius: 12px; 
          padding: 25px; 
          margin: 25px 0; 
          position: relative; 
        }
        .credentials-section::before { 
          content: '🔐'; 
          position: absolute; 
          top: -15px; 
          left: 25px; 
          background: white; 
          padding: 5px 10px; 
          border-radius: 50%; 
          font-size: 1.2em; 
        }
        .credentials-title { 
          color: #155724; 
          font-size: 1.3em; 
          font-weight: 700; 
          margin-bottom: 20px; 
          margin-top: 10px; 
        }
        .credential-item { 
          background: white; 
          margin: 12px 0; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #28a745; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .credential-label { 
          font-weight: 600; 
          color: #155724; 
          margin-bottom: 5px; 
        }
        .credential-value { 
          font-family: 'Courier New', monospace; 
          background: #f8f9fa; 
          padding: 8px 12px; 
          border-radius: 6px; 
          font-size: 1.1em; 
          border: 1px solid #e9ecef; 
          word-break: break-all; 
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
          margin: 25px 0; 
        }
        .info-card { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 10px; 
          border-top: 3px solid #28a745; 
        }
        .info-card h4 { 
          margin: 0 0 10px 0; 
          color: #155724; 
          font-size: 1.1em; 
        }
        .info-card p { 
          margin: 0; 
          font-size: 1.1em; 
          font-weight: 600; 
          color: #333; 
        }
        .next-steps { 
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); 
          border-radius: 12px; 
          padding: 25px; 
          margin: 25px 0; 
        }
        .next-steps h3 { 
          color: #1565c0; 
          margin: 0 0 15px 0; 
        }
        .steps-list { 
          counter-reset: step-counter; 
          list-style: none; 
          padding: 0; 
        }
        .steps-list li { 
          counter-increment: step-counter; 
          margin: 12px 0; 
          padding: 12px 15px 12px 50px; 
          background: white; 
          border-radius: 8px; 
          position: relative; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .steps-list li::before { 
          content: counter(step-counter); 
          position: absolute; 
          left: 15px; 
          top: 50%; 
          transform: translateY(-50%); 
          background: #28a745; 
          color: white; 
          width: 25px; 
          height: 25px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          font-size: 0.9em; 
        }
        .footer { 
          background: #28a745; 
          color: white; 
          padding: 25px; 
          text-align: center; 
        }
        .footer p { 
          margin: 5px 0; 
          opacity: 0.9; 
        }
        @media (max-width: 600px) {
          .info-grid { grid-template-columns: 1fr; }
          .content { padding: 25px 20px; }
          .header { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏥 OHMS Eye Hospital</h1>
          <p>Your Vision, Our Mission</p>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            <h2>Welcome ${firstName} ${lastName}!</h2>
            <p>Congratulations! Your patient account has been successfully created.</p>
            <div class="patient-badge">Patient Account</div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h4>👤 Patient Information</h4>
              <p>${firstName} ${lastName}</p>
            </div>
            <div class="info-card">
              <h4>🏥 Medical Record</h4>
              <p>MRN: ${mrn}</p>
            </div>
          </div>

          <div class="credentials-section">
            <div class="credentials-title">Your Login Credentials</div>
            
            <div class="credential-item">
              <div class="credential-label">Patient Number:</div>
              <div class="credential-value">${patientNumber}</div>
            </div>
            
            <div class="credential-item">
              <div class="credential-label">Email Address:</div>
              <div class="credential-value">${email}</div>
            </div>
            
            <div class="credential-item">
              <div class="credential-label">Temporary Password:</div>
              <div class="credential-value">${temporaryPassword}</div>
            </div>
          </div>

          <div class="next-steps">
            <h3>🚀 Getting Started - Next Steps</h3>
            <ol class="steps-list">
              <li>Access the OHMS patient portal using your email and temporary password</li>
              <li>Change your temporary password for security</li>
              <li>Complete your medical profile and preferences</li>
              <li>Book your first appointment with our specialists</li>
              <li>Download our mobile app for easy access</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <p style="margin: 0; color: #28a745; font-weight: 600;">
              🌟 Welcome to OHMS Eye Hospital - Where Excellence Meets Eye Care!
            </p>
          </div>

          <p style="text-align: center; margin: 20px 0;">
            If you have any questions or need assistance, please contact our support team at 
            <strong style="color: #28a745;">support@ohmseyehospital.com</strong>
          </p>
          
          <p style="text-align: center; font-weight: 600; color: #28a745;">
            Best regards,<br>
            <strong>OHMS Eye Hospital Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>OHMS Eye Hospital Management System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} OHMS Eye Hospital. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * HTML template for password reset OTP email
   */
  getPasswordResetTemplate(firstName, otp, expiryMinutes) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 OHMS Eye Hospital</h1>
        <p>Password Reset Request</p>
      </div>
      
      <div class="content">
        <h2>Hello ${firstName},</h2>
        
        <p>You have requested to reset your password for your OHMS super admin account. Please use the following OTP to complete the password reset process:</p>
        
        <div class="otp-box">
          <p>Your One-Time Password (OTP) is:</p>
          <div class="otp-code">${otp}</div>
          <p><strong>This OTP will expire in ${expiryMinutes} minutes</strong></p>
        </div>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong>
          <ul>
            <li>Do not share this OTP with anyone</li>
            <li>OHMS staff will never ask for your OTP</li>
            <li>If you didn't request this reset, please ignore this email</li>
          </ul>
        </div>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
        
        <p>Best regards,<br>
        <strong>OHMS Eye Hospital Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} OHMS Eye Hospital Management System</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * HTML template for staff welcome email with credentials
   */
  getStaffWelcomeTemplate(firstName, lastName, staffType, employeeId, defaultPassword, department, email) {
    const roleDisplayName = staffType.charAt(0).toUpperCase() + staffType.slice(1).replace('-', ' ');
    const departmentDisplayName = department.charAt(0).toUpperCase() + department.slice(1).replace('-', ' ');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to OHMS Eye Hospital</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f5f7fa; }
        .email-container { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4a90e2 0%, #2c5aa0 50%, #1a365d 100%); color: white; padding: 40px 30px; text-align: center; position: relative; }
        .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>'); opacity: 0.3; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); position: relative; z-index: 1; }
        .header p { margin: 10px 0 0 0; font-size: 1.2em; opacity: 0.9; position: relative; z-index: 1; }
        .content { padding: 40px 30px; }
        .welcome-message { text-align: center; margin-bottom: 30px; }
        .welcome-message h2 { color: #2c5aa0; font-size: 1.8em; margin-bottom: 10px; }
        .role-badge { display: inline-block; background: linear-gradient(45deg, #4a90e2, #2c5aa0); color: white; padding: 8px 20px; border-radius: 25px; font-weight: 600; margin: 10px 0; text-transform: uppercase; letter-spacing: 1px; }
        .credentials-section { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border: 2px solid #4a90e2; border-radius: 12px; padding: 25px; margin: 25px 0; position: relative; }
        .credentials-section::before { content: '🔐'; position: absolute; top: -15px; left: 25px; background: white; padding: 5px 10px; border-radius: 50%; font-size: 1.2em; }
        .credentials-title { color: #1565c0; font-size: 1.3em; font-weight: 700; margin-bottom: 20px; margin-top: 10px; }
        .credential-item { background: white; margin: 12px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #4a90e2; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .credential-label { font-weight: 600; color: #2c5aa0; margin-bottom: 5px; }
        .credential-value { font-family: 'Courier New', monospace; background: #f8f9fa; padding: 8px 12px; border-radius: 6px; font-size: 1.1em; border: 1px solid #e9ecef; word-break: break-all; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
        .info-card { background: #f8f9fa; padding: 20px; border-radius: 10px; border-top: 3px solid #4a90e2; }
        .info-card h4 { margin: 0 0 10px 0; color: #2c5aa0; font-size: 1.1em; }
        .info-card p { margin: 0; font-size: 1.1em; font-weight: 600; color: #333; }
        .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-notice h4 { color: #856404; margin: 0 0 10px 0; font-size: 1.1em; }
        .security-list { margin: 10px 0; padding-left: 20px; }
        .security-list li { margin: 5px 0; color: #856404; }
        .next-steps { background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); border-radius: 10px; padding: 25px; margin: 25px 0; }
        .next-steps h3 { color: #2e7d32; margin: 0 0 15px 0; }
        .steps-list { counter-reset: step-counter; list-style: none; padding: 0; }
        .steps-list li { counter-increment: step-counter; margin: 12px 0; padding: 12px 15px 12px 50px; background: white; border-radius: 8px; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .steps-list li::before { content: counter(step-counter); position: absolute; left: 15px; top: 50%; transform: translateY(-50%); background: #4a90e2; color: white; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9em; }
        .footer { background: #2c5aa0; color: white; padding: 25px; text-align: center; }
        .footer p { margin: 5px 0; opacity: 0.9; }
        @media (max-width: 600px) {
          .info-grid { grid-template-columns: 1fr; }
          .content { padding: 25px 20px; }
          .header { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏥 OHMS Eye Hospital</h1>
          <p>Welcome to Our Healthcare Family!</p>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            <h2>Welcome ${firstName} ${lastName}!</h2>
            <p>Congratulations! You have been successfully registered as our new team member.</p>
            <div class="role-badge">${roleDisplayName}</div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h4>👤 Your Role</h4>
              <p>${roleDisplayName}</p>
            </div>
            <div class="info-card">
              <h4>🏢 Department</h4>
              <p>${departmentDisplayName}</p>
            </div>
          </div>

          <div class="credentials-section">
            <div class="credentials-title">Your Login Credentials</div>
            
            <div class="credential-item">
              <div class="credential-label">Employee ID:</div>
              <div class="credential-value">${employeeId}</div>
            </div>
            
            <div class="credential-item">
              <div class="credential-label">Email Address:</div>
              <div class="credential-value">${email}</div>
            </div>
            
            <div class="credential-item">
              <div class="credential-label">Temporary Password:</div>
              <div class="credential-value">${defaultPassword}</div>
            </div>
          </div>

          <div class="security-notice">
            <h4>🔒 Important Security Information</h4>
            <ul class="security-list">
              <li><strong>Change your password immediately</strong> after your first login</li>
              <li>Never share your credentials with anyone</li>
              <li>Use a strong, unique password for your account</li>
              <li>Log out completely when finished using the system</li>
            </ul>
          </div>

          <div class="next-steps">
            <h3>🚀 Getting Started - Next Steps</h3>
            <ol class="steps-list">
              <li>Access the OHMS portal using your email and temporary password</li>
              <li>Complete your profile setup and change your password</li>
              <li>Familiarize yourself with the system dashboard</li>
              <li>Contact your supervisor for role-specific training</li>
              <li>Review hospital policies and procedures in the system</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <p style="margin: 0; color: #2c5aa0; font-weight: 600;">
              🎯 Ready to make a difference in eye care? Let's get started!
            </p>
          </div>

          <p style="text-align: center; margin: 20px 0;">
            If you have any questions or need assistance, please contact our IT support team or your department supervisor.
          </p>
          
          <p style="text-align: center; font-weight: 600; color: #2c5aa0;">
            Welcome to the OHMS family!<br>
            <strong>OHMS Eye Hospital Administration</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>OHMS Eye Hospital Management System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} OHMS Eye Hospital. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * HTML template for welcome email
   */
  getWelcomeTemplate(firstName, temporaryPassword) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to OHMS</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials-box { background: white; border: 2px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .password { font-family: 'Courier New', monospace; background: #f1f3f4; padding: 10px; border-radius: 4px; font-size: 16px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 OHMS Eye Hospital</h1>
        <p>Welcome to the Team!</p>
      </div>
      
      <div class="content">
        <h2>Welcome ${firstName}!</h2>
        
        <p>Your super admin account has been successfully created for the OHMS Eye Hospital Management System.</p>
        
        ${temporaryPassword ? `
        <div class="credentials-box">
          <h3>🔐 Your Login Credentials</h3>
          <p><strong>Email:</strong> (Your registered email)</p>
          <p><strong>Temporary Password:</strong></p>
          <div class="password">${temporaryPassword}</div>
          <p><small>⚠️ Please change your password immediately after first login</small></p>
        </div>
        ` : ''}
        
        <h3>🚀 Getting Started</h3>
        <ol>
          <li>Log in to your admin dashboard</li>
          ${temporaryPassword ? '<li>Change your temporary password</li>' : ''}
          <li>Complete your profile setup</li>
          <li>Start managing the hospital system</li>
        </ol>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
        
        <p>Best regards,<br>
        <strong>OHMS Eye Hospital Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} OHMS Eye Hospital Management System</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * HTML template for password change confirmation
   */
  getPasswordChangeTemplate(firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 OHMS Eye Hospital</h1>
        <p>Password Changed Successfully</p>
      </div>
      
      <div class="content">
        <h2>Hello ${firstName},</h2>
        
        <div class="success-box">
          <strong>✅ Password Changed Successfully</strong><br>
          Your password has been updated on ${new Date().toLocaleString()}.
        </div>
        
        <p>Your account password has been successfully changed. You can now use your new password to log in to the OHMS system.</p>
        
        <p><strong>🔒 Security Tip:</strong> If you didn't make this change, please contact our support team immediately and consider the following:</p>
        <ul>
          <li>Check your account for any unauthorized access</li>
          <li>Review recent login activities</li>
          <li>Contact support to secure your account</li>
        </ul>
        
        <p>Thank you for keeping your account secure.</p>
        
        <p>Best regards,<br>
        <strong>OHMS Eye Hospital Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} OHMS Eye Hospital Management System</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generic email sender for custom messages
   * @param {Object} options - Email options (to, subject, html, text)
   */
  async sendCustomEmail(options) {
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'OHMS - Eye Hospital',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
      },
      ...options
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Custom email sent to ${options.to}`);

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
      }

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(result) : null
      };
    } catch (error) {
      console.error('❌ Failed to send custom email:', error);
      throw new Error('Failed to send email');
    }
  }
}

// Create and export a singleton instance
const emailService = new EmailService();

module.exports = emailService;
