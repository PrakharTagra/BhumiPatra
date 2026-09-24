import logger from '../utils/logger.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`[Error Handler] ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    name: err.name,
  });

  // 1. Multer File Upload Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(
        res,
        'File size exceeds the allowable limit of 50MB.',
        ERROR_CODES.FILE_ERROR,
        400
      );
    }
    return sendError(res, `Upload error: ${err.message}`, ERROR_CODES.FILE_ERROR, 400);
  }

  // 2. Custom File Filter Errors
  if (err.message && err.message.includes('Invalid file format')) {
    return sendError(res, err.message, ERROR_CODES.FILE_ERROR, 400);
  }

  // 3. Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(
      res,
      `Validation failed: ${messages.join(', ')}`,
      ERROR_CODES.VALIDATION_ERROR,
      422
    );
  }

  // 4. Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    return sendError(
      res,
      `A record with this ${field} already exists.`,
      ERROR_CODES.VALIDATION_ERROR,
      409
    );
  }

  // 5. Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(
      res,
      `Resource identifier format is invalid for field '${err.path}'.`,
      ERROR_CODES.NOT_FOUND,
      404
    );
  }

  // 6. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token.', ERROR_CODES.AUTH_REQUIRED, 401);
  }

  // 7. General Server Error (Never expose stack trace to client!)
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred. Please contact the administrator.'
      : err.message || 'Internal server error';

  return sendError(res, message, err.code || ERROR_CODES.SERVER_ERROR, statusCode);
};

export const notFoundHandler = (req, res) => {
  return sendError(
    res,
    `Cannot ${req.method} endpoint '${req.originalUrl}'. Resource not found.`,
    ERROR_CODES.NOT_FOUND,
    404
  );
};
