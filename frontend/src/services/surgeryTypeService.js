// src/services/surgeryTypeService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Configure axios defaults
axios.defaults.withCredentials = true;

/**
 * Surgery Type Service
 * Handles all API calls related to surgery types, packages, and lenses
 */

class SurgeryTypeService {

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
   * Get surgery type dropdown options for examination form
   * @returns {Promise<Object>} Surgery type options
   */
  async getSurgeryTypeDropdown() {
    try {
      
      const response = await axios.get(`${API_BASE_URL}/surgery-types/types/dropdown`);
      
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch surgery type options');
    }
  }

  /**
   * Get surgery types with full details
   * @returns {Promise<Object>} Complete surgery types data
   */
  async getSurgeryTypes() {
    try {
      
      const response = await axios.get(`${API_BASE_URL}/surgery-types/types`);
      
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch surgery types');
    }
  }

  /**
   * Get surgery type details including packages and requirements
   * @param {string} surgeryTypeId - Surgery type ID
   * @returns {Promise<Object>} Surgery type details
   */
  async getSurgeryTypeDetails(surgeryTypeId) {
    try {
      
      const response = await axios.get(`${API_BASE_URL}/surgery-types/types/${surgeryTypeId}`);
      
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch surgery type details');
    }
  }

  /**
   * Get packages for a specific surgery type
   * @param {string} surgeryTypeId - Surgery type ID
   * @returns {Promise<Object>} Surgery packages
   */
  async getSurgeryPackages(surgeryTypeId) {
    try {
      
      const response = await apiClient.get(`/api/v1/surgery-types/types/${surgeryTypeId}/packages`);
      
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch surgery packages');
    }
  }

  /**
   * Get fitness requirements for a surgery type
   * @param {string} surgeryTypeId - Surgery type ID
   * @returns {Promise<Object>} Fitness requirements
   */
  async getSurgeryFitnessRequirements(surgeryTypeId) {
    try {
      
      const response = await apiClient.get(`/api/v1/surgery-types/types/${surgeryTypeId}/fitness-requirements`);
      
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch fitness requirements');
    }
  }

  /**
   * Get all available lenses
   * @param {Object} filters - Filter options (category, type, isAvailable)
   * @returns {Promise<Object>} Lenses data
   */
  async getLenses(filters = {}) {
    try {
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiClient.get(`/api/v1/surgery-types/lenses?${params.toString()}`);
      
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch lenses');
    }
  }

  /**
   * Create a new surgery type
   * @param {Object} surgeryTypeData - Surgery type data
   * @returns {Promise<Object>} Created surgery type
   */
  async createSurgeryType(surgeryTypeData) {
    try {
      
      const response = await apiClient.post('/api/v1/surgery-types/types', surgeryTypeData);
      
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create surgery type');
    }
  }

  /**
   * Create a new surgery package
   * @param {Object} packageData - Package data
   * @returns {Promise<Object>} Created package
   */
  async createSurgeryPackage(packageData) {
    try {
      
      const response = await apiClient.post('/api/v1/surgery-types/packages', packageData);
      
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create surgery package');
    }
  }

  /**
   * Create a new lens
   * @param {Object} lensData - Lens data
   * @returns {Promise<Object>} Created lens
   */
  async createLens(lensData) {
    try {
      
      const response = await apiClient.post('/api/v1/surgery-types/lenses', lensData);
      
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create lens');
    }
  }
}

// Export singleton instance
const surgeryTypeService = new SurgeryTypeService();
export default surgeryTypeService;