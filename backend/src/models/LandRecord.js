import mongoose from 'mongoose';
import { VERIFICATION_STATUS } from '../config/constants.js';

const ownerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    relation: { type: String, trim: true },
    relativeName: { type: String, trim: true },
    shareRatio: { type: String, trim: true },
    address: { type: String, trim: true },
    confidence: { type: Number, min: 0, max: 100, default: null },
  },
  { _id: false }
);

const validationResultSchema = new mongoose.Schema(
  {
    ruleName: { type: String, required: true },
    status: { type: String, enum: ['PASSED', 'FAILED', 'WARNING'], required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
  },
  { _id: false }
);

const landRecordSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    owner: {
      type: [ownerSchema],
      default: [],
    },
    landInformation: {
      khasraNo: { type: String, trim: true, index: true },
      khatauniNo: { type: String, trim: true, index: true },
      khewatNo: { type: String, trim: true },
      area: { type: Number, default: 0 },
      areaUnit: { type: String, trim: true, default: 'Acre' },
      landClassification: { type: String, trim: true },
      landUse: { type: String, trim: true },
      boundaries: {
        north: { type: String, trim: true },
        south: { type: String, trim: true },
        east: { type: String, trim: true },
        west: { type: String, trim: true },
      },
    },
    location: {
      state: { type: String, trim: true, index: true },
      district: { type: String, trim: true, index: true },
      tehsil: { type: String, trim: true, index: true },
      village: { type: String, trim: true, index: true },
      revenueCircle: { type: String, trim: true },
    },
    ownership: {
      tenureType: { type: String, trim: true },
      possessoryRights: { type: String, trim: true },
      encumbrances: [{ type: String, trim: true }],
      disputeStatus: { type: String, trim: true, default: 'Clear' },
    },
    mutation: {
      mutationNo: { type: String, trim: true },
      mutationYear: { type: Number },
      mutationType: { type: String, trim: true },
      remarks: { type: String, trim: true },
    },
    registration: {
      registrationNo: { type: String, trim: true },
      volumeNo: { type: String, trim: true },
      pageNo: { type: String, trim: true },
      registrationYear: { type: Number },
      subRegistrarOffice: { type: String, trim: true },
    },
    fieldLevelConfidence: {
      type: Map,
      of: Number,
      default: {},
    },
    validationResults: {
      type: [validationResultSchema],
      default: [],
    },
    overallConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationRemarks: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
landRecordSchema.index({ 'location.district': 1, 'location.tehsil': 1, 'location.village': 1 });
landRecordSchema.index({ verificationStatus: 1, createdAt: -1 });

export const LandRecord = mongoose.model('LandRecord', landRecordSchema, 'land_records');
export default LandRecord;
