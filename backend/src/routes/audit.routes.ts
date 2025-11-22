import { Router } from 'express';
import {
    getAllAuditLogs,
    getAuditLogById,
    getAuditStats,
    getUserAuditLogs,
    getEntityAuditLogs,
    deleteOldAuditLogs
} from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requirePermission(Permission.MANAGE_USERS), getAllAuditLogs);
router.get('/stats', authenticate, requirePermission(Permission.MANAGE_USERS), getAuditStats);
router.get('/user/:userId', authenticate, requirePermission(Permission.MANAGE_USERS), getUserAuditLogs);
router.get('/entity/:entity', authenticate, requirePermission(Permission.MANAGE_USERS), getEntityAuditLogs);
router.get('/entity/:entity/:entityId', authenticate, requirePermission(Permission.MANAGE_USERS), getEntityAuditLogs);
router.get('/:id', authenticate, requirePermission(Permission.MANAGE_USERS), getAuditLogById);
router.delete('/cleanup', authenticate, requirePermission(Permission.MANAGE_USERS), deleteOldAuditLogs);

export default router;
