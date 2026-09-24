import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many requests generated from this IP. Please try again after 15 minutes.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429
    );
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 authentication attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many failed login attempts. Account temporarily locked for 15 minutes.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429
    );
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 document uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Upload rate limit exceeded. Please wait a few minutes before submitting additional scans.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429
    );
  },
});
