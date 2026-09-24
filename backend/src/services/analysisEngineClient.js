import env from '../config/env.js';
import logger from '../utils/logger.js';

export const analysisEngineClient = {
  /**
   * Dispatches document file and metadata to Python Document Analysis Engine (/analyze)
   * @param {Object} document - Document mongoose model instance
   * @param {Buffer} fileBuffer - In-memory file buffer
   * @returns {Promise<Object>} AnalyzeResponse payload
   */
  async analyzeDocument(document, fileBuffer) {
    const engineUrl = env.DOCUMENT_ANALYSIS_ENGINE_URL || 'http://localhost:8000';
    const targetEndpoint = `${engineUrl}/analyze`;

    logger.info(`[Analysis Client] Dispatching document ${document.documentId} to Python Engine at ${targetEndpoint}`);

    try {
      let detectedMime = document.mimeType;
      if (!detectedMime || detectedMime === 'application/octet-stream') {
        const ext = (document.originalName || '').split('.').pop().toLowerCase();
        if (ext === 'png') detectedMime = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') detectedMime = 'image/jpeg';
        else if (ext === 'tif' || ext === 'tiff') detectedMime = 'image/tiff';
        else detectedMime = 'application/pdf';
      }

      const blob = new Blob([fileBuffer], { type: detectedMime });
      const formData = new FormData();

      formData.append('file', blob, document.originalName || 'document.pdf');
      if (document.documentId) formData.append('documentId', document.documentId);
      if (document.documentType) formData.append('documentType', document.documentType);
      if (document.state) formData.append('state', document.state);
      if (document.district) formData.append('district', document.district);
      if (document.tehsil) formData.append('tehsil', document.tehsil);
      if (document.village) formData.append('village', document.village);
      if (document.recordYear) formData.append('recordYear', String(document.recordYear));

      const headers = {};
      if (env.INTERNAL_API_KEY) {
        headers['X-API-Key'] = env.INTERNAL_API_KEY;
      }

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Engine responded with HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.detail || parsed.message || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      logger.info(
        `[Analysis Client] Analysis complete for ${document.documentId}. Status: ${result.processing?.status}, Confidence: ${result.confidence?.overallConfidence}%`
      );
      return result;
    } catch (err) {
      logger.error(`[Analysis Client Error] Failed to communicate with Python Engine: ${err.message}`);
      throw err;
    }
  },

  /**
   * Health check for Python analysis engine
   */
  async checkHealth() {
    const engineUrl = env.DOCUMENT_ANALYSIS_ENGINE_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${engineUrl}/health`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },
};

export default analysisEngineClient;
