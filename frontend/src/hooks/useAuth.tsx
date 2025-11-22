'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export enum UserRole {
    ADMIN = 'ADMIN',
    INVENTORY_MANAGER = 'INVENTORY_MANAGER',
    STAFF = 'STAFF',
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
    
    // Dashboard & Reports
    VIEW_DASHBOARD = 'VIEW_DASHBOARD',
    VIEW_REPORTS = 'VIEW_REPORTS',
    
    // Invoices
    CREATE_INVOICES = 'CREATE_INVOICES',
    UPDATE_INVOICES = 'UPDATE_INVOICES',
    DELETE_INVOICES = 'DELETE_INVOICES',
    
    // Payments
    VIEW_PAYMENTS = 'VIEW_PAYMENTS',
    CREATE_PAYMENTS = 'CREATE_PAYMENTS',
    UPDATE_PAYMENTS = 'UPDATE_PAYMENTS',
    DELETE_PAYMENTS = 'DELETE_PAYMENTS',
    
    // Users
    MANAGE_USERS = 'MANAGE_USERS',
    VIEW_USERS = 'VIEW_USERS',
    
    // Settings
    MANAGE_SETTINGS = 'MANAGE_SETTINGS',
    
    // Audit
    VIEW_AUDIT = 'VIEW_AUDIT',
}

const rolePermissions: Record<UserRole, Permission[]> = {
    // ADMIN - Full system access
    [UserRole.ADMIN]: Object.values(Permission),
    
    // INVENTORY_MANAGER - Operations & reporting, no user/settings management
    [UserRole.INVENTORY_MANAGER]: [
        // Products - Full CRUD
        Permission.VIEW_PRODUCTS,
        Permission.CREATE_PRODUCTS,
        Permission.UPDATE_PRODUCTS,
        Permission.DELETE_PRODUCTS,
        
        // Locations - View only
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
        
        // Transfers & Adjustments
        Permission.TRANSFER_STOCK,
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
    [UserRole.STAFF]: [
        // Products - View only
        Permission.VIEW_PRODUCTS,
        
        // Locations - View only
        Permission.VIEW_LOCATIONS,
        
        // Vendors - View only
        Permission.VIEW_VENDORS,
        
        // Receipts - Create drafts only
        Permission.VIEW_RECEIPTS,
        Permission.CREATE_RECEIPTS,
        
        // Deliveries - Process picking/packing
        Permission.VIEW_DELIVERIES,
        Permission.CREATE_DELIVERIES,
        
        // History - View own actions
        Permission.VIEW_MOVE_HISTORY,
        
        // Dashboard - Basic metrics
        Permission.VIEW_DASHBOARD,
        
        // Reports - View only
        Permission.VIEW_REPORTS,
    ],
};

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    hasPermission: (permission: Permission) => boolean;
    hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    const hasPermission = (permission: Permission): boolean => {
        if (!user) return false;
        const permissions = rolePermissions[user.role] || [];
        return permissions.includes(permission);
    };

    const hasRole = (roles: UserRole[]): boolean => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hasPermission, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
