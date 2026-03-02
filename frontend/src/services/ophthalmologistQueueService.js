// src/services/ophthalmologistQueueService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Configure axios defaults
axios.defaults.withCredentials = true;

class OphthalmologistQueueService {

  /**
   * Get the current ophthalmologist queue with all patients
   * @param {Object} params - Query parameters for filtering
   * @param {string} params.date - Date filter (YYYY-MM-DD)
   * @param {string} params.status - Status filter
   * @param {string} params.patientName - Patient name search
   * @returns {Promise<Object>} Queue data with statistics
   */
  async getOphthalmologistQueue(params = {}) {
    try {

      const queryParams = new URLSearchParams();
      if (params.date) queryParams.append('date', params.date);
      if (params.status) queryParams.append('status', params.status);
      if (params.patientName) queryParams.append('patientName', params.patientName);

      const url = `${API_BASE_URL}/ophthalmologist/queue${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await axios.get(url);

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch ophthalmologist queue');
    }
  }

  /**
   * Call the next patient in the ophthalmologist queue
   * @returns {Promise<Object>} Called patient information
   */
  async callNextPatient() {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/call-next`);

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to call next patient');
    }
  }

  /**
   * Start consultation for a patient
   * @param {string} queueEntryId - The queue entry ID
   * @returns {Promise<Object>} Updated queue entry
   */
  async startConsultation(queueEntryId) {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/start-consultation`, {
        queueEntryId
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to start consultation');
    }
  }

  /**
   * Complete consultation for a patient
   * @param {string} queueEntryId - The queue entry ID
   * @returns {Promise<Object>} Completion result
   */
  async completeConsultation(queueEntryId) {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/complete-consultation`, {
        queueEntryId
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to complete consultation');
    }
  }

  /**
   * Reorder patients in the ophthalmologist queue (drag and drop functionality)
   * @param {Array} reorderedQueueEntries - Array of queue entries with new positions
   * @param {string} reason - Reason for reordering
   * @returns {Promise<Object>} Reorder result
   */
  async reorderQueue(reorderedQueueEntries, reason = 'Queue reordered via drag and drop') {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/reorder`, {
        reorderedQueueEntries,
        reason
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to reorder queue');
    }
  }

  /**
   * Comprehensive queue reordering with intelligent shifting
   * @param {string} draggedPatientId - ID of the patient being moved
   * @param {number} targetPosition - Target position (1-based index)
   * @param {string} reason - Reason for reordering
   * @returns {Promise<Object>} Comprehensive reorder result
   */
  async reorderQueueComprehensive(draggedPatientId, targetPosition, reason = 'Comprehensive queue reordering via drag and drop') {
    try {
      // Validate parameters before making API call
      if (!draggedPatientId) {
        throw new Error('Dragged patient ID is required');
      }

      if (!targetPosition || targetPosition < 1) {
        throw new Error(`Invalid target position: ${targetPosition}. Must be >= 1`);
      }


      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/reorder-comprehensive`, {
        draggedPatientId,
        targetPosition,
        reason
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to reorder queue comprehensively');
    }
  }

  /**
   * Get current patient being consulted by ophthalmologist
   * @returns {Promise<Object|null>} Current patient or null
   */
  async getCurrentPatient() {
    try {
      const response = await axios.get(`${API_BASE_URL}/ophthalmologist/current-patient`);
      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to get current patient');
    }
  }

  /**
   * Assign a doctor to a patient in the queue
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} doctorId - Doctor's staff ID
   * @returns {Promise<Object>} Assignment result
   */
  async assignDoctorToPatient(queueEntryId, doctorId) {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/assign-doctor`, {
        queueEntryId,
        doctorId
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to assign doctor to patient');
    }
  }

  /**
   * Get dashboard statistics for ophthalmologist
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/ophthalmologist/dashboard/stats`);
      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to get dashboard statistics');
    }
  }

  /**
   * Assign a patient to an ophthalmologist
   * @param {string} queueEntryId - Queue entry ID
   * @returns {Promise<Object>} Assignment result
   */
  async assignPatient(queueEntryId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/${queueEntryId}/assign`);
      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to assign patient');
    }
  }

  /**
   * Call a specific assigned patient
   * @param {string} queueEntryId - Queue entry ID
   * @returns {Promise<Object>} Call result
   */
  async callAssignedPatient(queueEntryId) {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/call-assigned`, {
        queueEntryId
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to call assigned patient');
    }
  }

  /**
   * Put patient on hold (request eye drops from receptionist2)
   * @param {string} queueEntryId - Queue entry ID
   * @param {Array<string>} reasons - Array of reason IDs for eye drops
   * @returns {Promise<Object>} Hold result
   */
  async putPatientOnHold(queueEntryId, reasons = []) {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/put-on-hold`, {
        queueEntryId,
        reasons
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to put patient on hold');
    }
  }

  /**
   * Confirm eye drops applied by receptionist2 (starts 30-minute timer)
   * @param {string} queueEntryId - Queue entry ID
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmEyeDropsApplied(queueEntryId) {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/confirm-drops-applied`, {
        queueEntryId
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to confirm eye drops applied');
    }
  }

  /**
   * Resume patient from hold status
   * @param {string} queueEntryId - Queue entry ID
   * @returns {Promise<Object>} Resume result
   */
  async resumePatientFromHold(queueEntryId) {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/resume-from-hold`, {
        queueEntryId
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to resume patient from hold');
    }
  }

  /**
   * Update notes for a queue entry
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} notes - Notes to update
   * @returns {Promise<Object>} Update result
   */
  async updateQueueNotes(queueEntryId, notes) {
    try {
      const response = await axios.put(`${API_BASE_URL}/ophthalmologist/queue/${queueEntryId}/notes`, {
        notes
      });
      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to update queue notes');
    }
  }

  /**
   * Get only waiting patients in the ophthalmologist queue
   * @returns {Promise<Object>} Waiting patients data
   */
  async getWaitingPatients() {
    try {
      const response = await axios.get(`${API_BASE_URL}/ophthalmologist/queue/waiting`);
      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to get waiting patients');
    }
  }

  /**
   * Debug method to get current user information
   * @returns {Promise<Object>} User debug information
   */
  async debugUserInfo() {
    try {

      const response = await axios.get(`${API_BASE_URL}/ophthalmologist/debug/user-info`);

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to get debug user info');
    }
  }

  /**
   * Get patients assigned to the current doctor
   * @returns {Promise<Object>} Assigned patients data
   */
  async getMyAssignedPatients() {
    try {

      const response = await axios.get(`${API_BASE_URL}/ophthalmologist/my-patients`);

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch assigned patients');
    }
  }

  /**
   * Get doctor's ON_HOLD patients
   * @returns {Promise<Object>} ON_HOLD patients data
   */
  async getMyOnHoldPatients() {
    try {

      const response = await axios.get(`${API_BASE_URL}/ophthalmologist/my-on-hold-patients`);

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch ON_HOLD patients');
    }
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @param {string} defaultMessage - Default error message
   * @returns {Error} Formatted error
   */
  handleApiError(error, defaultMessage) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || defaultMessage;

      if (status === 401) {
        // Redirect to login or handle authentication error
        // You might want to trigger a logout action here
      }

      return new Error(`${message} (Status: ${status})`);
    } else if (error.request) {
      // Network error
      return new Error('Network error - please check your connection');
    } else {
      // Other error
      return new Error(error.message || defaultMessage);
    }
  }

  /**
   * Save detailed ophthalmologist examination data
   * @param {string} queueEntryId - Queue entry ID
   * @param {Object} examinationData - Examination data to save
   * @returns {Promise<Object>} Saved examination data
   */
  async saveDetailedOphthalmologistExamination(queueEntryId, examinationData) {
    try {

      const response = await axios.post(
        `${API_BASE_URL}/ophthalmologist/detailed-examination/${queueEntryId}/save`,
        examinationData
      );

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to save detailed examination data');
    }
  }

  /**
   * Get detailed ophthalmologist examination data
   * @param {string} queueEntryId - Queue entry ID
   * @returns {Promise<Object|null>} Examination data or null if not found
   */
  async getDetailedOphthalmologistExamination(queueEntryId) {
    try {

      const response = await axios.get(
        `${API_BASE_URL}/ophthalmologist/detailed-examination/${queueEntryId}`
      );

      return response.data.data || response.data;

    } catch (error) {
      // Return null if examination doesn't exist yet (404)
      if (error.response?.status === 404) {
        return null;
      }

      throw this.handleApiError(error, 'Failed to get detailed examination data');
    }
  }

  /**
   * Get optometrist examination data for a patient
   * @param {string} examinationId - Optometrist examination ID
   * @returns {Promise<Object|null>} Optometrist examination data or null if not found
   */
  async getOptometristExaminationData(examinationId) {
    try {

      const response = await axios.get(
        `${API_BASE_URL}/ophthalmologist/optometrist-examination/${examinationId}`
      );

      return response.data.data || response.data;

    } catch (error) {
      // Return null if examination doesn't exist (404)
      if (error.response?.status === 404) {
        return null;
      }

      throw this.handleApiError(error, 'Failed to get optometrist examination data');
    }
  }

  /**
   * Reorder doctor's specific queue with doctor-scoped positions
   * @param {Array} reorderedPatients - Array of patients with new doctorQueuePosition
   * @param {String} doctorId - Optional doctorId (used by receptionist2)
   * @returns {Promise<Object>} Reorder result
   */
  async reorderDoctorQueue(reorderedPatients, doctorId = null) {
    try {

      const requestBody = { reorderedPatients };
      if (doctorId) {
        requestBody.doctorId = doctorId;
      }

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/my-queue/reorder`, requestBody);

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to reorder doctor queue');
    }
  }

  /**
   * Reorder doctor's Next-in-Line panel only (positions 1-3) using doctorQueuePosition
   * @param {Array} reorderedQueueEntries - Array of {queueEntryId, newPosition}
   * @returns {Promise<Object>} Reorder result
   */
  async reorderDoctorNextInLine(reorderedQueueEntries) {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/my-queue/reorder-next-in-line`, {
        reorderedQueueEntries
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to reorder doctor Next-in-Line');
    }
  }

  /**
   * Transfer patient to another doctor (goes to end of their queue)
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} targetDoctorId - Target doctor's ID
   * @returns {Promise<Object>} Transfer result
   */
  async transferPatientToDoctor(queueEntryId, targetDoctorId) {
    try {

      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/transfer-patient`, {
        queueEntryId,
        targetDoctorId
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to transfer patient');
    }
  }

  /**
   * Get doctor's queue with positions (1,2,3...)
   * @returns {Promise<Object>} Doctor's queue with positions
   */
  async getDoctorQueue() {
    try {

      const response = await axios.get(`${API_BASE_URL}/ophthalmologist/my-queue`);

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch doctor queue');
    }
  }

  /**
   * Apply FCFS (First-Come-First-Served) ordering to a doctor's queue
   * Reorders patients based on optometrist examination completion time
   * @param {string} doctorId - The doctor's staff ID
   * @returns {Promise<Object>} FCFS application result
   */
  async applyDoctorFCFS(doctorId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ophthalmologist/queue/apply-doctor-fcfs`, {
        doctorId
      });

      return response.data.data || response.data;

    } catch (error) {
      throw this.handleApiError(error, 'Failed to apply FCFS to doctor queue');
    }
  }
}

// Create and export singleton instance
export default new OphthalmologistQueueService();