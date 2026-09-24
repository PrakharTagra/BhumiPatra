import logger from '../utils/logger.js';

export const confidenceService = {
  /**
   * Evaluate and aggregate confidence scores for the document and individual fields
   * @param {object} ocrResult
   * @param {object} extractionResult
   * @param {object} validationResult
   */
  async process(ocrResult, extractionResult, validationResult) {
    const startTime = Date.now();

    const fieldMap = extractionResult.fieldConfidenceMap || {};
    const scores = Object.values(fieldMap).filter((s) => typeof s === 'number');

    let overall = 85; // Baseline for structured extraction
    if (scores.length > 0) {
      overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    // Penalize if validation rules flagged high-severity errors
    if (validationResult && Array.isArray(validationResult.rules)) {
      const highSeverityWarnings = validationResult.rules.filter(
        (r) => (r.status === 'FAILED' || r.status === 'WARNING') && r.severity === 'HIGH'
      ).length;
      overall = Math.max(0, overall - highSeverityWarnings * 15);
    }

    const durationMs = Date.now() - startTime;
    return {
      overallConfidence: overall,
      fieldLevelConfidence: fieldMap,
      durationMs,
    };
  },
};

export default confidenceService;
