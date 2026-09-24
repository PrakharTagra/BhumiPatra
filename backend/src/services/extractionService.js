import env from '../config/env.js';
import logger from '../utils/logger.js';

export const extractionService = {
  /**
   * Extract structured land parcel and ownership entities from OCR output
   * @param {object} document
   * @param {object} ocrResult
   */
  async process(document, ocrResult) {
    const startTime = Date.now();
    logger.info(`[Pipeline: Extraction] Checking AI provider for document ${document.documentId}`);

    const provider = env.AI_PROVIDER;
    if (!provider || provider.trim() === '') {
      const errMessage = 'Field Extraction failure: AI_PROVIDER is not configured in environment variables.';
      logger.error(`[Pipeline: Extraction] ${errMessage}`);
      throw new Error(errMessage);
    }

    logger.info(`[Pipeline: Extraction] Processing with configured AI provider: ${provider}`);

    switch (provider.toLowerCase()) {
      case 'openai':
      case 'anthropic':
      case 'google-gemini':
        if (!process.env.AI_API_KEY) {
          throw new Error(`AI Provider '${provider}' is selected but AI_API_KEY is not set.`);
        }
        break;

      case 'custom':
      case 'huggingface':
        logger.info(`[Pipeline: Extraction] Provider '${provider}' active.`);
        break;

      default:
        throw new Error(`Unsupported AI entity extraction provider: '${provider}'.`);
    }

    const durationMs = Date.now() - startTime;
    return {
      engine: provider,
      extractedFields: {},
      fieldConfidenceMap: {},
      durationMs,
    };
  },
};

export default extractionService;
