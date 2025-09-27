import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  MessageCircle,
  Loader2,
  Mail,
  Lock,
  User,
  AlertCircle,
  Shield,
  CheckCircle,
  ArrowLeft,
  Camera,
  Upload,
  UserCircle,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Heart,
  Star,
  ArrowRight,
  X,
  Check,
  Crown
} from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { authAPI } from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  // Verification states
  const [otp, setOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Profile picture states
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Animated background elements
  const [floatingElements, setFloatingElements] = useState([]);

  useEffect(() => {
    // Generate floating elements for background animation
    const elements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 25 + 8,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 6
    }));
    setFloatingElements(elements);
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      await authAPI.register(registrationData);

      // Show verification step instead of navigating
      setShowVerification(true);
      setCountdown(60); // Start cooldown for resend
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccess('');

    if (!otp) {
      setVerifyError('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      setVerifyError('Verification code must be 6 digits');
      return;
    }

    setVerifyLoading(true);

    try {
      await authAPI.verifyEmail(formData.email, otp);
      setShowVerification(false);
      setShowProfilePicture(true);
      setVerifySuccess('Email verified successfully!');
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResending(true);
    setVerifyError('');
    setVerifySuccess('');

    try {
      await authAPI.resendOTP(formData.email);
      setVerifySuccess('Verification code sent! Please check your email.');
      setCountdown(60);
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleBackToRegistration = () => {
    setShowVerification(false);
    setShowProfilePicture(false);
    setProfileComplete(false);
    setOtp('');
    setVerifyError('');
    setVerifySuccess('');
    setCountdown(0);
    setProfilePicture(null);
    setProfilePicturePreview(null);
    setProfileError('');
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setProfileError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setProfileError('Image size should be less than 5MB');
        return;
      }

      setProfileError('');
      setProfilePicture(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    setUploadLoading(true);
    setProfileError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('profilePicture', profilePicture);
      formDataToSend.append('email', formData.email);

      await authAPI.uploadProfilePicture(formDataToSend);
      setProfileComplete(true);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSkipProfilePicture = () => {
    setProfileComplete(true);
  };

  const handleBackToVerification = () => {
    setShowProfilePicture(false);
    setShowVerification(true);
    setProfilePicture(null);
    setProfilePicturePreview(null);
    setProfileError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Success screen after profile setup
  if (profileComplete) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingElements.map((element) => (
            <div
              key={element.id}
              className="absolute rounded-full bg-gradient-to-r from-emerald-400/20 to-green-400/20 animate-pulse"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.size}px`,
                height: `${element.size}px`,
                animationDuration: `${element.duration}s`,
                animationDelay: `${element.delay}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl text-center hover:shadow-emerald-500/10 transition-all duration-300">
              <CardHeader className="space-y-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full border-4 border-white animate-pulse">
                    <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                    Welcome to Chatrix!
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Your account has been successfully created and verified. You're all set to start chatting!
                  </CardDescription>
                </div>

                <div className="flex justify-center gap-3">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-teal-200">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 border-l-4 border-l-emerald-500">
                  <CheckCircle className="h-5 w-5" />
                  <AlertDescription className="font-medium">
                    Account created and verified successfully for <strong>{formData.email}</strong>
                  </AlertDescription>
                </Alert>

                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-3 text-emerald-700">
                    <Crown className="w-5 h-5" />
                    <span className="font-medium">What's next?</span>
                  </div>
                  <p className="text-sm text-emerald-600 mt-2">
                    Join rooms, connect with friends, and start having amazing conversations in real-time!
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
                <Link to="/login" className="w-full">
                  <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center gap-3">
                      <span>Continue to Login</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={handleBackToRegistration}
                  className="w-full border-2 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Create Another Account
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Email verification screen
  if (showVerification) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingElements.map((element) => (
            <div
              key={element.id}
              className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.size}px`,
                height: `${element.size}px`,
                animationDuration: `${element.duration}s`,
                animationDelay: `${element.delay}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl hover:shadow-blue-500/10 transition-all duration-300">
              <CardHeader className="space-y-4 text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Mail className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-4 border-white animate-pulse">
                    <div className="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Verify Your Email
                  </CardTitle>
                  <CardDescription className="text-base">
                    We've sent a 6-digit verification code to
                    <br />
                    <span className="font-semibold text-blue-600">{formData.email}</span>
                  </CardDescription>
                </div>

                <div className="flex justify-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                    <Zap className="w-3 h-3 mr-1" />
                    One-time
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {verifyError && (
                  <Alert variant="destructive" className="animate-fade-in border-l-4 border-l-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="font-medium">
                      {verifyError}
                    </AlertDescription>
                  </Alert>
                )}

                {verifySuccess && (
                  <Alert className="animate-fade-in border-l-4 border-l-green-500 bg-green-50 border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800 font-medium">
                      {verifySuccess}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleVerifyEmail} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="otp" className="text-sm font-medium text-center block">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={handleOtpChange}
                      className="text-center text-2xl font-mono tracking-widest h-16 border-2 focus:border-blue-500 focus:ring-blue-200 bg-gray-50 focus:bg-white transition-all duration-300"
                      maxLength={6}
                      disabled={verifyLoading}
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                    disabled={verifyLoading || otp.length !== 6}
                    size="lg"
                  >
                    {verifyLoading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5" />
                        <span>Verify Email</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendOTP}
                      disabled={resending || countdown > 0}
                      className="w-full border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                    >
                      {resending ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </div>
                      ) : countdown > 0 ? (
                        <span>Resend in {countdown}s</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>Resend Code</span>
                        </div>
                      )}
                    </Button>
                  </div>

                  <Separator className="bg-gradient-to-r from-blue-200 to-purple-200" />

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToRegistration}
                    className="w-full hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Registration
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center space-y-1 bg-gray-50 rounded-lg p-3">
                  <p className="flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3" />
                    The verification code will expire in 10 minutes
                  </p>
                  <p>Check your spam folder if you don't see the email</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Profile picture upload screen
  if (showProfilePicture) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingElements.map((element) => (
            <div
              key={element.id}
              className="absolute rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.size}px`,
                height: `${element.size}px`,
                animationDuration: `${element.duration}s`,
                animationDelay: `${element.delay}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="space-y-4 text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full border-4 border-white animate-pulse">
                    <div className="w-full h-full bg-purple-400 rounded-full animate-ping"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                    Complete Your Profile
                  </CardTitle>
                  <CardDescription className="text-base">
                    Add a profile picture to help others recognize you
                    <br />
                    <span className="text-sm text-muted-foreground">(Optional - you can skip this step)</span>
                  </CardDescription>
                </div>

                <div className="flex justify-center gap-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                    <Camera className="w-3 h-3 mr-1" />
                    Optional
                  </Badge>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 border-pink-200">
                    <Heart className="w-3 h-3 mr-1" />
                    Personal
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {profileError && (
                  <Alert variant="destructive" className="animate-fade-in border-l-4 border-l-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="font-medium">
                      {profileError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col items-center space-y-6">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-dashed border-purple-300 flex items-center justify-center overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-purple-400">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <UserCircle className="w-16 h-16 text-purple-400 group-hover:text-purple-500 transition-colors" />
                      )}
                    </div>
                    <label
                      htmlFor="profilePicture"
                      className="absolute bottom-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-3 cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                    >
                      <Upload className="w-5 h-5" />
                    </label>
                    <input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {profilePicture ? 'Profile picture selected!' : 'Click the upload button to select an image'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 5MB • Supported formats: JPG, PNG, GIF
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {profilePicture && (
                    <Button
                      onClick={handleUploadProfilePicture}
                      disabled={uploadLoading}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                    >
                      {uploadLoading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Upload className="w-5 h-5" />
                          <span>Upload Profile Picture</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleSkipProfilePicture}
                    className="w-full border-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300"
                    disabled={uploadLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Skip for Now
                  </Button>
                </div>

                <Separator className="bg-gradient-to-r from-purple-200 to-pink-200" />

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToVerification}
                  className="w-full hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-300"
                  disabled={uploadLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Verification
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Registration form (default view)
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingElements.map((element) => (
          <div
            key={element.id}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.size}px`,
              height: `${element.size}px`,
              animationDuration: `${element.duration}s`,
              animationDelay: `${element.delay}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300 animate-bounce">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse">
                <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Join Chatrix
              </h1>
              <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Create your account and start chatting
                <Sparkles className="w-4 h-4 text-purple-500" />
              </p>
            </div>

            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                <Star className="w-3 h-3 mr-1" />
                Free
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <Zap className="w-3 h-3 mr-1" />
                Real-time
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                <Heart className="w-3 h-3 mr-1" />
                Secure
              </Badge>
            </div>
          </div>

          {/* Registration Card */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl hover:shadow-blue-500/10 transition-all duration-300">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-center text-base">
                Join thousands of users in real-time conversations
              </CardDescription>
              <Separator className="bg-gradient-to-r from-blue-200 to-purple-200" />
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Username Field */}
                <div className="space-y-3">
                  <Label
                    htmlFor="username"
                    className={`text-sm font-medium transition-colors ${
                      isFocused.username ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Username
                  </Label>
                  <div className="relative group">
                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                      isFocused.username ? 'text-blue-500 scale-110' : 'text-muted-foreground'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Choose a unique username"
                      className={`pl-12 h-12 text-base transition-all duration-300 border-2 ${
                        errors.username
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : isFocused.username
                          ? 'border-blue-400 focus:border-blue-500 focus:ring-blue-200 shadow-lg'
                          : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                      } ${errors.username ? 'animate-shake' : ''}`}
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => handleFocus('username')}
                      onBlur={() => handleBlur('username')}
                      disabled={loading}
                    />
                    {formData.username && !errors.username && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {errors.username && (
                    <div className="flex items-center gap-2 text-red-600 text-sm animate-fade-in">
                      <X className="w-4 h-4" />
                      {errors.username}
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className={`text-sm font-medium transition-colors ${
                      isFocused.email ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Email Address
                  </Label>
                  <div className="relative group">
                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                      isFocused.email ? 'text-blue-500 scale-110' : 'text-muted-foreground'
                    }`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className={`pl-12 h-12 text-base transition-all duration-300 border-2 ${
                        errors.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : isFocused.email
                          ? 'border-blue-400 focus:border-blue-500 focus:ring-blue-200 shadow-lg'
                          : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                      } ${errors.email ? 'animate-shake' : ''}`}
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      disabled={loading}
                    />
                    {formData.email && !errors.email && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <div className="flex items-center gap-2 text-red-600 text-sm animate-fade-in">
                      <X className="w-4 h-4" />
                      {errors.email}
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-3">
                  <Label
                    htmlFor="password"
                    className={`text-sm font-medium transition-colors ${
                      isFocused.password ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Password
                  </Label>
                  <div className="relative group">
                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                      isFocused.password ? 'text-blue-500 scale-110' : 'text-muted-foreground'
                    }`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className={`pl-12 pr-12 h-12 text-base transition-all duration-300 border-2 ${
                        errors.password
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : isFocused.password
                          ? 'border-blue-400 focus:border-blue-500 focus:ring-blue-200 shadow-lg'
                          : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                      } ${errors.password ? 'animate-shake' : ''}`}
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-blue-500 transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-2 text-red-600 text-sm animate-fade-in">
                      <X className="w-4 h-4" />
                      {errors.password}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must contain at least 6 characters with uppercase, lowercase, and number
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-3">
                  <Label
                    htmlFor="confirmPassword"
                    className={`text-sm font-medium transition-colors ${
                      isFocused.confirmPassword ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Confirm Password
                  </Label>
                  <div className="relative group">
                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                      isFocused.confirmPassword ? 'text-blue-500 scale-110' : 'text-muted-foreground'
                    }`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className={`pl-12 pr-12 h-12 text-base transition-all duration-300 border-2 ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : isFocused.confirmPassword
                          ? 'border-blue-400 focus:border-blue-500 focus:ring-blue-200 shadow-lg'
                          : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                      } ${errors.confirmPassword ? 'animate-shake' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => handleFocus('confirmPassword')}
                      onBlur={() => handleBlur('confirmPassword')}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-blue-500 transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-2 text-red-600 text-sm animate-fade-in">
                      <X className="w-4 h-4" />
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive" className="animate-fade-in border-l-4 border-l-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading || !formData.username || !formData.email || !formData.password || !formData.confirmPassword}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating your account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-blue-600 hover:text-purple-600 transition-colors hover:underline"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-3">
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                End-to-end encrypted
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                Lightning fast
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              By creating an account, you agree to our terms of service and privacy policy.
              Join the conversation and connect with others in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;