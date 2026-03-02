import apiClient from '@/lib/api';

const consentFormService = {
  /**
   * Fetch consent form data for an admission
   */
  getConsentFormData: async (admissionId) => {
    try {
      const response = await apiClient.get(`/consent-forms/data/${admissionId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generate pre-filled consent forms
   */
  generateConsentForms: async (admissionId) => {
    try {
      const response = await apiClient.post(`/consent-forms/generate/${admissionId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get preview URL for a consent form
   */
  getPreviewUrl: (admissionId, formType, filename) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    return `${baseURL}/consent-forms/preview/${admissionId}/${formType}/${filename}`;
  },

  /**
   * Save signed consent form
   */
  saveSignedConsentForm: async (admissionId, formType, pdfBlob) => {
    try {
      const formData = new FormData();
      formData.append('signedPdf', pdfBlob, `${formType}_signed.pdf`);
      // DO NOT set Content-Type header manually! Let browser set the boundary.
      const response = await apiClient.post(
        `/consent-forms/save-signed/${admissionId}/${formType}`,
        formData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Clean up temporary files
   */
  cleanupTempFiles: async (admissionId) => {
    try {
      const response = await apiClient.delete(`/consent-forms/cleanup/${admissionId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get signed PDF preview URL
   */
  getSignedPdfUrl: (admissionId, formType, filename) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    return `${baseURL}/consent-forms/signed-preview/${admissionId}/${formType}/${filename}`;
  },

  /**
   * Download saved signed consent form
   */
  downloadConsentForm: async (admissionId, formType, filename) => {
    try {
      const response = await apiClient.get(
        `/consent-forms/download/${admissionId}/${formType}/${filename}`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
};

export default consentFormService;
