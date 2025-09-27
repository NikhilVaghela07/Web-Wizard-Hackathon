const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (send OTP for verification)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide username, email, and password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        if (existingUser.isEmailVerified) {
          return res.status(400).json({ 
            message: 'User with this email already exists and is verified' 
          });
        }
        // User exists but not verified, update their details and resend OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        existingUser.username = username;
        existingUser.password = password;
        existingUser.emailOTP = otp;
        existingUser.otpExpires = otpExpires;
        await existingUser.save();

        await sendOTPEmail(email, username, otp);

        return res.status(200).json({
          message: 'Registration updated. Please check your email for verification code.',
          email: email
        });
      } else {
        return res.status(400).json({ 
          message: 'Username is already taken' 
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user (unverified)
    const user = new User({
      username,
      email,
      password,
      emailOTP: otp,
      otpExpires: otpExpires,
      isEmailVerified: false
    });

    await user.save();

    // Send OTP email
    await sendOTPEmail(email, username, otp);

    res.status(201).json({
      message: 'Registration successful! Please check your email for verification code.',
      email: email
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    if (error.message === 'Failed to send verification email') {
      return res.status(500).json({ message: 'Registration successful but failed to send verification email. Please try resending.' });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }

    // Find user and check password
    const user = await User.findByCredentials(email, password);

    // Update user online status
    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastSeen: new Date()
    });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid login credentials') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (error.message === 'Please verify your email before logging in') {
      return res.status(401).json({ 
        message: 'Please verify your email before logging in',
        needsVerification: true,
        email: email
      });
    }
    
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Update user offline status
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date()
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        isOnline: req.user.isOnline,
        lastSeen: req.user.lastSeen
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (for admin or user list)
// @access  Private
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({ isEmailVerified: true }, 'username email isOnline lastSeen createdAt')
      .sort({ username: 1 });
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Please provide email and OTP'
      });
    }

    // Find user with matching email and OTP
    const user = await User.findOne({
      email,
      emailOTP: otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired OTP'
      });
    }

    // Mark user as verified and clear OTP fields
    user.isEmailVerified = true;
    user.emailOTP = null;
    user.otpExpires = null;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(email, user.username);

    // Generate token for automatic login
    const token = generateToken(user._id);

    res.json({
      message: 'Email verified successfully! Welcome to Chat App!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: true
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for email verification
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Please provide email address'
      });
    }

    // Find unverified user
    const user = await User.findOne({
      email,
      isEmailVerified: false
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found or already verified'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, user.username, otp);

    res.json({
      message: 'Verification code sent successfully! Please check your email.',
      email: email
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    
    if (error.message === 'Failed to send verification email') {
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
    
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
});

module.exports = router;