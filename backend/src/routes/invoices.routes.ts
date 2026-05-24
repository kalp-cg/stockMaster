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
import { auditMiddleware, AuditAction } from '../middleware/audit.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, requirePermission(Permission.VIEW_REPORTS), getAllInvoices);
router.get('/stats', authenticate, requirePermission(Permission.VIEW_REPORTS), getInvoiceStats);
router.get('/:id', authenticate, requirePermission(Permission.VIEW_REPORTS), getInvoiceById);
router.get('/:id/pdf', authenticate, requirePermission(Permission.VIEW_REPORTS), generateInvoicePDF);
router.post('/', authenticate, requirePermission(Permission.CREATE_INVOICES), auditMiddleware(AuditAction.CREATE, 'Invoice'), createInvoice);
router.patch('/:id', authenticate, requirePermission(Permission.UPDATE_INVOICES), auditMiddleware(AuditAction.UPDATE, 'Invoice'), updateInvoice);
router.delete('/:id', authenticate, requirePermission(Permission.DELETE_INVOICES), auditMiddleware(AuditAction.DELETE, 'Invoice'), deleteInvoice);

export default router;
