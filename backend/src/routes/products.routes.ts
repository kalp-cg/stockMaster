import { Router } from 'express';
import { getAllProducts, createProduct, getProduct, updateProduct, deleteProduct } from '../controllers/products.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware, AuditAction } from '../middleware/audit.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate); // Protect all product routes

router.get('/', requirePermission(Permission.VIEW_PRODUCTS), getAllProducts);
router.post('/', requirePermission(Permission.CREATE_PRODUCTS), auditMiddleware(AuditAction.CREATE, 'Product'), createProduct);
router.get('/:id', requirePermission(Permission.VIEW_PRODUCTS), getProduct);
router.put('/:id', requirePermission(Permission.UPDATE_PRODUCTS), auditMiddleware(AuditAction.UPDATE, 'Product'), updateProduct);
router.delete('/:id', requirePermission(Permission.DELETE_PRODUCTS), auditMiddleware(AuditAction.DELETE, 'Product'), deleteProduct);

export default router;
