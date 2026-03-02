// src/components/auth/StaffProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/loader/Loader';

/**
 * StaffProtectedRoute Component
 *
 * Protects staff dashboard routes that require staff authentication
 * Redirects to staff-auth if user is not authenticated or not a staff member
 * 
 * Features:
 * - Checks if user is authenticated
 * - Validates user has staff role (userType: 'staff' or has staffType)
 * - Shows loading spinner during authentication check
 * - Preserves the intended destination for post-login redirect
 * - Enhanced resilience for page refresh scenarios
 */
const StaffProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();


  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // If not authenticated, redirect to staff login with return URL
  if (!isAuthenticated()) {
    return <Navigate to="/staff-auth" state={{ from: location }} replace />;
  }

  // Additional check: Ensure the authenticated user is a staff member
  // Check multiple possible indicators of staff status
  const isStaffUser = user?.staffType || 
                     user?.userType === 'staff' || 
                     user?.role === 'staff' ||
                     user?.employeeId; // Staff members have employeeId
  
  if (!isStaffUser) {
    // If authenticated but not a staff member, redirect to staff auth
    // This handles cases where a super admin might try to access staff routes
    return <Navigate to="/staff-auth" state={{ from: location }} replace />;
  }

  // If authenticated and is a staff member, render the protected component
  return children;
};

export default StaffProtectedRoute;