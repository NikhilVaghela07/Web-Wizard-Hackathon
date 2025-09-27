import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { MessageCircle, Loader2, Mail, Lock, User, AlertCircle, Shield, CheckCircle, ArrowLeft, Camera, Upload, UserCircle } from "lucide-react";
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
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  
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

  // Countdown timer for resend button
  React.useEffect(() => {
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
    setVerificationSuccess(false);
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

  // Success screen after profile setup
  if (profileComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm text-center">
            <CardHeader className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-700">
                Welcome to ChatApp!
              </CardTitle>
              <CardDescription className="text-base">
                Your email has been successfully verified. You can now login to start chatting with friends!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-800 text-left">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Account created and verified successfully for <strong>{formData.email}</strong>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Link to="/login" className="w-full">
                <Button className="w-full" size="lg">
                  Continue to Login
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleBackToRegistration}
                className="w-full"
              >
                Create Another Account
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Email verification screen
  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
              <CardDescription>
                We've sent a 6-digit verification code to
                <br />
                <span className="font-medium text-gray-700">{formData.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verifyError && (
                <Alert variant="destructive">
                  <AlertDescription>{verifyError}</AlertDescription>
                </Alert>
              )}
              {verifySuccess && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{verifySuccess}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={handleOtpChange}
                    className="text-center text-lg font-mono tracking-wider"
                    maxLength={6}
                    disabled={verifyLoading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={verifyLoading || otp.length !== 6}
                >
                  {verifyLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Verify Email
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Didn't receive the code?</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={resending || countdown > 0}
                  className="w-full"
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    'Resend Code'
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToRegistration}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Registration
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>The verification code will expire in 10 minutes.</p>
                <p>Check your spam folder if you don't see the email.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Profile picture upload screen
  if (showProfilePicture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Camera className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
              <CardDescription>
                Add a profile picture to help others recognize you
                <br />
                <span className="text-sm text-muted-foreground">(Optional - you can skip this step)</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileError && (
                <Alert variant="destructive">
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <UserCircle className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <label htmlFor="profilePicture" className="absolute bottom-0 right-0 bg-purple-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-purple-700 transition-colors">
                    <Upload className="w-3 h-3" />
                  </label>
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
                
                <p className="text-sm text-center text-muted-foreground">
                  Click the upload button to select an image
                  <br />
                  Maximum file size: 5MB
                </p>
              </div>

              <div className="space-y-3">
                {profilePicture && (
                  <Button 
                    onClick={handleUploadProfilePicture}
                    disabled={uploadLoading}
                    className="w-full"
                  >
                    {uploadLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Profile Picture
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={handleSkipProfilePicture}
                  className="w-full"
                  disabled={uploadLoading}
                >
                  Skip for Now
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToVerification}
                  className="w-full"
                  disabled={uploadLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Registration form (default view)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Join ChatApp</h1>
          <p className="text-muted-foreground">
            Create your account to start chatting
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Create account</CardTitle>
            <CardDescription>
              We'll send you a verification email to get started.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    className="pl-10"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    className="pl-10"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
              
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-primary hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;