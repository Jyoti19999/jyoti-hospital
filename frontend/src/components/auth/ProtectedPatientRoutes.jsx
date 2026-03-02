// src/components/auth/ProtectedPatientRoutes.jsx

import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedPatientRoute from './ProtectedPatientRoute';

// Import all patient pages
import AppointmentBooking from '@/pages/AppointmentBooking';
import PatientDashboard from '@/pages/PatientDashboard';
import PatientProfile from '@/pages/PatientProfile';
import AppointmentHistory from '@/pages/AppointmentHistory';
import MedicalRecords from '@/pages/MedicalRecords';
import PrescriptionHistory from '@/pages/PrescriptionHistory';
import InsuranceManagement from '@/pages/InsuranceManagement';
import PaymentHistory from '@/pages/PaymentHistory';

/*
========================================
👥 PROTECTED PATIENT ROUTES GENERATOR
========================================

This component automatically generates protected routes for all patient pages.
It eliminates code duplication and provides a clean, maintainable solution with enhanced security.

Benefits:
- Single source of truth for patient routes
- Automatic authentication protection for all patient routes
- Prevents unauthorized access to patient-specific pages
- Easy to add/remove routes
- Consistent protection pattern
- Automatic redirection to patient login

Security Features:
- Each route is protected by patient authentication
- Users are automatically redirected to login if not authenticated
- No manual URL manipulation can bypass authentication
- HTTP-only cookie based authentication
*/

/**
 * Configuration for patient routes
 * Each route specifies the path, component, and descriptive name
 */
export const patientRoutes = [
  {
    path: '/appointment-booking',
    component: AppointmentBooking,
    name: 'Appointment Booking'
  },
  {
    path: '/patient-dashboard',
    component: PatientDashboard,
    name: 'Patient Dashboard'
  },
  {
    path: '/patient-profile',
    component: PatientProfile,
    name: 'Patient Profile'
  },
  {
    path: '/appointment-history',
    component: AppointmentHistory,
    name: 'Appointment History'
  },
  {
    path: '/medical-records',
    component: MedicalRecords,
    name: 'Medical Records'
  },
  {
    path: '/prescription-history',
    component: PrescriptionHistory,
    name: 'Prescription History'
  },
  {
    path: '/insurance-management',
    component: InsuranceManagement,
    name: 'Insurance Management'
  },
  {
    path: '/payment-history',
    component: PaymentHistory,
    name: 'Payment History'
  }
];

/**
 * Generates protected patient routes from configuration
 * @returns {React.ReactElement[]} Array of protected Route components with patient authentication
 */
export const generateProtectedPatientRoutes = () => {
  return patientRoutes.map(({ path, component: Component, name }) => (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedPatientRoute>
          <Component />
        </ProtectedPatientRoute>
      }
    />
  ));
};

/**
 * Component that renders all protected patient routes
 * Use this in your main App.jsx routing configuration
 */
const ProtectedPatientRoutes = () => {
  return (
    <>
      {generateProtectedPatientRoutes()}
    </>
  );
};

export default ProtectedPatientRoutes;