import apiClient from '@/lib/api';

const insuranceProviderService = {
  // Get all active insurance providers
  getAllProviders: async () => {
    const response = await apiClient.get('/insurance-providers');
    return response;
  },

  // Get insurance provider by ID
  getProviderById: async (providerId) => {
    const response = await apiClient.get(`/insurance-providers/${providerId}`);
    return response;
  },

  // Create new insurance provider
  createProvider: async (providerData) => {
    const response = await apiClient.post('/insurance-providers', providerData);
    return response;
  },

  // Update insurance provider
  updateProvider: async (providerId, providerData) => {
    const response = await apiClient.put(`/insurance-providers/${providerId}`, providerData);
    return response;
  },

  // Delete (deactivate) insurance provider
  deleteProvider: async (providerId) => {
    const response = await apiClient.delete(`/insurance-providers/${providerId}`);
    return response;
  }
};

export default insuranceProviderService;
