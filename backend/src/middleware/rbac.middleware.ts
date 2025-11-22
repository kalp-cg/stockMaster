import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export enum Permission {
    // Products
    VIEW_PRODUCTS = 'VIEW_PRODUCTS',
    CREATE_PRODUCTS = 'CREATE_PRODUCTS',
    UPDATE_PRODUCTS = 'UPDATE_PRODUCTS',
    DELETE_PRODUCTS = 'DELETE_PRODUCTS',

    // Locations
    VIEW_LOCATIONS = 'VIEW_LOCATIONS',
    CREATE_LOCATIONS = 'CREATE_LOCATIONS',
    UPDATE_LOCATIONS = 'UPDATE_LOCATIONS',
    DELETE_LOCATIONS = 'DELETE_LOCATIONS',

    // Vendors
    VIEW_VENDORS = 'VIEW_VENDORS',
    CREATE_VENDORS = 'CREATE_VENDORS',
    UPDATE_VENDORS = 'UPDATE_VENDORS',
    DELETE_VENDORS = 'DELETE_VENDORS',

    // Receipts
    VIEW_RECEIPTS = 'VIEW_RECEIPTS',
    CREATE_RECEIPTS = 'CREATE_RECEIPTS',
    VALIDATE_RECEIPTS = 'VALIDATE_RECEIPTS',

    // Deliveries
    VIEW_DELIVERIES = 'VIEW_DELIVERIES',
    CREATE_DELIVERIES = 'CREATE_DELIVERIES',
    VALIDATE_DELIVERIES = 'VALIDATE_DELIVERIES',

    // Stock Operations
    TRANSFER_STOCK = 'TRANSFER_STOCK',
    ADJUST_STOCK = 'ADJUST_STOCK',
    VIEW_MOVE_HISTORY = 'VIEW_MOVE_HISTORY',

    // Dashboard
    VIEW_DASHBOARD = 'VIEW_DASHBOARD',

    // Reports & Invoices
    VIEW_REPORTS = 'VIEW_REPORTS',
    CREATE_INVOICES = 'CREATE_INVOICES',
    UPDATE_INVOICES = 'UPDATE_INVOICES',
    DELETE_INVOICES = 'DELETE_INVOICES',

    // Users (Admin only)
    MANAGE_USERS = 'MANAGE_USERS',
    VIEW_USERS = 'VIEW_USERS',

    // Settings (Admin only)
    MANAGE_SETTINGS = 'MANAGE_SETTINGS',

    // Payments
    VIEW_PAYMENTS = 'VIEW_PAYMENTS',
    CREATE_PAYMENTS = 'CREATE_PAYMENTS',
    UPDATE_PAYMENTS = 'UPDATE_PAYMENTS',
    DELETE_PAYMENTS = 'DELETE_PAYMENTS',

    // Audit
    VIEW_AUDIT = 'VIEW_AUDIT',
}

const rolePermissions: Record<string, Permission[]> = {
    // ADMIN - Full system access
    ADMIN: Object.values(Permission),

    // INVENTORY_MANAGER - Operations & reporting, no user/settings management
    INVENTORY_MANAGER: [
        // Products - Full CRUD
        Permission.VIEW_PRODUCTS,
        Permission.CREATE_PRODUCTS,
        Permission.UPDATE_PRODUCTS,
        Permission.DELETE_PRODUCTS,
        
        // Locations - View only (cannot create/edit/delete)
        Permission.VIEW_LOCATIONS,
        
        // Vendors - Full CRUD
        Permission.VIEW_VENDORS,
        Permission.CREATE_VENDORS,
        Permission.UPDATE_VENDORS,
        Permission.DELETE_VENDORS,
        
        // Receipts - Create, Edit, Validate
        Permission.VIEW_RECEIPTS,
        Permission.CREATE_RECEIPTS,
        Permission.VALIDATE_RECEIPTS,
        
        // Deliveries - Create, Edit, Validate
        Permission.VIEW_DELIVERIES,
        Permission.CREATE_DELIVERIES,
        Permission.VALIDATE_DELIVERIES,
        
        // Transfers - Create & Validate
        Permission.TRANSFER_STOCK,
        
        // Stock Adjustments - With reason required
        Permission.ADJUST_STOCK,
        
        // History & Reports
        Permission.VIEW_MOVE_HISTORY,
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_REPORTS,
        
        // Invoices
        Permission.CREATE_INVOICES,
        Permission.UPDATE_INVOICES,
        Permission.DELETE_INVOICES,
        
        // Payments
        Permission.VIEW_PAYMENTS,
        Permission.CREATE_PAYMENTS,
        Permission.UPDATE_PAYMENTS,
        
        // Users - View only
        Permission.VIEW_USERS,
        
        // Audit
        Permission.VIEW_AUDIT,
    ],

    // STAFF - Execution level, draft creation only
    STAFF: [
        // Products - View only
        Permission.VIEW_PRODUCTS,
        
        // Locations - View only
        Permission.VIEW_LOCATIONS,
        
        // Vendors - View only
        Permission.VIEW_VENDORS,
        
        // Receipts - Create drafts only (cannot validate)
        Permission.VIEW_RECEIPTS,
        Permission.CREATE_RECEIPTS,
        
        // Deliveries - Process picking/packing (cannot validate)
        Permission.VIEW_DELIVERIES,
        Permission.CREATE_DELIVERIES,
        
        // History - View own actions only
        Permission.VIEW_MOVE_HISTORY,
        
        // Dashboard - Basic metrics
        Permission.VIEW_DASHBOARD,
        
        // Reports - View only
        Permission.VIEW_REPORTS,
    ],
};

export function requirePermission(permission: Permission) {
    return (req: Request, res: Response, next: NextFunction) => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const userRole = authReq.user.role;
        const permissions = rolePermissions[userRole] || [];

        if (!permissions.includes(permission)) {
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            return;
        }

        next();
    };
}