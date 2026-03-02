// src/services/staffService.js
import apiClient from '@/lib/api';

export const staffService = {
  // Register new staff member with file upload support
  registerStaff: async (staffData) => {
    // Check if there are any files to upload
    const hasFiles = staffData.documents && staffData.documents.length > 0 && 
                     staffData.documents.some(doc => doc.file);
    
    if (hasFiles) {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append all non-file data as JSON string
      const jsonData = {
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        phone: staffData.phone,
        dateOfBirth: staffData.dateOfBirth,
        gender: staffData.gender,
        address: staffData.address,
        emergencyContact: staffData.emergencyContact,
        staffType: staffData.staffType,
        department: staffData.department,
        employmentStatus: staffData.employmentStatus,
        joiningDate: staffData.joiningDate,
        qualifications: staffData.qualifications,
        certifications: staffData.certifications,
        languagesSpoken: staffData.languagesSpoken,
        roleSpecificData: staffData.roleSpecificData
      };
      
      formData.append('staffData', JSON.stringify(jsonData));
      
      // Append files separately
      staffData.documents.forEach((doc, index) => {
        if (doc.file) {
          formData.append('documents', doc.file);
        }
      });
      
      // Check if there's a profile photo in documents
      const profilePhoto = staffData.documents?.find(doc => 
        doc.name.toLowerCase().includes('profile') || 
        doc.type.startsWith('image/')
      );
      
      if (profilePhoto && profilePhoto.file) {
        formData.append('profilePhoto', profilePhoto.file);
      }
      
      // Don't set Content-Type manually - let browser set it with boundary
      const response = await apiClient.post('/super-admin/staff', formData);
      return response;
    } else {
      // Send as regular JSON when no files
      const jsonData = {
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        phone: staffData.phone,
        dateOfBirth: staffData.dateOfBirth,
        gender: staffData.gender,
        address: staffData.address,
        emergencyContact: staffData.emergencyContact,
        staffType: staffData.staffType,
        department: staffData.department,
        employmentStatus: staffData.employmentStatus,
        joiningDate: staffData.joiningDate,
        qualifications: staffData.qualifications,
        certifications: staffData.certifications,
        languagesSpoken: staffData.languagesSpoken,
        roleSpecificData: staffData.roleSpecificData
      };
      
      const response = await apiClient.post('/super-admin/staff', jsonData);
      return response;
    }
  },

  // Get all staff members
  getAllStaff: async () => {
    const response = await apiClient.get('/super-admin/staff');
    return response;
  },

  // Get staff member by ID
  getStaffById: async (staffId) => {
    const response = await apiClient.get(`/super-admin/staff/${staffId}`);
    return response;
  },

  // Update staff member
  updateStaff: async (staffId, staffData) => {
    const response = await apiClient.put(`/super-admin/staff/${staffId}`, staffData);
    return response;
  },

  // Delete staff member
  deleteStaff: async (staffId) => {
    const response = await apiClient.delete(`/super-admin/staff/${staffId}`);
    return response;
  },

  // Get staff by department
  getStaffByDepartment: async (department) => {
    const response = await apiClient.get(`/super-admin/staff/department/${department}`);
    return response;
  },

  // Get staff by type
  getStaffByType: async (staffType) => {
    const response = await apiClient.get(`/super-admin/staff/type/${staffType}`);
    return response;
  },
};

export default staffService;