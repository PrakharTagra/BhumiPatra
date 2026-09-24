import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Document from '../models/Document.js';
import LandRecord from '../models/LandRecord.js';
import AuditLog from '../models/AuditLog.js';
import VerificationLog from '../models/VerificationLog.js';
import auditService from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';
import { ERROR_CODES, AUDIT_ACTIONS, PROCESSING_STATUS, VERIFICATION_STATUS } from '../config/constants.js';

export const adminController = {
  /**
   * System-Wide Live Dashboard Metrics
   * GET /api/admin/dashboard
   */
  async getDashboard(req, res, next) {
    try {
      // Purely API/DB-driven aggregates - ZERO dummy statistics
      const [
        totalUsers,
        activeUsers,
        totalDocuments,
        processingDocuments,
        processedDocuments,
        failedDocuments,
        totalLandRecords,
        pendingVerification,
        verifiedRecords,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Document.countDocuments(),
        Document.countDocuments({
          processingStatus: {
            $in: [
              PROCESSING_STATUS.PENDING,
              PROCESSING_STATUS.UPLOADING,
              PROCESSING_STATUS.PREPROCESSING,
              PROCESSING_STATUS.OCR,
              PROCESSING_STATUS.EXTRACTION,
              PROCESSING_STATUS.VALIDATION,
              PROCESSING_STATUS.CONFIDENCE_ANALYSIS,
            ],
          },
        }),
        Document.countDocuments({ processingStatus: PROCESSING_STATUS.COMPLETED }),
        Document.countDocuments({ processingStatus: PROCESSING_STATUS.FAILED }),
        LandRecord.countDocuments(),
        LandRecord.countDocuments({
          verificationStatus: {
            $in: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.NEEDS_VERIFICATION],
          },
        }),
        LandRecord.countDocuments({ verificationStatus: VERIFICATION_STATUS.VERIFIED }),
      ]);

      return sendSuccess(res, {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        documents: {
          total: totalDocuments,
          processing: processingDocuments,
          processed: processedDocuments,
          failed: failedDocuments,
        },
        records: {
          total: totalLandRecords,
          pendingVerification,
          verified: verifiedRecords,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deep Analytics Aggregation
   * GET /api/admin/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      // Aggregate documents by type
      const docsByType = await Document.aggregate([
        { $group: { _id: '$documentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Aggregate documents by status
      const docsByStatus = await Document.aggregate([
        { $group: { _id: '$processingStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Aggregate average confidence across documents
      const confidenceStats = await Document.aggregate([
        { $match: { overallConfidence: { $ne: null } } },
        {
          $group: {
            _id: null,
            averageConfidence: { $avg: '$overallConfidence' },
            minConfidence: { $min: '$overallConfidence' },
            maxConfidence: { $max: '$overallConfidence' },
          },
        },
      ]);

      // Verification actions distribution
      const actionsCount = await VerificationLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]);

      return sendSuccess(res, {
        documentsByType: docsByType.map((d) => ({ type: d._id || 'Unknown', count: d.count })),
        documentsByStatus: docsByStatus.map((d) => ({ status: d._id || 'Unknown', count: d.count })),
        confidenceMetrics: confidenceStats[0]
          ? {
              average: Math.round(confidenceStats[0].averageConfidence || 0),
              min: confidenceStats[0].minConfidence || 0,
              max: confidenceStats[0].maxConfidence || 0,
            }
          : { average: 0, min: 0, max: 0 },
        verificationActions: actionsCount.map((a) => ({ action: a._id, count: a.count })),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * User Management: List Users
   * GET /api/admin/users
   */
  async getUsers(req, res, next) {
    try {
      const { page, limit, skip, buildMeta } = getPagination(req.query);
      const { search, role, isActive } = req.query;

      const query = {};

      if (role) {
        query.role = role;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true' || isActive === true;
      }

      if (search && search.trim()) {
        const s = search.trim();
        query.$or = [{ name: new RegExp(s, 'i') }, { email: new RegExp(s, 'i') }, { department: new RegExp(s, 'i') }];
      }

      const [users, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        User.countDocuments(query),
      ]);

      return sendSuccess(res, users, 200, buildMeta(total));
    } catch (error) {
      next(error);
    }
  },

  /**
   * User Management: Create User Account
   * POST /api/admin/users
   */
  async createUser(req, res, next) {
    try {
      const { name, email, password, role, department, state, district, tehsil } = req.body;

      // Check if email already registered
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return sendError(res, 'A user account with this email address already exists.', ERROR_CODES.VALIDATION_ERROR, 409);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        department: department || 'Land Records & Revenue Department',
        state: state || null,
        district: district || null,
        tehsil: tehsil || null,
        isActive: true,
      });

      // Audit Log
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.USER_CREATED,
        entityType: 'USER',
        entityId: user._id,
        description: `Created new user '${user.name}' (${user.email}) with role '${user.role}'.`,
        req,
      });

      return sendSuccess(res, { user: user.toJSON() }, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * User Management: Toggle Active / Inactive Status
   * PATCH /api/admin/users/:id/status
   */
  async patchUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return sendError(res, `User with ID '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      user.isActive = Boolean(isActive);
      await user.save();

      // Audit Log
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
        entityType: 'USER',
        entityId: user._id,
        description: `User '${user.name}' status set to ${user.isActive ? 'ACTIVE' : 'DEACTIVATED'}.`,
        req,
      });

      return sendSuccess(res, {
        user: user.toJSON(),
        message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Document Management (Admin Full Inspection)
   * GET /api/admin/documents
   */
  async getDocuments(req, res, next) {
    try {
      const { page, limit, skip, buildMeta } = getPagination(req.query);
      const { search, status, district, verificationStatus } = req.query;

      const query = {};
      if (status) query.processingStatus = status.toUpperCase();
      if (verificationStatus) query.verificationStatus = verificationStatus.toUpperCase();
      if (district) query.district = new RegExp(district.trim(), 'i');

      if (search && search.trim()) {
        const s = search.trim();
        query.$or = [{ documentId: new RegExp(s, 'i') }, { originalName: new RegExp(s, 'i') }, { village: new RegExp(s, 'i') }];
      }

      const [documents, total] = await Promise.all([
        Document.find(query)
          .sort({ createdAt: -1 })
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
   * System Audit Logs Retrieval
   * GET /api/admin/audit-logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const { page, limit, skip, buildMeta } = getPagination(req.query);
      const { action, entityType, userId, search } = req.query;

      const query = {};

      if (action) query.action = action;
      if (entityType) query.entityType = entityType;
      if (userId) query.userId = userId;

      if (search && search.trim()) {
        query.description = new RegExp(search.trim(), 'i');
      }

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'name email role')
          .lean(),
        AuditLog.countDocuments(query),
      ]);

      return sendSuccess(res, logs, 200, buildMeta(total));
    } catch (error) {
      next(error);
    }
  },
};

export default adminController;
