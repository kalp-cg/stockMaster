import { Router } from 'express';
import {
    getAllSettings,
    getSetting,
    updateSetting,
    updateMultipleSettings,
    deleteSetting,
    getCompanyInfo,
    updateCompanyInfo,
    initializeDefaultSettings
} from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware, AuditAction } from '../middleware/audit.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

// Settings routes
router.get('/settings', authenticate, requirePermission(Permission.MANAGE_USERS), getAllSettings);
router.get('/settings/:key', authenticate, requirePermission(Permission.MANAGE_USERS), getSetting);
router.put('/settings/:key', authenticate, requirePermission(Permission.MANAGE_USERS), auditMiddleware(AuditAction.UPDATE, 'SystemSetting'), updateSetting);
router.post('/settings/bulk', authenticate, requirePermission(Permission.MANAGE_USERS), auditMiddleware(AuditAction.UPDATE, 'SystemSetting'), updateMultipleSettings);
router.delete('/settings/:key', authenticate, requirePermission(Permission.MANAGE_USERS), auditMiddleware(AuditAction.DELETE, 'SystemSetting'), deleteSetting);
router.post('/settings/initialize', authenticate, requirePermission(Permission.MANAGE_USERS), auditMiddleware(AuditAction.CREATE, 'SystemSetting'), initializeDefaultSettings);

// Company info routes
router.get('/company', authenticate, getCompanyInfo);
router.put('/company', authenticate, requirePermission(Permission.MANAGE_USERS), auditMiddleware(AuditAction.UPDATE, 'CompanyInfo'), updateCompanyInfo);

export default router;
