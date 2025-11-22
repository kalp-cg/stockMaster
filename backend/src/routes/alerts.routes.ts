import { Router } from 'express';
import {
    getAllAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert,
    checkAndGenerateAlerts,
    getAlertStats
} from '../controllers/alerts.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requirePermission(Permission.VIEW_REPORTS), getAllAlerts);
router.get('/stats', authenticate, requirePermission(Permission.VIEW_REPORTS), getAlertStats);
router.post('/check', authenticate, requirePermission(Permission.VIEW_REPORTS), checkAndGenerateAlerts);
router.patch('/:id/read', authenticate, requirePermission(Permission.VIEW_REPORTS), markAlertAsRead);
router.patch('/read-all', authenticate, requirePermission(Permission.VIEW_REPORTS), markAllAlertsAsRead);
router.delete('/:id', authenticate, requirePermission(Permission.VIEW_REPORTS), deleteAlert);

export default router;
