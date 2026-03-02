// src\pages\SuperAdminLogin.jsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import SuperAdminLoginForm from '@/components/auth/SuperAdminLoginForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import OTPVerificationForm from '@/components/auth/OTPVerificationForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import LoginRedirect from '@/components/auth/LoginRedirect';

const SuperAdminLogin = () => {
  const [currentStep, setCurrentStep] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleLoginSuccess = (data) => {
    // Handle successful login here
    // For example, redirect to super admin dashboard

    // You can add navigation logic here
    // navigate('/super-admin-dashboard');
  };
  const handleForgotPassword = () => {
    setCurrentStep('forgot-password');
  };

  const handleEmailSent = (email) => {
    setResetEmail(email);
    setCurrentStep('otp-verification');
  };

  const handleOTPVerified = (data) => {
    // Assuming the API returns a reset token after OTP verification
    setResetToken(data.resetToken || data.token || 'verified');
    setCurrentStep('reset-password');
  };

  const handlePasswordReset = () => {
    // Reset to login form after successful password reset
    setCurrentStep('login');
    setResetEmail('');
    setResetToken('');
  };

  const handleBackToLogin = () => {
    setCurrentStep('login');
    setResetEmail('');
    setResetToken('');
  };

  const handleBackToEmail = () => {
    setCurrentStep('forgot-password');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'login':
        return (
          <SuperAdminLoginForm
            onSubmit={handleLoginSuccess}
            onForgotPassword={handleForgotPassword}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onEmailSent={handleEmailSent}
            onBack={handleBackToLogin}
          />
        );
      case 'otp-verification':
        return (
          <OTPVerificationForm
            email={resetEmail}
            onOTPVerified={handleOTPVerified}
            onBack={handleBackToEmail}
          />
        );
      case 'reset-password':
        return (
          <ResetPasswordForm
            email={resetEmail}
            resetToken={resetToken}
            onPasswordReset={handlePasswordReset}
          />
        );
      default:
        return (
          <SuperAdminLoginForm
            onSubmit={handleLoginSuccess}
            onForgotPassword={handleForgotPassword}
          />
        );
    }
  };

  const getHeaderTitle = () => {
    switch (currentStep) {
      case 'forgot-password':
        return 'Password Recovery';
      case 'otp-verification':
        return 'Verify Identity';
      case 'reset-password':
        return 'Create New Password';
      default:
        return 'Super Admin Login';
    }
  };

  return (
    <LoginRedirect>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{getHeaderTitle()}</h1>
            <p className="text-gray-600">OphthalmoVision Institute</p>
          </div>

          {/* Form Card */}
          <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            {renderCurrentStep()}
          </Card>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              {currentStep === 'login' ? 'Authorized personnel only' : 'Secure password recovery'}
            </p>
          </div>
        </div>
      </div>
    </LoginRedirect>
  );
};

export default SuperAdminLogin;
