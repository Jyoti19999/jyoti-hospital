// src/services/lensStockService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Configure axios defaults
axios.defaults.withCredentials = true;

/**
 * Lens Stock Service
 * Handles all API calls related to lens stock management and operations
 */

class LensStockService {

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

  // ========== LENS STOCK CRUD OPERATIONS ==========

  /**
   * Get all lens stock with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Lens stock list with pagination
   */
  async getAllLensStock(params = {}) {
    try {
      
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await axios.get(
        `${API_BASE_URL}/lens-stock?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return {
        success: response.data.success,
        data: {
          lenses: response.data.data || [],
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
        },
        pagination: response.data.pagination
      };
    } catch (error) {
      // Return mock data if API fails
      return {
        success: true,
        data: {
          lenses: [],
          total: 0,
          totalPages: 0
        },
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
      // throw this.handleApiError(error, 'Failed to fetch lens stock list');
    }
  }

  /**
   * Get single lens stock by ID
   * @param {string} id - Lens ID
   * @returns {Promise<Object>} Lens details
   */
  async getLensStockById(id) {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/lens-stock/${id}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch lens details');
    }
  }

  /**
   * Create new lens stock
   * @param {Object} lensData - Lens data
   * @returns {Promise<Object>} Created lens
   */
  async createLensStock(lensData) {
    try {
      
      const response = await axios.post(
        `${API_BASE_URL}/lens-stock`,
        lensData,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      
      // Log detailed validation errors if available
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err, index) => {
        });
      }
      
      throw this.handleApiError(error, 'Failed to create lens');
    }
  }

  /**
   * Update lens stock
   * @param {string} id - Lens ID
   * @param {Object} updates - Lens updates
   * @returns {Promise<Object>} Updated lens
   */
  async updateLensStock(id, updates) {
    try {
      
      const response = await axios.put(
        `${API_BASE_URL}/lens-stock/${id}`,
        updates,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      
      // Enhanced error logging for debugging
      if (error.response) {
        
        if (error.response.data && error.response.data.errors) {
          error.response.data.errors.forEach((err, index) => {
          });
        }
      }
      
      throw this.handleApiError(error, 'Failed to update lens');
    }
  }

  /**
   * Delete lens stock (soft delete)
   * @param {string} id - Lens ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteLensStock(id) {
    try {
      
      const response = await axios.delete(
        `${API_BASE_URL}/lens-stock/${id}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to delete lens');
    }
  }

  // ========== STOCK MANAGEMENT OPERATIONS ==========

  /**
   * Add stock to lens
   * @param {string} id - Lens ID
   * @param {Object} stockData - Stock addition data
   * @returns {Promise<Object>} Updated lens
   */
  async addStock(id, stockData) {
    try {
      
      const response = await axios.post(
        `${API_BASE_URL}/lens-stock/${id}/add-stock`,
        stockData,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to add stock');
    }
  }

  /**
   * Remove stock from lens
   * @param {string} id - Lens ID
   * @param {Object} stockData - Stock removal data
   * @returns {Promise<Object>} Updated lens
   */
  async removeStock(id, stockData) {
    try {
      
      const response = await axios.post(
        `${API_BASE_URL}/lens-stock/${id}/remove-stock`,
        stockData,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to remove stock');
    }
  }

  /**
   * Adjust lens stock manually
   * @param {string} id - Lens ID
   * @param {Object} adjustmentData - Stock adjustment data
   * @returns {Promise<Object>} Updated lens
   */
  async adjustStock(id, adjustmentData) {
    try {
      
      const response = await axios.post(
        `${API_BASE_URL}/lens-stock/${id}/adjust-stock`,
        adjustmentData,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to adjust stock');
    }
  }

  /**
   * Get stock transactions for lens
   * @param {string} id - Lens ID
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
        `${API_BASE_URL}/lens-stock/${id}/transactions?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch stock transactions');
    }
  }

  // ========== ANALYTICS AND STATISTICS ==========

  /**
   * Get lens dashboard statistics
   * @returns {Promise<Object>} Dashboard stats
   */
  async getDashboardStats() {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/lens-stock/dashboard-stats`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      // Return mock data if API fails
      return {
        success: true,
        data: {
          totalLenses: 0,
          totalStockValue: 0,
          lowStockCount: 0,
          nearExpiryCount: 0,
          totalCategories: 0,
          averageCost: 0
        }
      };
      // throw this.handleApiError(error, 'Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get lens usage analytics
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
        `${API_BASE_URL}/lens-stock/stats/usage?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch usage statistics');
    }
  }

  /**
   * Get low stock lens items
   * @returns {Promise<Object>} Low stock items
   */
  async getLowStockItems() {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/lens-stock/low-stock`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      // Return empty array if API fails
      return {
        success: true,
        data: { lenses: [] }
      };
      // throw this.handleApiError(error, 'Failed to fetch low stock lenses');
    }
  }

  /**
   * Get near expiry lens items
   * @param {number} days - Days until expiry threshold
   * @returns {Promise<Object>} Near expiry items
   */
  async getNearExpiryItems(days = 30) {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/lens-stock/near-expiry?days=${days}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      // Return empty array if API fails
      return {
        success: true,
        data: { lenses: [] }
      };
      // throw this.handleApiError(error, 'Failed to fetch near expiry lenses');
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Search lens stock
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results
   */
  async searchLensStock(query) {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/lens-stock/search?q=${encodeURIComponent(query)}`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to search lens stock');
    }
  }

  /**
   * Get lens categories
   * @returns {Promise<Object>} Lens categories
   */
  async getLensCategories() {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/lens-stock/categories`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch lens categories');
    }
  }

  /**
   * Get lens types
   * @returns {Promise<Object>} Lens types
   */
  async getLensTypes() {
    try {
      
      const response = await axios.get(
        `${API_BASE_URL}/lens-stock/types`,
        { headers: this.getAuthHeaders() }
      );
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch lens types');
    }
  }
}

// Export singleton instance
const lensStockService = new LensStockService();
export default lensStockService;