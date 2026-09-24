import logger from '../utils/logger.js';

export const validationService = {
  /**
   * Validate extracted land record entities against revenue rules and mathematical bounds
   * @param {object} document
   * @param {object} extractedData
   */
  async process(document, extractedData) {
    const startTime = Date.now();
    logger.info(`[Pipeline: Validation] Executing validation rules for document ${document.documentId}`);

    const rules = [];

    // Rule 1: Administrative Location Matching
    const locMatch =
      extractedData.location?.district?.toLowerCase() === document.district?.toLowerCase() ||
      !extractedData.location?.district;
    rules.push({
      ruleName: 'ADMIN_LOCATION_MATCH',
      status: locMatch ? 'PASSED' : 'WARNING',
      description: locMatch
        ? 'Extracted revenue jurisdiction matches document metadata indexing.'
        : `Discrepancy detected between indexed district (${document.district}) and extracted text.`,
      severity: locMatch ? 'LOW' : 'MEDIUM',
    });

    // Rule 2: Land Area Positivity
    const area = extractedData.landInformation?.area;
    const isAreaValid = area === undefined || area === null || Number(area) > 0;
    rules.push({
      ruleName: 'LAND_AREA_CONSISTENCY',
      status: isAreaValid ? 'PASSED' : 'FAILED',
      description: isAreaValid
        ? 'Land parcel area is mathematically consistent and non-negative.'
        : 'Invalid or zero land parcel measurement found in document text.',
      severity: isAreaValid ? 'LOW' : 'HIGH',
    });

    // Rule 3: Khasra Parcel Number Presence
    const khasra = extractedData.landInformation?.khasraNo;
    const hasKhasra = Boolean(khasra && String(khasra).trim().length > 0);
    rules.push({
      ruleName: 'PARCEL_IDENTIFIER_INTEGRITY',
      status: hasKhasra ? 'PASSED' : 'WARNING',
      description: hasKhasra
        ? 'Standard Khasra parcel identifier identified and indexed.'
        : 'Parcel identifier not unequivocally isolated in OCR text.',
      severity: hasKhasra ? 'LOW' : 'MEDIUM',
    });

    // Rule 4: Ownership Share Ratio Integrity
    const owners = extractedData.owner || [];
    let shareStatus = 'PASSED';
    let shareDesc = 'Ownership share ratios verified.';
    if (owners.length > 0) {
      // Check if shares are percentages or fractions
      const totalPercentage = owners.reduce((acc, o) => {
        const val = parseFloat(o.shareRatio);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      if (totalPercentage > 0 && Math.abs(totalPercentage - 100) > 0.01 && Math.abs(totalPercentage - 1.0) > 0.01) {
        shareStatus = 'WARNING';
        shareDesc = `Calculated tenure share sum (${totalPercentage}) does not equate to full title total.`;
      }
    }

    rules.push({
      ruleName: 'OWNERSHIP_SHARE_SUMMATION',
      status: shareStatus,
      description: shareDesc,
      severity: shareStatus === 'PASSED' ? 'LOW' : 'HIGH',
    });

    const hasFailures = rules.some((r) => r.status === 'FAILED');
    const hasWarnings = rules.some((r) => r.status === 'WARNING');

    const durationMs = Date.now() - startTime;
    return {
      rules,
      isValid: !hasFailures,
      requiresManualVerification: hasFailures || hasWarnings,
      durationMs,
    };
  },
};

export default validationService;
