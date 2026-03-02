
import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { patientService } from '@/services/patientService';
import { useAuth } from '@/contexts/AuthContext';

const OTPVerification = ({
  phoneNumber = '',
  email = '',
  onVerified,
  onBack,
  isLoginFlow = false // New prop to distinguish login vs registration
}) => {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const verifyOTPMutation = useMutation({
    mutationFn: isLoginFlow 
      ? patientService.verifyLoginOTP 
      : patientService.verifyOTPAndRegister,
    onSuccess: (data) => {
      setError('');
      
      if (isLoginFlow) {
        // For login flow, update auth context and redirect
        const patientData = data.data;
        patientData.role = 'patient'; // Ensure role is set
        login(patientData);
        
        // Call the callback for UI updates
        onVerified(patientData);
        
        // Redirect to intended page or patient dashboard
        const from = location.state?.from?.pathname || '/patient-dashboard';
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500); // Small delay to show success message
      } else {
        // For registration flow, just call the callback
        onVerified(data.data);
      }
    },
    onError: (error) => {
      setError(error.message || 'Invalid or expired OTP. Please try again.');
    }
  });

  const resendOTPMutation = useMutation({
    mutationFn: isLoginFlow 
      ? patientService.resendLoginOTP 
      : patientService.resendRegistrationOTP,
    onSuccess: (data) => {
      setError('');
      setCountdown(30);
      setCanResend(false);
      setOtp('');
    },
    onError: (error) => {
      setError(error.message || 'Failed to resend OTP. Please try again.');
    }
  });

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) return;
    
    setError('');
    const verificationData = {
      otp,
      email: email || undefined,
      mobileNumber: phoneNumber || undefined
    };
    
    verifyOTPMutation.mutate(verificationData);
  };

  const handleResendOTP = () => {
    setError('');
    const resendData = {
      email: email || undefined,
      mobileNumber: phoneNumber || undefined
    };
    
    resendOTPMutation.mutate(resendData);
  };

  const maskContact = (contact) => {
    if (!contact) return '';
    if (contact.includes('@')) {
      // Email masking
      const [username, domain] = contact.split('@');
      if (username.length <= 2) return contact;
      return username.slice(0, 2) + '*'.repeat(username.length - 2) + '@' + domain;
    } else {
      // Phone masking
      if (contact.length < 4) return contact;
      return contact.slice(0, -4).replace(/\d/g, '*') + contact.slice(-4);
    }
  };

  const displayContact = email || phoneNumber;
  const contactType = email ? 'email' : 'phone';

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {isLoginFlow ? 'Verify Login Code' : 'Verify Your Code'}
        </h2>
        <p className="text-gray-600 text-sm mb-2">
          We've sent a 4-digit code to your {contactType}
        </p>
        <p className="text-gray-900 font-medium text-sm">{maskContact(displayContact)}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="flex justify-center">
          <InputOTP
            maxLength={4}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleVerifyOTP}
          disabled={otp.length !== 4 || verifyOTPMutation.isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2"
        >
          {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify Code'}
        </Button>

        <div className="text-center space-y-1">
          <p className="text-xs text-gray-600">
            Didn't receive the code?
          </p>
          {canResend ? (
            <Button
              variant="ghost"
              onClick={handleResendOTP}
              disabled={resendOTPMutation.isPending}
              className="text-blue-600 hover:text-blue-700 h-8 text-sm"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {resendOTPMutation.isPending ? 'Sending...' : 'Resend Code'}
            </Button>
          ) : (
            <p className="text-xs text-gray-500">
              Resend in {countdown}s
            </p>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-9 text-sm"
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          {isLoginFlow ? 'Back to Login' : 'Back to Details'}
        </Button>
      </div>
    </div>
  );
};

export default OTPVerification;
