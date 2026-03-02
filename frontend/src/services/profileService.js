// Profile Service - Handles all profile-related API calls
const API_BASE_URL = import.meta.env.VITE_API_URL;

class ProfileService {
  // Update staff profile with basic and role-specific data
  async updateStaffProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Upload profile photo
  async uploadProfilePhoto(photoFile) {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', photoFile);

      const response = await fetch(`${API_BASE_URL}/staff/upload-profile-photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload photo');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Get complete staff profile
  async getStaffProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Change staff password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/change-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Helper method to construct image URL
  getImageUrl(profilePhoto) {
    if (!profilePhoto) return null;
    const baseUrl = import.meta.env.VITE_API_IMG_URL || 'http://localhost:8080';
    return `${baseUrl}${profilePhoto}`;
  }
}

// Export singleton instance
const profileService = new ProfileService();
export default profileService;