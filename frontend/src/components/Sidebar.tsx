'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole, Permission } from '@/hooks/useAuth';
import {
    Home,
    Package,
    MapPin,
    Truck,
    ShoppingCart,
    TrendingDown,
    ArrowRightLeft,
    BarChart3,
    History,
    Users,
    LogOut,
    Bell,
    FileText,
    DollarSign,
    Settings,
    Shield,
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    permission?: Permission;
    adminOnly?: boolean;
    managerOnly?: boolean;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, permission: Permission.VIEW_DASHBOARD },
    { name: 'Products', href: '/dashboard/products', icon: Package, permission: Permission.VIEW_PRODUCTS },
    { name: 'Locations', href: '/dashboard/locations', icon: MapPin, permission: Permission.VIEW_LOCATIONS },
    { name: 'Vendors', href: '/dashboard/vendors', icon: Truck, permission: Permission.VIEW_VENDORS },
    { name: 'Receipts', href: '/dashboard/receipts', icon: ShoppingCart, permission: Permission.VIEW_RECEIPTS },
    { name: 'Deliveries', href: '/dashboard/deliveries', icon: TrendingDown, permission: Permission.VIEW_DELIVERIES },
    { name: 'Transfers', href: '/dashboard/transfers', icon: ArrowRightLeft, permission: Permission.TRANSFER_STOCK },
    { name: 'Adjustments', href: '/dashboard/adjustments', icon: BarChart3, permission: Permission.ADJUST_STOCK },
    { name: 'Move History', href: '/dashboard/move-history', icon: History, permission: Permission.VIEW_MOVE_HISTORY },
    { name: 'Low Stock Alerts', href: '/dashboard/alerts', icon: Bell, permission: Permission.VIEW_REPORTS },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, permission: Permission.CREATE_INVOICES },
    { name: 'Payments', href: '/dashboard/payments', icon: DollarSign, permission: Permission.VIEW_PAYMENTS },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, permission: Permission.VIEW_REPORTS },
    { name: 'Users', href: '/dashboard/users', icon: Users, permission: Permission.MANAGE_USERS, adminOnly: true },
    { name: 'Audit Trail', href: '/dashboard/audit', icon: Shield, permission: Permission.VIEW_AUDIT },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: Permission.MANAGE_SETTINGS, adminOnly: true },
];

interface SidebarProps {
    onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout, hasPermission, hasRole } = useAuth();

    const canAccessItem = (item: NavItem): boolean => {
        // Admin-only items
        if (item.adminOnly && user?.role !== UserRole.ADMIN) return false;
        
        // Manager-only items
        if (item.managerOnly && user?.role !== UserRole.INVENTORY_MANAGER) return false;
        
        // Check permission if specified
        if (item.permission && !hasPermission(item.permission)) return false;
        
        return true;
    };

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    return (
        <div className="w-64 bg-white border-r border-border-light h-screen flex flex-col">
            <div className="p-6 border-b border-border-light flex items-center justify-between flex-shrink-0">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-odoo-purple">StockMaster</h1>
                    <p className="text-xs text-text-muted mt-1 truncate">{user?.role.replace('_', ' ')}</p>
                </div>
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-lg hover:bg-hover-gray transition-colors ml-2 flex-shrink-0"
                >
                    <svg className="h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    if (!canAccessItem(item)) return null;

                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-odoo-purple text-white font-medium'
                                    : 'text-text-secondary hover:bg-hover-gray hover:text-odoo-purple'
                            }`}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border-light flex-shrink-0">
                <div className="mb-3 p-3 bg-hover-gray rounded-lg">
                    <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-status-error hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
