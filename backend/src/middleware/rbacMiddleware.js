import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Reusable Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles
 */
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'Access denied: User session has no assigned role.', ERROR_CODES.FORBIDDEN, 403);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied: Required role (${allowedRoles.join(' or ')}) not granted to your account (${req.user.role}).`,
        ERROR_CODES.FORBIDDEN,
        403
      );
    }

    next();
  };
};

export default authorizeRole;
