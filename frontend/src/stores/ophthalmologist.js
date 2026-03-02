import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import ophthalmologistQueueService from '@/services/ophthalmologistQueueService';

// Priority color mappings for UI
export const PRIORITY_COLORS = {
  1: 'bg-red-100 text-red-800 border-red-200', // Emergency
  2: 'bg-red-100 text-red-800 border-red-200', // Post-op
  3: 'bg-red-100 text-red-800 border-red-200', // Pre-op
  4: 'bg-orange-100 text-orange-800 border-orange-200', // Child under 5
  5: 'bg-orange-100 text-orange-800 border-orange-200', // Senior 60+
  6: 'bg-orange-100 text-orange-800 border-orange-200', // Extended wait
  7: 'bg-orange-100 text-orange-800 border-orange-200', // Referral
  8: 'bg-orange-100 text-orange-800 border-orange-200', // Review
  9: 'bg-green-100 text-green-800 border-green-200', // Follow-up
  10: 'bg-green-100 text-green-800 border-green-200', // New patient
  11: 'bg-green-100 text-green-800 border-green-200', // Routine
};

const useOphthalmologistStore = create(
  persist(
    (set, get) => ({
      // Queue State
      queueEntries: [],
      statistics: {
        totalPatients: 0,
        waitingPatients: 0,
        inProgressPatients: 0,
        completedPatients: 0,
        onHoldPatients: 0
      },
      doctorId: null,
      lastQueueUpdate: null,
      isLoading: false,
      error: null,

      // Current Patient State
      currentPatient: null,
      isConsultationActive: false,

      // Completed Consultations
      completedConsultations: [],

      // Dashboard Statistics
      dashboardStats: {
        totalPatientsToday: 0,
        waitingPatients: 0,
        inProgressPatients: 0,
        completedConsultations: 0,
        urgentCases: 0
      },

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Fetch queue data
      fetchQueue: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await ophthalmologistQueueService.getOphthalmologistQueue();
          
          if (response.success && response.data) {
            set({
              queueEntries: response.data.queueEntries || [],
              statistics: response.data.statistics || {},
              doctorId: response.data.doctorId,
              lastQueueUpdate: new Date().toISOString(),
              isLoading: false
            });
            
          } else {
            throw new Error('Invalid response structure');
          }
        } catch (error) {
          set({ 
            error: error.message || 'Failed to fetch queue',
            isLoading: false 
          });
        }
      },

      // Call next patient
      callNextPatient: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await ophthalmologistQueueService.callNextPatient();
          
          if (response.success) {
            // Refresh queue after calling patient
            await get().fetchQueue();
            
            return response;
          } else {
            throw new Error(response.message || 'Failed to call patient');
          }
        } catch (error) {
          set({ 
            error: error.message || 'Failed to call next patient',
            isLoading: false 
          });
          throw error;
        }
      },

      // Start consultation
      startConsultation: async (queueEntryId) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await ophthalmologistQueueService.startConsultation(queueEntryId);
          
          if (response.success) {
            // Update current patient and refresh queue
            await Promise.all([
              get().fetchCurrentPatient(),
              get().fetchQueue()
            ]);
            
            set({ isConsultationActive: true });
            
            return response;
          } else {
            throw new Error(response.message || 'Failed to start consultation');
          }
        } catch (error) {
          set({ 
            error: error.message || 'Failed to start consultation',
            isLoading: false 
          });
          throw error;
        }
      },

      // Complete consultation
      completeConsultation: async (queueEntryId, examinationData = null, transferTo = null) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await ophthalmologistQueueService.completeConsultation(
            queueEntryId, 
            examinationData, 
            transferTo
          );
          
          if (response.success) {
            // Clear current patient and refresh data
            set({ 
              currentPatient: null, 
              isConsultationActive: false 
            });
            
            await Promise.all([
              get().fetchQueue(),
              get().fetchCompletedConsultations()
            ]);
            
            return response;
          } else {
            throw new Error(response.message || 'Failed to complete consultation');
          }
        } catch (error) {
          set({ 
            error: error.message || 'Failed to complete consultation',
            isLoading: false 
          });
          throw error;
        }
      },

      // Fetch current patient
      fetchCurrentPatient: async () => {
        try {
          const response = await ophthalmologistQueueService.getCurrentPatient();
          
          if (response.success) {
            set({ 
              currentPatient: response.data,
              isConsultationActive: !!response.data
            });
            
          }
        } catch (error) {
          set({ error: error.message || 'Failed to fetch current patient' });
        }
      },

      // Save examination data
      saveExaminationData: async (patientVisitId, examinationData) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await ophthalmologistQueueService.saveExaminationData(
            patientVisitId, 
            examinationData
          );
          
          if (response.success) {
            return response;
          } else {
            throw new Error(response.message || 'Failed to save examination data');
          }
        } catch (error) {
          set({ 
            error: error.message || 'Failed to save examination data',
            isLoading: false 
          });
          throw error;
        }
      },

      // Fetch completed consultations
      fetchCompletedConsultations: async () => {
        try {
          const response = await ophthalmologistQueueService.getTodaysCompletedConsultations();
          
          if (response.success && response.data) {
            set({ 
              completedConsultations: response.data.data || []
            });
            
          }
        } catch (error) {
          set({ error: error.message || 'Failed to fetch completed consultations' });
        }
      },

      // Fetch dashboard statistics
      fetchDashboardStats: async () => {
        try {
          const response = await ophthalmologistQueueService.getDashboardStats();
          
          if (response.success && response.data) {
            set({ 
              dashboardStats: response.data
            });
            
          }
        } catch (error) {
          set({ error: error.message || 'Failed to fetch dashboard statistics' });
        }
      },

      // Utility functions
      getPatientByQueueEntryId: (queueEntryId) => {
        const state = get();
        return state.queueEntries.find(entry => entry.queueEntryId === queueEntryId);
      },

      getWaitingPatients: () => {
        const state = get();
        return state.queueEntries.filter(entry => entry.status === 'WAITING');
      },

      getInProgressPatients: () => {
        const state = get();
        return state.queueEntries.filter(entry => entry.status === 'IN_PROGRESS');
      },

      getUrgentPatients: () => {
        const state = get();
        return state.queueEntries.filter(entry => 
          entry.optometristExamination?.urgencyLevel === 'urgent' || 
          entry.optometristExamination?.urgencyLevel === 'emergency'
        );
      },

      // Initialize store
      initialize: async () => {
        try {
          
          await Promise.all([
            get().fetchQueue(),
            get().fetchCurrentPatient(),
            get().fetchCompletedConsultations(),
            get().fetchDashboardStats()
          ]);
          
        } catch (error) {
          set({ error: error.message || 'Failed to initialize store' });
        }
      },

      // Reset store
      reset: () => {
        set({
          queueEntries: [],
          statistics: {
            totalPatients: 0,
            waitingPatients: 0,
            inProgressPatients: 0,
            completedPatients: 0,
            onHoldPatients: 0
          },
          doctorId: null,
          lastQueueUpdate: null,
          currentPatient: null,
          isConsultationActive: false,
          completedConsultations: [],
          dashboardStats: {
            totalPatientsToday: 0,
            waitingPatients: 0,
            inProgressPatients: 0,
            completedConsultations: 0,
            urgentCases: 0
          },
          isLoading: false,
          error: null
        });
      }
    }),
    {
      name: 'ophthalmologist-store',
      partialize: (state) => ({
        completedConsultations: state.completedConsultations,
        dashboardStats: state.dashboardStats,
        lastQueueUpdate: state.lastQueueUpdate
      })
    }
  )
);

export default useOphthalmologistStore;