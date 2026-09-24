/**
 * Standardized API response utilities for BhumiPatra
 */

/**
 * Send standard success response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {number} statusCode
 * @param {object|null} pagination
 */
export const sendSuccess = (res, data = {}, statusCode = 200, pagination = null) => {
  const payload = {
    success: true,
    data,
  };

  if (pagination) {
    payload.pagination = {
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || 20,
      total: Number(pagination.total) || 0,
      pages: Number(pagination.pages) || 0,
    };
  }

  return res.status(statusCode).json(payload);
};

/**
 * Send standard error response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {string} code
 * @param {number} statusCode
 */
export const sendError = (res, message = 'An error occurred', code = 'ERROR', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};
