import { Router } from 'express';
import {
    getAllInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoicePDF,
    getInvoiceStats
} from '../controllers/invoices.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requirePermission(Permission.VIEW_REPORTS), getAllInvoices);
router.get('/stats', authenticate, requirePermission(Permission.VIEW_REPORTS), getInvoiceStats);
router.get('/:id', authenticate, requirePermission(Permission.VIEW_REPORTS), getInvoiceById);
router.get('/:id/pdf', authenticate, requirePermission(Permission.VIEW_REPORTS), generateInvoicePDF);
router.post('/', authenticate, requirePermission(Permission.CREATE_INVOICES), createInvoice);
router.patch('/:id', authenticate, requirePermission(Permission.UPDATE_INVOICES), updateInvoice);
router.delete('/:id', authenticate, requirePermission(Permission.DELETE_INVOICES), deleteInvoice);

export default router;
