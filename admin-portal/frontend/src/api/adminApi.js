import axiosClient from './axiosClient';

export const adminApi = {
  // Dashboard Metrics
  getDashboard: async () => {
    const response = await axiosClient.get('/api/admin/dashboard');
    return response.data;
  },

  // Analytics
  getAnalytics: async (params = {}) => {
    const response = await axiosClient.get('/api/admin/analytics', { params });
    return response.data;
  },

  // Users Management
  getUsers: async (params = {}) => {
    const response = await axiosClient.get('/api/admin/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await axiosClient.get(`/api/admin/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axiosClient.post('/api/admin/users', userData);
    return response.data;
  },

  updateUserStatus: async (id, status) => {
    const response = await axiosClient.patch(`/api/admin/users/${id}/status`, { status });
    return response.data;
  },

  // Documents Monitoring (strictly read-only for admin)
  getDocuments: async (params = {}) => {
    const response = await axiosClient.get('/api/admin/documents', { params });
    return response.data;
  },

  getDocumentById: async (id) => {
    const response = await axiosClient.get(`/api/admin/documents/${id}`);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const response = await axiosClient.get('/api/admin/audit-logs', { params });
    return response.data;
  },

  // System Activity
  getSystemActivity: async (params = {}) => {
    try {
      const response = await axiosClient.get('/api/admin/system-activity', { params });
      return response.data;
    } catch (err) {
      // If system-activity specific route doesn't exist on backend, fall back to audit logs with system query
      if (err.response?.status === 404) {
        const fallback = await axiosClient.get('/api/admin/audit-logs', {
          params: { ...params, entity: 'SYSTEM' }
        });
        return fallback.data;
      }
      throw err;
    }
  }
};

export default adminApi;
