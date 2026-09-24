import apiClient from './client';

/**
 * Document Digitization & AI Processing APIs
 */
export const documentsApi = {
  /**
   * Upload scanned land record document
   * @param {FormData} formData - Multipart form containing file and metadata
   * @param {Function} onUploadProgress - Axios progress callback (0-100)
   */
  async upload(formData, onUploadProgress) {
    const response = await apiClient.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  /**
   * Fetch documents with filtering, search, and pagination
   * @param {Object} params - Query parameters
   */
  async getDocuments(params = {}) {
    const response = await apiClient.get('/api/documents', { params });
    return response.data;
  },

  /**
   * Fetch single document full details
   * @param {string} id - Document ID
   */
  async getDocumentById(id) {
    const response = await apiClient.get(`/api/documents/${id}`);
    return response.data;
  },

  /**
   * Trigger or restart AI pipeline processing
   * @param {string} id - Document ID
   */
  async triggerProcess(id) {
    const response = await apiClient.post(`/api/documents/${id}/process`);
    return response.data;
  },

  /**
   * Fetch live AI pipeline status for a document
   * @param {string} id - Document ID
   */
  async getDocumentStatus(id) {
    const response = await apiClient.get(`/api/documents/${id}/status`);
    return response.data;
  },
};

export default documentsApi;
