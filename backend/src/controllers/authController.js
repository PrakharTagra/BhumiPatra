import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES, AUDIT_ACTIONS } from '../config/constants.js';
import auditService from '../services/auditService.js';

export const authController = {
  /**
   * Operator / Officer / Admin Login
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user and explicitly select passwordHash
      const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

      if (!user) {
        return sendError(
          res,
          'Invalid credentials provided. Please check your email and password.',
          ERROR_CODES.INVALID_CREDENTIALS,
          401
        );
      }

      if (!user.isActive) {
        return sendError(
          res,
          'This account has been deactivated. Please contact your system administrator.',
          ERROR_CODES.FORBIDDEN,
          403
        );
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return sendError(
          res,
          'Invalid credentials provided. Please check your email and password.',
          ERROR_CODES.INVALID_CREDENTIALS,
          401
        );
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user._id,
          role: user.role,
          email: user.email,
        },
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN,
        }
      );

      // Audit log user login
      await auditService.log({
        userId: user._id,
        action: AUDIT_ACTIONS.USER_LOGIN,
        entityType: 'USER',
        entityId: user._id,
        description: `User '${user.name}' (${user.role}) logged in successfully.`,
        req,
      });

      const userObject = user.toJSON();

      return sendSuccess(res, {
        token,
        user: userObject,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Current Authenticated Profile
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user._id || req.user.id);
      if (!user) {
        return sendError(res, 'User profile not found.', ERROR_CODES.NOT_FOUND, 404);
      }

      return sendSuccess(res, {
        user: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
