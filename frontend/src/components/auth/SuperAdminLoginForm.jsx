import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const superAdminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const SuperAdminLoginForm = ({ onSubmit, onForgotPassword }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(superAdminLoginSchema)
  });

  // TanStack Query mutation for login
  const loginMutation = useMutation({
    mutationFn: authService.superAdminLogin,
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: "Welcome back, Super Admin!",
        variant: "default",
      });
      
      // Store user data in auth context (token is now in httpOnly cookie)
      if (data.data && data.data.user) {
        login(data.data.user);
        
        // Use a more reliable navigation approach
        // First try React Router navigation with a delay
        setTimeout(() => {
          navigate('/admin-dashboard', { replace: true });
          
          // Fallback: if still on login page after 1 second, force navigate
          setTimeout(() => {
            if (window.location.pathname === '/superadmin-login') {
              window.location.href = '/admin-dashboard';
            }
          }, 1000);
        }, 500);
      }
      
      // Call the parent onSubmit if needed
      if (onSubmit) {
        onSubmit(data);
      }
    },
    onError: (error) => {
      
      // Extract the server error message
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific HTTP status codes with custom messages
      if (error.status) {
        switch (error.status) {
          case 401:
            errorMessage = error.message || "Invalid email or password. Please check your credentials.";
            break;
          case 403:
            errorMessage = error.message || "Access denied. You don't have permission to access this area.";
            break;
          case 404:
            errorMessage = error.message || "Login service not found. Please contact support.";
            break;
          case 500:
            errorMessage = error.message || "Server error. Please try again later.";
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = error.message || "Service temporarily unavailable. Please try again later.";
            break;
          default:
            errorMessage = error.message || `Server error (${error.status}). Please try again.`;
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onFormSubmit = (data) => {
    loginMutation.mutate(data);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Administrator Access</h2>
        <p className="text-gray-600 text-sm">Please enter your credentials to continue</p>
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
              placeholder="Enter your admin email"
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
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
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <button 
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot password?
          </button>
        </div>
              
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          This is a secure area. All access attempts are logged.
        </p>
      </div>
    </div>
  );
};

export default SuperAdminLoginForm;