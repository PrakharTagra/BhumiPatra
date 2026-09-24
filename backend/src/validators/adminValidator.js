import { body } from 'express-validator';
import { validateRequest } from './authValidator.js';
import { ROLES } from '../config/constants.js';

export const createUserValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('User name is required')
    .isLength({ max: 100 }),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  validateRequest,
];

export const patchUserStatusValidator = [
  body().custom((value, { req }) => {
    if (req.body.isActive === undefined && req.body.status === undefined) {
      throw new Error('Either status ("ACTIVE" / "INACTIVE") or isActive boolean field is required.');
    }
    return true;
  }),
  validateRequest,
];
