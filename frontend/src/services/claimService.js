import apiClient from '@/lib/api';

export const claimService = {
  /**
   * Calculate claim amount for IPD admission
   * @param {string} ipdId - IPD admission ID
   * @returns {Promise} Response with calculated amount breakdown
   */
  calculateClaimAmount: async (ipdId) => {
    try {
      const response = await apiClient.get(`/claims/ipd/${ipdId}/claim/calculate`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload claim documents and initiate claim
   * @param {string} ipdId - IPD admission ID
   * @param {FormData} formData - Form data with files and claim info
   * @returns {Promise} Response with claim details
   */
  uploadClaimDocuments: async (ipdId, formData) => {
    try {
      const response = await apiClient.post(
        `/claims/ipd/${ipdId}/claim/upload`,
        formData
        // Don't set Content-Type header - browser will set it automatically with boundary
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get claim details for an IPD admission
   * @param {string} ipdId - IPD admission ID
   * @returns {Promise} Response with complete claim details
   */
  getClaimDetails: async (ipdId) => {
    try {
      const response = await apiClient.get(`/claims/ipd/${ipdId}/claim`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update claim amount
   * @param {string} ipdId - IPD admission ID
   * @param {number} amount - New claim amount
   * @returns {Promise} Response with updated claim
   */
  updateClaimAmount: async (ipdId, amount) => {
    try {
      const response = await apiClient.patch(`/claims/ipd/${ipdId}/claim/amount`, {
        claimAmountRequested: amount
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update claim status
   * @param {string} ipdId - IPD admission ID
   * @param {Object} statusData - Status update data
   * @param {string} statusData.claimStatus - New status (APPLIED, UNDER_REVIEW, APPROVED, etc.)
   * @param {number} [statusData.claimAmountSanctioned] - Sanctioned amount (for APPROVED status)
   * @param {string} [statusData.claimRejectionReason] - Rejection reason (for REJECTED status)
   * @returns {Promise} Response with updated claim
   */
  updateClaimStatus: async (ipdId, statusData) => {
    try {
      const response = await apiClient.patch(
        `/claims/ipd/${ipdId}/claim/status`,
        statusData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all pending claims
   * @returns {Promise} Response with pending claims list
   */
  getPendingClaims: async () => {
    try {
      const response = await apiClient.get('/claims/pending');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all approved claims with optional filters
   * @param {Object} filters - Filter options
   * @param {string} [filters.search] - Search term for patient/claim/provider
   * @param {string} [filters.startDate] - Start date for filtering (YYYY-MM-DD)
   * @param {string} [filters.endDate] - End date for filtering (YYYY-MM-DD)
   * @returns {Promise} Response with approved claims list
   */
  getApprovedClaims: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      const queryString = queryParams.toString();
      const url = `/claims/approved${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all rejected claims with optional filters
   * @param {Object} filters - Filter options
   * @param {string} [filters.search] - Search term for patient/claim/provider
   * @param {string} [filters.startDate] - Start date for filtering (YYYY-MM-DD)
   * @param {string} [filters.endDate] - End date for filtering (YYYY-MM-DD)
   * @returns {Promise} Response with rejected claims list
   */
  getRejectedClaims: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      const queryString = queryParams.toString();
      const url = `/claims/rejected${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get TPA analytics stats
   * @returns {Promise} Response with analytics data (totalClaims, approvedClaims, underProcessClaims, approvalRate)
   */
  getClaimAnalytics: async () => {
    try {
      const response = await apiClient.get('/claims/analytics');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get recent claims (max 4) for overview
   * @returns {Promise} Response with recent claims list
   */
  getRecentClaims: async () => {
    try {
      const response = await apiClient.get('/claims/recent');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update IPD admission with final surgery amount and payment mode
   * @param {string} ipdId - IPD admission ID
   * @param {Object} updateData - Update data
   * @param {number} updateData.finalSurgeryAmount - Final calculated amount
   * @param {boolean} [updateData.isCashless] - Is cashless treatment
   * @param {boolean} [updateData.isReimbursement] - Is reimbursement treatment
   * @returns {Promise} Response with updated IPD admission
   */
  updateIpdAdmissionAmount: async (ipdId, updateData) => {
    try {
      const response = await apiClient.patch(`/claims/ipd/${ipdId}/update-admission`, updateData);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default claimService;
