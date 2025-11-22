import { Router } from 'express';
import {
    getStockReport,
    getSalesReport,
    getPurchaseReport,
    getInventoryMovementReport,
    getProfitLossReport,
    getActivityReport
} from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/stock', authenticate, requirePermission(Permission.VIEW_REPORTS), getStockReport);
router.get('/sales', authenticate, requirePermission(Permission.VIEW_REPORTS), getSalesReport);
router.get('/purchases', authenticate, requirePermission(Permission.VIEW_REPORTS), getPurchaseReport);
router.get('/movements', authenticate, requirePermission(Permission.VIEW_REPORTS), getInventoryMovementReport);
router.get('/profit-loss', authenticate, requirePermission(Permission.VIEW_REPORTS), getProfitLossReport);
router.get('/activity', authenticate, requirePermission(Permission.VIEW_REPORTS), getActivityReport);

export default router;
