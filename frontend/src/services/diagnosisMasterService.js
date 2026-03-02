const API_BASE_URL = '/api/v1/diagnosis-master';

class DiagnosisMasterService {
  async fetchStatistics() {
    const response = await fetch(`${API_BASE_URL}/statistics`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }
    
    return response.json();
  }

  async fetchDiagnosisData(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/diagnosis-master?${searchParams}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch diagnosis data');
    }
    
    return response.json();
  }

  async fetchEyeDiseasesFromICD11() {
    const response = await fetch(`${API_BASE_URL}/fetch-eye-diseases`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch eye diseases from ICD-11');
    }
    
    return response.json();
  }

  async importDiseases(diseases) {
    const response = await fetch(`${API_BASE_URL}/import-diseases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ diseases })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to import diseases');
    }
    
    return response.json();
  }

  async updateDisease(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/diseases/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update disease');
    }
    
    return response.json();
  }

  async deleteDisease(id) {
    const response = await fetch(`${API_BASE_URL}/diseases/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete disease');
    }
    
    return response.json();
  }
}

export default new DiagnosisMasterService();