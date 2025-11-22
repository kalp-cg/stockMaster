'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw, Trash2, Package, MapPin } from 'lucide-react';

interface Alert {
    id: string;
    productId: string;
    locationId: string;
    currentQty: number;
    minQty: number;
    severity: 'CRITICAL' | 'WARNING' | 'LOW';
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
    product: {
        id: string;
        name: string;
        sku: string;
        unit: string;
    } | null;
    location: {
        id: string;
        name: string;
    } | null;
    currentStock: number;
}

interface AlertStats {
    total: number;
    unread: number;
    bySeverity: {
        critical: number;
        warning: number;
        low: number;
    };
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [stats, setStats] = useState<AlertStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterSeverity, setFilterSeverity] = useState<string>('');
    const [filterRead, setFilterRead] = useState<string>('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAlerts();
        fetchStats();
    }, [filterSeverity, filterRead]);

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filterSeverity) params.append('severity', filterSeverity);
            if (filterRead) params.append('isRead', filterRead);

            const response = await fetch(`/api/alerts?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            setAlerts(data.alerts || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/alerts/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const checkAlerts = async () => {
        setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'check' })
            });

            await fetchAlerts();
            await fetchStats();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRefreshing(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'read', id })
            });

            await fetchAlerts();
            await fetchStats();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'readAll' })
            });

            await fetchAlerts();
            await fetchStats();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteAlert = async (id: string) => {
        if (!confirm('Are you sure you want to delete this alert?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/alerts?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            await fetchAlerts();
            await fetchStats();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return <AlertCircle className="w-6 h-6 text-red-600" />;
            case 'WARNING': return <AlertTriangle className="w-6 h-6 text-orange-500" />;
            case 'LOW': return <Info className="w-6 h-6 text-yellow-500" />;
            default: return <Bell className="w-6 h-6 text-gray-500" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-100 border-red-300';
            case 'WARNING': return 'bg-orange-100 border-orange-300';
            case 'LOW': return 'bg-yellow-100 border-yellow-300';
            default: return 'bg-gray-100 border-gray-300';
        }
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
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">Low Stock Alerts</h1>
                        <p className="text-gray-600">Monitor inventory levels and get notified when stock is running low</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={checkAlerts}
                            disabled={refreshing}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Checking...' : 'Check Stock'}
                        </button>
                        {stats && stats.unread > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Mark All Read
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="glass rounded-xl p-4 mb-6 bg-red-50 border border-red-200">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Bell className="w-6 h-6 text-blue-600" />
                                <span className="text-sm text-gray-600">Total Alerts</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Bell className="w-6 h-6 text-purple-600" />
                                <span className="text-sm text-gray-600">Unread</span>
                            </div>
                            <p className="text-3xl font-bold text-purple-600">{stats.unread}</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                                <span className="text-sm text-gray-600">Critical</span>
                            </div>
                            <p className="text-3xl font-bold text-red-600">{stats.bySeverity.critical}</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-6 h-6 text-orange-500" />
                                <span className="text-sm text-gray-600">Warning</span>
                            </div>
                            <p className="text-3xl font-bold text-orange-500">{stats.bySeverity.warning}</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Info className="w-6 h-6 text-yellow-500" />
                                <span className="text-sm text-gray-600">Low</span>
                            </div>
                            <p className="text-3xl font-bold text-yellow-500">{stats.bySeverity.low}</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mb-6">
                    <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 glass"
                    >
                        <option value="">All Severity</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="WARNING">Warning</option>
                        <option value="LOW">Low</option>
                    </select>
                    <select
                        value={filterRead}
                        onChange={(e) => setFilterRead(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 glass"
                    >
                        <option value="">All Status</option>
                        <option value="false">Unread</option>
                        <option value="true">Read</option>
                    </select>
                </div>

                <div className="space-y-4">
                    {alerts.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No alerts found. Stock levels are healthy! 🎉</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`glass rounded-2xl p-6 border-2 ${getSeverityColor(alert.severity)} ${!alert.isRead ? 'shadow-lg' : 'opacity-75'} transition-all`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-3 rounded-xl bg-white">
                                            {getSeverityIcon(alert.severity)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {alert.product?.name || 'Unknown Product'}
                                                </h3>
                                                {!alert.isRead && (
                                                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">NEW</span>
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                                                    alert.severity === 'WARNING' ? 'bg-orange-500 text-white' :
                                                    'bg-yellow-500 text-white'
                                                }`}>
                                                    {alert.severity}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">SKU: {alert.product?.sku}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">{alert.location?.name}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 mt-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Current Stock</p>
                                                    <p className="text-2xl font-bold text-red-600">{alert.currentStock} {alert.product?.unit}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Minimum Required</p>
                                                    <p className="text-2xl font-bold text-gray-700">{alert.minQty} {alert.product?.unit}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Shortage</p>
                                                    <p className="text-2xl font-bold text-orange-600">{alert.minQty - alert.currentStock} {alert.product?.unit}</p>
                                                </div>
                                            </div>

                                            <p className="text-xs text-gray-500 mt-3">
                                                Created: {new Date(alert.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {!alert.isRead && (
                                            <button
                                                onClick={() => markAsRead(alert.id)}
                                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all"
                                                title="Mark as read"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteAlert(alert.id)}
                                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                                            title="Delete alert"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
