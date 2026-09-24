import axios from 'axios';

// Get base URL from environment or default to local backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bhumipatra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized Error Normalization
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const customError = {
      status: error.response?.status || 0,
      message: 'An unexpected error occurred.',
      errors: null,
      isNetworkError: false,
    };

    if (!error.response) {
      // Network failure, CORS failure, or server completely offline
      customError.isNetworkError = true;
      customError.message = `Cannot reach BhumiPatra API at ${API_BASE_URL}. Ensure the backend service is running.`;
    } else {
      const { status, data } = error.response;
      customError.errors = data?.errors || null;

      switch (status) {
        case 401:
          // Unauthorized: Token expired or invalid
          localStorage.removeItem('bhumipatra_token');
          localStorage.removeItem('bhumipatra_user');
          customError.message = data?.message || 'Session expired or invalid credentials. Please log in again.';
          // Dispatch session expired event so UI/Context can notify user
          window.dispatchEvent(new CustomEvent('bhumipatra:session-expired', { detail: customError.message }));
          break;

        case 403:
          // Forbidden: Operator role mismatch or permission denied
          customError.message = data?.message || 'Access Denied: Your account does not have DIGITIZATION_OPERATOR permissions.';
          break;

        case 404:
          // Not Found
          customError.message = data?.message || 'The requested resource or document was not found.';
          break;

        case 422:
          // Unprocessable Entity / Validation Error
          customError.message = data?.message || 'Validation failed. Please verify the submitted information.';
          break;

        case 500:
          // Internal Server Error
          customError.message = data?.message || 'Internal Server Error. Please contact your system administrator or try again later.';
          break;

        default:
          customError.message = data?.message || `Request failed with status ${status}.`;
          break;
      }
    }

    return Promise.reject(customError);
  }
);

export default apiClient;
