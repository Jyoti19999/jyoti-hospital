// src/components/auth/ProtectedStaffRoutes.jsx

import React from 'react';
import { Route } from 'react-router-dom';
import RoleBasedStaffRoute from './RoleBasedStaffRoute';
import { staffRoutes } from '@/config/staffRoutes';

/*
========================================
🏥 PROTECTED STAFF ROUTES GENERATOR
========================================

This component automatically generates role-based protected routes for all staff dashboards.
It eliminates code duplication and provides a clean, maintainable solution with enhanced security.

Benefits:
- Single source of truth for staff routes
- Automatic role-based protection for all staff routes
- Prevents unauthorized access to other staff dashboards
- Easy to add/remove routes
- Consistent protection pattern
- Automatic redirection to correct dashboard

Security Features:
- Each route is protected by specific staff types
- Users are automatically redirected to their correct dashboard if they try to access unauthorized routes
- No manual URL manipulation can bypass role restrictions
*/

/**
 * Generates role-based protected staff routes from configuration
 * @returns {React.ReactElement[]} Array of protected Route components with role validation
 */
export const generateProtectedStaffRoutes = () => {
  return staffRoutes.map(({ path, component: Component, name, allowedStaffTypes }) => (
    <Route
      key={path}
      path={path}
      element={
        <RoleBasedStaffRoute allowedStaffTypes={allowedStaffTypes}>
          <Component />
        </RoleBasedStaffRoute>
      }
    />
  ));
};

/**
 * Component that renders all role-based protected staff routes
 * Use this in your main App.jsx routing configuration
 */
const ProtectedStaffRoutes = () => {
  return (
    <>
      {generateProtectedStaffRoutes()}
    </>
  );
};

export default ProtectedStaffRoutes;