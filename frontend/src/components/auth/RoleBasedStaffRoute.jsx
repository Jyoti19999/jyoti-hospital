// src/components/auth/RoleBasedStaffRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getStaffDashboardPath } from '@/config/staffRoutes';
import Loader from '@/components/loader/Loader';

/**
 * RoleBasedStaffRoute Component
 *
 * Enhanced staff route protection that enforces role-based access control.
 * Prevents staff members from accessing dashboards they're not authorized for.
 * 
 * Features:
 * - Checks if user is authenticated
 * - Validates user has staff role
 * - Enforces role-specific dashboard access
 * - Automatically redirects to correct dashboard if unauthorized
 * - Shows loading spinner during authentication check
 * - Preserves intended destination for post-login redirect
 */
const RoleBasedStaffRoute = ({ children, allowedStaffTypes = [] }) => {
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
  const isStaffUser = user?.staffType || 
                     user?.userType === 'staff' || 
                     user?.role === 'staff' ||
                     user?.employeeId;
  
  if (!isStaffUser) {
    return <Navigate to="/staff-auth" state={{ from: location }} replace />;
  }

  // Role-based access control
  const userStaffType = user?.staffType;
  
  // Check if user's staff type is allowed for this route
  if (allowedStaffTypes.length > 0 && !allowedStaffTypes.includes(userStaffType)) {
    
    // Redirect to their appropriate dashboard
    const correctDashboard = getStaffDashboardPath(userStaffType);
    return <Navigate to={correctDashboard} replace />;
  }

  // If authenticated, is staff, and has correct role, render the protected component
  return children;
};

export default RoleBasedStaffRoute;