// src/utils/staffRouting.js

/*
========================================
🏥 STAFF ROUTING UTILITY
========================================

This utility function maps staff types to their respective dashboard routes.
Used after successful staff login to redirect users to appropriate dashboards.

Supported Staff Types:
- doctor → /doctor-dashboard
- nurse → /nurse-dashboard  
- technician → /technician-dashboard
- optometrist → /optometrist-dashboard
- administrator → /administrator-dashboard
- receptionist → /staff-dashboard
- accountant → /accountant-dashboard
- quality_coordinator → /quality-coordinator-dashboard
- patient_safety_officer → /patient-safety-officer-dashboard
- ot-admin → /ot-admin-dashboard
- anesthesiologist → /anesthesiologist-dashboard
- surgeon → /surgeon-dashboard
- sister → /sister-dashboard

Default fallback: /staff-dashboard (for unrecognized staff types)
*/

export const getStaffDashboardRoute = (staffType) => {
  if (!staffType) {
    return '/staff-dashboard';
  }

  // Normalize staff type to lowercase and handle variations
  const normalizedStaffType = staffType.toLowerCase().trim();

  const routeMap = {
    'doctor': '/doctor-dashboard',
    'nurse': '/nurse-dashboard',
    'technician': '/technician-dashboard',
    'optometrist': '/optometrist-dashboard',
    'administrator': '/administrator-dashboard',
    'admin': '/administrator-dashboard',
    'receptionist': '/staff-dashboard',
    'receptionist2': '/receptionist2-dashboard',
    'accountant': '/accountant-dashboard',
    'quality-coordinator': '/quality-coordinator-dashboard',
    'quality_coordinator': '/quality-coordinator-dashboard',
    'patient_safety_officer': '/patient-safety-officer-dashboard',
    'patient-safety-officer': '/patient-safety-officer-dashboard',
    'ot-admin': '/ot-admin-dashboard',
    'otadmin': '/ot-admin-dashboard',
    'ot_admin': '/ot-admin-dashboard',
    'anesthesiologist': '/anesthesiologist-dashboard',
    'surgeon': '/surgeon-dashboard',
    'sister': '/sister-dashboard',
    'ophthalmologist': '/ophthalmologist-dashboard',
  };

  return routeMap[normalizedStaffType] || '/staff-dashboard';
};

export const getStaffTypeDisplayName = (staffType) => {
  if (!staffType) {
    return 'Staff Member';
  }

  const normalizedStaffType = staffType.toLowerCase().trim();

  const displayNames = {
    'doctor': 'Doctor',
    'nurse': 'Nurse',
    'technician': 'Technician',
    'optometrist': 'Optometrist',
    'administrator': 'Administrator',
    'admin': 'Administrator',
    'receptionist': 'Receptionist',
    'accountant': 'Accountant',
    'quality_coordinator': 'Quality Coordinator',
    'quality coordinator': 'Quality Coordinator',
    'patient_safety_officer': 'Patient Safety Officer',
    'patient safety officer': 'Patient Safety Officer',
    'ot-admin': 'OT Administrator',
    'ot_admin': 'OT Administrator',
    'otadmin': 'OT Administrator',
    'anesthesiologist': 'Anesthesiologist',
    'surgeon': 'Surgeon',
    'sister': 'Sister/Head Nurse',
  };

  return displayNames[normalizedStaffType] || 'Staff Member';
};

export default {
  getStaffDashboardRoute,
  getStaffTypeDisplayName,
};