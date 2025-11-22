'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Vendor {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
        receipts: number;
    };
    totalReceipts?: number;
    totalItemsReceived?: number;
    lastReceiptDate?: string;
}

interface VendorFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [formData, setFormData] = useState<VendorFormData>({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        fetchVendors();
    }, [search]);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/vendors?search=${search}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch vendors');
            }

            const data = await response.json();
            setVendors(data.vendors);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors';
            const method = editingVendor ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Operation failed');
            }

            await fetchVendors();
            resetForm();
            setShowForm(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (vendor: Vendor) => {
        setEditingVendor(vendor);
        setFormData({
            name: vendor.name,
            email: vendor.email || '',
            phone: vendor.phone || '',
            address: vendor.address || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (vendorId: string) => {
        if (!confirm('Are you sure you want to delete this vendor?')) return;

        try {
            const response = await fetch(`/api/vendors/${vendorId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Delete failed');
            }

            await fetchVendors();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: ''
        });
        setEditingVendor(null);
    };

    const canCreateVendors = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';
    const canEditVendors = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';
    const canDeleteVendors = user?.role === 'ADMIN';

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-3 text-gray-600">Loading vendors...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Vendors Management
                    </h1>
                    <p className="text-gray-600 mt-2">Manage suppliers and vendor relationships</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                        <button
                            onClick={() => setError('')}
                            className="float-right text-red-700 hover:text-red-900"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Controls */}
                <div className="mb-6 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        {canCreateVendors && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                            >
                                + Add Vendor
                            </button>
                        )}
                    </div>
                </div>

                {/* Vendors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {vendors.map((vendor) => (
                        <div
                            key={vendor.id}
                            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                                    {vendor.email && (
                                        <p className="text-sm text-gray-600 mt-1">{vendor.email}</p>
                                    )}
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-2 mb-4">
                                {vendor.phone && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {vendor.phone}
                                    </div>
                                )}
                                {vendor.address && (
                                    <div className="flex items-start text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="line-clamp-2">{vendor.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-blue-600 font-medium">RECEIPTS</p>
                                        <p className="text-lg font-bold text-blue-800">{vendor._count?.receipts || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600 font-medium">ITEMS</p>
                                        <p className="text-lg font-bold text-blue-800">{vendor.totalItemsReceived || 0}</p>
                                    </div>
                                </div>
                                {vendor.lastReceiptDate && (
                                    <div className="mt-2 pt-2 border-t border-blue-200">
                                        <p className="text-xs text-blue-600">
                                            Last Receipt: {new Date(vendor.lastReceiptDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {canEditVendors && (
                                    <button
                                        onClick={() => handleEdit(vendor)}
                                        className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                    >
                                        Edit
                                    </button>
                                )}
                                {canDeleteVendors && (
                                    <button
                                        onClick={() => handleDelete(vendor.id)}
                                        className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* No Data Message */}
                {vendors.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendors Found</h3>
                        <p className="text-gray-500">Get started by adding your first vendor.</p>
                        {canCreateVendors && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                            >
                                Add Vendor
                            </button>
                        )}
                    </div>
                )}

                {/* Add/Edit Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">
                                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vendor Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter vendor name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="vendor@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Enter vendor address"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        {formLoading ? 'Saving...' : (editingVendor ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}