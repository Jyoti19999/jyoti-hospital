// src/components/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPasswordForm = ({ onEmailSent, onBack }) => {
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(emailSchema)
  });

  // TanStack Query mutation for sending reset email
  const sendResetEmailMutation = useMutation({
    mutationFn: authService.sendPasswordResetEmail,
    onSuccess: (data, variables) => {
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for the OTP code.",
        variant: "default",
      });
      onEmailSent(variables.email);
    },
    onError: (error) => {
      
      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.status) {
        switch (error.status) {
          case 404:
            errorMessage = error.message || "Email address not found in our system.";
            break;
          case 429:
            errorMessage = error.message || "Too many requests. Please wait before trying again.";
            break;
          case 500:
            errorMessage = error.message || "Server error. Please try again later.";
            break;
          default:
            errorMessage = error.message || `Error ${error.status}. Please try again.`;
        }
      }
      
      toast({
        title: "Failed to Send Email",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onFormSubmit = (data) => {
    sendResetEmailMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Forgot Password</h2>
        <p className="text-gray-600 text-sm">Enter your email address and we'll send you an OTP to reset your password</p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          disabled={sendResetEmailMutation.isPending}
        >
          {sendResetEmailMutation.isPending ? 'Sending...' : 'Send Reset Code'}
        </Button>
      </form>

      <Button
        variant="ghost"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </Button>
    </div>
  );
};

export default ForgotPasswordForm;
