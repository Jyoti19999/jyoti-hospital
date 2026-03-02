// src/services/patientService.js
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 30000, // Increased to 30 seconds for email operations
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session management
});

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // You can trigger logout or redirect to login here if needed
    }
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      error.message = 'Request timeout. The server is taking longer than expected. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

// Patient Service Functions
export const patientService = {
  /**
   * Send OTP for patient registration
   * @param {Object} data - { firstName, lastName, dateOfBirth, gender, email, mobileNumber }
   * @returns {Promise} API response
   */
  sendRegistrationOTP: async (data) => {
    try {
      // Increase timeout for this specific request due to email sending
      const response = await api.post('/patients/send-otp', data, {
        timeout: 45000 // 45 seconds for email operations
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Email sending is taking longer than expected. Please wait or try again.'
        : error.response?.data?.message || 'Failed to send OTP';
      throw new Error(errorMessage);
    }
  },

  /**
   * Verify OTP and complete patient registration
   * @param {Object} data - { email, mobileNumber, otp, firstName, lastName, dateOfBirth, gender }
   * @returns {Promise} API response
   */
  verifyOTPAndRegister: async (data) => {
    try {
      // Increase timeout for this specific request due to welcome email sending
      const response = await api.post('/patients/verify-otp', data, {
        timeout: 45000 // 45 seconds for welcome email operations
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Registration is taking longer than expected. Please wait or try again.'
        : error.response?.data?.message || 'Failed to verify OTP and register';
      throw new Error(errorMessage);
    }
  },

  /**
   * Resend OTP for patient registration
   * @param {Object} data - { email, mobileNumber }
   * @returns {Promise} API response
   */
  resendRegistrationOTP: async (data) => {
    try {
      // Increase timeout for this specific request due to email sending
      const response = await api.post('/patients/resend-otp', data, {
        timeout: 45000 // 45 seconds for email operations
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Email sending is taking longer than expected. Please wait or try again.'
        : error.response?.data?.message || 'Failed to resend OTP';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get patient profile (authenticated route)
   * @returns {Promise} API response
   */
  getProfile: async () => {
    try {
      const response = await api.get('/patients/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get patient profile');
    }
  },

  /**
   * Get patient by patient number
   * @param {string|number} patientNumber - Patient number
   * @returns {Promise} API response
   */
  getPatientByNumber: async (patientNumber) => {
    try {
      const response = await api.get(`/patients/${patientNumber}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get patient information');
    }
  },

  /**
   * Get patient profile (authenticated route)
   * @returns {Promise} API response
   */
  getProfile: async () => {
    try {
      const response = await api.get('/patients/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get patient profile');
    }
  },

  /**
   * Get patient by patient number
   * @param {string|number} patientNumber - Patient number
   * @returns {Promise} API response
   */
  getPatientByNumber: async (patientNumber) => {
    try {
      const response = await api.get(`/patients/${patientNumber}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get patient information');
    }
  },

  /**
   * Get patient statistics
   * @returns {Promise} API response
   */
  getPatientStatistics: async () => {
    try {
      const response = await api.get('/patients/statistics/overview');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get patient statistics');
    }
  },

  /**
   * Patient login with email/phone and password
   * @param {Object} data - { contactMethod, email?, phone?, password }
   * @returns {Promise} API response
   */
  loginPatient: async (data) => {
    try {
      const response = await api.post('/patients/login', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  /**
   * Patient logout
   * @returns {Promise} API response
   */
  logoutPatient: async () => {
    try {
      const response = await api.post('/patients/logout');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Logout failed');
    }
  },

  /**
   * Send OTP for patient login
   * @param {Object} data - { contactMethod, email?, phone? }
   * @returns {Promise} API response
   */
  sendLoginOTP: async (data) => {
    try {
      // Increase timeout for this specific request due to email sending
      const response = await api.post('/patients/send-login-otp', data, {
        timeout: 45000 // 45 seconds for email operations
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Email sending is taking longer than expected. Please wait or try again.'
        : error.response?.data?.message || 'Failed to send login OTP';
      throw new Error(errorMessage);
    }
  },

  /**
   * Verify OTP for patient login
   * @param {Object} data - { otp, email?, mobileNumber? }
   * @returns {Promise} API response
   */
  verifyLoginOTP: async (data) => {
    try {
      // Increase timeout for this specific request due to authentication processing
      const response = await api.post('/patients/verify-login-otp', data, {
        timeout: 45000 // 45 seconds for authentication operations
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Login is taking longer than expected. Please wait or try again.'
        : error.response?.data?.message || 'Failed to verify login OTP';
      throw new Error(errorMessage);
    }
  },

  /**
   * Resend OTP for patient login
   * @param {Object} data - { email?, mobileNumber? }
   * @returns {Promise} API response
   */
  resendLoginOTP: async (data) => {
    try {
      // Increase timeout for this specific request due to email sending
      const response = await api.post('/patients/resend-login-otp', data, {
        timeout: 45000 // 45 seconds for email operations
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Email sending is taking longer than expected. Please wait or try again.'
        : error.response?.data?.message || 'Failed to resend login OTP';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get patient medical records with examination data
   * @returns {Promise} API response
   */
  getPatientMedicalRecords: async () => {
    try {
      const response = await api.get('/patients/medical-records');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get medical records');
    }
  },

  /**
   * Get list of doctors available for appointments
   * @param {Object} params - { department?, specialization? }
   * @returns {Promise} API response
   */
  getDoctorsList: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.department) queryParams.append('department', params.department);
      if (params.specialization) queryParams.append('specialization', params.specialization);
      
      const url = `/patients/doctors/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get doctors list');
    }
  },

  /**
   * Get appointment slots with real booking counts for a given date
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {Promise} API response with timeSlots array
   */
  getAppointmentSlotsByDate: async (date) => {
    try {
      const response = await api.get(`/patients/appointments-by-date?date=${date}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch appointment slots');
    }
  },

  /**
   * Book appointment for patient
   * @param {Object} data - { doctorId, appointmentDate, appointmentTime, appointmentType?, purpose?, notes?, estimatedDuration? }
   * @returns {Promise} API response
   */
  bookAppointment: async (data) => {
    try {
      // Increase timeout for this specific request due to potential email operations
      const response = await api.post('/patients/book-appointment', data, {
        timeout: 45000 // 45 seconds for appointment booking and email operations
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Appointment booking is taking longer than expected. Please wait or try again.'
        : error.response?.data?.message || 'Failed to book appointment';
      throw new Error(errorMessage);
    }
  },

  /**
   * Update appointment with QR code
   * @param {string} appointmentId - Appointment ID
   * @param {string} qrCode - Base64 QR code string
   * @returns {Promise} API response
   */
  updateAppointmentQR: async (appointmentId, qrCode) => {
    try {
      const response = await api.patch(`/patients/update-appointment-qr/${appointmentId}`, {
        qrCode
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update appointment QR code';
      throw new Error(errorMessage);
    }
  },

  /**
   * Register family member (patient referral system)
   * @param {Object} data - Family member registration data
   * @returns {Promise} API response
   */
  registerFamilyMember: async (data) => {
    try {
      
      // Increase timeout for this specific request due to email operations and patient creation
      const response = await api.post('/patients/register-family-member', data, {
        timeout: 60000 // 60 seconds for family member registration with emails
      });
      
      return response.data;
    } catch (error) {
      
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Family member registration is taking longer than expected. Please wait or try again.'
        : error.response?.data?.message || 'Failed to register family member';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get all family members referred by current patient (original endpoint)
   * @returns {Promise} API response
   */
  getFamilyMembers: async () => {
    try {
      const response = await api.get('/patients/family-members');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get family members');
    }
  },

  /**
   * Get family members for currently logged-in patient (dynamic based on current user)
   * @returns {Promise} API response
   */
  getCurrentPatientFamilyMembers: async () => {
    try {
      const response = await api.get('/patients/current-family-members');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get current patient family members');
    }
  },

  /**
   * Switch to family member account
   * @param {string} familyMemberPatientId - Family member patient ID
   * @returns {Promise} API response
   */
  switchToFamilyMember: async (familyMemberPatientId) => {
    try {
      const response = await api.post(`/patients/switch-to-family/${familyMemberPatientId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to switch to family member account');
    }
  },

  /**
   * Get patient prescriptions (authenticated route)
   * @returns {Promise} API response
   */
  getPrescriptions: async () => {
    try {
      const response = await api.get('/patients/prescriptions');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get prescriptions');
    }
  },

  /**
   * Get patient appointments (authenticated route)
   * @returns {Promise} API response
   */
  getAppointments: async () => {
    try {
      const response = await api.get('/patients/appointments');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get patient appointments');
    }
  },
};

// TanStack Query mutation and query functions
export const patientQueryKeys = {
  all: ['patients'],
  statistics: () => [...patientQueryKeys.all, 'statistics'],
  byNumber: (patientNumber) => [...patientQueryKeys.all, 'byNumber', patientNumber],
};

// Custom hooks for TanStack Query
export const usePatientMutations = () => {
  return {
    // Send OTP mutation
    sendOTP: {
      mutationFn: patientService.sendRegistrationOTP,
      onSuccess: (data) => {
      },
      onError: (error) => {
      }
    },

    // Verify OTP and register mutation
    verifyAndRegister: {
      mutationFn: patientService.verifyOTPAndRegister,
      onSuccess: (data) => {
      },
      onError: (error) => {
      }
    },

    // Resend OTP mutation
    resendOTP: {
      mutationFn: patientService.resendRegistrationOTP,
      onSuccess: (data) => {
      },
      onError: (error) => {
      }
    },

    // Book appointment mutation
    bookAppointment: {
      mutationFn: patientService.bookAppointment,
      onSuccess: (data) => {
      },
      onError: (error) => {
      }
    },

    // Register family member mutation
    registerFamilyMember: {
      mutationFn: patientService.registerFamilyMember,
      onSuccess: (data) => {
      },
      onError: (error) => {
      }
    },

    // Switch to family member account mutation
    switchToFamilyMember: {
      mutationFn: patientService.switchToFamilyMember,
      onSuccess: (data) => {
      },
      onError: (error) => {
      }
    }
  };
};

export const usePatientQueries = () => {
  return {
    // Get patient statistics query
    statistics: {
      queryKey: patientQueryKeys.statistics(),
      queryFn: patientService.getPatientStatistics,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },

    // Get patient by number query factory
    byNumber: (patientNumber) => ({
      queryKey: patientQueryKeys.byNumber(patientNumber),
      queryFn: () => patientService.getPatientByNumber(patientNumber),
      enabled: !!patientNumber,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    }),

    // Get family members query (original - for initial patient)
    familyMembers: {
      queryKey: ['patient', 'familyMembers'],
      queryFn: patientService.getFamilyMembers,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },

    // Get current patient family members query (dynamic based on current user)
    currentFamilyMembers: {
      queryKey: ['patient', 'currentFamilyMembers'],
      queryFn: patientService.getCurrentPatientFamilyMembers,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  };
};

// Utility functions for form validation
export const validatePatientData = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  mobileNumber: (mobile) => {
    // Support both Indian (10 digits starting with 6-9) and international (10-15 digits)
    const indianMobileRegex = /^[6-9]\d{9}$/;
    const internationalMobileRegex = /^\d{10,15}$/;
    return indianMobileRegex.test(mobile) || internationalMobileRegex.test(mobile);
  },

  otp: (otp) => {
    const otpRegex = /^\d{4}$/;
    return otpRegex.test(otp);
  },

  name: (name) => {
    return name && name.trim().length >= 2;
  },

  dateOfBirth: (date) => {
    if (!date) return false; // Required field for patient registration
    const birthDate = new Date(date);
    const today = new Date();
    const minDate = new Date('1900-01-01');
    return birthDate <= today && birthDate >= minDate;
  },

  gender: (gender) => {
    const validGenders = ['male', 'female', 'other'];
    return gender && validGenders.includes(gender.toLowerCase());
  }
};

/**
 * Update patient personal information
 * @param {Object} personalData - Personal information to update
 * @param {string} personalData.firstName - First name
 * @param {string} personalData.lastName - Last name
 * @param {string} personalData.dateOfBirth - Date of birth
 * @param {string} personalData.gender - Gender
 * @param {string} personalData.bloodGroup - Blood group
 * @returns {Promise} API response
 */
patientService.updatePersonalInfo = async (personalData) => {
  try {
    const response = await api.put('/patients/profile/personal-info', personalData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update personal information');
  }
};

/**
 * Update patient contact information
 * @param {Object} contactData - Contact information to update
 * @param {string} contactData.phone - Phone number
 * @param {string} contactData.email - Email address
 * @param {string} contactData.address - Address
 * @param {Array} contactData.emergencyContacts - Emergency contacts array
 * @returns {Promise} API response
 */
patientService.updateContactInfo = async (contactData) => {
  try {
    const response = await api.put('/patients/profile/contact', contactData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update contact information');
  }
};

/**
 * Update patient medical history information
 * @param {Object} medicalData - Medical history information to update
 * @param {Array} medicalData.allergies - Allergies array
 * @param {Array} medicalData.chronicConditions - Chronic conditions array
 * @param {Array} medicalData.currentMedications - Current medications array
 * @param {Array} medicalData.previousSurgeries - Previous surgeries array
 * @param {Array} medicalData.familyHistory - Family history array
 * @param {Object} medicalData.lifestyle - Lifestyle assessment object
 * @param {string} medicalData.bloodGroup - Blood group
 * @param {Object} medicalData.eyeHistory - Eye history object
 * @param {Object} medicalData.visionHistory - Vision history object
 * @param {Object} medicalData.riskFactors - Risk factors object
 * @returns {Promise} API response
 */
patientService.updateMedicalHistory = async (medicalData) => {
  try {
    const response = await api.put('/patients/profile/medical-history', medicalData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update medical history');
  }
};

/**
 * Update patient profile photo
 * @param {string} profilePhoto - Base64 encoded profile photo
 * @returns {Promise} API response
 */
patientService.updateProfilePhoto = async (profilePhoto) => {
  try {
    const response = await api.put('/patients/profile/photo', { profilePhoto });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile photo');
  }
};

export default patientService;