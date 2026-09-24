import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach Officer JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bhumipatra_officer_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 session expiry and standardized error formatting
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem('bhumipatra_officer_token');
        localStorage.removeItem('bhumipatra_officer_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=1';
        }
      }

      const message = data?.message || data?.error || (typeof data === 'string' ? data : null);
      error.customMessage = message || getStatusMessage(status);
      error.validationErrors = data?.errors || null;
    } else if (error.request) {
      error.customMessage = 'Verification server is unreachable. Please verify network connectivity.';
    } else {
      error.customMessage = error.message || 'An unexpected error occurred.';
    }

    return Promise.reject(error);
  }
);

function getStatusMessage(status) {
  switch (status) {
    case 400:
      return 'Bad request. Please verify the submitted correction or decision.';
    case 401:
      return 'Session expired or officer authentication required.';
    case 403:
      return 'Access forbidden. This action requires VERIFICATION_OFFICER authorization.';
    case 404:
      return 'Requested land record or resource was not found.';
    case 422:
      return 'Validation failed. Please correct highlighted land record attributes.';
    case 500:
      return 'Internal server error in land record processing engine.';
    default:
      return `Server returned error status code: ${status}`;
  }
}

export default axiosClient;
