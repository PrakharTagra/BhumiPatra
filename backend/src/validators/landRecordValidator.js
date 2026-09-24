import { body } from 'express-validator';
import { validateRequest } from './authValidator.js';

export const updateLandRecordValidator = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('A valid rationale or reason is required for updating land records'),
  validateRequest,
];

export const actionLandRecordValidator = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('A reason or justification is mandatory for verification action'),
  validateRequest,
];
