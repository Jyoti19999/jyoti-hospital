// src/components/auth/ProtectedPatientRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/loader/Loader';

/**
 * ProtectedPatientRoute Component
 *
 * Enhanced patient route protection that enforces patient-only access control.
 * Prevents unauthorized access to patient-specific pages and dashboards.
 * 
 * Features:
 * - Checks if user is authenticated
 * - Validates user has patient role
 * - Enforces patient-specific access
 * - Automatically redirects to patient login if unauthorized
 * - Shows loading spinner during authentication check
 * - Preserves intended destination for post-login redirect
 */
const ProtectedPatientRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user, getUserRole } = useAuth();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Watch for user changes (account switching)
  useEffect(() => {
    if (user) {
      setIsTransitioning(true);
      // Give a brief moment for auth state to stabilize after user change
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [user?.id, user?.patientId, user?.patientNumber]);


  // Show loading spinner while checking authentication or during account transitions
  if (isLoading || isTransitioning) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // If not authenticated, redirect to patient login with return URL
  if (!isAuthenticated()) {
    return <Navigate to="/patient-login" state={{ from: location }} replace />;
  }

  // Additional check: Ensure the authenticated user is a patient
  const isPatientUser = user?.patientId || 
                       user?.role === 'patient' ||
                       getUserRole() === 'patient';
  
  if (!isPatientUser) {
    return <Navigate to="/patient-login" state={{ from: location }} replace />;
  }

  // If authenticated and is patient, render the protected component
  return children;
};

export default ProtectedPatientRoute;