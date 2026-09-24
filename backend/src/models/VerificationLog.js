import mongoose from 'mongoose';
import { VERIFICATION_ACTIONS } from '../config/constants.js';

const verificationLogSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    landRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LandRecord',
      required: true,
      index: true,
    },
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(VERIFICATION_ACTIONS),
      required: true,
      index: true,
    },
    field: {
      type: String,
      trim: true,
      default: null,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      required: [true, 'Verification rationale or reason is required'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

verificationLogSchema.index({ landRecordId: 1, createdAt: -1 });

export const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema, 'verification_logs');
export default VerificationLog;
