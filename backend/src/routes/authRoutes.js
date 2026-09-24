import { Router } from 'express';
import authController from '../controllers/authController.js';
import { loginValidator } from '../validators/authValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/login
router.post('/login', authLimiter, loginValidator, authController.login);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

export default router;
