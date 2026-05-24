import { Router } from 'express';
import { getAllReceipts, createReceipt, getReceipt, validateReceipt } from '../controllers/receipts.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware, AuditAction } from '../middleware/audit.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.VIEW_RECEIPTS), getAllReceipts);
router.post('/', requirePermission(Permission.CREATE_RECEIPTS), auditMiddleware(AuditAction.CREATE, 'Receipt'), createReceipt);
router.get('/:id', requirePermission(Permission.VIEW_RECEIPTS), getReceipt);
router.post('/:id/validate', requirePermission(Permission.VALIDATE_RECEIPTS), auditMiddleware(AuditAction.UPDATE, 'Receipt'), validateReceipt);

export default router;
