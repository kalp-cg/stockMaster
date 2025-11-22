'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Activity, Download, Calendar, Filter } from 'lucide-react';

type ReportType = 'stock' | 'sales' | 'purchases' | 'movements' | 'profit-loss' | 'activity';

export default function ReportsPage() {
    const [reportType, setReportType] = useState<ReportType>('stock');
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        locationId: '',
        productId: '',
        vendorId: ''
    });

    const [locations, setLocations] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchReport();
    }, [reportType]);

    const fetchMetadata = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [locRes, prodRes, vendRes] = await Promise.all([
                fetch('/api/locations', { headers }),
                fetch('/api/products', { headers }),
                fetch('/api/vendors', { headers })
            ]);

            const locData = await locRes.json();
            const prodData = await prodRes.json();
            const vendData = await vendRes.json();

            setLocations(locData.locations || []);
            setProducts(prodData.products || []);
            setVendors(vendData.vendors || []);
        } catch (err) {
            console.error('Failed to fetch metadata:', err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ type: reportType });
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await fetch(`/api/reports?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            setReportData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!reportData) return;

        let csv = '';
        let filename = `${reportType}-report.csv`;

        if (reportType === 'stock') {
            csv = 'Product,SKU,Location,Quantity,Min Stock,Unit Price,Total Value\n';
            reportData.stocks.forEach((s: any) => {
                csv += `${s.product.name},${s.product.sku},${s.location.name},${s.quantity},${s.product.minStock},${s.product.price},${s.quantity * s.product.price}\n`;
            });
        } else if (reportType === 'sales') {
            csv = 'Order Number,Date,Location,Items,Revenue\n';
            reportData.deliveries.forEach((d: any) => {
                const revenue = d.items.reduce((sum: number, i: any) => sum + (i.quantityDelivered * i.product.price), 0);
                csv += `${d.deliveryNumber},${new Date(d.validatedAt).toLocaleDateString()},${d.location.name},${d.totalItems},${revenue.toFixed(2)}\n`;
            });
        } else if (reportType === 'purchases') {
            csv = 'Receipt Number,Date,Vendor,Items,Cost\n';
            reportData.receipts.forEach((r: any) => {
                const cost = r.items.reduce((sum: number, i: any) => sum + (i.quantityReceived * i.product.price), 0);
                csv += `${r.receiptNumber},${new Date(r.validatedAt).toLocaleDateString()},${r.vendor.name},${r.totalItems},${cost.toFixed(2)}\n`;
            });
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const renderStockReport = () => {
        if (!reportData) return null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Total Products</span>
                        <p className="text-3xl font-bold text-blue-600">{reportData.summary.totalProducts}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Low Stock</span>
                        <p className="text-3xl font-bold text-orange-600">{reportData.summary.lowStockCount}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Out of Stock</span>
                        <p className="text-3xl font-bold text-red-600">{reportData.summary.outOfStockCount}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Total Value</span>
                        <p className="text-3xl font-bold text-green-600">${reportData.summary.totalValue.toFixed(2)}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Avg Stock Level</span>
                        <p className="text-3xl font-bold text-purple-600">{reportData.summary.averageStockLevel}</p>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6 overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4">Product</th>
                                <th className="text-left py-3 px-4">SKU</th>
                                <th className="text-left py-3 px-4">Location</th>
                                <th className="text-right py-3 px-4">Quantity</th>
                                <th className="text-right py-3 px-4">Min Stock</th>
                                <th className="text-right py-3 px-4">Value</th>
                                <th className="text-center py-3 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.stocks.map((stock: any) => (
                                <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{stock.product.name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{stock.product.sku}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{stock.location.name}</td>
                                    <td className="py-3 px-4 text-right font-medium">{stock.quantity}</td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-600">{stock.product.minStock}</td>
                                    <td className="py-3 px-4 text-right font-medium text-green-600">
                                        ${(stock.quantity * stock.product.price).toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {stock.quantity === 0 ? (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Out of Stock</span>
                                        ) : stock.quantity <= stock.product.minStock ? (
                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Low Stock</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">In Stock</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderSalesReport = () => {
        if (!reportData) return null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                            <span className="text-sm text-gray-600">Total Revenue</span>
                        </div>
                        <p className="text-3xl font-bold text-green-600">${reportData.summary.totalRevenue}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Total Orders</span>
                        <p className="text-3xl font-bold text-blue-600">{reportData.summary.totalOrders}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Total Items</span>
                        <p className="text-3xl font-bold text-purple-600">{reportData.summary.totalItems}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Avg Order Value</span>
                        <p className="text-3xl font-bold text-orange-600">${reportData.summary.averageOrderValue}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">Top Products by Revenue</h3>
                        <div className="space-y-3">
                            {reportData.topProducts.slice(0, 5).map((product: any, index: number) => (
                                <div key={product.productId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-green-600">${product.revenue.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">Sales by Location</h3>
                        <div className="space-y-3">
                            {reportData.topLocations.map((location: any) => (
                                <div key={location.locationId} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{location.name}</p>
                                        <p className="text-xs text-gray-500">{location.quantity} units</p>
                                    </div>
                                    <span className="font-bold text-green-600">${location.revenue.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPurchaseReport = () => {
        if (!reportData) return null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                            <span className="text-sm text-gray-600">Total Cost</span>
                        </div>
                        <p className="text-3xl font-bold text-red-600">${reportData.summary.totalCost}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Total Orders</span>
                        <p className="text-3xl font-bold text-blue-600">{reportData.summary.totalOrders}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Total Items</span>
                        <p className="text-3xl font-bold text-purple-600">{reportData.summary.totalItems}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Avg Order Value</span>
                        <p className="text-3xl font-bold text-orange-600">${reportData.summary.averageOrderValue}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">Top Vendors by Volume</h3>
                        <div className="space-y-3">
                            {reportData.topVendors.map((vendor: any) => (
                                <div key={vendor.vendorId} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{vendor.name}</p>
                                        <p className="text-xs text-gray-500">{vendor.quantity} units purchased</p>
                                    </div>
                                    <span className="font-bold text-red-600">${vendor.cost.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">Most Purchased Products</h3>
                        <div className="space-y-3">
                            {reportData.topProducts.slice(0, 5).map((product: any) => (
                                <div key={product.productId} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.quantity} units</p>
                                    </div>
                                    <span className="font-bold text-red-600">${product.cost.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderProfitLossReport = () => {
        if (!reportData) return null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                            <span className="text-sm text-gray-600">Total Revenue</span>
                        </div>
                        <p className="text-3xl font-bold text-green-600">${reportData.revenue.sales}</p>
                        <p className="text-xs text-gray-500 mt-1">{reportData.revenue.totalOrders} orders</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                            <span className="text-sm text-gray-600">Total Costs</span>
                        </div>
                        <p className="text-3xl font-bold text-red-600">${reportData.costs.purchases}</p>
                        <p className="text-xs text-gray-500 mt-1">{reportData.costs.totalOrders} orders</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                            <span className="text-sm text-gray-600">Gross Profit</span>
                        </div>
                        <p className={`text-3xl font-bold ${reportData.profit.gross >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${reportData.profit.gross}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{reportData.profit.margin}% margin</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Package className="w-6 h-6 text-purple-600" />
                            <span className="text-sm text-gray-600">Stock Value</span>
                        </div>
                        <p className="text-3xl font-bold text-purple-600">${reportData.inventory.totalValue}</p>
                        <p className="text-xs text-gray-500 mt-1">{reportData.inventory.totalProducts} products</p>
                    </div>
                </div>

                <div className="glass rounded-2xl p-8">
                    <h3 className="text-xl font-bold mb-6 text-center">Financial Overview</h3>
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="flex items-center justify-between py-4 border-b border-gray-200">
                            <span className="text-gray-600">Revenue</span>
                            <span className="text-xl font-bold text-green-600">+${reportData.revenue.sales}</span>
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-gray-200">
                            <span className="text-gray-600">Costs</span>
                            <span className="text-xl font-bold text-red-600">-${reportData.costs.purchases}</span>
                        </div>
                        <div className="flex items-center justify-between py-4">
                            <span className="text-lg font-bold">Net Profit</span>
                            <span className={`text-2xl font-bold ${reportData.profit.gross >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${reportData.profit.gross}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderActivityReport = () => {
        if (!reportData) return null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Receipts</span>
                        <p className="text-3xl font-bold text-blue-600">{reportData.summary.totalReceipts}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Deliveries</span>
                        <p className="text-3xl font-bold text-green-600">{reportData.summary.totalDeliveries}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Transfers</span>
                        <p className="text-3xl font-bold text-orange-600">{reportData.summary.totalTransfers}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Adjustments</span>
                        <p className="text-3xl font-bold text-purple-600">{reportData.summary.totalAdjustments}</p>
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <span className="text-sm text-gray-600">Total Activity</span>
                        <p className="text-3xl font-bold text-gray-900">{reportData.summary.totalActivity}</p>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">User Activity</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4">User</th>
                                    <th className="text-left py-3 px-4">Role</th>
                                    <th className="text-right py-3 px-4">Receipts</th>
                                    <th className="text-right py-3 px-4">Deliveries</th>
                                    <th className="text-right py-3 px-4">Transfers</th>
                                    <th className="text-right py-3 px-4">Adjustments</th>
                                    <th className="text-right py-3 px-4">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.userActivity.map((user: any) => (
                                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">{user._count.receipts}</td>
                                        <td className="py-3 px-4 text-right">{user._count.deliveries}</td>
                                        <td className="py-3 px-4 text-right">{user._count.transfers}</td>
                                        <td className="py-3 px-4 text-right">{user._count.adjustments}</td>
                                        <td className="py-3 px-4 text-right font-bold">{user.totalActivity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">Reports & Analytics</h1>
                        <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        disabled={!reportData}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        <Download className="w-5 h-5" />
                        Export CSV
                    </button>
                </div>

                {error && (
                    <div className="glass rounded-xl p-4 mb-6 bg-red-50 border border-red-200">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                <div className="glass rounded-2xl p-6 mb-6">
                    <div className="flex flex-wrap gap-3 mb-6">
                        {[
                            { type: 'stock', label: 'Stock Report', icon: Package },
                            { type: 'sales', label: 'Sales Report', icon: TrendingUp },
                            { type: 'purchases', label: 'Purchase Report', icon: TrendingDown },
                            { type: 'profit-loss', label: 'Profit & Loss', icon: DollarSign },
                            { type: 'activity', label: 'Activity Report', icon: Activity }
                        ].map(({ type, label, icon: Icon }) => (
                            <button
                                key={type}
                                onClick={() => setReportType(type as ReportType)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                    reportType === type
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {reportType === 'stock' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Location</label>
                                <select
                                    value={filters.locationId}
                                    onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Locations</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {reportType === 'purchases' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Vendor</label>
                                <select
                                    value={filters.vendorId}
                                    onChange={(e) => setFilters({ ...filters, vendorId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Vendors</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex items-end">
                            <button
                                onClick={fetchReport}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                            >
                                <Filter className="w-5 h-5" />
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {reportData && (
                    <>
                        {reportType === 'stock' && renderStockReport()}
                        {reportType === 'sales' && renderSalesReport()}
                        {reportType === 'purchases' && renderPurchaseReport()}
                        {reportType === 'profit-loss' && renderProfitLossReport()}
                        {reportType === 'activity' && renderActivityReport()}
                    </>
                )}
            </div>
        </div>
    );
}
