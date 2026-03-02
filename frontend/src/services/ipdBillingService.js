import api from '../lib/api';

const ipdBillingService = {
  /**
   * Get all admissions ready for billing
   */
  getAdmissionsReadyForBilling: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.insuranceApplicable !== undefined) {
        queryParams.append('insuranceApplicable', params.insuranceApplicable);
      }
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }

      const response = await api.get(`/ipd/billing/ready?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admissions ready for billing:', error);
      throw error;
    }
  },

  /**
   * Calculate bill for an admission
   */
  calculateBill: async (admissionId) => {
    console.log('🔵 ipdBillingService.calculateBill called with:', admissionId);
    console.log('🔵 Making API call to:', `/ipd/admissions/${admissionId}/calculate-bill`);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });
    
    try {
      const apiCallPromise = api.get(`/ipd/admissions/${admissionId}/calculate-bill`);
      
      const response = await Promise.race([apiCallPromise, timeoutPromise]);
      
      console.log('🟢 API call successful');
      console.log('🟢 Response:', response);
      console.log('🟢 Response data:', response.data);
      
      return response;
    } catch (error) {
      console.error('🔴 Error calculating bill:', error);
      console.error('🔴 Error response:', error.response);
      console.error('🔴 Error response data:', error.response?.data);
      console.error('🔴 Error message:', error.message);
      throw error;
    }
  },

  /**
   * Generate bill/invoice
   */
  generateBill: async (admissionId, data = {}) => {
    try {
      const response = await api.post(`/ipd/admissions/${admissionId}/generate-bill`, data);
      return response.data;
    } catch (error) {
      console.error('Error generating bill:', error);
      throw error;
    }
  },

  /**
   * Get billing summary
   */
  getBillingSummary: async (admissionId) => {
    try {
      const response = await api.get(`/ipd/admissions/${admissionId}/billing-summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching billing summary:', error);
      throw error;
    }
  },

  /**
   * Record payment
   */
  recordPayment: async (admissionId, paymentData) => {
    try {
      const response = await api.post(`/ipd/admissions/${admissionId}/record-payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  /**
   * Get payment history
   */
  getPaymentHistory: async (admissionId) => {
    try {
      const response = await api.get(`/ipd/admissions/${admissionId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  /**
   * Mark admission ready for billing
   */
  markReadyForBilling: async (admissionId) => {
    try {
      const response = await api.post(`/ipd/admissions/${admissionId}/mark-billing-ready`);
      return response.data;
    } catch (error) {
      console.error('Error marking ready for billing:', error);
      throw error;
    }
  },

  /**
   * Add additional charges to an admission from billing tab
   */
  addAdditionalCharges: async (admissionId, charges) => {
    try {
      const response = await api.post(`/ipd/admissions/${admissionId}/add-charges`, { charges });
      return response.data;
    } catch (error) {
      console.error('Error adding additional charges:', error);
      throw error;
    }
  },

  /**
   * Save receipt PDF to server
   */
  saveReceipt: async (admissionId, receiptBase64, paymentId) => {
    try {
      const response = await api.post(`/ipd/admissions/${admissionId}/save-receipt`, {
        receiptBase64,
        paymentId
      });
      return response.data;
    } catch (error) {
      console.error('Error saving receipt:', error);
      throw error;
    }
  }
};

export default ipdBillingService;
