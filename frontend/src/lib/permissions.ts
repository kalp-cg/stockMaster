// Role-Based Access Control (RBAC) for Frontend
export enum UserRole {
    ADMIN = 'ADMIN',
    INVENTORY_MANAGER = 'INVENTORY_MANAGER',
    STAFF = 'STAFF'
}

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

    // Users
    MANAGE_USERS = 'MANAGE_USERS',
    VIEW_USERS = 'VIEW_USERS',

    // Settings
    MANAGE_SETTINGS = 'MANAGE_SETTINGS',

    // Payments
    VIEW_PAYMENTS = 'VIEW_PAYMENTS',
    CREATE_PAYMENTS = 'CREATE_PAYMENTS',
    UPDATE_PAYMENTS = 'UPDATE_PAYMENTS',
    DELETE_PAYMENTS = 'DELETE_PAYMENTS',

    // Audit
    VIEW_AUDIT = 'VIEW_AUDIT',
}

const rolePermissions: Record<UserRole, Permission[]> = {
    [UserRole.ADMIN]: Object.values(Permission),

    [UserRole.INVENTORY_MANAGER]: [
        Permission.VIEW_PRODUCTS,
        Permission.CREATE_PRODUCTS,
        Permission.UPDATE_PRODUCTS,
        Permission.DELETE_PRODUCTS,
        Permission.VIEW_LOCATIONS,
        Permission.VIEW_VENDORS,
        Permission.CREATE_VENDORS,
        Permission.UPDATE_VENDORS,
        Permission.DELETE_VENDORS,
        Permission.VIEW_RECEIPTS,
        Permission.CREATE_RECEIPTS,
        Permission.VALIDATE_RECEIPTS,
        Permission.VIEW_DELIVERIES,
        Permission.CREATE_DELIVERIES,
        Permission.VALIDATE_DELIVERIES,
        Permission.TRANSFER_STOCK,
        Permission.ADJUST_STOCK,
        Permission.VIEW_MOVE_HISTORY,
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_REPORTS,
        Permission.CREATE_INVOICES,
        Permission.UPDATE_INVOICES,
        Permission.DELETE_INVOICES,
        Permission.VIEW_PAYMENTS,
        Permission.CREATE_PAYMENTS,
        Permission.UPDATE_PAYMENTS,
        Permission.VIEW_USERS,
        Permission.VIEW_AUDIT,
    ],

    [UserRole.STAFF]: [
        Permission.VIEW_PRODUCTS,
        Permission.VIEW_LOCATIONS,
        Permission.VIEW_VENDORS,
        Permission.VIEW_RECEIPTS,
        Permission.CREATE_RECEIPTS,
        Permission.VIEW_DELIVERIES,
        Permission.CREATE_DELIVERIES,
        Permission.VIEW_MOVE_HISTORY,
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_REPORTS,
    ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: string | undefined, permission: Permission): boolean {
    if (!userRole) return false;
    const role = userRole as UserRole;
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
}

/**
 * Check if a user can perform any of the listed permissions
 */
export function hasAnyPermission(userRole: string | undefined, permissions: Permission[]): boolean {
    if (!userRole) return false;
    return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user can perform all of the listed permissions
 */
export function hasAllPermissions(userRole: string | undefined, permissions: Permission[]): boolean {
    if (!userRole) return false;
    return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(userRole: string | undefined): Permission[] {
    if (!userRole) return [];
    const role = userRole as UserRole;
    return rolePermissions[role] || [];
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: string | undefined): boolean {
    return userRole === UserRole.ADMIN;
}

/**
 * Check if user is inventory manager
 */
export function isInventoryManager(userRole: string | undefined): boolean {
    return userRole === UserRole.INVENTORY_MANAGER;
}

/**
 * Check if user is staff
 */
export function isStaff(userRole: string | undefined): boolean {
    return userRole === UserRole.STAFF;
}

/**
 * Get user role label
 */
export function getRoleLabel(userRole: string | undefined): string {
    switch (userRole) {
        case UserRole.ADMIN:
            return '🔒 Administrator';
        case UserRole.INVENTORY_MANAGER:
            return '📊 Inventory Manager';
        case UserRole.STAFF:
            return '👤 Warehouse Staff';
        default:
            return 'Unknown Role';
    }
}

/**
 * Get permissions description by feature area
 */
export const featurePermissions = {
    products: {
        view: Permission.VIEW_PRODUCTS,
        create: Permission.CREATE_PRODUCTS,
        edit: Permission.UPDATE_PRODUCTS,
        delete: Permission.DELETE_PRODUCTS,
    },
    locations: {
        view: Permission.VIEW_LOCATIONS,
        create: Permission.CREATE_LOCATIONS,
        edit: Permission.UPDATE_LOCATIONS,
        delete: Permission.DELETE_LOCATIONS,
    },
    vendors: {
        view: Permission.VIEW_VENDORS,
        create: Permission.CREATE_VENDORS,
        edit: Permission.UPDATE_VENDORS,
        delete: Permission.DELETE_VENDORS,
    },
    receipts: {
        view: Permission.VIEW_RECEIPTS,
        create: Permission.CREATE_RECEIPTS,
        validate: Permission.VALIDATE_RECEIPTS,
    },
    deliveries: {
        view: Permission.VIEW_DELIVERIES,
        create: Permission.CREATE_DELIVERIES,
        validate: Permission.VALIDATE_DELIVERIES,
    },
    stock: {
        transfer: Permission.TRANSFER_STOCK,
        adjust: Permission.ADJUST_STOCK,
        viewHistory: Permission.VIEW_MOVE_HISTORY,
    },
    invoices: {
        create: Permission.CREATE_INVOICES,
        edit: Permission.UPDATE_INVOICES,
        delete: Permission.DELETE_INVOICES,
    },
    payments: {
        view: Permission.VIEW_PAYMENTS,
        create: Permission.CREATE_PAYMENTS,
        edit: Permission.UPDATE_PAYMENTS,
        delete: Permission.DELETE_PAYMENTS,
    },
    users: {
        manage: Permission.MANAGE_USERS,
        view: Permission.VIEW_USERS,
    },
    settings: {
        manage: Permission.MANAGE_SETTINGS,
    },
    audit: {
        view: Permission.VIEW_AUDIT,
    },
};
