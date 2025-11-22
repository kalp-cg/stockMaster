'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ReportData {
    overview: {
        totalProducts: number;
        totalLocations: number;
        totalVendors: number;
        totalStock: number;
        lowStockProducts: number;
        recentTransactions: number;
    };
    topProducts: Array<{
        product: {
            name: string;
            sku: string;
            unit: string;
        };
        totalQuantity: number;
        transactionCount: number;
    }>;
    topLocations: Array<{
        location: {
            name: string;
        };
        productCount: number;
        totalStock: number;
        transactionCount: number;
    }>;
    lowStockAlerts: Array<{
        id: string;
        name: string;
        sku: string;
        totalStock: number;
        minStock: number;
        unit: string;
        locations: Array<{
            locationName: string;
            quantity: number;
        }>;
    }>;
    recentActivity: Array<{
        id: string;
        type: string;
        description: string;
        createdAt: string;
        user: {
            name: string;
        };
    }>;
}

export default function ReportsPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'locations' | 'alerts'>('overview');

    const { user } = useAuth();

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            
            // Simulate fetching comprehensive report data
            // In a real app, you'd have dedicated report endpoints
            const [productsRes, locationsRes, vendorsRes] = await Promise.all([
                fetch('/api/products?limit=1000', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch('/api/locations', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch('/api/vendors', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            const products = await productsRes.json();
            const locations = await locationsRes.json();
            const vendors = await vendorsRes.json();

            // Process data for reports
            const processedData: ReportData = {
                overview: {
                    totalProducts: products.pagination?.total || products.products?.length || 0,
                    totalLocations: locations.locations?.length || 0,
                    totalVendors: vendors.vendors?.length || 0,
                    totalStock: products.products?.reduce((sum: number, p: any) => sum + (p.totalStock || 0), 0) || 0,
                    lowStockProducts: products.products?.filter((p: any) => p.isLowStock)?.length || 0,
                    recentTransactions: products.products?.reduce((sum: number, p: any) => 
                        sum + (p._count?.receiptItems || 0) + (p._count?.deliveryItems || 0), 0) || 0
                },
                topProducts: products.products?.sort((a: any, b: any) => 
                    ((b._count?.receiptItems || 0) + (b._count?.deliveryItems || 0)) - 
                    ((a._count?.receiptItems || 0) + (a._count?.deliveryItems || 0))
                ).slice(0, 5).map((p: any) => ({
                    product: {
                        name: p.name,
                        sku: p.sku,
                        unit: p.unit
                    },
                    totalQuantity: p.totalStock || 0,
                    transactionCount: (p._count?.receiptItems || 0) + (p._count?.deliveryItems || 0)
                })) || [],
                topLocations: locations.locations?.slice(0, 5).map((l: any) => ({
                    location: {
                        name: l.name
                    },
                    productCount: l._count?.stocks || 0,
                    totalStock: l.totalStock || 0,
                    transactionCount: (l._count?.receipts || 0) + (l._count?.deliveries || 0)
                })) || [],
                lowStockAlerts: products.products?.filter((p: any) => p.isLowStock).slice(0, 10).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    totalStock: p.totalStock || 0,
                    minStock: p.minStock || 0,
                    unit: p.unit,
                    locations: p.stockByLocation || []
                })) || [],
                recentActivity: [] // Would need dedicated endpoint for move history
            };

            setReportData(processedData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-3 text-gray-600">Loading reports...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!reportData) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-600 mt-2">Comprehensive inventory insights and analytics</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                        <button onClick={() => setError('')} className="float-right text-red-700 hover:text-red-900">×</button>
                    </div>
                )}

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Products</p>
                                <p className="text-2xl font-bold text-gray-900">{reportData.overview.totalProducts}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-green-100 rounded-xl">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Locations</p>
                                <p className="text-2xl font-bold text-gray-900">{reportData.overview.totalLocations}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-purple-100 rounded-xl">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Vendors</p>
                                <p className="text-2xl font-bold text-gray-900">{reportData.overview.totalVendors}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-xl">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Stock</p>
                                <p className="text-2xl font-bold text-gray-900">{reportData.overview.totalStock.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-red-100 rounded-xl">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.168 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                                <p className="text-2xl font-bold text-gray-900">{reportData.overview.lowStockProducts}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-xl">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Transactions</p>
                                <p className="text-2xl font-bold text-gray-900">{reportData.overview.recentTransactions}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { key: 'overview', label: 'Overview' },
                                { key: 'products', label: 'Top Products' },
                                { key: 'locations', label: 'Top Locations' },
                                { key: 'alerts', label: 'Low Stock Alerts' }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.key
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {/* Top Products Tab */}
                    {activeTab === 'products' && (
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                            <h2 className="text-xl font-bold mb-4">Top Products by Activity</h2>
                            <div className="space-y-4">
                                {reportData.topProducts.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                                <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">{item.totalQuantity} {item.product.unit}</p>
                                            <p className="text-sm text-gray-500">{item.transactionCount} transactions</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top Locations Tab */}
                    {activeTab === 'locations' && (
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                            <h2 className="text-xl font-bold mb-4">Top Locations by Activity</h2>
                            <div className="space-y-4">
                                {reportData.topLocations.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-bold text-green-600">{index + 1}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{item.location.name}</p>
                                                <p className="text-sm text-gray-500">{item.productCount} unique products</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">{item.totalStock} items</p>
                                            <p className="text-sm text-gray-500">{item.transactionCount} transactions</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Low Stock Alerts Tab */}
                    {activeTab === 'alerts' && (
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                            <h2 className="text-xl font-bold mb-4">Low Stock Alerts</h2>
                            {reportData.lowStockAlerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <p className="text-green-600 font-medium">All products have adequate stock levels!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reportData.lowStockAlerts.map((alert) => (
                                        <div key={alert.id} className="border-l-4 border-red-400 bg-red-50 p-4 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium text-red-800">{alert.name}</h3>
                                                    <p className="text-sm text-red-600">SKU: {alert.sku}</p>
                                                    <p className="text-sm text-red-600">
                                                        Current: {alert.totalStock} {alert.unit} | 
                                                        Minimum: {alert.minStock} {alert.unit}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Critical
                                                </span>
                                            </div>
                                            {alert.locations.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-medium text-red-700 mb-1">Stock by location:</p>
                                                    <div className="space-y-1">
                                                        {alert.locations.map((loc, idx) => (
                                                            <div key={idx} className="flex justify-between text-xs text-red-600">
                                                                <span>{loc.locationName}:</span>
                                                                <span>{loc.quantity} {alert.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Overview Tab (default) */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                                <h2 className="text-xl font-bold mb-4">Quick Summary</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Products:</span>
                                        <span className="font-medium">{reportData.overview.totalProducts}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Active Locations:</span>
                                        <span className="font-medium">{reportData.overview.totalLocations}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Registered Vendors:</span>
                                        <span className="font-medium">{reportData.overview.totalVendors}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Stock Items:</span>
                                        <span className="font-medium">{reportData.overview.totalStock.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Low Stock Alerts:</span>
                                        <span className={`font-medium ${reportData.overview.lowStockProducts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {reportData.overview.lowStockProducts}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Transactions:</span>
                                        <span className="font-medium">{reportData.overview.recentTransactions}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                                <h2 className="text-xl font-bold mb-4">System Health</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Stock Levels</span>
                                        <div className="flex items-center">
                                            <div className={`w-3 h-3 rounded-full mr-2 ${
                                                reportData.overview.lowStockProducts === 0 ? 'bg-green-400' : 
                                                reportData.overview.lowStockProducts <= 5 ? 'bg-yellow-400' : 'bg-red-400'
                                            }`}></div>
                                            <span className="text-sm font-medium">
                                                {reportData.overview.lowStockProducts === 0 ? 'Good' : 
                                                reportData.overview.lowStockProducts <= 5 ? 'Warning' : 'Critical'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Data Coverage</span>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full mr-2 bg-green-400"></div>
                                            <span className="text-sm font-medium">Complete</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">System Status</span>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full mr-2 bg-green-400"></div>
                                            <span className="text-sm font-medium">Operational</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}