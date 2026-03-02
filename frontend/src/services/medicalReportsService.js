// src/services/medicalReportsService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Create axios instance with default config
const api = axios.create({
    baseURL: `${API_BASE_URL}/medical-reports`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('staffToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('staffToken');
            window.location.href = '/staff-auth';
        }
        return Promise.reject(error);
    }
);

const medicalReportsService = {
    /**
     * Get diagnostic records with filtering and pagination
     */
    getDiagnosticRecords: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            
            if (filters.dateFilter) params.append('dateFilter', filters.dateFilter);
            if (filters.statusFilter) params.append('statusFilter', filters.statusFilter);
            if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await api.get(`/diagnostics?${params.toString()}`);
            return response.data.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch diagnostic records');
        }
    },

    /**
     * Get prescription details
     */
    getPrescriptionDetails: async (prescriptionId) => {
        try {
            const response = await api.get(`/prescription/${prescriptionId}`);
            return response.data.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch prescription details');
        }
    },

    /**
     * Download prescription as PDF
     */
    downloadPrescription: async (prescriptionId) => {
        try {
            const response = await api.get(`/prescription/${prescriptionId}/download`, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `prescription-${prescriptionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to download prescription');
        }
    },

    /**
     * Get examination details
     */
    getExaminationDetails: async (examinationId) => {
        try {
            const response = await api.get(`/examination/${examinationId}`);
            return response.data.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch examination details');
        }
    },

    /**
     * Download medical report as PDF
     */
    downloadMedicalReport: async (examinationId) => {
        try {
            const response = await api.get(`/examination/${examinationId}/download`, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `medical-report-${examinationId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to download medical report');
        }
    },

    /**
     * Export diagnostic records as CSV
     */
    exportDiagnosticRecords: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            
            if (filters.dateFilter) params.append('dateFilter', filters.dateFilter);
            if (filters.statusFilter) params.append('statusFilter', filters.statusFilter);
            if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);

            const response = await api.get(`/diagnostics/export?${params.toString()}`, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `diagnostic-records-${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to export diagnostic records');
        }
    },

    /**
     * Get patient's complete medical history
     */
    getPatientMedicalHistory: async (patientId) => {
        try {
            const response = await api.get(`/patient/${patientId}/history`);
            return response.data.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch patient medical history');
        }
    }
};

export default medicalReportsService;