// src/services/surgeryService.js
import apiClient from '@/lib/api';
/*
========================================
🏥 SURGERY SERVICE
========================================

API service for surgery recommendation workflow:
- Surgery recommended patients (Receptionist2)
- Surgery details management
- Surgery assignments (OT Admin)
*/

const surgeryService = {
  // ==========================================
  // RECEPTIONIST2 SURGERY WORKFLOW
  // ==========================================

  /**
   * Get patients recommended for surgery by ophthalmologist
   */
  getSurgeryRecommendedPatients: async () => {
    const response = await apiClient.get('/receptionist2/surgery/recommended-patients');
    return response;
  },

  /**
   * Update surgery details for a patient (Receptionist2 workflow)
   * @param {string} patientId - Patient ID
   * @param {Object} surgeryDetails - Surgery details
   * @param {string} surgeryDetails.surgeryDate - ISO date string
   * @param {string} surgeryDetails.tentativeTime - Time string (HH:MM)
   * @param {string} surgeryDetails.surgeryPackage - Package type
   * @param {string} surgeryDetails.iolType - IOL lens type
   * @param {string} surgeryDetails.specialInstructions - Special instructions
   * @param {string} surgeryDetails.preOpInstructions - Pre-op instructions
   * @param {number} surgeryDetails.expectedDuration - Duration in minutes
   * @param {string} surgeryDetails.priorityLevel - Priority level
   */
  updateSurgeryDetails: async (patientId, surgeryDetails) => {
    const response = await apiClient.post(`/surgery/patients/${patientId}/update-details`, surgeryDetails);
    return response;
  },

  // ==========================================
  // OT ADMIN SURGERY WORKFLOW
  // ==========================================

  /**
   * Get upcoming surgery requests awaiting OT assignment
   */
  getUpcomingSurgeryRequests: async () => {
    const response = await apiClient.get('/surgery/upcoming-requests');
    return response;
  },

  /**
   * Assign surgeon and OT room to surgery request
   * @param {string} admissionId - IPD admission ID
   * @param {Object} assignmentDetails - Assignment details
   * @param {string} assignmentDetails.surgeonId - Surgeon staff ID
   * @param {string} assignmentDetails.otRoom - OT room identifier
   * @param {string} assignmentDetails.finalSurgeryDate - Final surgery date ISO string
   * @param {string} assignmentDetails.finalTime - Final surgery time
   * @param {string} assignmentDetails.anesthesiaType - Type of anesthesia
   * @param {string} assignmentDetails.assistantStaff - Assistant staff
   * @param {string} assignmentDetails.equipmentNeeds - Equipment requirements
   * @param {string} assignmentDetails.otAdminNotes - OT admin notes
   */
  assignSurgeryDetails: async (admissionId, assignmentDetails) => {
    const response = await apiClient.post(`/surgery/admissions/${admissionId}/assign-details`, assignmentDetails);
    return response;
  },

  // ==========================================
  // ADMIN SURGERY MANAGEMENT
  // ==========================================

  // Surgery Types
  getSurgeryTypes: async (page = 1, limit = 10, search = '') => {
    return apiClient.get(`/surgery-types/admin/types?page=${page}&limit=${limit}&search=${search}`);
  },

  createSurgeryType: async (surgeryTypeData) => {
    return apiClient.post('/surgery-types/admin/types', surgeryTypeData);
  },

  updateSurgeryType: async (id, surgeryTypeData) => {
    return apiClient.put(`/surgery-types/admin/types/${id}`, surgeryTypeData);
  },

  deleteSurgeryType: async (id) => {
    return apiClient.delete(`/surgery-types/admin/types/${id}`);
  },

  getSurgeryTypeDetails: async (id) => {
    return apiClient.get(`/surgery-types/types/${id}`);
  },

  // Surgery Packages
  getSurgeryPackages: async (page = 1, limit = 10, search = '') => {
    return apiClient.get(`/surgery-types/admin/packages?page=${page}&limit=${limit}&search=${search}`);
  },

  createSurgeryPackage: async (packageData) => {
    return apiClient.post('/surgery-types/packages', packageData);
  },

  updateSurgeryPackage: async (id, packageData) => {
    return apiClient.put(`/surgery-types/admin/packages/${id}`, packageData);
  },

  deleteSurgeryPackage: async (id) => {
    return apiClient.delete(`/surgery-types/admin/packages/${id}`);
  },

  updatePackageBreakdown: async (id, packageBreakdown) => {
    return apiClient.put(`/surgery-types/admin/packages/${id}`, { packageBreakdown });
  },

  getSurgeryTypePackages: async (surgeryTypeId) => {
    return apiClient.get(`/surgery-types/types/${surgeryTypeId}/packages`);
  },

  // Fitness Investigations
  getFitnessInvestigations: async () => {
    return apiClient.get('/surgery-types/admin/investigations');
  },

  getSurgeryFitnessRequirements: async (surgeryTypeId) => {
    return apiClient.get(`/surgery-types/types/${surgeryTypeId}/fitness-requirements`);
  },

  // Lenses
  getLenses: async (page = 1, limit = 10, search = '', category = '') => {
    return apiClient.get(`/surgery-types/lenses?page=${page}&limit=${limit}&search=${search}&category=${category}`);
  },

  getAllLenses: async () => {
    return apiClient.get('/surgery-types/lenses');
  },

  createLens: async (lensData) => {
    return apiClient.post('/surgery-types/lenses', lensData);
  },

  updateLens: async (id, lensData) => {
    return apiClient.put(`/surgery-types/lenses/${id}`, lensData);
  },

  deleteLens: async (id) => {
    return apiClient.delete(`/surgery-types/lenses/${id}`);
  },

  // Surgery Type Dropdown (for forms)
  getSurgeryTypeDropdown: async () => {
    return apiClient.get('/surgery-types/types/dropdown');
  },

  /**
   * Get surgery types with their assigned investigations
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response with surgery types and their investigations
   */
  getSurgeryTypesWithInvestigations: async (params = {}) => {
    try {
      
      const response = await apiClient.get('/surgery-types/admin/types', { params: { ...params, includeInvestigations: true } });
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch surgery types with investigations');
      }
    } catch (error) {
      throw error;
    }
  },

  // ==========================================
  // SURGERY TYPE INVESTIGATION ASSIGNMENT
  // ==========================================

  /**
   * Assign investigations to a surgery type
   * @param {string} surgeryTypeId - Surgery type ID
   * @param {string[]} investigationIds - Array of investigation IDs
   * @returns {Promise<Object>} API response
   */
  assignInvestigationsToSurgeryType: async (surgeryTypeId, investigationIds) => {
    try {
      
      const response = await apiClient.post(`/surgery-types/admin/types/${surgeryTypeId}/investigations/assign`, {
        investigationIds
      });
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to assign investigations');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove investigations from a surgery type
   * @param {string} surgeryTypeId - Surgery type ID
   * @param {string[]} investigationIds - Array of investigation IDs to remove
   * @returns {Promise<Object>} API response
   */
  removeInvestigationsFromSurgeryType: async (surgeryTypeId, investigationIds) => {
    try {
      
      const response = await apiClient.post(`/surgery-types/admin/types/${surgeryTypeId}/investigations/remove`, {
        investigationIds
      });
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to remove investigations');
      }
    } catch (error) {
      throw error;
    }
  },

  // ==========================================
  // SURGEON DASHBOARD SURGERY METHODS
  // ==========================================

  /**
   * Get surgeon dashboard statistics
   * @returns {Promise<Object>} API response with dashboard statistics
   */
  getSurgeonDashboardStats: async () => {
    try {
      
      const response = await apiClient.get('/ipd/surgeon/dashboard-stats');
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard statistics');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get anesthesiologist dashboard statistics
   * @returns {Promise<Object>} API response with dashboard statistics
   */
  getAnesthesiologistDashboardStats: async () => {
    try {
      
      const response = await apiClient.get('/ipd/anesthesiologist/dashboard-stats');
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch anesthesiologist dashboard statistics');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get patients ready for surgery
   * @returns {Promise<Object>} API response with patients ready for surgery
   */
  getReadyForSurgeryPatients: async () => {
    try {
      
      const response = await apiClient.get('/ipd/surgeon/ready-for-surgery');
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch ready for surgery patients');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get patients with surgery already started
   * @returns {Promise<Object>} API response with patients with ongoing surgery
   */
  getSurgeryStartedPatients: async () => {
    try {
      
      const response = await apiClient.get('/ipd/surgeon/surgery-started');
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch surgery started patients');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get patient's recent examination data
   * @param {number} patientId - Patient ID
   * @returns {Promise<Object>} API response with examination data
   */
  getPatientRecentExamination: async (patientId) => {
    try {
      
      const response = await apiClient.get(`/ipd/surgeon/patient/${patientId}/examination`);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch patient examination data');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get available equipment for surgery
   * @returns {Promise<Object>} API response with available equipment
   */
  getAvailableEquipment: async () => {
    try {
      
      const response = await apiClient.get('/ipd/surgeon/available-equipment');
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch available equipment');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Start surgery
   * @param {Object} data - Surgery start data
   * @param {number} data.ipdAdmissionId - IPD admission ID
   * @param {string} data.surgicalNotes - Surgical notes
   * @param {Array} data.equipmentUsed - Equipment used
   * @returns {Promise<Object>} API response
   */
  startSurgery: async (data) => {
    try {
      
      const response = await apiClient.post('/ipd/surgeon/start-surgery', data);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to start surgery');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Complete surgery
   * @param {Object} data - Surgery completion data
   * @param {number} data.ipdAdmissionId - IPD admission ID
   * @param {string} data.finalNotes - Final surgical notes
   * @returns {Promise<Object>} API response
   */
  completeSurgery: async (data) => {
    try {
      
      const response = await apiClient.post('/ipd/surgeon/complete-surgery', data);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to complete surgery');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get completed surgeries
   * @returns {Promise<Object>} API response with completed surgeries
   */
  getCompletedSurgeries: async () => {
    try {
      
      const response = await apiClient.get('/ipd/surgeon/completed-surgeries');
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch completed surgeries');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Give anesthesia to patient
   * @param {string} admissionId - IPD admission ID
   * @returns {Promise<Object>} API response
   */
  giveAnesthesia: async (admissionId) => {
    try {
      
      const response = await apiClient.post(`/ipd/admissions/${admissionId}/give-anesthesia`);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to mark anesthesia as given');
      }
    } catch (error) {
      throw error;
    }
  },

  // ==========================================
  // SURGEON ANALYTICS
  // ==========================================

  /**
   * Get surgeon analytics data (monthly performance, surgery distribution, metrics)
   */
  getSurgeonAnalytics: async () => {
    const response = await apiClient.get('/surgery/surgeon-analytics');
    return response;
  }
};

export { surgeryService };