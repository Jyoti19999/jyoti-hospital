import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { patientService } from '@/services/patientService';
import { useAuth } from '@/contexts/AuthContext';

const passwordLoginSchema = z.object({
  contactMethod: z.enum(['email', 'phone'], {
    required_error: 'Please select login method',
  }),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => {
  if (data.contactMethod === 'email') {
    return data.email && data.email.trim() !== '' && z.string().email().safeParse(data.email).success;
  }
  if (data.contactMethod === 'phone') {
    const phoneRegex = /^\d{10}$/;
    return data.phone && phoneRegex.test(data.phone.trim());
  }
  return false;
}, {
  message: 'Please provide valid contact information',
  path: ['contactMethod'],
});

const PasswordLogin = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [contactMethod, setContactMethod] = useState('email');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      contactMethod: 'email'
    }
  });

  const watchContactMethod = watch('contactMethod');

  const loginMutation = useMutation({
    mutationFn: patientService.loginPatient,
    onSuccess: (data) => {
      setError('');
      
      // Update auth context with patient data
      const patientData = data.data;
      patientData.role = 'patient'; // Ensure role is set
      login(patientData);
      
      // Call the callback for UI updates
      onLoginSuccess(patientData);
      
      // Redirect to intended page or patient dashboard
      const from = location.state?.from?.pathname || '/patient-dashboard';
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500); // Small delay to show success message
    },
    onError: (error) => {
      setError(error.message || 'Login failed. Please try again.');
    }
  });

  const onFormSubmit = (data) => {
    setError('');
    
    const loginData = {
      contactMethod: data.contactMethod,
      password: data.password
    };
    
    if (data.contactMethod === 'email') {
      loginData.email = data.email?.trim();
    } else if (data.contactMethod === 'phone') {
      loginData.phone = data.phone?.trim();
    }
    
    loginMutation.mutate(loginData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign In to Your Account</h2>
        <p className="text-gray-600 text-sm">Enter your credentials to continue</p>
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
            How would you like to sign in?
          </Label>
          <RadioGroup 
            value={contactMethod} 
            onValueChange={(value) => {
              setContactMethod(value);
              setValue('contactMethod', value);
              // Clear previous contact field values
              setValue('email', '');
              setValue('phone', '');
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

        {errors.contactMethod && (
          <p className="text-xs text-red-600">{errors.contactMethod.message}</p>
        )}

        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-10 pr-10 py-2"
              {...register('password')}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-600 text-xs">Remember me</span>
          </label>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 font-medium text-xs"
          >
            Forgot password?
          </button>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2"
          disabled={isSubmitting || loginMutation.isPending}
        >
          {isSubmitting || loginMutation.isPending ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-600">
          Don't have an account?{' '}
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default PasswordLogin;