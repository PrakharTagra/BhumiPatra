import { body } from 'express-validator';
import { validateRequest } from './authValidator.js';

export const updateLandRecordValidator = [
  body().custom((value, { req }) => {
    const reason = req.body.reason || req.body.remarks;
    if (!reason || !reason.trim()) {
      throw new Error('A valid rationale or reason is required for updating land records');
    }
    return true;
  }),
  validateRequest,
];

export const actionLandRecordValidator = [
  body().custom((value, { req }) => {
    // If reject or send-back, reason is required. For approve, remarks/reason is optional.
    const isApprove = req.originalUrl?.includes('/approve');
    const reason = req.body.reason || req.body.remarks;
    if (!isApprove && (!reason || !reason.trim())) {
      throw new Error('A reason or justification is mandatory for this verification action');
    }
    return true;
  }),
  validateRequest,
];
