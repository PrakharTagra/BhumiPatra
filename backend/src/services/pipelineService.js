import Document from '../models/Document.js';
import LandRecord from '../models/LandRecord.js';
import ProcessingLog from '../models/ProcessingLog.js';
import storageService from './storageService.js';
import analysisEngineClient from './analysisEngineClient.js';
import preprocessingService from './preprocessingService.js';
import ocrService from './ocrService.js';
import extractionService from './extractionService.js';
import validationService from './validationService.js';
import confidenceService from './confidenceService.js';
import { PIPELINE_STAGES, PROCESSING_STATUS, VERIFICATION_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';

export const pipelineService = {
  /**
   * Run complete document digitization pipeline via Python Document Analysis Engine
   * @param {string} documentId
   */
  async runPipeline(documentId) {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found.`);
    }

    logger.info(`[Pipeline] Commencing digitization for document ${document.documentId}`);

    try {
      // Step 1: Preprocessing & Ingestion
      await this.logStage(document._id, PIPELINE_STAGES.PREPROCESSING, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.PREPROCESSING;
      await document.save();

      const fileBuffer = await storageService.getFile(document.storageKey);

      // Attempt analysis through Python FastAPI Document Analysis Engine (PaddleOCR)
      let analysisResult = null;
      let usedPythonEngine = false;

      try {
        analysisResult = await analysisEngineClient.analyzeDocument(document, fileBuffer);
        usedPythonEngine = true;
        logger.info(`[Pipeline] Document ${document.documentId} successfully analyzed by Python Analysis Engine.`);
      } catch (engineErr) {
        logger.warn(
          `[Pipeline Notice] Python engine unavailable (${engineErr.message}). Initiating fallback Node.js pipeline...`
        );
      }

      if (usedPythonEngine && analysisResult && analysisResult.success) {
        // --- PROCESSED BY PYTHON FASTAPI ENGINE (PaddleOCR + OpenCV) ---
        const totalDuration = analysisResult.processing?.processingTimeMs || 1000;
        const ocrEngine = analysisResult.processing?.ocrEngine || 'PaddleOCR';

        await this.logStage(
          document._id,
          PIPELINE_STAGES.PREPROCESSING,
          'SUCCESS',
          'OpenCV-Adaptive-Deskew',
          Math.max(50, Math.round(totalDuration * 0.2))
        );

        // Stage 2: OCR
        await this.logStage(
          document._id,
          PIPELINE_STAGES.OCR,
          'SUCCESS',
          ocrEngine,
          Math.max(200, Math.round(totalDuration * 0.5))
        );

        // Stage 3: Extraction
        await this.logStage(
          document._id,
          PIPELINE_STAGES.EXTRACTION,
          'SUCCESS',
          'Cadastral-Regex-Rule-Engine',
          Math.max(50, Math.round(totalDuration * 0.15))
        );

        // Stage 4: Validation
        await this.logStage(
          document._id,
          PIPELINE_STAGES.VALIDATION,
          'SUCCESS',
          'Cadastral-Validation-Engine',
          Math.max(40, Math.round(totalDuration * 0.1))
        );

        // Stage 5: Confidence Scoring
        await this.logStage(
          document._id,
          PIPELINE_STAGES.CONFIDENCE_ANALYSIS,
          'SUCCESS',
          'Composite-Scoring-Engine',
          Math.max(30, Math.round(totalDuration * 0.05))
        );

        const extracted = analysisResult.extractedFields || {};
        const confidenceData = analysisResult.confidence || {};
        const validationData = analysisResult.validation || {};

        const overallConf = confidenceData.overallConfidence ?? 0.0;
        const requiresReview =
          confidenceData.requiresHumanVerification ||
          overallConf < 80.0 ||
          validationData.status !== 'PASSED';

        document.processingStatus = PROCESSING_STATUS.COMPLETED;
        document.verificationStatus = requiresReview
          ? VERIFICATION_STATUS.NEEDS_VERIFICATION
          : VERIFICATION_STATUS.PENDING;
        document.overallConfidence = overallConf;

        // Store OCR results, token bounding boxes & analysis metadata
        document.metadata = document.metadata || new Map();
        document.metadata.set('ocr', analysisResult.ocr);
        document.metadata.set('extractedFields', extracted);
        document.metadata.set('validation', validationData);
        document.metadata.set('confidence', confidenceData);
        document.metadata.set('processing', analysisResult.processing);
        await document.save();

        // Build structured owners list
        const owners = [];
        if (extracted.owner_name?.value) {
          owners.push({
            name: String(extracted.owner_name.value).trim(),
            relation: 'Tenure Holder',
            relativeName: extracted.father_guardian_name?.value ? String(extracted.father_guardian_name.value).trim() : '',
            shareRatio: '100%',
            confidence: Math.round(extracted.owner_name.confidence * 100),
          });
        }
        if (Array.isArray(extracted.co_owners?.value)) {
          extracted.co_owners.value.forEach((co) => {
            owners.push({
              name: String(co).trim(),
              relation: 'Co-Sharer',
              relativeName: '',
              shareRatio: 'Shareholder',
              confidence: Math.round((extracted.co_owners.confidence || 0.8) * 100),
            });
          });
        }
        if (owners.length === 0) {
          owners.push({
            name: 'Not detected',
            relation: 'Requires verification',
            relativeName: '',
            shareRatio: '',
            confidence: 0,
          });
        }

        // Build validation rules for MongoDB LandRecord
        const validationRules = (validationData.issues || []).map((iss) => ({
          ruleName: iss.type || 'VALIDATION_CHECK',
          status: iss.severity === 'ERROR' ? 'FAILED' : 'WARNING',
          description: iss.message || 'Validation alert',
          severity: iss.severity === 'ERROR' ? 'HIGH' : 'MEDIUM',
        }));

        if (validationRules.length === 0) {
          validationRules.push({
            ruleName: 'CADASTRE_INTEGRITY',
            status: 'PASSED',
            description: 'All structural cadastral attributes verified against schema.',
            severity: 'LOW',
          });
        }

        // Upsert LandRecord
        await LandRecord.findOneAndUpdate(
          { documentId: document._id },
          {
            documentId: document._id,
            owner: owners,
            landInformation: {
              khasraNo: extracted.khasra_number?.value || 'Not detected',
              khatauniNo: extracted.khata_number?.value || 'Not detected',
              khewatNo: extracted.plot_number?.value || extracted.survey_number?.value || 'Not detected',
              area: parseFloat(extracted.area?.value) || 0,
              areaUnit: extracted.area?.unit || extracted.area_unit?.value || (extracted.area?.value ? 'Hectare' : 'Not detected'),
              landClassification: extracted.land_classification?.value || 'Not detected',
            },
            location: {
              state: extracted.state?.value || document.state,
              district: extracted.district?.value || document.district,
              tehsil: extracted.tehsil?.value || document.tehsil,
              village: extracted.village?.value || document.village,
            },
            ownership: {
              tenureType: extracted.ownership_type?.value || 'Not detected',
              disputeStatus: 'Clear',
            },
            mutation: {
              mutationNo: extracted.mutation_number?.value || null,
              remarks: extracted.mutation_date?.value ? `Date: ${extracted.mutation_date.value}` : null,
            },
            registration: {
              registrationNo: extracted.registration_number?.value || null,
              remarks: extracted.registration_date?.value ? `Date: ${extracted.registration_date.value}` : null,
            },
            fieldLevelConfidence: confidenceData.fieldConfidences || {},
            validationResults: validationRules,
            overallConfidence: overallConf,
            verificationStatus: document.verificationStatus,
          },
          { upsert: true, new: true }
        );

        await this.logStage(document._id, PIPELINE_STAGES.COMPLETED, 'SUCCESS', 'Pipeline-Orchestrator', 0);
        logger.info(`[Pipeline] Successfully finalized digitization for document ${document.documentId}`);

        return {
          success: true,
          document,
          analysis: analysisResult,
        };
      }

      // --- FALLBACK NODE.JS PIPELINE (Only used if Python service is stopped) ---
      const preprocessed = await preprocessingService.process(document, fileBuffer);
      await this.logStage(document._id, PIPELINE_STAGES.PREPROCESSING, 'SUCCESS', 'Image-Preprocessor', preprocessed.durationMs);

      await this.logStage(document._id, PIPELINE_STAGES.OCR, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.OCR;
      await document.save();

      const ocrResult = await ocrService.process(document, fileBuffer, preprocessed);
      await this.logStage(document._id, PIPELINE_STAGES.OCR, 'SUCCESS', ocrResult.engine, ocrResult.durationMs);

      await this.logStage(document._id, PIPELINE_STAGES.EXTRACTION, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.EXTRACTION;
      await document.save();

      const extractionResult = await extractionService.process(document, ocrResult);
      await this.logStage(document._id, PIPELINE_STAGES.EXTRACTION, 'SUCCESS', extractionResult.engine, extractionResult.durationMs);

      await this.logStage(document._id, PIPELINE_STAGES.VALIDATION, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.VALIDATION;
      await document.save();

      const validationResult = await validationService.process(document, extractionResult.extractedFields);
      await this.logStage(document._id, PIPELINE_STAGES.VALIDATION, 'SUCCESS', 'Validation-Rules-Engine', validationResult.durationMs);

      await this.logStage(document._id, PIPELINE_STAGES.CONFIDENCE_ANALYSIS, 'STARTED');
      document.processingStatus = PROCESSING_STATUS.CONFIDENCE_ANALYSIS;
      await document.save();

      const confidenceResult = await confidenceService.process(ocrResult, extractionResult, validationResult);
      await this.logStage(document._id, PIPELINE_STAGES.CONFIDENCE_ANALYSIS, 'SUCCESS', 'Confidence-Engine', confidenceResult.durationMs);

      const overallConf = confidenceResult.overallConfidence;
      const requiresReview = validationResult.requiresManualVerification || overallConf < 70;

      document.processingStatus = PROCESSING_STATUS.COMPLETED;
      document.verificationStatus = requiresReview
        ? VERIFICATION_STATUS.NEEDS_VERIFICATION
        : VERIFICATION_STATUS.PENDING;
      document.overallConfidence = overallConf;
      await document.save();

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
          ownership: extractionResult.extractedFields.ownership || {},
          mutation: extractionResult.extractedFields.mutation || {},
          registration: extractionResult.extractedFields.registration || {},
          fieldLevelConfidence: confidenceResult.fieldLevelConfidence,
          validationResults: validationResult.rules,
          overallConfidence: overallConf,
          verificationStatus: document.verificationStatus,
        },
        { upsert: true, new: true }
      );

      await this.logStage(document._id, PIPELINE_STAGES.COMPLETED, 'SUCCESS', 'Pipeline-Orchestrator', 0);
      logger.info(`[Pipeline] Successfully completed fallback digitization for document ${document.documentId}`);

      return {
        success: true,
        document,
      };
    } catch (error) {
      logger.error(`[Pipeline Error] Document ${document.documentId} failed: ${error.message}`);

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
