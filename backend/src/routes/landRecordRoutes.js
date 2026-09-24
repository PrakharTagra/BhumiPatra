import { Router } from 'express';
import landRecordController from '../controllers/landRecordController.js';
import { updateLandRecordValidator, actionLandRecordValidator } from '../validators/landRecordValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// GET /api/land-records (All authenticated users can list land records)
router.get('/', authenticate, landRecordController.getLandRecords);

// GET /api/land-records/pending (Verification Officers & Admins only)
router.get(
  '/pending',
  authenticate,
  authorizeRole(ROLES.VERIFICATION_OFFICER, ROLES.ADMIN),
  landRecordController.getPending
);

// GET /api/land-records/:id (Inspect single land record)
router.get('/:id', authenticate, landRecordController.getLandRecordById);

// PUT /api/land-records/:id (Edit field by Verification Officer & Admin)
router.put(
  '/:id',
  authenticate,
  authorizeRole(ROLES.VERIFICATION_OFFICER, ROLES.ADMIN),
  updateLandRecordValidator,
  landRecordController.updateLandRecord
);

// POST /api/land-records/:id/approve (Verification Officer & Admin)
router.post(
  '/:id/approve',
  authenticate,
  authorizeRole(ROLES.VERIFICATION_OFFICER, ROLES.ADMIN),
  actionLandRecordValidator,
  landRecordController.approve
);

// POST /api/land-records/:id/reject (Verification Officer & Admin)
router.post(
  '/:id/reject',
  authenticate,
  authorizeRole(ROLES.VERIFICATION_OFFICER, ROLES.ADMIN),
  actionLandRecordValidator,
  landRecordController.reject
);

// POST /api/land-records/:id/send-back (Verification Officer & Admin)
router.post(
  '/:id/send-back',
  authenticate,
  authorizeRole(ROLES.VERIFICATION_OFFICER, ROLES.ADMIN),
  actionLandRecordValidator,
  landRecordController.sendBack
);

// GET /api/land-records/:id/verification-history (Audit trail of modifications)
router.get('/:id/verification-history', authenticate, landRecordController.getVerificationHistory);

export default router;
