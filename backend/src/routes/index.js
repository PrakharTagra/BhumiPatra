import { Router } from 'express';
import authRoutes from './authRoutes.js';
import documentRoutes from './documentRoutes.js';
import landRecordRoutes from './landRecordRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'BhumiPatra Land Record Digitization & Validation API',
    timestamp: new Date().toISOString(),
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/land-records', landRecordRoutes);
router.use('/admin', adminRoutes);

export default router;
