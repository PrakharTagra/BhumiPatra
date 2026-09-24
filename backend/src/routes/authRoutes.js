import { Router } from 'express';
import authController from '../controllers/authController.js';
import { loginValidator, setupValidator } from '../validators/authValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/setup - Initial bootstrap admin (allowed only when 0 users exist)
router.post('/setup', authLimiter, setupValidator, authController.setupInitialAdmin);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidator, authController.login);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  // Allow logout even if token expired
  if (req.headers.authorization) {
    return authenticate(req, res, () => authController.logout(req, res, next));
  }
  return authController.logout(req, res, next);
});

export default router;

