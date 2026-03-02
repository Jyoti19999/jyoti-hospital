// src/services/otAdminService.js
import apiClient from '@/lib/api';

/*
========================================
🏥 OT ADMIN SERVICE
========================================

API service for OT Admin operations:
- Completed surgeries management
- Equipment stock adjustments
- Surgery equipment finalization
*/

const otAdminService = {
  // ==========================================
  // COMPLETED SURGERIES MANAGEMENT
  // ==========================================

  /**
   * Get completed surgeries for OT Admin
   * @returns {Promise<Object>} API response with completed surgeries
   */
  getCompletedSurgeries: async () => {
    try {
      
      const response = await apiClient.get('/ot-admin/completed-surgeries');
      
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
   * Finalize equipment stock adjustments after surgery
   * @param {number} admissionId - IPD admission ID
   * @param {Object} adjustments - Stock adjustment data
   * @param {Array} adjustments.unusedEquipment - Equipment to return to stock
   * @param {Array} adjustments.extraEquipment - Extra equipment used (deduct from stock)
   * @param {Array} adjustments.unusedLenses - Lenses to return to stock
   * @param {Array} adjustments.extraLenses - Extra lenses used (deduct from stock)
   * @param {string} adjustments.notes - Adjustment notes
   * @returns {Promise<Object>} API response
   */
  finalizeEquipmentStock: async (admissionId, adjustments) => {
    try {
      
      const response = await apiClient.post(`/ot-admin/finalize-equipment/${admissionId}`, adjustments);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to finalize equipment stock');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get surgery details with equipment information
   * @param {number} admissionId - IPD admission ID
   * @returns {Promise<Object>} API response with detailed surgery information
   */
  getSurgeryDetails: async (admissionId) => {
    try {
      
      const response = await apiClient.get(`/ot-admin/surgery/${admissionId}/details`);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch surgery details');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get equipment and lens master data for adjustments
   * @returns {Promise<Object>} API response with equipment and lens data
   */
  getEquipmentMasterData: async () => {
    try {
      
      const response = await apiClient.get('/ot-admin/equipment-master-data');
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch equipment master data');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get today's scheduled surgeries
   * @returns {Promise<Object>} API response with today's surgeries
   */
  getTodaysSurgeries: async () => {
    try {
      const response = await apiClient.get('/ipd/admissions/surgery/today');
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch today\'s surgeries');
      }
    } catch (error) {
      throw error;
    }
  },

  // ==========================================
  // OT ROOMS MANAGEMENT
  // ==========================================

  /**
   * Get all OT rooms
   * @returns {Promise<Object>} API response with OT rooms
   */
  getAllOTRooms: async () => {
    try {
      const response = await apiClient.get('/ot-rooms');
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch OT rooms');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get single OT room by ID
   * @param {string} id - OT room ID
   * @returns {Promise<Object>} API response with OT room details
   */
  getOTRoomById: async (id) => {
    try {
      
      const response = await apiClient.get(`/ot-rooms/${id}`);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch OT room');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create new OT room
   * @param {Object} roomData - OT room data
   * @returns {Promise<Object>} API response
   */
  createOTRoom: async (roomData) => {
    try {
      
      const response = await apiClient.post('/ot-rooms', roomData);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to create OT room');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update OT room
   * @param {string} id - OT room ID
   * @param {Object} roomData - Updated OT room data
   * @returns {Promise<Object>} API response
   */
  updateOTRoom: async (id, roomData) => {
    try {
      
      const response = await apiClient.put(`/ot-rooms/${id}`, roomData);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to update OT room');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete OT room
   * @param {string} id - OT room ID
   * @returns {Promise<Object>} API response
   */
  deleteOTRoom: async (id) => {
    try {
      
      const response = await apiClient.delete(`/ot-rooms/${id}`);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to delete OT room');
      }
    } catch (error) {
      throw error;
    }
  }
};

export { otAdminService };