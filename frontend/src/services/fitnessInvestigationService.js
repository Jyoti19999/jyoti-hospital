// src/services/fitnessInvestigationService.js
import apiClient from '@/lib/api';

/**
 * Fitness Investigation Service
 * Handles all API operations related to fitness investigations
 */
class FitnessInvestigationService {
  /**
   * Get all fitness investigations with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search query
   * @param {string} params.category - Investigation category
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort direction (asc/desc)
   * @returns {Promise<Object>} API response with investigations data
   */
  async getAllInvestigations(params = {}) {
    try {
      
      const response = await apiClient.get('/surgery-types/admin/investigations', { params });
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch fitness investigations');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new fitness investigation
   * @param {Object} investigationData - Investigation data
   * @param {string} investigationData.investigationName - Investigation name
   * @param {string} investigationData.investigationCode - Investigation code
   * @param {string} investigationData.category - Investigation category
   * @param {string} investigationData.description - Investigation description
   * @param {number} investigationData.cost - Investigation cost
   * @param {number} investigationData.validityDays - Validity in days
   * @param {string} investigationData.processingTime - Processing time
   * @param {boolean} investigationData.fastingRequired - Fasting required flag
   * @returns {Promise<Object>} API response with created investigation
   */
  async createInvestigation(investigationData) {
    try {
      
      // Use surgery-types admin endpoint for consistency
      const response = await apiClient.post('/surgery-types/admin/investigations', investigationData);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to create fitness investigation');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing fitness investigation
   * @param {string} id - Investigation ID
   * @param {Object} investigationData - Updated investigation data
   * @returns {Promise<Object>} API response with updated investigation
   */
  async updateInvestigation(id, investigationData) {
    try {
      
      const response = await apiClient.put(`/surgery-types/admin/investigations/${id}`, investigationData);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to update fitness investigation');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete or deactivate a fitness investigation
   * @param {string} id - Investigation ID
   * @returns {Promise<Object>} API response
   */
  async deleteInvestigation(id) {
    try {
      
      const response = await apiClient.delete(`/surgery-types/admin/investigations/${id}`);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to delete fitness investigation');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get investigation statistics
   * @returns {Promise<Object>} API response with statistics
   */
  async getInvestigationStatistics() {
    try {
      
      const response = await this.getAllInvestigations({ limit: 1 });
      
      if (response.success && response.pagination) {
        const stats = {
          totalInvestigations: response.pagination.totalCount,
          totalPages: response.pagination.totalPages,
          currentPage: response.pagination.page
        };
        
        return { success: true, data: stats };
      } else {
        throw new Error('Failed to fetch investigation statistics');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search investigations by name or code
   * @param {string} searchQuery - Search query
   * @returns {Promise<Object>} API response with search results
   */
  async searchInvestigations(searchQuery) {
    try {
      
      const response = await this.getAllInvestigations({
        search: searchQuery,
        limit: 50 // Get more results for search
      });
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get investigations by category
   * @param {string} category - Investigation category
   * @returns {Promise<Object>} API response with filtered investigations
   */
  async getInvestigationsByCategory(category) {
    try {
      
      const response = await this.getAllInvestigations({
        category: category,
        limit: 100
      });
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch category investigations');
      }
    } catch (error) {
      throw error;
    }
  }
}

// Export a singleton instance
const fitnessInvestigationService = new FitnessInvestigationService();
export default fitnessInvestigationService;