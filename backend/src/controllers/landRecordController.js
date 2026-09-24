import LandRecord from '../models/LandRecord.js';
import Document from '../models/Document.js';
import VerificationLog from '../models/VerificationLog.js';
import auditService from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';
import {
  ERROR_CODES,
  VERIFICATION_STATUS,
  VERIFICATION_ACTIONS,
  AUDIT_ACTIONS,
} from '../config/constants.js';

export const landRecordController = {
  /**
   * Get Land Records with Pagination, Search, and Filtering
   * GET /api/land-records
   */
  async getLandRecords(req, res, next) {
    try {
      const { page, limit, skip, buildMeta } = getPagination(req.query);
      const { search, status, district, tehsil, village, khasraNo } = req.query;

      const query = {};

      if (status) {
        query.verificationStatus = status.toUpperCase();
      }

      if (district) {
        query['location.district'] = new RegExp(district.trim(), 'i');
      }

      if (tehsil) {
        query['location.tehsil'] = new RegExp(tehsil.trim(), 'i');
      }

      if (village) {
        query['location.village'] = new RegExp(village.trim(), 'i');
      }

      if (khasraNo) {
        query['landInformation.khasraNo'] = new RegExp(khasraNo.trim(), 'i');
      }

      if (search && search.trim()) {
        const s = search.trim();
        query.$or = [
          { 'landInformation.khasraNo': new RegExp(s, 'i') },
          { 'landInformation.khatauniNo': new RegExp(s, 'i') },
          { 'location.village': new RegExp(s, 'i') },
          { 'location.district': new RegExp(s, 'i') },
          { 'owner.name': new RegExp(s, 'i') },
        ];
      }

      const [records, total] = await Promise.all([
        LandRecord.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('documentId', 'documentId originalName documentType fileUrl')
          .populate('verifiedBy', 'name email role')
          .lean(),
        LandRecord.countDocuments(query),
      ]);

      return sendSuccess(res, records, 200, buildMeta(total));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Pending / Verification Required Land Records
   * GET /api/land-records/pending
   */
  async getPending(req, res, next) {
    try {
      const { page, limit, skip, buildMeta } = getPagination(req.query);

      const query = {
        verificationStatus: {
          $in: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.NEEDS_VERIFICATION],
        },
      };

      const [records, total] = await Promise.all([
        LandRecord.find(query)
          .sort({ overallConfidence: 1, createdAt: -1 }) // Low confidence records first
          .skip(skip)
          .limit(limit)
          .populate('documentId', 'documentId originalName documentType fileUrl recordYear')
          .lean(),
        LandRecord.countDocuments(query),
      ]);

      return sendSuccess(res, records, 200, buildMeta(total));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Single Land Record
   * GET /api/land-records/:id
   */
  async getLandRecordById(req, res, next) {
    try {
      const { id } = req.params;

      const record = await LandRecord.findById(id)
        .populate('documentId')
        .populate('verifiedBy', 'name email role department')
        .lean();

      if (!record) {
        return sendError(res, `Land record with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      return sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update / Edit Land Record Field (by Verification Officer)
   * PUT /api/land-records/:id
   */
  async updateLandRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, owner, landInformation, location, ownership, mutation, registration } = req.body;

      const record = await LandRecord.findById(id);
      if (!record) {
        return sendError(res, `Land record with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      // Record field changes in VerificationLog
      const changes = [];
      if (landInformation) {
        changes.push({ field: 'landInformation', oldValue: record.landInformation, newValue: landInformation });
        record.landInformation = { ...record.landInformation.toObject(), ...landInformation };
      }
      if (owner) {
        changes.push({ field: 'owner', oldValue: record.owner, newValue: owner });
        record.owner = owner;
      }
      if (location) {
        changes.push({ field: 'location', oldValue: record.location, newValue: location });
        record.location = { ...record.location.toObject(), ...location };
      }
      if (ownership) {
        changes.push({ field: 'ownership', oldValue: record.ownership, newValue: ownership });
        record.ownership = { ...record.ownership.toObject(), ...ownership };
      }
      if (mutation) {
        changes.push({ field: 'mutation', oldValue: record.mutation, newValue: mutation });
        record.mutation = { ...record.mutation.toObject(), ...mutation };
      }
      if (registration) {
        changes.push({ field: 'registration', oldValue: record.registration, newValue: registration });
        record.registration = { ...record.registration.toObject(), ...registration };
      }

      // Persist logs for all changes
      for (const change of changes) {
        await VerificationLog.create({
          documentId: record.documentId,
          landRecordId: record._id,
          officerId: req.user._id,
          action: VERIFICATION_ACTIONS.UPDATE_FIELD,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          reason,
        });
      }

      await record.save();

      // Audit Log
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.LAND_RECORD_UPDATED,
        entityType: 'LAND_RECORD',
        entityId: record._id,
        description: `Land record ${record._id} updated by ${req.user.name}. Reason: ${reason}`,
        req,
      });

      return sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Approve Land Record
   * POST /api/land-records/:id/approve
   */
  async approve(req, res, next) {
    try {
      const { id } = req.params;
      const { reason = 'Land record entities verified and approved' } = req.body;

      const record = await LandRecord.findById(id);
      if (!record) {
        return sendError(res, `Land record with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      record.verificationStatus = VERIFICATION_STATUS.VERIFIED;
      record.verifiedBy = req.user._id;
      record.verifiedAt = new Date();
      record.verificationRemarks = reason;
      await record.save();

      // Sync Document verification status
      await Document.findByIdAndUpdate(record.documentId, {
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
      });

      // Verification log
      await VerificationLog.create({
        documentId: record.documentId,
        landRecordId: record._id,
        officerId: req.user._id,
        action: VERIFICATION_ACTIONS.APPROVE,
        reason,
      });

      // Audit Log
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.LAND_RECORD_APPROVED,
        entityType: 'LAND_RECORD',
        entityId: record._id,
        description: `Land record ${record._id} approved by ${req.user.name}.`,
        req,
      });

      return sendSuccess(res, {
        record,
        message: 'Land record successfully verified and approved.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reject Land Record
   * POST /api/land-records/:id/reject
   */
  async reject(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const record = await LandRecord.findById(id);
      if (!record) {
        return sendError(res, `Land record with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      record.verificationStatus = VERIFICATION_STATUS.REJECTED;
      record.verifiedBy = req.user._id;
      record.verifiedAt = new Date();
      record.verificationRemarks = reason;
      await record.save();

      // Sync Document verification status
      await Document.findByIdAndUpdate(record.documentId, {
        verificationStatus: VERIFICATION_STATUS.REJECTED,
      });

      // Verification Log
      await VerificationLog.create({
        documentId: record.documentId,
        landRecordId: record._id,
        officerId: req.user._id,
        action: VERIFICATION_ACTIONS.REJECT,
        reason,
      });

      // Audit Log
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.LAND_RECORD_REJECTED,
        entityType: 'LAND_RECORD',
        entityId: record._id,
        description: `Land record ${record._id} rejected by ${req.user.name}. Reason: ${reason}`,
        req,
      });

      return sendSuccess(res, {
        record,
        message: 'Land record marked as rejected.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Send Back Land Record for Re-digitization / Re-scanning
   * POST /api/land-records/:id/send-back
   */
  async sendBack(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const record = await LandRecord.findById(id);
      if (!record) {
        return sendError(res, `Land record with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      record.verificationStatus = VERIFICATION_STATUS.SENT_BACK;
      record.verifiedBy = req.user._id;
      record.verifiedAt = new Date();
      record.verificationRemarks = reason;
      await record.save();

      // Sync Document verification status
      await Document.findByIdAndUpdate(record.documentId, {
        verificationStatus: VERIFICATION_STATUS.SENT_BACK,
      });

      // Verification Log
      await VerificationLog.create({
        documentId: record.documentId,
        landRecordId: record._id,
        officerId: req.user._id,
        action: VERIFICATION_ACTIONS.SEND_BACK,
        reason,
      });

      // Audit Log
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.LAND_RECORD_SENT_BACK,
        entityType: 'LAND_RECORD',
        entityId: record._id,
        description: `Land record ${record._id} sent back for re-digitization by ${req.user.name}. Reason: ${reason}`,
        req,
      });

      return sendSuccess(res, {
        record,
        message: 'Land record successfully sent back for operator review.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Land Record Verification Audit Trail History
   * GET /api/land-records/:id/verification-history
   */
  async getVerificationHistory(req, res, next) {
    try {
      const { id } = req.params;

      const history = await VerificationLog.find({ landRecordId: id })
        .sort({ createdAt: -1 })
        .populate('officerId', 'name email role department')
        .lean();

      return sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  },
};

export default landRecordController;
