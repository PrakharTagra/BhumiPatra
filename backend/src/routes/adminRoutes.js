import { Router } from 'express';
import adminController from '../controllers/adminController.js';
import { createUserValidator, patchUserStatusValidator } from '../validators/adminValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// All admin routes strictly require ADMIN role
router.use(authenticate, authorizeRole(ROLES.ADMIN));

// GET /api/admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// GET /api/admin/analytics
router.get('/analytics', adminController.getAnalytics);

// GET /api/admin/users
router.get('/users', adminController.getUsers);

// POST /api/admin/users
router.post('/users', createUserValidator, adminController.createUser);

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', patchUserStatusValidator, adminController.patchUserStatus);

// GET /api/admin/documents
router.get('/documents', adminController.getDocuments);

// GET /api/admin/audit-logs
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
