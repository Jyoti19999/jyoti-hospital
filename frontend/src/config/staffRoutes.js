// src/config/staffRoutes.js

/*
========================================
🏥 STAFF ROUTES CONFIGURATION
========================================

Centralized configuration for all staff dashboard routes. ts
This approach provides better maintainability and reduces code duplication.
Each route now includes allowedStaffTypes for role-based access control.
*/

import DoctorDashboard from "../pages/staff/DoctorDashboard";
import OphthalmologistDashboard from "../pages/ohms/OphthalmologistDashboard";
import NurseDashboard from "../pages/staff/NurseDashboard";
import TechnicianDashboard from "../pages/staff/TechnicianDashboard";
import ReceptionistDashboard from "../pages/staff/ReceptionistDashboard";
import AdministratorDashboard from "../pages/staff/AdministratorDashboard";
import AccountantDashboard from "../pages/staff/AccountantDashboard";
import QualityCoordinatorDashboard from "../pages/staff/QualityCoordinatorDashboard";
import PatientSafetyOfficerDashboard from "../pages/staff/PatientSafetyOfficerDashboard";
import OptometristDashboard from "../pages/OptometristDashboard";
import StaffDashboard from "../pages/staff/StaffDashboard";
import Receptionist2Dashboard from "../pages/staff/Receptionist2Dashboard";
import PatientExamination from "../pages/staff/PatientExamination";
import OTAdminDashboard from "../pages/staff/OTAdminDashboard";
import AnesthesiologistDashboard from "../pages/staff/AnesthesiologistDashboard";
import SurgeonDashboard from "../pages/staff/SurgeonDashboard";
import SisterDashboard from "../pages/staff/SisterDashboard";
import IpdDashboard from "../pages/staff/IpdDashboard";
import IpdAdmissions from "../pages/staff/IpdAdmissions";

// TPA (Third Party Administrator) Extension Pages
import TPADashboard from "../pages/tpa/TPADashboard";
import TPAClaims from "../pages/tpa/TPAClaims";
import TPAReview from "../pages/tpa/TPAReview";
import TPACommunication from "../pages/tpa/TPACommunication";
import TPAAnalytics from "../pages/tpa/TPAAnalytics";

export const staffRoutes = [
  {
    path: "/staff-dashboard",
    component: StaffDashboard,
    name: "Staff Dashboard",
    allowedStaffTypes: ["receptionist"] // Default staff dashboard for receptionists
  },
  {
    path: "/doctor-dashboard",
    component: DoctorDashboard,
    name: "Doctor Dashboard",
    allowedStaffTypes: ["doctor"]
  },
  {
    path: "/nurse-dashboard",
    component: NurseDashboard,
    name: "Nurse Dashboard",
    allowedStaffTypes: ["nurse"]
  },
  {
    path: "/technician-dashboard",
    component: TechnicianDashboard,
    name: "Technician Dashboard",
    allowedStaffTypes: ["technician"]
  },
  {
    path: "/receptionist-dashboard",
    component: StaffDashboard,
    name: "Receptionist Dashboard",
    allowedStaffTypes: ["receptionist"]
  },
  {
    path: "/receptionist2-dashboard",
    component: Receptionist2Dashboard,
    name: "Receptionist2 Dashboard",
    allowedStaffTypes: ["receptionist2"]
  },
  {
    path: "/administrator-dashboard",
    component: AdministratorDashboard,
    name: "Administrator Dashboard",
    allowedStaffTypes: ["admin"]
  },
  {
    path: "/accountant-dashboard",
    component: AccountantDashboard,
    name: "Accountant Dashboard",
    allowedStaffTypes: ["accountant"]
  },
  {
    path: "/quality-coordinator-dashboard",
    component: QualityCoordinatorDashboard,
    name: "Quality Coordinator Dashboard",
    allowedStaffTypes: ["quality-coordinator", "quality_coordinator"]
  },
  {
    path: "/patient-safety-officer-dashboard",
    component: PatientSafetyOfficerDashboard,
    name: "Patient Safety Officer Dashboard",
    allowedStaffTypes: ["patient-safety-officer", "patient_safety_officer"]
  },
  {
    path: "/optometrist-dashboard",
    component: OptometristDashboard,
    name: "Optometrist Dashboard",
    allowedStaffTypes: ["optometrist"]
  },
  {
    path: "/ophthalmologist-dashboard",
    component: DoctorDashboard,
    name: "Ophthalmologist Dashboard",
    allowedStaffTypes: ["ophthalmologist", "doctor"]
  },
  {
    path: "/patient-examination/:queueEntryId",
    component: PatientExamination,
    name: "Patient Examination",
    allowedStaffTypes: ["ophthalmologist", "doctor"]
  },
  {
    path: "/ot-admin-dashboard",
    component: OTAdminDashboard,
    name: "OT Administrator Dashboard",
    allowedStaffTypes: ["ot_admin", "ot-admin"]
  },
  {
    path: "/anesthesiologist-dashboard",
    component: AnesthesiologistDashboard,
    name: "Anesthesiologist Dashboard",
    allowedStaffTypes: ["anesthesiologist"]
  },
  {
    path: "/surgeon-dashboard",
    component: SurgeonDashboard,
    name: "Surgeon Dashboard",
    allowedStaffTypes: ["surgeon"]
  },
  {
    path: "/sister-dashboard",
    component: SisterDashboard,
    name: "Sister Dashboard",
    allowedStaffTypes: ["sister"]
  },
  {
    path: "/ipd-dashboard",
    component: IpdDashboard,
    name: "IPD Dashboard",
    allowedStaffTypes: ["doctor", "nurse", "surgeon", "anesthesiologist", "ot_admin", "ot-admin", "admin", "receptionist2"]
  },
  {
    path: "/ipd-admissions",
    component: IpdAdmissions,
    name: "IPD Admissions",
    allowedStaffTypes: ["doctor", "nurse", "surgeon", "anesthesiologist", "ot_admin", "ot-admin", "admin", "receptionist2"]
  },
  // TPA (Third Party Administrator) Routes
  {
    path: "/tpa-dashboard",
    component: TPADashboard,
    name: "TPA Dashboard",
    allowedStaffTypes: ["tpa"]
  },
  {
    path: "/tpa-claims",
    component: TPAClaims,
    name: "TPA Claims Management",
    allowedStaffTypes: ["tpa"]
  },
  {
    path: "/tpa-review/:claimId",
    component: TPAReview,
    name: "TPA Claim Review",
    allowedStaffTypes: ["tpa"]
  },
  {
    path: "/tpa-communication",
    component: TPACommunication,
    name: "TPA Communication",
    allowedStaffTypes: ["tpa"]
  },
  {
    path: "/tpa-analytics",
    component: TPAAnalytics,
    name: "TPA Analytics",
    allowedStaffTypes: ["tpa"]
  }
];

// Helper function to get the correct dashboard path for each staff type
export const getStaffDashboardPath = (staffType) => {
  const dashboardMap = {
    'doctor': '/doctor-dashboard', // Route doctors to their comprehensive dashboard
    'ophthalmologist': '/ophthalmologist-dashboard',
    'nurse': '/nurse-dashboard',
    'receptionist': '/staff-dashboard',
    'receptionist2': '/receptionist2-dashboard',
    'technician': '/technician-dashboard',
    'optometrist': '/optometrist-dashboard',
    'admin': '/administrator-dashboard',
    'accountant': '/accountant-dashboard',
    'quality-coordinator': '/quality-coordinator-dashboard',
    'quality_coordinator': '/quality-coordinator-dashboard',
    'patient-safety-officer': '/patient-safety-officer-dashboard',
    'patient_safety_officer': '/patient-safety-officer-dashboard',
    'ot_admin': '/ot-admin-dashboard',
    'ot-admin': '/ot-admin-dashboard',
    'anesthesiologist': '/anesthesiologist-dashboard',
    'surgeon': '/surgeon-dashboard',
    'sister': '/sister-dashboard',
    'tpa': '/tpa-dashboard'
  };

  return dashboardMap[staffType] || '/staff-dashboard';
};

// Helper function to validate if a staff type can access a specific route
export const validateStaffAccess = (userStaffType, routePath) => {
  const route = staffRoutes.find(route => route.path === routePath);
  if (!route) return false;
  
  return route.allowedStaffTypes.includes(userStaffType);
};

export default staffRoutes;