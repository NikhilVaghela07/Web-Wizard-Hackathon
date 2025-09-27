import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
  X,
  Shield
} from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { authAPI } from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [successMessage, setSuccessMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Animated background elements
  const [floatingElements, setFloatingElements] = useState([]);

  useEffect(() => {
    // Generate floating elements for background animation
    const elements = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5
    }));
    setFloatingElements(elements);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general error
    if (error) setError('');
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData);

      if (result.success) {
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Handle specific error cases
        if (result.error?.includes('not verified')) {
          setNeedsVerification(true);
          setError('Your email is not verified. Please check your email for verification instructions.');
        } else {
          setError(result.error || 'Login failed. Please check your credentials and try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await authAPI.resendOTP(formData.email);
      setSuccessMessage('Verification email sent! Please check your inbox.');
      setError('');
      setTimeout(() => {
        navigate('/verify-email', {
          state: { email: formData.email }
        });
      }, 2000);
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
                Welcome Back
              </h1>
              <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Sign in to continue your conversation
                <Sparkles className="w-4 h-4 text-purple-500" />
              </p>
            </div>

            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                <Star className="w-3 h-3 mr-1" />
                Secure
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <Zap className="w-3 h-3 mr-1" />
                Real-time
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                <Heart className="w-3 h-3 mr-1" />
                Private
              </Badge>
            </div>
          </div>

          {/* Login Card */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl hover:shadow-blue-500/10 transition-all duration-300">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-base">
                Enter your credentials to access your account
              </CardDescription>
              <Separator className="bg-gradient-to-r from-blue-200 to-purple-200" />
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
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
                        <CheckCircle className="w-5 h-5" />
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
                      placeholder="Enter your password"
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
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <Alert variant={needsVerification ? "default" : "destructive"} className="animate-fade-in border-l-4 border-l-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="font-medium">
                      {error}
                      {needsVerification && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResendVerification}
                            disabled={loading}
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Resend Verification Email
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="animate-fade-in border-l-4 border-l-green-500 bg-green-50 border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800 font-medium">
                      {successMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading || !formData.email || !formData.password}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing you in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-blue-600 hover:text-purple-600 transition-colors hover:underline"
                    >
                      Create one here
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
              By signing in, you agree to our terms of service and privacy policy.
              Join thousands of users in real-time conversations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;