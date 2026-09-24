import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach JWT token if present
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bhumipatra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: standard error classification & token expiration handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        // Token expired or invalid
        localStorage.removeItem('bhumipatra_token');
        localStorage.removeItem('bhumipatra_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=1';
        }
      }

      // Format custom error message
      const message = data?.message || data?.error || (typeof data === 'string' ? data : null);
      error.customMessage = message || getDefaultErrorMessage(status);
      error.validationErrors = data?.errors || null;
    } else if (error.request) {
      error.customMessage = 'Unable to reach the BhumiPatra server. Please check your network or server status.';
    } else {
      error.customMessage = error.message || 'An unexpected error occurred.';
    }

    return Promise.reject(error);
  }
);

function getDefaultErrorMessage(status) {
  switch (status) {
    case 400:
      return 'Bad request. Please verify the submitted data.';
    case 401:
      return 'Authentication required or session expired. Please log in.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'Validation failed. Please verify the input requirements.';
    case 500:
      return 'Internal server error occurred on the BhumiPatra backend.';
    case 502:
    case 503:
      return 'BhumiPatra service is currently unavailable. Please try again shortly.';
    default:
      return `Server responded with error status ${status}.`;
  }
}

export default axiosClient;
