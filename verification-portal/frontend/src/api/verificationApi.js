import axiosClient from './axiosClient';

export const verificationApi = {
  // Pending verification queue
  getPendingRecords: async (params = {}) => {
    const response = await axiosClient.get('/api/land-records/pending', { params });
    return response.data;
  },

  // General query for land records (used for verified/rejected lists and dashboard)
  getRecords: async (params = {}) => {
    const response = await axiosClient.get('/api/land-records', { params });
    return response.data;
  },

  // Specific land record details
  getRecordById: async (id) => {
    const response = await axiosClient.get(`/api/land-records/${id}`);
    return response.data;
  },

  // Update/correct extracted fields (frontend never directly modifies MongoDB)
  updateRecord: async (id, payload) => {
    const response = await axiosClient.put(`/api/land-records/${id}`, payload);
    return response.data;
  },

  // Officer action: Approve Record
  approveRecord: async (id, payload = {}) => {
    const response = await axiosClient.post(`/api/land-records/${id}/approve`, payload);
    return response.data;
  },

  // Officer action: Reject Record
  rejectRecord: async (id, payload) => {
    const response = await axiosClient.post(`/api/land-records/${id}/reject`, payload);
    return response.data;
  },

  // Officer action: Send Back
  sendBackRecord: async (id, payload) => {
    const response = await axiosClient.post(`/api/land-records/${id}/send-back`, payload);
    return response.data;
  },

  // Verification audit history for a record
  getVerificationHistory: async (id) => {
    const response = await axiosClient.get(`/api/land-records/${id}/verification-history`);
    return response.data;
  },

  // Dashboard metrics (tries /api/land-records/dashboard, falls back if needed)
  getDashboardMetrics: async () => {
    try {
      const response = await axiosClient.get('/api/land-records/dashboard');
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        // Fall back to querying pending records to construct real count without dummy data
        const pendingRes = await axiosClient.get('/api/land-records/pending', { params: { limit: 100 } });
        const list = pendingRes?.records || pendingRes?.data || (Array.isArray(pendingRes) ? pendingRes : []);
        const total = pendingRes?.total || list.length;
        
        const highConfidence = list.filter((r) => (r.confidence ?? r.confidenceScore ?? 0) >= 80).length;
        const lowConfidence = list.filter((r) => (r.confidence ?? r.confidenceScore ?? 0) < 80).length;

        return {
          pendingCount: total,
          highConfidenceCount: highConfidence,
          lowConfidenceCount: lowConfidence,
          approvedCount: 0,
          rejectedCount: 0,
          recentRecords: list.slice(0, 5),
        };
      }
      throw err;
    }
  },
};

export default verificationApi;
