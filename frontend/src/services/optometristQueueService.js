// src/services/optometristQueueService.js
import apiClient from '@/lib/api';

/**
 * Optometrist Queue Service
 * Handles all API operations for the optometrist queue management
 */
export const optometristQueueService = {
  
  /**
   * Get the complete optometrist queue with all patient information
   * @returns {Promise<Object>} Queue data with statistics and patient entries
   */
  getOptometristQueue: async () => {
    try {
      
      const response = await apiClient.get('/optometrist/queue');
      
      
      // Check if the response has the expected structure
      if (response && response.success && response.data) {
        return response; // Return the entire response, not just response.data
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch optometrist queue');
    }
  },

  /**
   * Get patients with status "CALLED" - for "Next in Line" display
   * @returns {Promise<Array>} Array of called patients
   */
  getCalledPatients: async () => {
    try {
      
      const queueData = await optometristQueueService.getOptometristQueue();
      const calledPatients = queueData.data.queueEntries.filter(
        entry => entry.status === 'CALLED'
      );
      
      return calledPatients;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Call the next patient in the queue
   * @returns {Promise<Object>} Called patient information
   */
  callNextPatient: async () => {
    try {
      
      const response = await apiClient.post('/optometrist/queue/call-next');
      
      
      // Validate response structure
      if (response && response.success !== false) {
        const patientData = response.data?.data?.patient || response.data?.patient || response.patient;
        const queueData = response.data?.data?.queueEntry || response.data?.queueEntry || response.queueEntry;
        
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to call next patient');
      }
    } catch (error) {
      
      // Create a more descriptive error message
      let errorMessage = 'Failed to call next patient';
      
      if (error.response?.status === 404) {
        errorMessage = 'No patients available to call';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid request - please check queue status';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error - please try again later';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Start examination for a specific patient
   * @param {string} queueEntryId - Queue entry ID
   * @returns {Promise<Object>} Updated queue entry with examination started
   */
  startExamination: async (queueEntryId) => {
    try {
      
      if (!queueEntryId) {
        throw new Error('Queue entry ID is required');
      }
      
      const response = await apiClient.patch(`/optometrist/queue/${queueEntryId}/start`);
      
      
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to start examination');
    }
  },

  /**
   * Record examination start time - called when Start Examination button is clicked
   * @param {string} queueEntryId - Queue entry ID
   * @returns {Promise<Object>} Response with optometristCalledAt timestamp
   */
  recordExaminationStartTime: async (queueEntryId) => {
    try {
      if (!queueEntryId) {
        throw new Error('Queue entry ID is required');
      }
      
      const response = await apiClient.patch(`/optometrist/queue/${queueEntryId}/record-start-time`);
      
      console.log('✅ Recorded examination start time:', response.data);
      
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to record examination start time');
    }
  },

  /**
   * Save examination data to the database
   * @param {string} patientVisitId - Patient visit ID
   * @param {Object} examinationData - Complete examination data
   * @returns {Promise<Object>} Saved examination result
   */
  saveExaminationData: async (patientVisitId, examinationData) => {
    try {
      
      if (!patientVisitId || !examinationData) {
        throw new Error('Patient visit ID and examination data are required');
      }
      
      const response = await apiClient.post('/optometrist/examination', {
        patientVisitId,
        examinationData
      });
      
      
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to save examination data');
    }
  },

  /**
   * Complete examination for a patient
   * @param {string} queueEntryId - Queue entry ID
   * @param {Object} examinationData - Examination results and findings
   * @returns {Promise<Object>} Completed examination result
   */
  completeExamination: async (queueEntryId, examinationData = {}) => {
    try {
      
      if (!queueEntryId) {
        throw new Error('Queue entry ID is required');
      }
      
      // First, save examination data if provided
      if (examinationData && Object.keys(examinationData).length > 0) {
        try {
          // Extract patient visit ID from examination data or queue entry
          const patientVisitId = examinationData.patientInfo?.visitId || 
                                examinationData.patientVisitId || 
                                queueEntryId; // fallback - might need adjustment based on your data structure
          
          await optometristQueueService.saveExaminationData(patientVisitId, examinationData);
        } catch (saveError) {
          // Continue with completion even if save fails - examination data is logged in console
        }
      }
      
      // Then complete the queue entry and transfer to OPHTHALMOLOGIST
      const payload = {
        transferTo: "OPHTHALMOLOGIST",
        priorityLabel: examinationData?.priorityLabel || 'ROUTINE',
        examinationDurationMinutes: examinationData?.examinationDurationMinutes || 0
      };
      
      console.log('🔍 Sending completion payload:', payload);
      
      const response = await apiClient.patch(`/optometrist/queue/${queueEntryId}/complete`, payload);
      
      
      // Return the complete response data to maintain consistency with other methods
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete examination');
    }
  },

  /**
   * Get current patient being examined by the optometrist
   * @returns {Promise<Object|null>} Current patient or null
   */
  getCurrentPatient: async () => {
    try {
      
      const response = await apiClient.get('/optometrist/current-patient');
      
      if (response.data.data) {
      } else {
      }
      
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch current patient');
    }
  },

  /**
   * Format patient data for existing UI components
   * @param {Object} queueEntry - Raw queue entry from API
   * @returns {Object} Formatted patient data for UI
   */
  formatForUI: (queueEntry) => {
    if (!queueEntry) return null;
    
    return {
      id: queueEntry.queueEntryId,
      name: queueEntry.patient?.fullName || 'N/A',
      age: queueEntry.patient?.dateOfBirth ? 
            new Date().getFullYear() - new Date(queueEntry.patient.dateOfBirth).getFullYear() : 'N/A',
      gender: queueEntry.patient?.gender || 'N/A',
      mrn: queueEntry.patient?.patientNumber?.toString() || 'N/A',
      token: queueEntry.appointment?.tokenNumber || 'N/A',
      visitType: queueEntry.appointment?.appointmentType?.toLowerCase().replace(/\s+/g, '_') || 'routine',
      appointmentType: queueEntry.appointment?.appointmentType || 'N/A', // Add this for filtering
      priority: optometristQueueService.getPriorityNumber(queueEntry.priorityLabel),
      priorityLabel: queueEntry.priorityLabel,
      priorityDescription: queueEntry.priorityLabel || 'ROUTINE',
      isEmergency: queueEntry.priorityLabel === 'EMERGENCY',
      appointmentTime: queueEntry.appointment?.appointmentTime,
      addedAt: queueEntry.joinedAt,
      waitStartTime: queueEntry.joinedAt,
      calledAt: queueEntry.calledAt, // Add calledAt timestamp for sorting
      status: queueEntry.status,
      queueNumber: queueEntry.queueNumber,
      queueEntryId: queueEntry.queueEntryId,
      // Additional data for examination modal
      patientData: {
        id: queueEntry.patient?.id,
        patientNumber: queueEntry.patient?.patientNumber,
        firstName: queueEntry.patient?.firstName,
        lastName: queueEntry.patient?.lastName,
        phone: queueEntry.patient?.phone,
        email: queueEntry.patient?.email,
        dateOfBirth: queueEntry.patient?.dateOfBirth,
        gender: queueEntry.patient?.gender,
        allergies: queueEntry.patient?.allergies || []
      },
      appointmentData: {
        id: queueEntry.appointment?.id,
        tokenNumber: queueEntry.appointment?.tokenNumber,
        appointmentTime: queueEntry.appointment?.appointmentTime,
        appointmentType: queueEntry.appointment?.appointmentType,
        purpose: queueEntry.appointment?.purpose
      },
      visitData: {
        id: queueEntry.visit?.id,
        visitNumber: queueEntry.visit?.visitNumber,
        visitType: queueEntry.visit?.visitType,
        status: queueEntry.visit?.status,
        checkedInAt: queueEntry.visit?.checkedInAt
      }
    };
  },

  /**
   * Convert priority label to number for existing UI
   * @param {string} priorityLabel - Priority label from API
   * @returns {number} Priority number
   */
  getPriorityNumber: (priorityLabel) => {
    const priorityMap = {
      'EMERGENCY': 1,
      'URGENT': 2,
      'HIGH': 3,
      'ROUTINE': 10,
      'LOW': 11
    };
    
    return priorityMap[priorityLabel] || 10;
  },

  /**
   * Get today's completed examinations
   * @returns {Promise<Array>} Array of completed examinations for today
   */
  getTodaysCompletedExaminations: async () => {
    try {
      
      const response = await apiClient.get('/optometrist/completed-examinations/today');
      
      
      if (response && response.success && response.data) {
        return response;
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch completed examinations');
    }
  },

  /**
   * Get waiting time in minutes
   * @param {string} joinedAt - ISO string of when patient joined queue
   * @returns {number} Waiting time in minutes
   */
  getWaitingMinutes: (joinedAt) => {
    if (!joinedAt) return 0;
    
    const joined = new Date(joinedAt);
    const now = new Date();
    return Math.floor((now - joined) / (1000 * 60));
  },

  /**
   * Reorder optometrist queue
   * @param {Array} reorderedQueueEntries - Array of queue entries with new positions
   * @param {string} reason - Optional reason for reordering
   * @returns {Promise<Object>} Reorder result
   */
  reorderQueue: async (reorderedQueueEntries, reason = null) => {
    try {
      
      if (!reorderedQueueEntries || !Array.isArray(reorderedQueueEntries) || reorderedQueueEntries.length === 0) {
        throw new Error('Invalid reorder data provided');
      }

      const response = await apiClient.post('/optometrist/queue/reorder', {
        reorderedQueueEntries,
        reason
      });
      
      
      if (response && response.success) {
        return response;
      } else {
        throw new Error('Invalid response from reorder API');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to reorder queue');
    }
  },

  /**
   * Update patient priority label in queue
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} visitType - New priority label
   * @returns {Promise<Object>} Update result
   */
  updatePatientVisitType: async (queueEntryId, visitType) => {
    try {
      
      if (!queueEntryId || !visitType) {
        throw new Error('Queue entry ID and priority label are required');
      }

      const response = await apiClient.patch(`/optometrist/queue/${queueEntryId}/update-priority-label`, {
        visitType
      });
      
      
      if (response && response.success) {
        return response;
      } else {
        throw new Error('Invalid response from update API');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update priority label');
    }
  },

  /**
   * Assign doctor to patient in the queue
   * @param {string} queueEntryId - The queue entry ID
   * @param {string} doctorId - The doctor's staff ID
   * @returns {Promise<Object>} Response with assignment details
   */
  assignDoctorToPatient: async (queueEntryId, doctorId) => {
    try {

      if (!queueEntryId || !doctorId) {
        throw new Error('Queue entry ID and doctor ID are required');
      }

      const response = await apiClient.patch(`/optometrist/queue/${queueEntryId}/assign-doctor`, {
        doctorId
      });
      
      
      if (response && response.success) {
        return response;
      } else {
        throw new Error('Invalid response from assignment API');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to assign doctor');
    }
  },

  /**
   * Revert examination status - change patient queue status back to WAITING from IN_PROGRESS
   * @param {string} queueEntryId - Queue entry ID
   * @returns {Promise<Object>} Revert result
   */
  revertExaminationStatus: async (queueEntryId) => {
    try {
      
      if (!queueEntryId) {
        throw new Error('Queue entry ID is required');
      }
      
      const response = await apiClient.patch(`/optometrist/queue/${queueEntryId}/revert`);
      
      
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to revert examination status');
    }
  },

  /**
   * Apply First-Come-First-Served ordering to queue from position 4 onwards
   * Keeps Next in Line patients (positions 1-3) untouched
   * @returns {Promise<Object>} FCFS application result
   */
  applyFCFS: async () => {
    try {
      const response = await apiClient.post('/optometrist/queue/apply-fcfs');
      
      if (response && response.success) {
        return response;
      } else {
        throw new Error('Invalid response from apply FCFS API');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to apply FCFS ordering');
    }
  },

  /**
   * Discontinue examination for a patient
   * Marks the patient visit as DISCONTINUED and removes from active queue
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} reason - Optional reason for discontinuation
   * @returns {Promise<Object>} Discontinue result
   */
  discontinueExamination: async (queueEntryId, reason = null) => {
    try {
      console.log('🚫 Discontinuing examination for queue entry:', queueEntryId);
      
      if (!queueEntryId) {
        throw new Error('Queue entry ID is required');
      }
      
      const payload = {
        reason: reason || 'Patient left hospital without completing examination'
      };
      
      const response = await apiClient.patch(`/optometrist/queue/${queueEntryId}/discontinue`, payload);
      
      console.log('✅ Examination discontinued successfully:', response.data);
      
      if (response && response.success) {
        return response;
      } else {
        throw new Error('Invalid response from discontinue API');
      }
    } catch (error) {
      console.error('❌ Error discontinuing examination:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to discontinue examination');
    }
  }
};

export default optometristQueueService;