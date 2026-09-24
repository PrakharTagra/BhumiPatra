import { body, validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => `${err.path}: ${err.msg}`).join(', ');
    return sendError(res, `Validation error: ${errorMessages}`, ERROR_CODES.VALIDATION_ERROR, 422);
  }
  next();
};

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address or username is required')
    .isEmail()
    .withMessage('Please provide a valid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest,
];
