// src/components/auth/LoginRedirect.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/loader/Loader';

/**
 * LoginRedirect Component
 *
 * Redirects authenticated users away from login page
 * Shows loading spinner while checking authentication
 */
const LoginRedirect = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated()) {
      // If user is already authenticated, redirect to superadmin dashboard
      navigate('/admin-dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // If not authenticated, show the login form
  if (!isAuthenticated()) {
    return children;
  }

  // If authenticated, show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader />
    </div>
  );
};

export default LoginRedirect;