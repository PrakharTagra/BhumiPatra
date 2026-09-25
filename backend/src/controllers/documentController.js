import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Document from '../models/Document.js';
import LandRecord from '../models/LandRecord.js';
import ProcessingLog from '../models/ProcessingLog.js';
import storageService from '../services/storageService.js';
import pipelineService from '../services/pipelineService.js';
import auditService from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';
import { ERROR_CODES, AUDIT_ACTIONS, PROCESSING_STATUS, PIPELINE_STAGES } from '../config/constants.js';

function getAbsoluteFileUrl(req, fileUrl) {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const host = req ? req.get('host') : 'localhost:5000';
  const protocol = req ? req.protocol : 'http';
  const cleanPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${protocol}://${host}${cleanPath}`;
}

export const documentController = {
  /**
   * Upload Scanned Land Record
   * POST /api/documents/upload
   */
  async upload(req, res, next) {
    try {
      if (!req.file) {
        return sendError(
          res,
          'Scanned file is required. Please provide a PDF, JPG, PNG, or TIFF file.',
          ERROR_CODES.FILE_ERROR,
          400
        );
      }

      const { documentType, state, district, tehsil, village, recordYear } = req.body;

      // Generate a standardized Document ID: DOC-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const uniqueSuffix = uuidv4().substring(0, 8).toUpperCase();
      const documentId = `DOC-${dateStr}-${uniqueSuffix}`;

      // Save file via modular storage layer
      const ext = path.extname(req.file.originalname).toLowerCase();
      const filename = `${documentId}${ext}`;
      const { storageKey, fileUrl } = await storageService.saveFile(
        req.file.buffer,
        filename,
        `records/${district.toLowerCase().replace(/\s+/g, '_')}`
      );

      // Create Document record
      const document = await Document.create({
        documentId,
        originalName: req.file.originalname,
        fileUrl,
        storageKey,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        documentType,
        state,
        district,
        tehsil,
        village,
        recordYear: Number(recordYear),
        uploadedBy: req.user._id,
        processingStatus: PROCESSING_STATUS.PENDING,
      });

      // Log initial UPLOAD stage in ProcessingLog
      await ProcessingLog.create({
        documentId: document._id,
        stage: PIPELINE_STAGES.UPLOAD,
        status: 'SUCCESS',
        engine: 'StorageService',
        processingTime: 0,
      });

      // Audit log document upload
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
        entityType: 'DOCUMENT',
        entityId: document._id,
        description: `Uploaded legacy document '${document.originalName}' (${document.documentId}) for ${village}, ${district}.`,
        req,
      });

      const absoluteUrl = getAbsoluteFileUrl(req, fileUrl);
      const docObject = document.toObject();
      docObject.fileUrl = absoluteUrl;

      return res.status(201).json({
        success: true,
        document: docObject,
        documentId: docObject.documentId,
        id: docObject._id,
        _id: docObject._id,
        data: {
          ...docObject,
          document: docObject,
          documentId: docObject.documentId,
          id: docObject._id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * List Documents with Search, Filters, and Pagination
   * GET /api/documents
   */
  async getDocuments(req, res, next) {
    try {
      const { page, limit, skip, buildMeta } = getPagination(req.query);
      const { search, status, documentType, district, tehsil, village, recordYear, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      // Construct filter query
      const query = {};

      if (status) {
        query.processingStatus = status.toUpperCase();
      }

      if (documentType) {
        query.documentType = documentType;
      }

      if (district) {
        query.district = new RegExp(district.trim(), 'i');
      }

      if (tehsil) {
        query.tehsil = new RegExp(tehsil.trim(), 'i');
      }

      if (village) {
        query.village = new RegExp(village.trim(), 'i');
      }

      if (recordYear) {
        query.recordYear = Number(recordYear);
      }

      if (search && search.trim()) {
        const s = search.trim();
        query.$or = [
          { documentId: new RegExp(s, 'i') },
          { originalName: new RegExp(s, 'i') },
          { village: new RegExp(s, 'i') },
          { district: new RegExp(s, 'i') },
          { tehsil: new RegExp(s, 'i') },
        ];
      }

      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [documents, total] = await Promise.all([
        Document.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('uploadedBy', 'name email role department')
          .lean(),
        Document.countDocuments(query),
      ]);

      const formatted = documents.map((d) => ({
        ...d,
        fileUrl: getAbsoluteFileUrl(req, d.fileUrl),
      }));

      const totalPages = Math.ceil(total / limit) || 1;
      return res.status(200).json({
        success: true,
        documents: formatted,
        total,
        totalPages,
        page,
        limit,
        pagination: buildMeta(total),
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Single Document Details
   * GET /api/documents/:id
   */
  async getDocumentById(req, res, next) {
    try {
      const { id } = req.params;

      const document = await Document.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { documentId: id }],
      })
        .populate('uploadedBy', 'name email role department')
        .lean();

      if (!document) {
        return sendError(res, `Document with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      // Fetch corresponding LandRecord if pipeline extracted it
      const landRecord = await LandRecord.findOne({ documentId: document._id })
        .populate('verifiedBy', 'name email role')
        .lean();

      // Fetch processing logs
      const processingLogs = await ProcessingLog.find({ documentId: document._id })
        .sort({ createdAt: 1 })
        .lean();

      const extractedData = landRecord
        ? {
            parcels: [
              {
                khasraNo: landRecord.landInformation?.khasraNo || 'Not detected',
                khatauniNo: landRecord.landInformation?.khatauniNo || 'Not detected',
                khewatNo: landRecord.landInformation?.khewatNo || 'Not detected',
                area: landRecord.landInformation?.area != null ? landRecord.landInformation.area : null,
                unit: landRecord.landInformation?.areaUnit || 'Not detected',
                landType: landRecord.landInformation?.landClassification || 'Not detected',
                confidence: landRecord.overallConfidence,
              },
            ],
            owners:
              landRecord.owner?.map((o) => ({
                name: o.name || 'Not detected',
                relation: o.relation || '',
                share: o.shareRatio || 'Not detected',
                confidence: o.confidence || landRecord.overallConfidence,
              })) || [],
          }
        : null;

      const enrichedDoc = {
        ...document,
        fileUrl: getAbsoluteFileUrl(req, document.fileUrl),
        extractedData,
      };

      return sendSuccess(res, {
        document: enrichedDoc,
        landRecord,
        processingLogs,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Trigger / Re-run Document Processing
   * POST /api/documents/:id/process
   */
  async triggerProcess(req, res, next) {
    try {
      const { id } = req.params;

      const document = await Document.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { documentId: id }],
      });

      if (!document) {
        return sendError(res, `Document with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      // Audit log process trigger
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.DOCUMENT_PROCESS_TRIGGERED,
        entityType: 'DOCUMENT',
        entityId: document._id,
        description: `Processing pipeline triggered for document ${document.documentId}.`,
        req,
      });

      // Update initial status to PREPROCESSING
      document.processingStatus = PROCESSING_STATUS.PREPROCESSING;
      await document.save();

      // Ensure UPLOAD stage exists in ProcessingLog
      const uploadLog = await ProcessingLog.findOne({ documentId: document._id, stage: PIPELINE_STAGES.UPLOAD });
      if (!uploadLog) {
        await ProcessingLog.create({
          documentId: document._id,
          stage: PIPELINE_STAGES.UPLOAD,
          status: 'SUCCESS',
          engine: 'StorageService',
          processingTime: 0,
        });
      }

      // Mark PREPROCESSING as STARTED
      await ProcessingLog.findOneAndUpdate(
        { documentId: document._id, stage: PIPELINE_STAGES.PREPROCESSING },
        {
          documentId: document._id,
          stage: PIPELINE_STAGES.PREPROCESSING,
          status: 'STARTED',
          engine: 'PreprocessingService',
        },
        { upsert: true, new: true }
      );

      // Execute pipeline asynchronously so caller gets immediate response and UI observes actual stage progress
      pipelineService.runPipeline(document._id).catch((err) => {
        console.error(`[Pipeline Error] Background processing failed for ${document.documentId}:`, err);
      });

      return res.status(202).json({
        success: true,
        documentId: document.documentId,
        status: document.processingStatus,
        message: 'Document processing initiated.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Internal Stage Update from Document Analysis Engine
   * POST /api/documents/internal/stage-update
   */
  async updateStageInternal(req, res, next) {
    try {
      const { documentId, stage, status, durationMs, error } = req.body;
      if (!documentId || !stage) {
        return res.status(400).json({ success: false, message: 'documentId and stage are required' });
      }

      const document = await Document.findOne({
        $or: [{ _id: documentId.match(/^[0-9a-fA-F]{24}$/) ? documentId : null }, { documentId }],
      });

      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      if (status === 'STARTED' || status === 'IN_PROGRESS') {
        document.processingStatus = stage;
        await document.save();
      } else if (status === 'FAILED') {
        document.processingStatus = PROCESSING_STATUS.FAILED;
        if (error) {
          document.metadata = document.metadata || new Map();
          document.metadata.set('failureReason', error);
        }
        await document.save();
      }

      await ProcessingLog.findOneAndUpdate(
        { documentId: document._id, stage },
        {
          documentId: document._id,
          stage,
          status,
          processingTime: durationMs || 0,
          error: error || null,
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Document Live Processing Status
   * GET /api/documents/:id/status
   */
  async getDocumentStatus(req, res, next) {
    try {
      const { id } = req.params;

      const document = await Document.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { documentId: id }],
      }).lean();

      if (!document) {
        return sendError(res, `Document with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      const logs = await ProcessingLog.find({ documentId: document._id })
        .sort({ createdAt: 1 })
        .lean();

      const lastLog = logs[logs.length - 1];

      // Format steps dictionary for the 7-stage tracker
      const stepDetails = {};
      for (const log of logs) {
        const key = log.stage?.toLowerCase();
        if (key) {
          stepDetails[key] = {
            status: log.status,
            duration: log.processingTime ? `${log.processingTime}ms` : undefined,
            engine: log.engine,
            error: log.error,
          };
        }
      }

      return sendSuccess(res, {
        documentId: document.documentId,
        status: document.processingStatus,
        verificationStatus: document.verificationStatus,
        overallConfidence: document.overallConfidence,
        currentStep: lastLog?.stage || document.processingStatus,
        steps: stepDetails,
        logs,
        error: document.metadata?.get ? document.metadata.get('failureReason') : document.metadata?.failureReason || null,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default documentController;
