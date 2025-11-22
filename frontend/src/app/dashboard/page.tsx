'use client';

import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Package, TrendingUp, AlertTriangle, Truck, Sparkles, Activity } from 'lucide-react';

interface DashboardStats {
    summary: {
        totalStockQuantity: number;
        lowStockProductsCount: number;
        pendingReceipts: number;
        pendingTransfers: number;
    };
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await api.getDashboard();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-odoo-purple"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-odoo-purple animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-odoo-purple-soft to-odoo-purple rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <Activity className="h-10 w-10 animate-pulse-slow" />
                    <h1 className="text-4xl font-bold">Dashboard</h1>
                </div>
                <p className="text-white/90 text-lg">Welcome back, {user?.name}! Here's your inventory overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light card-hover border-l-4 border-odoo-purple">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-hover-gray rounded-xl">
                            <Package className="h-8 w-8 text-odoo-purple" />
                        </div>
                        <span className="text-3xl font-bold text-odoo-purple">{stats?.summary.totalStockQuantity || 0}</span>
                    </div>
                    <h3 className="text-text-secondary font-semibold">Total Stock</h3>
                    <p className="text-sm text-text-muted mt-1">Items in inventory</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light card-hover border-l-4 border-status-warning">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-50 rounded-xl">
                            <AlertTriangle className="h-8 w-8 text-status-warning" />
                        </div>
                        <span className="text-3xl font-bold text-status-warning">{stats?.summary.lowStockProductsCount || 0}</span>
                    </div>
                    <h3 className="text-text-secondary font-semibold">Low Stock Alert</h3>
                    <p className="text-sm text-text-muted mt-1">Items need reorder</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light card-hover border-l-4 border-status-success">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <TrendingUp className="h-8 w-8 text-status-success" />
                        </div>
                        <span className="text-3xl font-bold text-status-success">{stats?.summary.pendingReceipts || 0}</span>
                    </div>
                    <h3 className="text-text-secondary font-semibold">Pending Receipts</h3>
                    <p className="text-sm text-text-muted mt-1">Awaiting validation</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light card-hover border-l-4 border-status-info">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Truck className="h-8 w-8 text-status-info" />
                        </div>
                        <span className="text-3xl font-bold text-status-info">{stats?.summary.pendingTransfers || 0}</span>
                    </div>
                    <h3 className="text-text-secondary font-semibold">Pending Transfers</h3>
                    <p className="text-sm text-text-muted mt-1">In transit</p>
                </div>
            </div>

            {/* Role Info */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-border-light">
                <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-status-warning" />
                    Your Access Level
                </h2>
                {user?.role === UserRole.ADMIN && (
                    <div className="bg-hover-gray border-2 border-border-light rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-status-error rounded-lg">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Administrator Access</h3>
                        </div>
                        <p className="text-text-secondary">
                            You have complete system control including user management, system configuration, and all inventory operations.
                        </p>
                    </div>
                )}
                {user?.role === UserRole.INVENTORY_MANAGER && (
                    <div className="bg-hover-gray border-2 border-border-light rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-odoo-purple rounded-lg">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Inventory Manager Access</h3>
                        </div>
                        <p className="text-text-secondary">
                            Manage all inventory operations, stock adjustments, vendor management, and comprehensive reports.
                        </p>
                    </div>
                )}
                {user?.role === UserRole.STAFF && (
                    <div className="bg-hover-gray border-2 border-border-light rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-status-success rounded-lg">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Staff Access</h3>
                        </div>
                        <p className="text-text-secondary">
                            View inventory, create receipts and deliveries, and access basic reporting features.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
