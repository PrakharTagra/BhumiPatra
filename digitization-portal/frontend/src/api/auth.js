import apiClient from './client';

/**
 * Operator Authentication APIs
 */
export const authApi = {
  /**
   * Log in digitization operator
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Fetch current authenticated operator profile
   */
  async getMe() {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  /**
   * Log out operator
   */
  async logout() {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('bhumipatra_token');
      localStorage.removeItem('bhumipatra_user');
    }
  },
};

export default authApi;
