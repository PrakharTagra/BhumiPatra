import { body } from 'express-validator';
import { validateRequest } from './authValidator.js';

export const uploadDocumentValidator = [
  body('documentType')
    .trim()
    .notEmpty()
    .withMessage('Document type is required'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('district')
    .trim()
    .notEmpty()
    .withMessage('District is required'),
  body('tehsil')
    .trim()
    .notEmpty()
    .withMessage('Tehsil is required'),
  body('village')
    .trim()
    .notEmpty()
    .withMessage('Village is required'),
  body('recordYear')
    .notEmpty()
    .withMessage('Record year is required')
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage(`Record year must be a valid year between 1800 and ${new Date().getFullYear()}`),
  validateRequest,
];
