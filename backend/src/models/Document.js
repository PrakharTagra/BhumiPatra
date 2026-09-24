import mongoose from 'mongoose';
import { PROCESSING_STATUS, VERIFICATION_STATUS } from '../config/constants.js';

const documentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    storageKey: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true,
    },
    tehsil: {
      type: String,
      required: [true, 'Tehsil is required'],
      trim: true,
      index: true,
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
      trim: true,
      index: true,
    },
    recordYear: {
      type: Number,
      required: [true, 'Record year is required'],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    processingStatus: {
      type: String,
      enum: Object.values(PROCESSING_STATUS),
      default: PROCESSING_STATUS.PENDING,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
      index: true,
    },
    overallConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching and filtering
documentSchema.index({ district: 1, tehsil: 1, village: 1 });
documentSchema.index({ processingStatus: 1, createdAt: -1 });
documentSchema.index({ verificationStatus: 1, createdAt: -1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });

export const Document = mongoose.model('Document', documentSchema);
export default Document;
