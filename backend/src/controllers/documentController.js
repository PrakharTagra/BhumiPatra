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
import { ERROR_CODES, AUDIT_ACTIONS, PROCESSING_STATUS } from '../config/constants.js';

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

      // Audit log document upload
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
        entityType: 'DOCUMENT',
        entityId: document._id,
        description: `Uploaded legacy document '${document.originalName}' (${document.documentId}) for ${village}, ${district}.`,
        req,
      });

      return sendSuccess(res, { document }, 201);
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

      return sendSuccess(res, documents, 200, buildMeta(total));
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

      return sendSuccess(res, {
        document,
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

      // Execute pipeline
      const result = await pipelineService.runPipeline(document._id);

      return sendSuccess(res, {
        document: result.document,
        message: 'AI Processing pipeline finished successfully.',
      });
    } catch (error) {
      next(error);
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

      return sendSuccess(res, {
        documentId: document.documentId,
        status: document.processingStatus,
        verificationStatus: document.verificationStatus,
        overallConfidence: document.overallConfidence,
        currentStep: lastLog?.stage || document.processingStatus,
        logs,
        error: document.metadata?.get ? document.metadata.get('failureReason') : document.metadata?.failureReason || null,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default documentController;
