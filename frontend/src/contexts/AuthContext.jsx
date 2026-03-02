// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load by calling a protected endpoint
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Try Staff profile first (most common case)
      let response = await fetch(`${import.meta.env.VITE_API_URL}/staff/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data.staff || data.data; // Handle both data.staff and data structures
        userData.role = 'staff'; // Explicitly set role
        setUser(userData);
        // 🔌 Connect WebSocket when authenticated user is found
        connectSocket();
        setIsLoading(false);
        return;
      }

      // If Staff fails, try SuperAdmin profile
      response = await fetch(`${import.meta.env.VITE_API_URL}/super-admin/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data;
        userData.role = 'superadmin'; // Explicitly set role
        setUser(userData);
        // 🔌 Connect WebSocket when authenticated user is found
        connectSocket();
        setIsLoading(false);
        return;
      }

      // If SuperAdmin fails, try Patient profile
      response = await fetch(`${import.meta.env.VITE_API_URL}/patients/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data.patient || data.data; // Handle both data.patient and data structures
        userData.role = 'patient'; // Explicitly set role
        setUser(userData);
        // 🔌 Connect WebSocket when authenticated user is found
        connectSocket();
        setIsLoading(false);
        return;
      }

      // If all fail, user is not authenticated
      setUser(null);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // HTTP client with automatic cookie handling
  const apiCall = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Always include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle token expiration - but be smart about it
    // Only clear user if this is actually an authentication endpoint call
    if (response.status === 401) {
      // Check if this is an authentication/profile endpoint
      const isAuthEndpoint = url.includes('/profile') || 
                            url.includes('/login') || 
                            url.includes('/logout') ||
                            url.includes('/auth');
      
      if (isAuthEndpoint) {
        setUser(null);
      } else {
        // For other endpoints, don't clear user - just throw error
      }
      
      throw new Error('Authentication required');
    }

    return response;
  };

  const login = async (userData) => {
    setUser(userData);
    
    // 🔌 Connect WebSocket after successful login
    connectSocket();
    
    // If user is a staff member, fetch complete profile data
    if (userData.role === 'staff' || userData.staffType) {
      try {
        const completeProfile = await fetchStaffProfile();
        if (completeProfile) {
          // Update with complete profile data while preserving login response
          const mergedData = { ...userData, ...completeProfile };
          setUser(mergedData);
        }
      } catch (error) {
        // Keep the original login data if profile fetch fails
      }
    }
    // If user is a patient, fetch complete profile data
    else if (userData.role === 'patient' || userData.patientId || userData.patientNumber) {
      try {
        const completeProfile = await fetchPatientProfile();
        if (completeProfile) {
          // Update with complete profile data while preserving login response
          const mergedData = { ...userData, ...completeProfile };
          setUser(mergedData);
        }
      } catch (error) {
        // Keep the original login data if profile fetch fails
      }
    }
    
    // No need to store token - it's in httpOnly cookie
  };

  const logout = async () => {
    try {
      // 🔌 Disconnect WebSocket before logout
      disconnectSocket();
      
      // Determine user type and call appropriate logout endpoint
      let logoutEndpoint;
      
      if (user?.staffType) {
        logoutEndpoint = '/staff/logout';
      } else if (user?.role === 'patient' || user?.patientId) {
        logoutEndpoint = '/patients/logout';
      } else {
        logoutEndpoint = '/super-admin/logout';
      }
      
      await fetch(`${import.meta.env.VITE_API_URL}${logoutEndpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Logout request failed
    } finally {
      setUser(null);
    }
  };

  const isAuthenticated = () => {
    // User is authenticated if:
    // 1. User object exists
    // 2. User has either staffType (for staff), userType (for superadmin), or patientId (for patient)
    // 3. User has a role explicitly set
    const authenticated = !!(user && (user.staffType || user.userType || user.role || user.patientId));
    return authenticated;
  };

  const getUserRole = () => {
    if (!user) return null;
    
    // If user has patientId or role is patient, they are a patient
    if (user.patientId || user.role === 'patient') {
      return 'patient';
    }
    
    // If user has staffType, they are a staff member
    if (user.staffType) {
      return 'staff';
    }
    
    // If user has userType, use that
    if (user.userType) {
      return user.userType;
    }
    
    // Default fallback
    return 'super_admin';
  };

  // Function to fetch complete patient profile
  const fetchPatientProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const completeProfile = data.data.patient || data.data;
        completeProfile.role = 'patient'; // Explicitly set role
        
        // Update user with complete profile data
        setUser(completeProfile);
        return completeProfile;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  // Function to fetch complete staff profile
  const fetchStaffProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const completeProfile = data.data.staff;
        completeProfile.role = 'staff'; // Explicitly set role
        
        // Update user with complete profile data
        setUser(completeProfile);
        return completeProfile;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  // Function to get the correct dashboard path for the current user
  const getCorrectDashboardPath = () => {
    if (!user?.staffType) return '/staff-auth';
    
    const { getStaffDashboardPath } = require('@/config/staffRoutes');
    return getStaffDashboardPath(user.staffType);
  };

  // Special method for smooth account switching
  const switchUserAccount = (newUserData) => {
    // Update user data immediately to prevent auth issues
    setUser(newUserData);
  };

  const value = {
    user,
    setUser, // Export setUser for direct user updates
    switchUserAccount, // Export for smooth account switching
    isLoading,
    login,
    logout,
    isAuthenticated,
    getUserRole,
    apiCall,
    checkAuthStatus, // Export for manual auth checks
    fetchStaffProfile, // Export for fetching complete profile
    fetchPatientProfile, // Export for fetching complete patient profile
    getCorrectDashboardPath // Export for getting correct dashboard path
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export default AuthContext;