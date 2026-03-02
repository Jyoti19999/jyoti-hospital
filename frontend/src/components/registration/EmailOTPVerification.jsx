import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Mail, RefreshCw, Shield, Phone } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { usePatientMutations } from '@/services/patientService';
import { useToast } from '@/components/ui/use-toast';

const EmailOTPVerification = ({ email, mobileNumber, registrationData, onVerified, onBack }) => {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  // Get mutation configurations
  const mutations = usePatientMutations();
  
  // Setup verify OTP mutation
  const verifyOTPMutation = useMutation({
    ...mutations.verifyAndRegister,
    onSuccess: (response) => {
      toast({
        title: "Registration Successful!",
        description: `Welcome ${response.data.firstName}! Your patient number is ${response.data.patientNumber}`,
        duration: 5000,
      });
      onVerified(response.data);
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Setup resend OTP mutation
  const resendOTPMutation = useMutation({
    ...mutations.resendOTP,
    onSuccess: () => {
      toast({
        title: "OTP Resent",
        description: "Please check your email and mobile for the new verification code.",
        duration: 5000,
      });
      setCountdown(30);
      setCanResend(false);
      setOtp('');
    },
    onError: (error) => {
      toast({
        title: "Failed to Resend OTP",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) return;
    
    // Prepare registration data with OTP
    const registrationPayload = {
      email: email.trim(),
      mobileNumber: mobileNumber.trim(),
      otp: otp.trim(),
      firstName: registrationData.firstName.trim(),
      middleName: registrationData.middleName.trim(),
      lastName: registrationData.lastName.trim(),
      dateOfBirth: registrationData.dateOfBirth || null,
      gender: registrationData.gender
    };

    verifyOTPMutation.mutate(registrationPayload);
  };

  const handleResendOTP = () => {
    resendOTPMutation.mutate({
      email: email.trim(),
      mobileNumber: mobileNumber.trim()
    });
  };

  const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    return maskedLocal + '@' + domain;
  };

  const maskMobile = (mobile) => {
    if (mobile.length < 4) return mobile;
    return mobile.slice(0, -4).replace(/\d/g, '*') + mobile.slice(-4);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4 space-x-2">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Phone className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify Your Details</h2>
        <p className="text-gray-600 text-sm mb-4">
          We've sent a 4-digit code to both:
        </p>
        <div className="space-y-1">
          <p className="text-gray-900 font-medium flex items-center justify-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            {maskEmail(email)}
          </p>
          <p className="text-gray-900 font-medium flex items-center justify-center gap-2">
            <Phone className="h-4 w-4 text-green-600" />
            {maskMobile(mobileNumber)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
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
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {verifyOTPMutation.isPending ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </div>
          ) : (
            'Verify & Register'
          )}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          {canResend ? (
            <Button
              variant="ghost"
              onClick={handleResendOTP}
              disabled={resendOTPMutation.isPending}
              className="text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${resendOTPMutation.isPending ? 'animate-spin' : ''}`} />
              {resendOTPMutation.isPending ? 'Resending...' : 'Resend Code'}
            </Button>
          ) : (
            <p className="text-sm text-gray-500">
              Resend in {countdown}s
            </p>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onBack}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Basic Info
        </Button>
      </div>
    </div>
  );
};

export default EmailOTPVerification;