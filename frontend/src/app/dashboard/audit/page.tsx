'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Shield, User, Activity, Calendar, Filter, Download, Search } from 'lucide-react';

interface AuditLog {
    id: string;
    userId: string | null;
    userName: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    changes: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    } | null;
}

interface AuditStats {
    totalLogs: number;
    actionStats: Array<{ action: string; count: number }>;
    entityStats: Array<{ entity: string; count: number }>;
    userActivity: Array<{ userId: string | null; userName: string | null; count: number }>;
}

export default function AuditTrailPage() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        entity: '',
        userId: '',
        startDate: '',
        endDate: '',
        search: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [currentPage, filters]);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20'
            });

            if (filters.action) params.append('action', filters.action);
            if (filters.entity) params.append('entity', filters.entity);
            if (filters.userId) params.append('userId', filters.userId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await fetch(`/api/audit?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setLogs(data.logs);
            setTotalPages(data.pagination.totalPages);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await fetch(`/api/audit/stats?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            case 'LOGIN': return 'bg-purple-100 text-purple-800';
            case 'LOGOUT': return 'bg-gray-100 text-gray-800';
            case 'EXPORT': return 'bg-yellow-100 text-yellow-800';
            case 'IMPORT': return 'bg-orange-100 text-orange-800';
            case 'VIEW': return 'bg-indigo-100 text-indigo-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const exportToCSV = () => {
        const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP Address'];
        const rows = logs.map(log => [
            new Date(log.createdAt).toLocaleString(),
            log.userName || 'System',
            log.action,
            log.entity,
            log.entityId || '',
            log.ipAddress || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const resetFilters = () => {
        setFilters({
            action: '',
            entity: '',
            userId: '',
            startDate: '',
            endDate: '',
            search: ''
        });
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
                    <p className="text-gray-600 mt-1">System activity and user action logs</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Logs</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Users</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.userActivity.length}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <User className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Entities Tracked</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.entityStats.length}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <Shield className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Action Types</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.actionStats.length}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <Calendar className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Action
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">Create</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                                <option value="LOGIN">Login</option>
                                <option value="LOGOUT">Logout</option>
                                <option value="EXPORT">Export</option>
                                <option value="IMPORT">Import</option>
                                <option value="VIEW">View</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Entity
                            </label>
                            <input
                                type="text"
                                value={filters.entity}
                                onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                                placeholder="e.g., Product, User"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                User ID
                            </label>
                            <input
                                type="text"
                                value={filters.userId}
                                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                                placeholder="Filter by user"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={resetFilters}
                                className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Logs Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left p-4 text-sm font-semibold text-gray-600">Timestamp</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-600">User</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-600">Action</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-600">Entity</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-600">Entity ID</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-600">IP Address</th>
                                <th className="text-center p-4 text-sm font-semibold text-gray-600">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4 text-sm">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div>
                                            <div className="font-medium">{log.userName || 'System'}</div>
                                            {log.user && (
                                                <div className="text-xs text-gray-500">{log.user.email}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-medium">{log.entity}</td>
                                    <td className="p-4 text-sm text-gray-600">{log.entityId || '-'}</td>
                                    <td className="p-4 text-sm text-gray-600">{log.ipAddress || '-'}</td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Audit Log Details</h2>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Timestamp</p>
                                    <p className="text-sm font-medium">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Action</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                                        {selectedLog.action}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">User</p>
                                    <p className="text-sm font-medium">{selectedLog.userName || 'System'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Entity</p>
                                    <p className="text-sm font-medium">{selectedLog.entity}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Entity ID</p>
                                    <p className="text-sm font-medium">{selectedLog.entityId || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">IP Address</p>
                                    <p className="text-sm font-medium">{selectedLog.ipAddress || '-'}</p>
                                </div>
                            </div>

                            {selectedLog.userAgent && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">User Agent</p>
                                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedLog.userAgent}</p>
                                </div>
                            )}

                            {selectedLog.changes && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Changes</p>
                                    <pre className="text-xs font-mono bg-gray-50 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(JSON.parse(selectedLog.changes), null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
