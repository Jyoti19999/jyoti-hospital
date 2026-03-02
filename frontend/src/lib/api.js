// src/lib/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Function to handle authentication errors
const handleAuthError = () => {
  
  // Clear any stored auth data
  localStorage.removeItem('user');
  sessionStorage.clear();
  
  // Show a user-friendly message
  const event = new CustomEvent('auth:expired', {
    detail: { message: 'Your session has expired. Please login again.' }
  });
  window.dispatchEvent(event);
  
  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = '/staff-auth';
  }, 1000);
};

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      credentials: 'include', // Always include cookies for authentication
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // Handle different body types
    if (config.body) {
      // If it's FormData, don't set Content-Type (let browser set it with boundary)
      if (config.body instanceof FormData) {
        // Don't set Content-Type for FormData - browser will set it automatically with boundary
      } else if (typeof config.body === 'object') {
        // For regular objects, set JSON content type and stringify
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(config.body);
      }
      // For other types (string, etc.), leave as is
    } else {
      // Only set default Content-Type if no body
      config.headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;

        // Handle 401 Unauthorized or 403 Forbidden (token expired/invalid)
        if (response.status === 401 || response.status === 403) {
          try {
            errorData = await response.json();
            // Check if it's a token expiration error
            if (errorData.error === 'Token expired' || 
                errorData.message?.includes('expired') ||
                errorData.message?.includes('login again')) {
              handleAuthError();
              throw new Error('Authentication required. Redirecting to login...');
            }
          } catch (e) {
            // If JSON parsing fails, still handle as auth error
            handleAuthError();
            throw new Error('Authentication required. Redirecting to login...');
          }
        }

        try {
          if (!errorData) {
            errorData = await response.json();
          }
          
          // Try to extract error message from various common server response formats
          errorMessage = errorData.message ||
                        errorData.error ||
                        errorData.msg ||
                        errorData.detail ||
                        errorData.errors?.[0]?.message ||
                        `Server error: ${response.status} ${response.statusText}`;
        } catch (jsonError) {
          // If JSON parsing fails, try to get text response
          try {
            const textError = await response.text();
            if (textError) {
              errorMessage = textError;
            }
          } catch (textError) {
            // Use default message if all parsing fails
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        throw error;
      }

      return await response.json();
    } catch (error) {
      // If it's already our custom error, just re-throw it
      if (error.status) {
        throw error;
      }

      // Handle network errors
      throw new Error(error.message || 'Network error occurred. Please check your connection.');
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
      ...options,
    });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
      ...options,
    });
  }

  delete(endpoint, options = {}) {
    // Handle data in DELETE requests
    const requestOptions = { method: 'DELETE', ...options };
    if (options.data) {
      requestOptions.body = options.data;
    }
    return this.request(endpoint, requestOptions);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
