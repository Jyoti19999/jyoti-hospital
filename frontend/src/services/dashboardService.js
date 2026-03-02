// src/services/dashboardService.js
import apiClient from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Dashboard Service
 * Handles all dashboard-related API calls for superadmin dashboard
 */
export const dashboardService = {
  /**
   * Get dashboard statistics (active patients, appointments)
   */
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/super-admin/dashboard/stats`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    
    const result = await response.json();
    return result.data;
  },

  /**
   * Get queue status for both optometrist and ophthalmologist
   */
  getQueueStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/queue-status`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch queue status');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get today's scheduled surgeries
   */
  getTodaysSurgeries: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/todays-surgeries`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch surgeries');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get combined dashboard data (optimized single call)
   * This combines stats, queue, and surgeries in one request
   */
  getCombinedDashboardData: async () => {
    try {
      // Fetch all data in parallel for better performance
      const [stats, queueStatus, surgeries] = await Promise.all([
        dashboardService.getDashboardStats().catch(() => ({ 
          patients: { activeToday: 0 }, 
          appointments: { today: 0 } 
        })),
        dashboardService.getQueueStatus().catch(() => ({ 
          OPTOMETRIST: [], 
          OPHTHALMOLOGIST: [] 
        })),
        dashboardService.getTodaysSurgeries().catch(() => [])
      ]);

      return {
        stats,
        queueStatus,
        surgeries
      };
    } catch (error) {
      throw error;
    }
  }
};

export default dashboardService;
