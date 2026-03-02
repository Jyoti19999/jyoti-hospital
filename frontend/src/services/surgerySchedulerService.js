// src/services/surgerySchedulerService.js
import apiClient from '@/lib/api';

/*
========================================
🏥 SURGERY SCHEDULER SERVICE
========================================

API service for surgery scheduling operations:
- Get patients suggested for surgery
- Get surgery types and investigations
- Get surgery packages
- Get staff by type (surgeons, sisters, anesthesiologists)
- Schedule surgery with all required data
*/

export const surgerySchedulerService = {
  // ==========================================
  // SURGERY SUGGESTED PATIENTS
  // ==========================================

  /**
   * Get all patients with status SURGERY_SUGGESTED from IPD admissions
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.search - Search term for patient name/MRN
   */
  getSurgerySuggestedPatients: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Set default status filter
    queryParams.append('status', 'SURGERY_SUGGESTED');
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await apiClient.get(`/ipd/admissions?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get all patients with scheduled surgeries (status SURGERY_SCHEDULED)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.search - Search term for patient name/MRN
   */
  getScheduledSurgeries: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Set default status filter for scheduled surgeries
    queryParams.append('status', 'SURGERY_SCHEDULED');
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await apiClient.get(`/ipd/admissions?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get single IPD admission details by ID
   * @param {string} admissionId - The admission ID
   */
  getAdmissionDetails: async (admissionId) => {
    const response = await apiClient.get(`/ipd/admissions/${admissionId}`);
    return response;
  },

  // ==========================================
  // SURGERY TYPES & INVESTIGATIONS
  // ==========================================

  /**
   * Get surgery type details including investigations
   * @param {string} surgeryTypeId - Surgery type ID
   */
  getSurgeryTypeDetails: async (surgeryTypeId) => {
    const response = await apiClient.get(`/surgery-types/types/${surgeryTypeId}`);
    return response;
  },

  /**
   * Get investigations for a surgery type from investigationIds array
   * @param {string} surgeryTypeId - Surgery type ID
   */
  getSurgeryTypeInvestigations: async (surgeryTypeId) => {
    const response = await apiClient.get(`/surgery-types/types/${surgeryTypeId}/investigations`);
    return response;
  },

  /**
   * Get all investigations list (with larger limit to get all investigations) - TPA accessible
   */
  getAllInvestigations: async () => {
    const response = await apiClient.get('/surgery-types/investigations?limit=1000');
    return response;
  },

  /**
   * Get fitness investigations by IDs
   * @param {string[]} investigationIds - Array of investigation IDs
   */
  getInvestigationsByIds: async (investigationIds) => {
    if (!investigationIds || investigationIds.length === 0) return { success: true, data: [] };
    
    const queryParams = new URLSearchParams();
    investigationIds.forEach(id => queryParams.append('ids', id));
    
    const response = await apiClient.get(`/surgery-types/investigations/by-ids?${queryParams.toString()}`);
    return response;
  },

  // ==========================================
  // SURGERY PACKAGES
  // ==========================================

  /**
   * Get surgery packages for a specific surgery type
   * @param {string} surgeryTypeId - Surgery type ID
   */
  getSurgeryPackagesBySurgeryType: async (surgeryTypeId) => {
    const response = await apiClient.get(`/surgery-types/types/${surgeryTypeId}/packages`);
    return response;
  },

  /**
   * Get all surgery packages
   */
  getAllSurgeryPackages: async () => {
    const response = await apiClient.get('/surgery-types/admin/packages');
    return response;
  },

  /**
   * Get packages separated by recommended (matching surgery type) vs others
   * @param {string} surgeryTypeId - The surgery type ID to filter recommended packages
   */
  getPackagesWithRecommendations: async (surgeryTypeId) => {
    try {
      // Get packages for the specific surgery type (recommended)
      const [specificPackagesRes, allPackagesRes] = await Promise.all([
        apiClient.get(`/surgery-types/types/${surgeryTypeId}/packages`),
        apiClient.get('/surgery-types/admin/packages?limit=1000') // Add large limit to get all packages
      ]);

      if (!specificPackagesRes.success || !allPackagesRes.success) {
        return {
          success: false,
          message: 'Failed to fetch surgery packages',
          data: { recommended: [], other: [], all: [] }
        };
      }

      const specificPackages = specificPackagesRes.data || [];
      const allPackages = allPackagesRes.data || [];

      // Create a Set of IDs from specific packages for faster lookup
      const specificPackageIds = new Set(specificPackages.map(pkg => pkg.id));

      // Separate recommended (specific to surgery type) vs other packages
      const recommended = specificPackages;
      const other = allPackages.filter(pkg => !specificPackageIds.has(pkg.id));

      return {
        success: true,
        data: {
          recommended,
          other,
          all: allPackages
        },
        message: 'Surgery packages retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch surgery packages',
        data: { recommended: [], other: [], all: [] }
      };
    }
  },

  // ==========================================
  // STAFF MANAGEMENT
  // ==========================================

  /**
   * Get staff by specific type (alias method for consistency)
   */
  getSurgeryStaff: async () => {
    return surgerySchedulerService.getAllSurgeryStaff();
  },

  /**
   * Get staff by specific type
   * @param {string} staffType - Staff type ('surgeon', 'sister', 'anesthesiologist')
   */
  getStaffByType: async (staffType) => {
    const response = await apiClient.get(`/super-admin/staff/by-type/${staffType}`);
    return response;
  },

  /**
   * Get all surgery-related staff in one call (more efficient)
   */
  getAllSurgeryStaff: async () => {
    const response = await apiClient.get('/super-admin/staff/surgery-staff');
    return response;
  },

  /**
   * Get surgeons (staff with type 'surgeon')
   */
  getSurgeons: async () => {
    return apiClient.get('/super-admin/staff/by-type/surgeon');
  },

  /**
   * Get sisters (staff with type 'sister')
   */
  getSisters: async () => {
    return apiClient.get('/super-admin/staff/by-type/sister');
  },

  /**
   * Get anesthesiologists (staff with type 'anesthesiologist')
   */
  getAnesthesiologists: async () => {
    return apiClient.get('/super-admin/staff/by-type/anesthesiologist');
  },

  // ==========================================
  // SURGERY SCHEDULING
  // ==========================================

  /**
   * Schedule surgery for a patient
   * @param {string} admissionId - IPD admission ID
   * @param {Object} surgeryData - Surgery scheduling data
   * @param {string} surgeryData.surgeryDate - Surgery date (ISO string)
   * @param {string} surgeryData.surgeryTimeSlot - Surgery time slot (e.g., "09:00-10:00")
   * @param {string} surgeryData.surgeryPackageId - Selected surgery package ID
   * @param {string} surgeryData.surgeonId - Surgeon staff ID
   * @param {string} surgeryData.sisterId - Sister staff ID
   * @param {string} surgeryData.anesthesiologistId - Anesthesiologist staff ID
   * @param {string} surgeryData.tentativeTime - Surgery time (HH:MM format)
   * @param {number} surgeryData.expectedDuration - Expected duration in minutes
   * @param {string} surgeryData.priorityLevel - Priority level
   * @param {string} surgeryData.notes - Additional notes
   * @param {boolean} surgeryData.lensRequired - Whether lens is required for surgery
   * @param {string} surgeryData.lensId - Selected lens ID
   */
  scheduleSurgery: async (admissionId, surgeryData) => {
    console.log('🚀 Surgery Scheduler Service - scheduleSurgery called:');
    console.log('   admissionId:', admissionId);
    console.log('   surgeryData:', surgeryData);
    console.log('   surgeryData.surgeryPackageId:', surgeryData.surgeryPackageId);
    
    const requestData = {
      surgeryDate: surgeryData.surgeryDate,
      surgeryTimeSlot: surgeryData.surgeryTimeSlot,
      surgeryPackageId: surgeryData.surgeryPackageId,
      surgeonId: surgeryData.surgeonId,
      sisterId: surgeryData.sisterId,
      anesthesiologistId: surgeryData.anesthesiologistId,
      otRoomId: surgeryData.otRoomId,
      tentativeTime: surgeryData.tentativeTime,
      expectedDuration: surgeryData.expectedDuration,
      priorityLevel: surgeryData.priorityLevel,
      status: 'SURGERY_SCHEDULED',
      notes: surgeryData.notes,
      lensRequired: surgeryData.lensRequired,
      lensId: surgeryData.lensId
    };

    console.log('📤 Sending request data to backend:', requestData);

    const response = await apiClient.put(`/ipd/admissions/${admissionId}`, requestData);
    return response;
  },

  /**
   * Update surgery date for an admission
   * @param {string} admissionId - IPD admission ID
   * @param {string} surgeryDate - New surgery date (ISO string)
   */
  updateSurgeryDate: async (admissionId, surgeryDate) => {
    const response = await apiClient.put(`/ipd/admissions/${admissionId}`, {
      surgeryDate: surgeryDate
    });
    return response;
  },

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  /**
   * Get surgery scheduling dashboard statistics
   */
  getSchedulingStats: async () => {
    const response = await apiClient.get('/ipd/dashboard');
    return response;
  },

  /**
   * Get upcoming scheduled surgeries
   * @param {number} days - Number of days to look ahead (default: 7)
   */
  getUpcomingScheduledSurgeries: async (days = 7) => {
    const response = await apiClient.get(`/ipd/admissions/surgery/upcoming?days=${days}`);
    return response;
  },

  /**
   * Get today's scheduled surgeries
   */
  getTodaysScheduledSurgeries: async () => {
    const response = await apiClient.get('/ipd/admissions/surgery/today');
    return response;
  },

  // ==========================================
  // LENS MANAGEMENT
  // ==========================================

  /**
   * Get all available lenses for surgery scheduling
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term for lens name/manufacturer
   * @param {string} params.lensType - Filter by lens type
   * @param {string} params.lensCategory - Filter by lens category
   * @param {string} params.manufacturer - Filter by manufacturer
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   */
  getAvailableLenses: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await apiClient.get(`/lenses/available?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get lens details by ID
   * @param {string} lensId - Lens ID
   */
  getLensById: async (lensId) => {
    const response = await apiClient.get(`/lenses/${lensId}`);
    return response;
  },

  /**
   * Search lenses by term
   * @param {string} searchTerm - Search term
   * @param {Object} params - Additional parameters
   */
  searchLenses: async (searchTerm, params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await apiClient.get(`/lenses/search/${encodeURIComponent(searchTerm)}?${queryParams.toString()}`);
    return response;
  },

  // ==========================================
  // ADDITIONAL CHARGES
  // ==========================================

  /**
   * Get all additional charges
   */
  getAdditionalCharges: async () => {
    const response = await apiClient.get('/surgery-types/additional-charges');
    return response;
  }
};

export default surgerySchedulerService;