const nodemailer = require('nodemailer');

// Create transporter with SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, username, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Chat App',
        address: process.env.SMTP_USER
      },
      to: email,
      subject: 'Email Verification - Chat App',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Chat App!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Verify your email to get started</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${username}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for registering with Chat App. To complete your account setup and start chatting, 
              please verify your email address using the OTP below:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code</p>
              <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">This code expires in 10 minutes</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you didn't create an account with Chat App, you can safely ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Chat App',
        address: process.env.SMTP_USER
      },
      to: email,
      subject: 'Welcome to Chat App! 🎉',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Chat App!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account is now verified and ready to use</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${username}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Congratulations! Your email has been successfully verified. You can now enjoy all features of Chat App:
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
              <ul style="color: #666; padding-left: 0; list-style: none;">
                <li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  💬 Real-time messaging with other users
                </li>
                <li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  🏠 Create private chat rooms with unique codes
                </li>
                <li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  👥 Invite friends to your chat rooms
                </li>
                <li style="padding: 8px 0;">
                  🔒 Secure and private conversations
                </li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Start exploring and connect with friends and colleagues in a whole new way!
            </p>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                 style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Start Chatting Now
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email as it's not critical
    return false;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail
};