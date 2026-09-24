import Document from '../models/Document.js';
import LandRecord from '../models/LandRecord.js';
import ProcessingLog from '../models/ProcessingLog.js';
import storageService from './storageService.js';
import preprocessingService from './preprocessingService.js';
import ocrService from './ocrService.js';
import extractionService from './extractionService.js';
import validationService from './validationService.js';
import confidenceService from './confidenceService.js';
import { PIPELINE_STAGES, PROCESSING_STATUS, VERIFICATION_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';

export const pipelineService = {
  /**
   * Run complete document digitization pipeline
   * @param {string} documentId
   */
  async runPipeline(documentId) {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found.`);
    }

    logger.info(`[Pipeline] Commencing autonomous digitization for document ${document.documentId}`);

    try {
      // Step 1: Preprocessing
      await this.logStage(document._id, PIPELINE_STAGES.PREPROCESSING, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.PREPROCESSING;
      await document.save();

      const fileBuffer = await storageService.getFile(document.storageKey);
      const preprocessed = await preprocessingService.process(document, fileBuffer);
      await this.logStage(document._id, PIPELINE_STAGES.PREPROCESSING, 'SUCCESS', 'Image-Preprocessor', preprocessed.durationMs);

      // Step 2: OCR
      await this.logStage(document._id, PIPELINE_STAGES.OCR, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.OCR;
      await document.save();

      const ocrResult = await ocrService.process(document, fileBuffer, preprocessed);
      await this.logStage(document._id, PIPELINE_STAGES.OCR, 'SUCCESS', ocrResult.engine, ocrResult.durationMs);

      // Step 3: Field Extraction
      await this.logStage(document._id, PIPELINE_STAGES.EXTRACTION, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.EXTRACTION;
      await document.save();

      const extractionResult = await extractionService.process(document, ocrResult);
      await this.logStage(document._id, PIPELINE_STAGES.EXTRACTION, 'SUCCESS', extractionResult.engine, extractionResult.durationMs);

      // Step 4: Validation
      await this.logStage(document._id, PIPELINE_STAGES.VALIDATION, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.VALIDATION;
      await document.save();

      const validationResult = await validationService.process(document, extractionResult.extractedFields);
      await this.logStage(document._id, PIPELINE_STAGES.VALIDATION, 'SUCCESS', 'Validation-Rules-Engine', validationResult.durationMs);

      // Step 5: Confidence Scoring
      await this.logStage(document._id, PIPELINE_STAGES.CONFIDENCE_ANALYSIS, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.CONFIDENCE_ANALYSIS;
      await document.save();

      const confidenceResult = await confidenceService.process(ocrResult, extractionResult, validationResult);
      await this.logStage(document._id, PIPELINE_STAGES.CONFIDENCE_ANALYSIS, 'SUCCESS', 'Confidence-Engine', confidenceResult.durationMs);

      // Step 6: Finalize Pipeline & Create/Update LandRecord
      const overallConf = confidenceResult.overallConfidence;
      const requiresReview = validationResult.requiresManualVerification || overallConf < 70;

      document.processingStatus = PROCESSING_STATUS.COMPLETED;
      document.verificationStatus = requiresReview
        ? VERIFICATION_STATUS.NEEDS_VERIFICATION
        : VERIFICATION_STATUS.PENDING;
      document.overallConfidence = overallConf;
      await document.save();

      // Persist structured LandRecord
      await LandRecord.findOneAndUpdate(
        { documentId: document._id },
        {
          documentId: document._id,
          owner: extractionResult.extractedFields.owners || [],
          landInformation: extractionResult.extractedFields.landInformation || {
            area: 0,
            areaUnit: 'Acre',
          },
          location: {
            state: document.state,
            district: document.district,
            tehsil: document.tehsil,
            village: document.village,
          },
          fieldLevelConfidence: confidenceResult.fieldLevelConfidence,
          validationResults: validationResult.rules,
          overallConfidence: overallConf,
          verificationStatus: document.verificationStatus,
        },
        { upsert: true, new: true }
      );

      await this.logStage(document._id, PIPELINE_STAGES.COMPLETED, 'SUCCESS', 'Pipeline-Orchestrator', 0);
      logger.info(`[Pipeline] Successfully completed digitization for document ${document.documentId}`);

      return {
        success: true,
        document,
      };
    } catch (error) {
      logger.error(`[Pipeline Error] Document ${document.documentId} failed: ${error.message}`);

      // Log failure in ProcessingLog
      await this.logStage(
        document._id,
        this.mapStatusToStage(document.processingStatus),
        'FAILED',
        'Pipeline-Worker',
        0,
        error.message
      );

      document.processingStatus = PROCESSING_STATUS.FAILED;
      document.metadata = document.metadata || new Map();
      document.metadata.set('failureReason', error.message);
      await document.save();

      throw error;
    }
  },

  /**
   * Helper to write structured ProcessingLog record
   */
  async logStage(documentId, stage, status, engine = 'BhumiPatra-Engine', processingTime = 0, error = null) {
    try {
      await ProcessingLog.create({
        documentId,
        stage,
        status,
        engine,
        processingTime,
        error,
      });
    } catch (logErr) {
      logger.error(`Failed to record processing log: ${logErr.message}`);
    }
  },

  mapStatusToStage(status) {
    switch (status) {
      case PROCESSING_STATUS.PREPROCESSING:
        return PIPELINE_STAGES.PREPROCESSING;
      case PROCESSING_STATUS.OCR:
        return PIPELINE_STAGES.OCR;
      case PROCESSING_STATUS.EXTRACTION:
        return PIPELINE_STAGES.EXTRACTION;
      case PROCESSING_STATUS.VALIDATION:
        return PIPELINE_STAGES.VALIDATION;
      case PROCESSING_STATUS.CONFIDENCE_ANALYSIS:
        return PIPELINE_STAGES.CONFIDENCE_ANALYSIS;
      default:
        return PIPELINE_STAGES.UPLOAD;
    }
  },
};

export default pipelineService;
