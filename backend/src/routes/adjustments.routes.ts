import { Router } from 'express';
import { getAllAdjustments, createAdjustment } from '../controllers/adjustments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.VIEW_MOVE_HISTORY), getAllAdjustments);
router.post('/', requirePermission(Permission.ADJUST_STOCK), createAdjustment);

export default router;
