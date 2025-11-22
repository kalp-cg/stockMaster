import { Router } from 'express';
import { createUser, getAllUsers, getUser, updateUser, deleteUser, getMyStaff } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/staff', getMyStaff); // For inventory managers to see their staff
router.post('/', requirePermission(Permission.MANAGE_USERS), createUser);
router.get('/', requirePermission(Permission.MANAGE_USERS), getAllUsers);
router.get('/:id', requirePermission(Permission.MANAGE_USERS), getUser);
router.put('/:id', requirePermission(Permission.MANAGE_USERS), updateUser);
router.delete('/:id', requirePermission(Permission.MANAGE_USERS), deleteUser);

export default router;