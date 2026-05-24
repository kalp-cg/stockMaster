import { Router } from 'express';
import { getAllAdjustments, createAdjustment } from '../controllers/adjustments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware, AuditAction } from '../middleware/audit.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.VIEW_MOVE_HISTORY), getAllAdjustments);
router.post('/', requirePermission(Permission.ADJUST_STOCK), auditMiddleware(AuditAction.CREATE, 'Adjustment'), createAdjustment);

export default router;
