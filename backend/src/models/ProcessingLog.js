import mongoose from 'mongoose';
import { PIPELINE_STAGES } from '../config/constants.js';

const processingLogSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    stage: {
      type: String,
      enum: Object.values(PIPELINE_STAGES),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['STARTED', 'IN_PROGRESS', 'SUCCESS', 'FAILED'],
      required: true,
    },
    engine: {
      type: String,
      trim: true,
      default: 'BhumiPatra-Pipeline-Engine',
    },
    processingTime: {
      type: Number, // In milliseconds
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

processingLogSchema.index({ documentId: 1, createdAt: 1 });

export const ProcessingLog = mongoose.model('ProcessingLog', processingLogSchema, 'processing_logs');
export default ProcessingLog;
