// src/services/equipmentService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Configure axios defaults
axios.defaults.withCredentials = true;

/**
 * Equipment Service
 * Handles all API calls related to equipment management and stock operations
 */

class EquipmentService {

  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @param {string} defaultMessage - Default error message
   * @returns {Error} Formatted error
   */
  handleApiError(error, defaultMessage) {
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 
                     error.response.data?.error || 
                     `Server error: ${error.response.status}`;
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error: Please check your internet connection');
    } else {
      // Something else happened
      return new Error(error.message || defaultMessage);
    }
  }

  /**
   * Get authorization headers
   * @returns {Object} Headers with authorization token
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // ========== EQUIPMENT CRUD OPERATIONS ==========

  /**
   * Get all equipment with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Equipment list with pagination
   */
  async getAllEquipment(params = {}) {
    try {
      
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await axios.get(
        `${API_BASE_URL}/equipment?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch equipment list');
    }
  }

  /**
   * Get single equipment by ID
   * @param {string} id - Equipment ID
   * @returns {Promise<Object>} Equipment details
   */
  async getEquipmentById(id) {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/equipment/${id}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch equipment details');
    }
  }

  /**
   * Create new equipment
   * @param {Object} equipmentData - Equipment data
   * @returns {Promise<Object>} Created equipment
   */
  async createEquipment(equipmentData) {
    try {
      
      const response = await axios.post(
        `${API_BASE_URL}/equipment`,
        equipmentData,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to create equipment');
    }
  }

  /**
   * Update equipment
   * @param {string} id - Equipment ID
   * @param {Object} updates - Equipment updates
   * @returns {Promise<Object>} Updated equipment
   */
  async updateEquipment(id, updates) {
    try {
      
      const response = await axios.put(
        `${API_BASE_URL}/equipment/${id}`,
        updates,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to update equipment');
    }
  }

  /**
   * Delete equipment (soft delete)
   * @param {string} id - Equipment ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteEquipment(id) {
    try {
      
      const response = await axios.delete(
        `${API_BASE_URL}/equipment/${id}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to delete equipment');
    }
  }

  // ========== STOCK MANAGEMENT OPERATIONS ==========

  /**
   * Add stock to equipment
   * @param {string} id - Equipment ID
   * @param {Object} stockData - Stock addition data
   * @returns {Promise<Object>} Updated equipment
   */
  async addStock(id, stockData) {
    try {
      
      const response = await axios.post(
        `${API_BASE_URL}/equipment/${id}/stock/add`,
        stockData,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to add stock');
    }
  }

  /**
   * Remove stock from equipment
   * @param {string} id - Equipment ID
   * @param {Object} stockData - Stock removal data
   * @returns {Promise<Object>} Updated equipment
   */
  async removeStock(id, stockData) {
    try {
      
      const response = await axios.post(
        `${API_BASE_URL}/equipment/${id}/stock/remove`,
        stockData,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to remove stock');
    }
  }

  /**
   * Adjust equipment stock manually
   * @param {string} id - Equipment ID
   * @param {Object} adjustmentData - Stock adjustment data
   * @returns {Promise<Object>} Updated equipment
   */
  async adjustStock(id, adjustmentData) {
    try {
      
      const response = await axios.post(
        `${API_BASE_URL}/equipment/${id}/stock/adjust`,
        adjustmentData,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to adjust stock');
    }
  }

  /**
   * Get stock transactions for equipment
   * @param {string} id - Equipment ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Stock transactions
   */
  async getStockTransactions(id, params = {}) {
    try {
      
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await axios.get(
        `${API_BASE_URL}/equipment/${id}/stock/transactions?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch stock transactions');
    }
  }

  // ========== ANALYTICS AND STATISTICS ==========

  /**
   * Get equipment dashboard statistics
   * @returns {Promise<Object>} Dashboard stats
   */
  async getDashboardStats() {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/equipment/stats/dashboard`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get equipment usage analytics
   * @param {Object} params - Date range and other filters
   * @returns {Promise<Object>} Usage analytics
   */
  async getUsageStats(params = {}) {
    try {
      
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await axios.get(
        `${API_BASE_URL}/equipment/stats/usage?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch usage statistics');
    }
  }

  /**
   * Get low stock equipment items
   * @returns {Promise<Object>} Low stock items
   */
  async getLowStockItems() {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/equipment/low-stock`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch low stock items');
    }
  }

  /**
   * Get near expiry equipment items
   * @param {number} days - Days until expiry threshold
   * @returns {Promise<Object>} Near expiry items
   */
  async getNearExpiryItems(days = 30) {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/equipment/near-expiry?days=${days}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch near expiry items');
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Search equipment
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results
   */
  async searchEquipment(query) {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/equipment/search?q=${encodeURIComponent(query)}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to search equipment');
    }
  }

  /**
   * Get equipment categories
   * @returns {Promise<Object>} Equipment categories
   */
  async getCategories() {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/equipment/categories`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch equipment categories');
    }
  }
}

// Export singleton instance
const equipmentService = new EquipmentService();
export default equipmentService;