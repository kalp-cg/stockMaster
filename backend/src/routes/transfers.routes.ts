import { Router } from 'express';
import { getAllTransfers, createTransfer, getTransfer, applyTransfer } from '../controllers/transfers.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware, AuditAction } from '../middleware/audit.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.VIEW_MOVE_HISTORY), getAllTransfers);
router.post('/', requirePermission(Permission.TRANSFER_STOCK), auditMiddleware(AuditAction.CREATE, 'Transfer'), createTransfer);
router.get('/:id', requirePermission(Permission.VIEW_MOVE_HISTORY), getTransfer);
router.post('/:id/apply', requirePermission(Permission.TRANSFER_STOCK), auditMiddleware(AuditAction.UPDATE, 'Transfer'), applyTransfer);

export default router;
