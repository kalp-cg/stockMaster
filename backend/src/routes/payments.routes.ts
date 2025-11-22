import { Router } from 'express';
import {
    getAllPayments,
    getPaymentById,
    createPayment,
    deletePayment,
    getPaymentStats,
    getInvoicePayments
} from '../controllers/payments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requirePermission(Permission.VIEW_REPORTS), getAllPayments);
router.get('/stats', authenticate, requirePermission(Permission.VIEW_REPORTS), getPaymentStats);
router.get('/invoice/:invoiceId', authenticate, requirePermission(Permission.VIEW_REPORTS), getInvoicePayments);
router.get('/:id', authenticate, requirePermission(Permission.VIEW_REPORTS), getPaymentById);
router.post('/', authenticate, requirePermission(Permission.CREATE_INVOICES), createPayment);
router.delete('/:id', authenticate, requirePermission(Permission.DELETE_INVOICES), deletePayment);

export default router;
