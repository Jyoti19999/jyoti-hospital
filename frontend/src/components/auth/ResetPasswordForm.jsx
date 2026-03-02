// src/components/auth/ResetPasswordForm.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPasswordForm = ({ email, resetToken, onPasswordReset }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  });

  const password = watch('password');

  // Password strength indicators
  const passwordStrength = {
    hasMinLength: password?.length >= 6,
    hasLowercase: /(?=.*[a-z])/.test(password),
    hasUppercase: /(?=.*[A-Z])/.test(password),
    hasNumber: /(?=.*\d)/.test(password),
  };

  // TanStack Query mutation for resetting password
  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: (data) => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully. You can now login with your new password.",
        variant: "default",
      });
      onPasswordReset();
    },
    onError: (error) => {
      
      let errorMessage = "Failed to reset password. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.status) {
        switch (error.status) {
          case 400:
            errorMessage = error.message || "Invalid password format or token expired.";
            break;
          case 401:
            errorMessage = error.message || "Reset token has expired. Please request a new one.";
            break;
          case 422:
            errorMessage = error.message || "Password doesn't meet security requirements.";
            break;
          default:
            errorMessage = error.message || `Error ${error.status}. Please try again.`;
        }
      }
      
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onFormSubmit = (data) => {
    resetPasswordMutation.mutate({
      email,
      resetToken,
      newPassword: data.password,
      confirmPassword: data.confirmPassword
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset Password</h2>
        <p className="text-gray-600 text-sm">Enter your new password for <span className="font-medium text-gray-800">{email}</span></p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            New Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              className="pl-10 pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
          
          {/* Password Strength Indicators */}
          {password && (
            <div className="space-y-1 mt-2">
              <p className="text-xs text-gray-600">Password requirements:</p>
              <div className="space-y-1">
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className={`h-3 w-3 ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-300'}`} />
                  At least 6 characters
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className={`h-3 w-3 ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-300'}`} />
                  One lowercase letter
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className={`h-3 w-3 ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-300'}`} />
                  One uppercase letter
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className={`h-3 w-3 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-300'}`} />
                  One number
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Confirm New Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              className="pl-10 pr-10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Your password will be encrypted and stored securely.
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
