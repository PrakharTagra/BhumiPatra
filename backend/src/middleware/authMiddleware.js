import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../config/constants.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(
        res,
        'Authentication required. Please provide a valid Bearer token.',
        ERROR_CODES.AUTH_REQUIRED,
        401
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return sendError(res, 'Session token has expired. Please sign in again.', ERROR_CODES.TOKEN_EXPIRED, 401);
      }
      return sendError(res, 'Invalid authentication token.', ERROR_CODES.AUTH_REQUIRED, 401);
    }

    const user = await User.findById(decoded.id).select('+passwordHash');
    if (!user) {
      return sendError(res, 'Authenticated user account no longer exists.', ERROR_CODES.AUTH_REQUIRED, 401);
    }

    if (!user.isActive) {
      return sendError(res, 'This operator account has been deactivated.', ERROR_CODES.FORBIDDEN, 403);
    }

    // Attach user without passwordHash
    const userObj = user.toJSON();
    req.user = userObj;
    req.userId = user._id;

    next();
  } catch (error) {
    return sendError(res, 'Authentication failed.', ERROR_CODES.AUTH_REQUIRED, 401);
  }
};

export default authenticate;
