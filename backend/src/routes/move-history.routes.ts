import { Router } from 'express';
import { getMoveHistory } from '../controllers/move-history.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.VIEW_MOVE_HISTORY), getMoveHistory);

export default router;
