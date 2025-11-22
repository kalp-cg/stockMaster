import { Router } from 'express';
import { getAllProducts, createProduct, getProduct, updateProduct, deleteProduct } from '../controllers/products.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate); // Protect all product routes

router.get('/', requirePermission(Permission.VIEW_PRODUCTS), getAllProducts);
router.post('/', requirePermission(Permission.CREATE_PRODUCTS), createProduct);
router.get('/:id', requirePermission(Permission.VIEW_PRODUCTS), getProduct);
router.put('/:id', requirePermission(Permission.UPDATE_PRODUCTS), updateProduct);
router.delete('/:id', requirePermission(Permission.DELETE_PRODUCTS), deleteProduct);

export default router;
