import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

export const auditService = {
  /**
   * Log an administrative or operational action
   */
  async log({ userId = null, action, entityType, entityId, description, req = null }) {
    try {
      const ipAddress = req ? req.ip || req.connection?.remoteAddress : null;
      const userAgent = req ? req.get('user-agent') : null;

      await AuditLog.create({
        userId,
        action,
        entityType,
        entityId,
        description,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
    } catch (err) {
      // Never let audit logging fail the primary user request, but log diagnostic
      logger.error(`Audit logging failed for action [${action}]: ${err.message}`);
    }
  },
};

export default auditService;
