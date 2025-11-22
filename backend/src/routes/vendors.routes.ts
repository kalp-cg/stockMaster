import { Router } from 'express';
import { getAllVendors, createVendor, getVendor, updateVendor, deleteVendor } from '../controllers/vendors.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.VIEW_VENDORS), getAllVendors);
router.post('/', requirePermission(Permission.CREATE_VENDORS), createVendor);
router.get('/:id', requirePermission(Permission.VIEW_VENDORS), getVendor);
router.put('/:id', requirePermission(Permission.UPDATE_VENDORS), updateVendor);
router.delete('/:id', requirePermission(Permission.DELETE_VENDORS), deleteVendor);

export default router;
