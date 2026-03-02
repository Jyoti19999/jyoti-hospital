// src/components/auth/OTPVerificationForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

const OTPVerificationForm = ({ email, onOTPVerified, onBack }) => {
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(otpSchema)
  });

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // TanStack Query mutation for verifying OTP
  const verifyOTPMutation = useMutation({
    mutationFn: authService.verifyPasswordResetOTP,
    onSuccess: (data) => {
      toast({
        title: "OTP Verified",
        description: "Please enter your new password.",
        variant: "default",
      });
      onOTPVerified(data);
    },
    onError: (error) => {
      
      let errorMessage = "Invalid OTP. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.status) {
        switch (error.status) {
          case 400:
            errorMessage = error.message || "Invalid OTP format.";
            break;
          case 401:
            errorMessage = error.message || "Invalid or expired OTP.";
            break;
          case 429:
            errorMessage = error.message || "Too many attempts. Please wait before trying again.";
            break;
          default:
            errorMessage = error.message || `Error ${error.status}. Please try again.`;
        }
      }
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // TanStack Query mutation for resending OTP
  const resendOTPMutation = useMutation({
    mutationFn: authService.sendPasswordResetEmail,
    onSuccess: () => {
      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your email.",
        variant: "default",
      });
      setResendTimer(60);
      setCanResend(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Resend",
        description: error.message || "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onFormSubmit = (data) => {
    verifyOTPMutation.mutate({ email, otp: data.otp });
  };

  const handleResendOTP = () => {
    resendOTPMutation.mutate({ email });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify OTP</h2>
        <p className="text-gray-600 text-sm">
          We've sent a 6-digit code to <br />
          <span className="font-medium text-gray-800">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
            Enter OTP
          </Label>
          <Input
            id="otp"
            placeholder="Enter 6-digit code"
            className="text-center text-lg tracking-widest"
            maxLength={6}
            {...register('otp')}
          />
          {errors.otp && (
            <p className="text-sm text-red-600">{errors.otp.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          disabled={verifyOTPMutation.isPending}
        >
          {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify OTP'}
        </Button>
      </form>

      <div className="text-center space-y-3">
        <p className="text-sm text-gray-600">
          Didn't receive the code?
        </p>
        
        {canResend ? (
          <Button
            variant="ghost"
            onClick={handleResendOTP}
            disabled={resendOTPMutation.isPending}
            className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className={`h-4 w-4 ${resendOTPMutation.isPending ? 'animate-spin' : ''}`} />
            {resendOTPMutation.isPending ? 'Sending...' : 'Resend OTP'}
          </Button>
        ) : (
          <p className="text-sm text-gray-500">
            Resend OTP in {resendTimer} seconds
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Email
      </Button>
    </div>
  );
};

export default OTPVerificationForm;
