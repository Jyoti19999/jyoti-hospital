// src\pages\PatientLogin.jsx - Patient login page with password and OTP options
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Key, Smartphone } from 'lucide-react';
import PasswordLogin from '@/components/patient-login/PasswordLogin';
import OTPLogin from '@/components/patient-login/OTPLogin';
import OTPVerification from '@/components/patient-login/OTPVerification';
import LoginSuccess from '@/components/patient-login/LoginSuccess';

const PatientLogin = () => {
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [currentStep, setCurrentStep] = useState('login'); // 'login', 'otp-verification', 'success'
  const [loginData, setLoginData] = useState({
    email: '',
    phone: '',
    patientName: ''
  });

  const handlePasswordLogin = (data) => {
    setLoginData({
      email: data.email,
      patientName: `${data.firstName} ${data.lastName}`
    });
    setCurrentStep('success');
  };

  const handleOTPRequest = (data) => {
    setLoginData({
      email: data.email,
      phone: data.phone
    });
    setCurrentStep('otp-verification');
  };

  const handleOTPVerified = (data) => {
    setLoginData(prev => ({
      ...prev,
      patientName: `${data.firstName} ${data.lastName}`
    }));
    setCurrentStep('success');
  };

  const handleBackToLogin = () => {
    setCurrentStep('login');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'login':
        return loginMethod === 'password' ? (
          <PasswordLogin onLoginSuccess={handlePasswordLogin} />
        ) : (
          <OTPLogin onOTPRequest={handleOTPRequest} />
        );
      case 'otp-verification':
        return (
          <OTPVerification
            email={loginData.email}
            phoneNumber={loginData.phone}
            onVerified={handleOTPVerified}
            onBack={handleBackToLogin}
            isLoginFlow={true}
          />
        );
      case 'success':
        return <LoginSuccess patientName={loginData.patientName} />;
      default:
        return loginMethod === 'password' ? (
          <PasswordLogin onLoginSuccess={handlePasswordLogin} />
        ) : (
          <OTPLogin onOTPRequest={handleOTPRequest} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header - More Compact */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Patient Login</h1>
          <p className="text-sm text-gray-600">OphthalmoVision Institute</p>
        </div>

        {/* Login Method Tabs - Only show on login step */}
        {currentStep === 'login' && (
          <div className="mb-4">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <Button
                variant={loginMethod === 'password' ? 'default' : 'ghost'}
                onClick={() => setLoginMethod('password')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 ${
                  loginMethod === 'password'
                    ? 'bg-white shadow-sm text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Key className="h-4 w-4" />
                <span className="text-sm font-medium">Password</span>
              </Button>
              <Button
                variant={loginMethod === 'otp' ? 'default' : 'ghost'}
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 ${
                  loginMethod === 'otp'
                    ? 'bg-white shadow-sm text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-medium">OTP</span>
              </Button>
            </div>
          </div>
        )}

        {/* Login Form Card - More Compact */}
        <Card className="p-5 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          {renderCurrentStep()}
        </Card>

        {/* Footer - More Compact */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;
