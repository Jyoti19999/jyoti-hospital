// src/services/authService.js
import apiClient from '@/lib/api';

export const authService = {
  // Super Admin Login
  superAdminLogin: async (credentials) => {
    const response = await apiClient.post('/super-admin/login', credentials);
    return response;
  },

  /*
  ========================================
  🏥 STAFF LOGIN AUTHENTICATION SERVICE
  ========================================
  
  This function handles staff login authentication for all staff types:
  - Doctor, Nurse, Technician, Optometrist, Administrator, 
  - Receptionist, Accountant, Quality Coordinator, Patient Safety Officer
  
  Expected Response Structure:
  {
    "message": "Login successful",
    "data": {
      "user": {
        "id": "string",
        "employeeId": "string", 
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string",
        "staffType": "doctor|nurse|technician|optometrist|administrator|receptionist|receptionist2|accountant|quality_coordinator|patient_safety_officer|ot-admin|anesthesiologist|surgeon|sister",
        "department": "string",
        "isActive": boolean,
        "employmentStatus": "active|inactive",
        "lastLogin": "ISO string",
        "createdAt": "ISO string", 
        "updatedAt": "ISO string"
      }
    }
  }
  
  Note: JWT token is automatically stored in httpOnly cookies by the backend
  */
  staffLogin: async (credentials) => {
    const response = await apiClient.post('/staff/login', credentials);
    return response;
  },

  // Forgot Password Flow
  sendPasswordResetEmail: async (data) => {
    const response = await apiClient.post('/super-admin/forgot-password', data);
    return response;
  },

  verifyPasswordResetOTP: async (data) => {
    const response = await apiClient.post('/super-admin/verify-reset-otp', data);
    return response;
  },

  resetPassword: async (data) => {
    const response = await apiClient.post('/super-admin/reset-password', data);
    return response;
  },

  // Staff Logout
  staffLogout: async () => {
    const response = await apiClient.post('/staff/logout');
    return response;
  },

  // You can add more auth methods here later
  // logout: async () => {
  //   const response = await apiClient.post('/auth/logout');
  //   return response;
  // },
};

export default authService;
