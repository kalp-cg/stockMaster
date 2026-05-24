import { Router } from 'express';
import { getAllLocations, createLocation, getLocation, updateLocation, deleteLocation, getLocationStocks } from '../controllers/locations.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware, AuditAction } from '../middleware/audit.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.VIEW_LOCATIONS), getAllLocations);
router.post('/', requirePermission(Permission.CREATE_LOCATIONS), auditMiddleware(AuditAction.CREATE, 'Location'), createLocation);
router.get('/:id', requirePermission(Permission.VIEW_LOCATIONS), getLocation);
router.get('/:id/stocks', requirePermission(Permission.VIEW_LOCATIONS), getLocationStocks);
router.put('/:id', requirePermission(Permission.UPDATE_LOCATIONS), auditMiddleware(AuditAction.UPDATE, 'Location'), updateLocation);
router.delete('/:id', requirePermission(Permission.DELETE_LOCATIONS), auditMiddleware(AuditAction.DELETE, 'Location'), deleteLocation);

export default router;
