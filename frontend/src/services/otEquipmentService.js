// src/services/otEquipmentService.js
import apiClient from '@/lib/api';

const otEquipmentService = {
  /**
   * Get all equipment
   */
  getAllEquipment: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/ot-equipment${queryParams ? `?${queryParams}` : ''}`;
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get equipment by ID
   */
  getEquipmentById: async (id) => {
    try {
      const response = await apiClient.get(`/ot-equipment/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create new equipment
   */
  createEquipment: async (data) => {
    try {
      const response = await apiClient.post('/ot-equipment', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update equipment
   */
  updateEquipment: async (id, data) => {
    try {
      const response = await apiClient.put(`/ot-equipment/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete equipment
   */
  deleteEquipment: async (id) => {
    try {
      const response = await apiClient.delete(`/ot-equipment/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get equipment statistics
   */
  getEquipmentStats: async () => {
    try {
      const response = await apiClient.get('/ot-equipment/stats');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add maintenance log
   */
  addMaintenanceLog: async (equipmentId, data) => {
    try {
      const response = await apiClient.post(`/ot-equipment/${equipmentId}/maintenance`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default otEquipmentService;
