import { Router } from 'express';
import { getAllDeliveries, createDelivery, getDelivery, validateDelivery } from '../controllers/deliveries.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(Permission.VIEW_DELIVERIES), getAllDeliveries);
router.post('/', requirePermission(Permission.CREATE_DELIVERIES), createDelivery);
router.get('/:id', requirePermission(Permission.VIEW_DELIVERIES), getDelivery);
router.post('/:id/validate', requirePermission(Permission.VALIDATE_DELIVERIES), validateDelivery);

export default router;
