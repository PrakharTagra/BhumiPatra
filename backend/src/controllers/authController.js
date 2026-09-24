import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import env from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ERROR_CODES, AUDIT_ACTIONS, ROLES } from '../config/constants.js';
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

      return res.status(200).json({
        success: true,
        token,
        user: userObject,
        data: {
          token,
          user: userObject,
        },
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

      const userObject = user.toJSON();
      return res.status(200).json({
        success: true,
        user: userObject,
        data: {
          user: userObject,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * User Logout
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      if (req.user) {
        await auditService.log({
          userId: req.user._id || req.user.id,
          action: AUDIT_ACTIONS.USER_LOGOUT,
          entityType: 'USER',
          entityId: req.user._id || req.user.id,
          description: `User logged out.`,
          req,
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Initial Setup for Administrator
   * POST /api/auth/setup
   * Only permitted when zero users exist in the database.
   */
  async setupInitialAdmin(req, res, next) {
    try {
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        return sendError(
          res,
          'System setup has already been completed. An administrator account already exists. Please log in through the Administrator Portal.',
          ERROR_CODES.FORBIDDEN,
          403
        );
      }

      const { name, email, password, department, state, district, tehsil } = req.body;

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const adminUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: ROLES.ADMIN,
        department: department || 'Land Records & Revenue Department',
        state: state || 'Uttar Pradesh',
        district: district || 'Lucknow',
        tehsil: tehsil || 'Sadar',
        isActive: true,
      });

      const token = jwt.sign(
        {
          id: adminUser._id,
          role: adminUser.role,
          email: adminUser.email,
        },
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN,
        }
      );

      await auditService.log({
        userId: adminUser._id,
        action: AUDIT_ACTIONS.USER_CREATED,
        entityType: 'USER',
        entityId: adminUser._id,
        description: `Initial Administrator '${adminUser.name}' bootstrapped the system.`,
        req,
      });

      const userObject = adminUser.toJSON();

      return res.status(201).json({
        success: true,
        message: 'Initial administrator account created successfully.',
        token,
        user: userObject,
        data: {
          token,
          user: userObject,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default authController;

