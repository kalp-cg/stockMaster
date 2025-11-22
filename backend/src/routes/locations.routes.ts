import { Router } from 'express';
import { getAllLocations, createLocation, getLocation, updateLocation, deleteLocation, getLocationStocks } from '../controllers/locations.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.VIEW_LOCATIONS), getAllLocations);
router.post('/', requirePermission(Permission.CREATE_LOCATIONS), createLocation);
router.get('/:id', requirePermission(Permission.VIEW_LOCATIONS), getLocation);
router.get('/:id/stocks', requirePermission(Permission.VIEW_LOCATIONS), getLocationStocks);
router.put('/:id', requirePermission(Permission.UPDATE_LOCATIONS), updateLocation);
router.delete('/:id', requirePermission(Permission.DELETE_LOCATIONS), deleteLocation);

export default router;
