// src/services/ipdService.js
import apiClient from '@/lib/api';

/*
========================================
🏥 IPD MANAGEMENT SERVICE
========================================

This service handles all IPD (In-Patient Department) operations:
- IPD Admissions management
- Fitness Reports
- Pre-Op Assessments  
- Surgery Metrics
- Dashboard statistics

All functions use the apiClient with automatic authentication
via httpOnly cookies.
*/

export const ipdService = {
  // ==========================================
  // IPD AUTHENTICATION & BASIC ENDPOINTS
  // ==========================================

  /**
   * Test IPD authentication endpoint
   */
  testAuth: async () => {
    const response = await apiClient.get('/ipd/test-auth');
    return response;
  },

  // ==========================================
  // IPD ADMISSIONS MANAGEMENT
  // ==========================================

  /**
   * Get all IPD admissions with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.status - Filter by status
   * @param {string} params.surgeryType - Filter by surgery type
   */
  getAdmissions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await apiClient.get(`/ipd/admissions?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get single IPD admission by ID
   * @param {string} admissionId - The admission ID
   */
  getAdmission: async (admissionId) => {
    const response = await apiClient.get(`/ipd/admissions/${admissionId}`);
    return response;
  },

  /**
   * Create new IPD admission
   * @param {Object} admissionData - Admission details
   * @param {string} admissionData.patientId - Patient ID
   * @param {string} admissionData.surgeryType - Surgery type (CATARACT, GLAUCOMA, RETINAL, CORNEAL, REFRACTIVE, OTHER)
   * @param {string} admissionData.surgeryDate - ISO date string
   * @param {string} admissionData.notes - Optional notes
   * @param {string} admissionData.preOpInstructions - Pre-operative instructions
   * @param {number} admissionData.expectedDuration - Expected surgery duration in minutes
   */
  createAdmission: async (admissionData) => {
    const response = await apiClient.post('/ipd/admissions', admissionData);
    return response;
  },

  /**
   * Update IPD admission
   * @param {string} admissionId - The admission ID
   * @param {Object} updateData - Updated admission data
   */
  updateAdmission: async (admissionId, updateData) => {
    const response = await apiClient.patch(`/ipd/admissions/${admissionId}`, updateData);
    return response;
  },

  /**
   * Delete IPD admission
   * @param {string} admissionId - The admission ID
   */
  deleteAdmission: async (admissionId) => {
    const response = await apiClient.delete(`/ipd/admissions/${admissionId}`);
    return response;
  },

  // ==========================================
  // FITNESS REPORTS MANAGEMENT
  // ==========================================

  /**
   * Get fitness reports for an admission
   * @param {string} admissionId - The admission ID
   */
  getFitnessReports: async (admissionId) => {
    const response = await apiClient.get(`/ipd/admissions/${admissionId}/fitness-reports`);
    return response;
  },

  /**
   * Create fitness report for admission
   * @param {string} admissionId - The admission ID
   * @param {Object} fitnessData - Fitness report data
   * @param {string} fitnessData.bloodPressure - Blood pressure reading
   * @param {string} fitnessData.heartRate - Heart rate
   * @param {string} fitnessData.temperature - Body temperature
   * @param {string} fitnessData.oxygenSaturation - Oxygen saturation
   * @param {string} fitnessData.ecgReport - ECG report details
   * @param {string} fitnessData.fitnessNotes - Fitness assessment notes
   * @param {string} fitnessData.fitnessStatus - Status (PENDING, FIT_FOR_SURGERY, UNFIT_FOR_SURGERY, NEEDS_EVALUATION)
   * @param {string} fitnessData.specialInstructions - Special instructions
   */
  createFitnessReport: async (admissionId, fitnessData) => {
    const response = await apiClient.post(`/ipd/admissions/${admissionId}/fitness-reports`, fitnessData);
    return response;
  },

  /**
   * Update fitness status
   * @param {string} fitnessReportId - The fitness report ID
   * @param {Object} statusData - Status update data
   * @param {string} statusData.fitnessStatus - New status
   * @param {string} statusData.fitnessNotes - Updated notes
   * @param {string} statusData.specialInstructions - Special instructions
   */
  updateFitnessStatus: async (fitnessReportId, statusData) => {
    const response = await apiClient.patch(`/ipd/fitness-reports/${fitnessReportId}/status`, statusData);
    return response;
  },

  // ==========================================
  // PRE-OP ASSESSMENTS MANAGEMENT
  // ==========================================

  /**
   * Get pre-op assessments for an admission
   * @param {string} admissionId - The admission ID
   */
  getPreOpAssessments: async (admissionId) => {
    const response = await apiClient.get(`/ipd/admissions/${admissionId}/pre-op-assessments`);
    return response;
  },

  /**
   * Create pre-op assessment
   * @param {string} admissionId - The admission ID
   * @param {Object} assessmentData - Pre-op assessment data
   * @param {string} assessmentData.allergies - Patient allergies
   * @param {string} assessmentData.currentMedications - Current medications
   * @param {string} assessmentData.medicalHistory - Medical history
   * @param {string} assessmentData.surgicalHistory - Surgical history
   * @param {string} assessmentData.anesthesiaRisk - Risk level (LOW, MEDIUM, HIGH)
   * @param {string} assessmentData.fastingStatus - Fasting status
   * @param {string} assessmentData.preOpInstructions - Pre-op instructions
   * @param {string} assessmentData.assessmentNotes - Assessment notes
   */
  createPreOpAssessment: async (admissionId, assessmentData) => {
    const response = await apiClient.post(`/ipd/admissions/${admissionId}/pre-op-assessments`, assessmentData);
    return response;
  },

  // ==========================================
  // SURGERY METRICS MANAGEMENT
  // ==========================================

  /**
   * Get surgery metrics for an admission
   * @param {string} admissionId - The admission ID
   */
  getSurgeryMetrics: async (admissionId) => {
    const response = await apiClient.get(`/ipd/admissions/${admissionId}/surgery-metrics`);
    return response;
  },

  /**
   * Create surgery metrics
   * @param {string} admissionId - The admission ID
   * @param {Object} metricsData - Surgery metrics data
   * @param {string} metricsData.surgeryStartTime - ISO date string
   * @param {string} metricsData.surgeryEndTime - ISO date string
   * @param {number} metricsData.actualDuration - Actual duration in minutes
   * @param {string} metricsData.surgeon - Surgeon name
   * @param {string} metricsData.assistantSurgeon - Assistant surgeon name
   * @param {string} metricsData.anesthesiologist - Anesthesiologist name
   * @param {string} metricsData.complications - Complications description
   * @param {string} metricsData.outcome - Surgery outcome
   * @param {string} metricsData.postOpInstructions - Post-op instructions
   * @param {string} metricsData.notes - Additional notes
   */
  createSurgeryMetrics: async (admissionId, metricsData) => {
    const response = await apiClient.post(`/ipd/admissions/${admissionId}/surgery-metrics`, metricsData);
    return response;
  },

  // ==========================================
  // SURGERY SCHEDULING & DASHBOARD
  // ==========================================

  /**
   * Get today's scheduled surgeries
   */
  getTodaysSurgeries: async () => {
    const response = await apiClient.get('/ipd/admissions/surgery/today');
    return response;
  },

  /**
   * Get upcoming surgeries
   * @param {number} days - Number of days to look ahead (default: 7)
   */
  getUpcomingSurgeries: async (days = 7, showAll = false) => {
    const params = new URLSearchParams();
    params.append('days', days);
    if (showAll) {
      params.append('showAll', 'true');
    }
    const response = await apiClient.get(`/ipd/admissions/surgery/upcoming?${params}`);
    return response;
  },

  /**
   * Get IPD dashboard statistics
   */
  getDashboardStats: async () => {
    const response = await apiClient.get('/ipd/dashboard');
    return response;
  },

  // ==========================================
  // RECEPTIONIST2 IPD ENDPOINTS
  // ==========================================

  /**
   * Receptionist2: Get today's surgeries
   */
  receptionist2: {
    getTodaysSurgeries: async () => {
      const response = await apiClient.get('/receptionist2/ipd/surgeries/today');
      return response;
    },

    /**
     * Receptionist2: Get upcoming surgeries
     * @param {number} days - Days to look ahead
     */
    getUpcomingSurgeries: async (days = 7) => {
      const response = await apiClient.get(`/receptionist2/ipd/surgeries/upcoming?days=${days}`);
      return response;
    },

    /**
     * Receptionist2: Get fitness reports for review
     * @param {Object} params - Query parameters
     * @param {string} params.status - Filter by status
     * @param {number} params.page - Page number
     * @param {number} params.limit - Items per page
     */
    getFitnessReports: async (params = {}) => {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await apiClient.get(`/receptionist2/ipd/fitness-reports?${queryParams.toString()}`);
      return response;
    },

    /**
     * Receptionist2: Get IPD dashboard statistics
     */
    getDashboardStats: async () => {
      const response = await apiClient.get('/receptionist2/ipd/dashboard/stats');
      return response;
    },

    /**
     * Receptionist2: Create surgery day visit entry
     * @param {Object} visitData - Visit data
     * @param {string} visitData.admissionId - Admission ID
     * @param {string} visitData.arrivalTime - ISO date string
     * @param {string} visitData.notes - Visit notes
     * @param {string} visitData.specialRequirements - Special requirements
     */
    createSurgeryDayVisit: async (visitData) => {
      const response = await apiClient.post('/receptionist2/ipd/surgery-visit', visitData);
      return response;
    }
  },

  // ==========================================
  // INVESTIGATION DOCUMENT UPLOAD
  // ==========================================

  /**
   * Upload investigation document for IPD admission
   * @param {string} admissionId - IPD admission ID
   * @param {FormData} formData - Form data containing the file
   */
  uploadInvestigationDocument: async (admissionId, formData) => {
    const response = await apiClient.post(`/ipd/admissions/${admissionId}/investigation-documents`, formData);
    return response;
  },

  /**
   * Delete investigation document from IPD admission
   * @param {string} admissionId 
   * @param {string} documentPath 
   * @returns {Promise}
   */
  deleteInvestigationDocument: async (admissionId, documentPath) => {
    
    const response = await apiClient.delete(`/ipd/admissions/${admissionId}/investigation-documents`, {
      data: { documentPath }
    });
    return response;
  },

  // ==========================================
  // SURGERY CHECKIN MANAGEMENT
  // ==========================================

  /**
   * Get checkin resources (equipment, lens, surgery package data)
   * @param {string} admissionId - IPD admission ID
   */
  getCheckinResources: async (admissionId) => {
    const response = await apiClient.get(`/ipd/admissions/${admissionId}/checkin-resources`);
    return response;
  },

  /**
   * Update checkin selections (equipment and lens)
   * @param {string} admissionId - IPD admission ID
   * @param {Object} selectionsData - Selection data
   * @param {Array} selectionsData.selectedEquipments - Array of equipment selections
   * @param {Object} selectionsData.selectedLens - Lens selection data
   */
  updateCheckinSelections: async (admissionId, selectionsData) => {
    const response = await apiClient.post(`/ipd/admissions/${admissionId}/checkin-selections`, selectionsData);
    return response;
  },

  /**
   * Process surgery checkin with stock adjustments
   * @param {string} admissionId - IPD admission ID
   * @param {Object} checkinData - Checkin processing data
   * @param {boolean} checkinData.finalizeStock - Whether to adjust stock (default: true)
   */
  processSurgeryCheckin: async (admissionId, checkinData = { finalizeStock: true }) => {
    const response = await apiClient.post(`/ipd/admissions/${admissionId}/process-checkin`, checkinData);
    return response;
  },

  // ==========================================
  // INSURANCE & CLAIM MANAGEMENT
  // ==========================================

  /**
   * Toggle insurance applicable status for an admission
   * @param {string} admissionId - IPD admission ID
   * @param {boolean} insuranceApplicable - Whether insurance is applicable (true/false)
   */
  toggleInsuranceApplicable: async (admissionId, insuranceApplicable) => {
    const response = await apiClient.patch(`/ipd/admissions/${admissionId}/insurance-applicable`, {
      insuranceApplicable
    });
    return response;
  }
};

export default ipdService;