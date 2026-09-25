import { Router } from 'express';
import documentController from '../controllers/documentController.js';
import { uploadDocumentValidator } from '../validators/documentValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/rbacMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// POST /api/documents/upload (Only Operators and Admins can upload)
router.post(
  '/upload',
  authenticate,
  authorizeRole(ROLES.DIGITIZATION_OPERATOR, ROLES.ADMIN),
  uploadLimiter,
  (req, res, next) => {
    upload.fields([{ name: 'file', maxCount: 1 }, { name: 'document', maxCount: 1 }])(req, res, (err) => {
      if (err) return next(err);
      if (req.files) {
        req.file = req.files['file']?.[0] || req.files['document']?.[0];
      }
      next();
    });
  },
  uploadDocumentValidator,
  documentController.upload
);

// GET /api/documents (All authenticated roles can view list)
router.get('/', authenticate, documentController.getDocuments);

// GET /api/documents/:id (All authenticated roles can inspect)
router.get('/:id', authenticate, documentController.getDocumentById);

// POST /api/documents/:id/process (Operators and Admins can trigger processing)
router.post(
  '/:id/process',
  authenticate,
  authorizeRole(ROLES.DIGITIZATION_OPERATOR, ROLES.ADMIN),
  documentController.triggerProcess
);

// GET /api/documents/:id/status (All authenticated roles can poll status)
router.get('/:id/status', authenticate, documentController.getDocumentStatus);

// POST /api/documents/internal/stage-update (Called by Python Analysis Engine)
router.post('/internal/stage-update', documentController.updateStageInternal);

export default router;
