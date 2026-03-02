import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Phone, AlertCircle } from 'lucide-react';
import { patientService } from '@/services/patientService';

const otpLoginSchema = z.object({
  contactMethod: z.enum(['email', 'phone'], {
    required_error: 'Please select how to receive OTP',
  }),
  email: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => {
  if (data.contactMethod === 'email') {
    return data.email && z.string().email().safeParse(data.email).success;
  }
  if (data.contactMethod === 'phone') {
    return data.phone && data.phone.length >= 10;
  }
  return false;
}, {
  message: 'Please provide valid contact information',
  path: ['contact'],
});

const OTPLogin = ({ onOTPRequest }) => {
  const [contactMethod, setContactMethod] = useState('email');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: {
      contactMethod: 'email'
    }
  });

  const watchContactMethod = watch('contactMethod');

  const sendOTPMutation = useMutation({
    mutationFn: patientService.sendLoginOTP,
    onSuccess: (data) => {
      setError('');
      onOTPRequest({
        email: watchContactMethod === 'email' ? watch('email') : '',
        phone: watchContactMethod === 'phone' ? watch('phone') : '',
        contactMethod: watchContactMethod
      });
    },
    onError: (error) => {
      setError(error.message || 'Failed to send OTP. Please try again.');
    }
  });

  const onFormSubmit = (data) => {
    setError('');
    const otpData = {
      contactMethod: data.contactMethod,
      [data.contactMethod]: data[data.contactMethod]
    };
    sendOTPMutation.mutate(otpData);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Login with OTP</h2>
        <p className="text-gray-600 text-sm">We'll send a verification code to your contact</p>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            How would you like to receive the OTP?
          </Label>
          <RadioGroup 
            value={contactMethod} 
            onValueChange={(value) => {
              setContactMethod(value);
              register('contactMethod').onChange({ target: { value } });
            }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="flex items-center space-x-2 border rounded-lg p-2">
              <RadioGroupItem value="email" id="email-method" />
              <Label htmlFor="email-method" className="flex items-center space-x-2 cursor-pointer">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Email</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-2">
              <RadioGroupItem value="phone" id="phone-method" />
              <Label htmlFor="phone-method" className="flex items-center space-x-2 cursor-pointer">
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-sm">Phone</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {contactMethod === 'email' && (
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10 py-2"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
        )}

        {contactMethod === 'phone' && (
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                className="pl-10 py-2"
                {...register('phone')}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.phone.message}</p>
            )}
          </div>
        )}

        {errors.contact && (
          <p className="text-xs text-red-600">{errors.contact.message}</p>
        )}

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-2"
          disabled={isSubmitting || sendOTPMutation.isPending}
        >
          {isSubmitting || sendOTPMutation.isPending ? 'Sending OTP...' : 'Send OTP'}
        </Button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-600">
          Remember your password?{' '}
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in with password
          </button>
        </p>
      </div>
    </div>
  );
};

export default OTPLogin;