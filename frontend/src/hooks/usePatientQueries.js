// src/hooks/usePatientQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';

/*
========================================
👥 PATIENT TANSTACK QUERY HOOKS
========================================

Custom hooks using TanStack Query for patient operations.
Provides automatic caching, background updates, and optimistic updates.
*/

// Query Keys
export const patientQueryKeys = {
  all: ['patients'],
  search: (searchTerm) => [...patientQueryKeys.all, 'search', searchTerm],
  patient: (id) => [...patientQueryKeys.all, id],
  statistics: () => [...patientQueryKeys.all, 'statistics']
};

// Patient Service Functions
const patientService = {
  /**
   * Search patients (simplified version for IPD usage)
   * This is a mock implementation - you may need to implement the actual search endpoint
   */
  searchPatients: async (searchTerm) => {
    // For now, return mock data or implement actual search
    // You can replace this with actual API call when the search endpoint is available
    
    if (!searchTerm || searchTerm.length < 2) {
      return { data: { patients: [] } };
    }

    try {
      // Try to get patient by number first
      const response = await apiClient.get(`/patients/${searchTerm}`);
      return {
        data: {
          patients: [response.data]
        }
      };
    } catch (error) {
      // If not found by number, return empty results
      // In future, implement proper search endpoint
      return { data: { patients: [] } };
    }
  },

  /**
   * Get patient by patient number
   */
  getPatientByNumber: async (patientNumber) => {
    const response = await apiClient.get(`/patients/${patientNumber}`);
    return response;
  },

  /**
   * Get patient statistics
   */
  getPatientStatistics: async () => {
    const response = await apiClient.get('/patients/statistics/overview');
    return response;
  }
};

// ==========================================
// PATIENT SEARCH HOOKS
// ==========================================

/**
 * Search patients by various criteria
 * @param {string} searchTerm - Search term (name, phone, patient number)
 * @param {Object} options - React Query options
 */
export const usePatientSearch = (searchTerm, options = {}) => {
  return useQuery({
    queryKey: patientQueryKeys.search(searchTerm),
    queryFn: () => patientService.searchPatients(searchTerm),
    enabled: searchTerm && searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    ...options
  });
};

/**
 * Get patient by patient number
 * @param {string} patientNumber - Patient number
 * @param {Object} options - React Query options
 */
export const usePatientByNumber = (patientNumber, options = {}) => {
  return useQuery({
    queryKey: patientQueryKeys.patient(patientNumber),
    queryFn: () => patientService.getPatientByNumber(patientNumber),
    enabled: !!patientNumber,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Get patient statistics
 * @param {Object} options - React Query options
 */
export const usePatientStatistics = (options = {}) => {
  return useQuery({
    queryKey: patientQueryKeys.statistics(),
    queryFn: patientService.getPatientStatistics,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};

export default patientService;