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

/**
 * Helper to build an absolute URL for a document file
 */
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

/**
 * Normalizes a LandRecord document so both flat field accessors (used by Verification Portal)
 * and nested hierarchical accessors (used by Digitization Portal & Backend) resolve cleanly.
 */
function normalizeLandRecord(record, req) {
  if (!record) return null;
  const doc = record.documentId || {};
  const rawFileUrl = doc.fileUrl || record.fileUrl || '';
  const fullFileUrl = getAbsoluteFileUrl(req, rawFileUrl);

  const plain = typeof record.toObject === 'function' ? record.toObject() : { ...record };

  const ownerFirst = Array.isArray(plain.owner) && plain.owner.length > 0 ? plain.owner[0] : null;
  const landInfo = plain.landInformation || {};
  const loc = plain.location || {};

  return {
    ...plain,
    id: plain._id,
    _id: plain._id,
    documentNumber: doc.documentId || doc.originalName || `REC-${plain._id.toString().substring(0, 8)}`,
    documentUrl: fullFileUrl,
    fileUrl: fullFileUrl,
    documentType: doc.documentType || 'Scanned Land Record',
    ownerName: ownerFirst?.name || '',
    khasraNumber: landInfo.khasraNo || '',
    khataNumber: landInfo.khatauniNo || '',
    surveyNumber: landInfo.khewatNo || '',
    area: landInfo.area !== undefined ? landInfo.area : 0,
    areaUnit: landInfo.areaUnit || 'Acre',
    landClassification: landInfo.landClassification || '',
    state: loc.state || doc.state || '',
    district: loc.district || doc.district || '',
    tehsil: loc.tehsil || doc.tehsil || '',
    village: loc.village || doc.village || '',
    ownershipDetails: plain.ownership?.tenureType || '',
    mutationDetails: plain.mutation?.mutationNo ? `Mutation No: ${plain.mutation.mutationNo}` : '',
    registrationDetails: plain.registration?.registrationNo ? `Reg No: ${plain.registration.registrationNo}` : '',
    confidence: plain.overallConfidence,
    confidenceScore: plain.overallConfidence,
    reviewStatus: plain.verificationStatus,
    validations: plain.validationResults || [],
    confidenceScores: plain.fieldLevelConfidence || {},
  };
}

export const landRecordController = {
  /**
   * Verification Desk Dashboard Telemetry
   * GET /api/land-records/dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const [
        pendingCount,
        highConfidenceCount,
        lowConfidenceCount,
        approvedCount,
        rejectedCount,
        recentReviewedDocs,
      ] = await Promise.all([
        LandRecord.countDocuments({
          verificationStatus: {
            $in: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.NEEDS_VERIFICATION],
          },
        }),
        LandRecord.countDocuments({
          verificationStatus: {
            $in: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.NEEDS_VERIFICATION],
          },
          overallConfidence: { $gte: 80 },
        }),
        LandRecord.countDocuments({
          verificationStatus: {
            $in: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.NEEDS_VERIFICATION],
          },
          overallConfidence: { $lt: 80 },
        }),
        LandRecord.countDocuments({ verificationStatus: VERIFICATION_STATUS.VERIFIED }),
        LandRecord.countDocuments({ verificationStatus: VERIFICATION_STATUS.REJECTED }),
        LandRecord.find({
          verificationStatus: {
            $in: [VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED, VERIFICATION_STATUS.SENT_BACK],
          },
        })
          .sort({ updatedAt: -1 })
          .limit(5)
          .populate('documentId')
          .populate('verifiedBy', 'name email role')
          .lean(),
      ]);

      const normalizedRecent = recentReviewedDocs.map((r) => normalizeLandRecord(r, req));

      return sendSuccess(res, {
        pendingVerification: pendingCount,
        pendingCount,
        highConfidenceRecords: highConfidenceCount,
        highConfidenceCount,
        lowConfidenceRecords: lowConfidenceCount,
        lowConfidenceCount,
        approvedRecords: approvedCount,
        approvedCount,
        rejectedRecords: rejectedCount,
        rejectedCount,
        recentlyReviewed: normalizedRecent,
        recentRecords: normalizedRecent,
      });
    } catch (error) {
      next(error);
    }
  },

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
          .populate('documentId')
          .populate('verifiedBy', 'name email role')
          .lean(),
        LandRecord.countDocuments(query),
      ]);

      const normalized = records.map((r) => normalizeLandRecord(r, req));

      return res.status(200).json({
        success: true,
        records: normalized,
        data: normalized,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        pagination: buildMeta(total),
      });
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
      const { search, district, tehsil, confidence, validationStatus, sort } = req.query;

      const query = {
        verificationStatus: {
          $in: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.NEEDS_VERIFICATION],
        },
      };

      if (district && district.trim()) {
        query['location.district'] = new RegExp(district.trim(), 'i');
      }

      if (tehsil && tehsil.trim()) {
        query['location.tehsil'] = new RegExp(tehsil.trim(), 'i');
      }

      if (confidence === 'high') {
        query.overallConfidence = { $gte: 80 };
      } else if (confidence === 'low') {
        query.overallConfidence = { $lt: 80 };
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

      let sortOption = { overallConfidence: 1, createdAt: -1 };
      if (sort === 'confidence_desc') {
        sortOption = { overallConfidence: -1 };
      } else if (sort === 'confidence_asc') {
        sortOption = { overallConfidence: 1 };
      } else if (sort === 'date_asc') {
        sortOption = { createdAt: 1 };
      } else if (sort === 'date_desc') {
        sortOption = { createdAt: -1 };
      }

      const [records, total] = await Promise.all([
        LandRecord.find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .populate('documentId')
          .lean(),
        LandRecord.countDocuments(query),
      ]);

      const normalized = records.map((r) => normalizeLandRecord(r, req));

      return res.status(200).json({
        success: true,
        records: normalized,
        data: normalized,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        pagination: buildMeta(total),
      });
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
        .populate('verifiedBy', 'name email role department');

      if (!record) {
        return sendError(res, `Land record with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      const normalized = normalizeLandRecord(record, req);
      return sendSuccess(res, normalized);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update / Edit Land Record Field (by Verification Officer)
   * PUT /api/land-records/:id
   * Supports both single field correction: { field, value, previousValue, reason }
   * and multi-field structured payload: { landInformation, owner, location, reason }
   */
  async updateLandRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { field, value, previousValue, reason, remarks, owner, landInformation, location, ownership, mutation, registration } = req.body;

      const actionReason = reason || remarks || 'Field correction by Verification Officer';

      const record = await LandRecord.findById(id);
      if (!record) {
        return sendError(res, `Land record with identifier '${id}' was not found.`, ERROR_CODES.NOT_FOUND, 404);
      }

      const loggedChanges = [];

      // Case A: Single flat field update from Verification Workstation (e.g. field: 'area', value: '4.5')
      if (field) {
        let oldValue = previousValue !== undefined ? previousValue : null;
        let newValue = value;

        switch (field) {
          case 'ownerName':
            if (!record.owner || record.owner.length === 0) {
              record.owner = [{ name: value }];
            } else {
              oldValue = oldValue ?? record.owner[0].name;
              record.owner[0].name = value;
            }
            break;

          case 'khasraNumber':
            record.landInformation = record.landInformation || {};
            oldValue = oldValue ?? record.landInformation.khasraNo;
            record.landInformation.khasraNo = value;
            break;

          case 'khataNumber':
            record.landInformation = record.landInformation || {};
            oldValue = oldValue ?? record.landInformation.khatauniNo;
            record.landInformation.khatauniNo = value;
            break;

          case 'surveyNumber':
            record.landInformation = record.landInformation || {};
            oldValue = oldValue ?? record.landInformation.khewatNo;
            record.landInformation.khewatNo = value;
            break;

          case 'area':
            record.landInformation = record.landInformation || {};
            oldValue = oldValue ?? record.landInformation.area;
            record.landInformation.area = Number(value) || 0;
            break;

          case 'areaUnit':
            record.landInformation = record.landInformation || {};
            oldValue = oldValue ?? record.landInformation.areaUnit;
            record.landInformation.areaUnit = value;
            break;

          case 'landClassification':
            record.landInformation = record.landInformation || {};
            oldValue = oldValue ?? record.landInformation.landClassification;
            record.landInformation.landClassification = value;
            break;

          case 'village':
            record.location = record.location || {};
            oldValue = oldValue ?? record.location.village;
            record.location.village = value;
            break;

          case 'tehsil':
            record.location = record.location || {};
            oldValue = oldValue ?? record.location.tehsil;
            record.location.tehsil = value;
            break;

          case 'district':
            record.location = record.location || {};
            oldValue = oldValue ?? record.location.district;
            record.location.district = value;
            break;

          case 'ownershipDetails':
            record.ownership = record.ownership || {};
            oldValue = oldValue ?? record.ownership.tenureType;
            record.ownership.tenureType = value;
            break;

          case 'mutationDetails':
            record.mutation = record.mutation || {};
            oldValue = oldValue ?? record.mutation.remarks;
            record.mutation.remarks = value;
            break;

          case 'registrationDetails':
            record.registration = record.registration || {};
            oldValue = oldValue ?? record.registration.registrationNo;
            record.registration.registrationNo = value;
            break;

          default:
            // Generic attribute update
            record.set(field, value);
            break;
        }

        loggedChanges.push({ field, oldValue, newValue });
      }

      // Case B: Multi-attribute structured updates
      if (landInformation) {
        loggedChanges.push({ field: 'landInformation', oldValue: record.landInformation, newValue: landInformation });
        record.landInformation = { ...(record.landInformation?.toObject() || {}), ...landInformation };
      }
      if (owner) {
        loggedChanges.push({ field: 'owner', oldValue: record.owner, newValue: owner });
        record.owner = owner;
      }
      if (location) {
        loggedChanges.push({ field: 'location', oldValue: record.location, newValue: location });
        record.location = { ...(record.location?.toObject() || {}), ...location };
      }
      if (ownership) {
        loggedChanges.push({ field: 'ownership', oldValue: record.ownership, newValue: ownership });
        record.ownership = { ...(record.ownership?.toObject() || {}), ...ownership };
      }
      if (mutation) {
        loggedChanges.push({ field: 'mutation', oldValue: record.mutation, newValue: mutation });
        record.mutation = { ...(record.mutation?.toObject() || {}), ...mutation };
      }
      if (registration) {
        loggedChanges.push({ field: 'registration', oldValue: record.registration, newValue: registration });
        record.registration = { ...(record.registration?.toObject() || {}), ...registration };
      }

      // Persist logs for all modified fields in VerificationLog
      for (const change of loggedChanges) {
        await VerificationLog.create({
          documentId: record.documentId,
          landRecordId: record._id,
          officerId: req.user._id,
          action: VERIFICATION_ACTIONS.UPDATE_FIELD,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          reason: actionReason,
        });
      }

      await record.save();

      // Audit Log
      await auditService.log({
        userId: req.user._id,
        action: AUDIT_ACTIONS.LAND_RECORD_UPDATED,
        entityType: 'LAND_RECORD',
        entityId: record._id,
        description: `Land record ${record._id} updated by ${req.user.name}. Reason: ${actionReason}`,
        req,
      });

      const updatedRecord = await LandRecord.findById(id).populate('documentId');
      return sendSuccess(res, normalizeLandRecord(updatedRecord, req));
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
      const reason = req.body.remarks || req.body.reason || 'Land record verified and approved';

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

      // Verification Log
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

      const updatedRecord = await LandRecord.findById(id).populate('documentId');
      return sendSuccess(res, {
        record: normalizeLandRecord(updatedRecord, req),
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
      const reason = req.body.reason || req.body.remarks;

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

      const updatedRecord = await LandRecord.findById(id).populate('documentId');
      return sendSuccess(res, {
        record: normalizeLandRecord(updatedRecord, req),
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
      const reason = req.body.reason || req.body.remarks;

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

      const updatedRecord = await LandRecord.findById(id).populate('documentId');
      return sendSuccess(res, {
        record: normalizeLandRecord(updatedRecord, req),
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

      const formatted = history.map((h) => ({
        ...h,
        officerName: h.officerId?.name || 'Verification Officer',
        timestamp: h.createdAt,
      }));

      return sendSuccess(res, formatted);
    } catch (error) {
      next(error);
    }
  },
};

export default landRecordController;
