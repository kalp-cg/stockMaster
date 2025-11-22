'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Location {
    id: string;
    name: string;
    address: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
        stocks: number;
        receipts: number;
        deliveries: number;
        transfersFrom?: number;
        transfersTo?: number;
    };
    stocks?: Array<{
        quantity: number;
        product: {
            name: string;
            sku: string;
            unit: string;
        };
    }>;
}

interface LocationFormData {
    name: string;
    address: string;
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [formData, setFormData] = useState<LocationFormData>({
        name: '',
        address: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        fetchLocations();
    }, [search]);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/locations?search=${search}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch locations');
            }

            const data = await response.json();
            setLocations(data.locations);
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
            const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations';
            const method = editingLocation ? 'PUT' : 'POST';

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

            await fetchLocations();
            resetForm();
            setShowForm(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (location: Location) => {
        setEditingLocation(location);
        setFormData({
            name: location.name,
            address: location.address || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (locationId: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            const response = await fetch(`/api/locations/${locationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Delete failed');
            }

            await fetchLocations();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: ''
        });
        setEditingLocation(null);
    };

    const canCreateLocations = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';
    const canEditLocations = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';
    const canDeleteLocations = user?.role === 'ADMIN';

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-3 text-gray-600">Loading locations...</span>
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
                        Locations Management
                    </h1>
                    <p className="text-gray-600 mt-2">Manage warehouse locations and storage areas</p>
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
                                placeholder="Search locations..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        {canCreateLocations && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                            >
                                + Add Location
                            </button>
                        )}
                    </div>
                </div>

                {/* Locations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {locations.map((location) => (
                        <div
                            key={location.id}
                            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                                    {location.address && (
                                        <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                                    )}
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-xs text-blue-600 font-medium">PRODUCTS</p>
                                        <p className="text-lg font-bold text-blue-800">{location._count?.stocks || 0}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <p className="text-xs text-green-600 font-medium">RECEIPTS</p>
                                        <p className="text-lg font-bold text-green-800">{location._count?.receipts || 0}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <p className="text-xs text-purple-600 font-medium">DELIVERIES</p>
                                        <p className="text-lg font-bold text-purple-800">{location._count?.deliveries || 0}</p>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-lg">
                                        <p className="text-xs text-orange-600 font-medium">TRANSFERS</p>
                                        <p className="text-lg font-bold text-orange-800">
                                            {(location._count?.transfersFrom || 0) + (location._count?.transfersTo || 0)}
                                        </p>
                                    </div>
                                </div>

                                {/* Stock Preview */}
                                {location.stocks && location.stocks.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Recent Stock:</p>
                                        <div className="space-y-1">
                                            {location.stocks.slice(0, 3).map((stock, index) => (
                                                <div key={index} className="flex justify-between text-xs">
                                                    <span className="text-gray-600 truncate">{stock.product.name}</span>
                                                    <span className="text-gray-900 ml-2">{stock.quantity} {stock.product.unit}</span>
                                                </div>
                                            ))}
                                            {location.stocks.length > 3 && (
                                                <p className="text-xs text-gray-500 italic">+{location.stocks.length - 3} more</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                                    {canEditLocations && (
                                        <button
                                            onClick={() => handleEdit(location)}
                                            className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {canDeleteLocations && (
                                        <button
                                            onClick={() => handleDelete(location.id)}
                                            className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* No Data Message */}
                {locations.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Locations Found</h3>
                        <p className="text-gray-500">Get started by creating your first location.</p>
                        {canCreateLocations && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                            >
                                Add Location
                            </button>
                        )}
                    </div>
                )}

                {/* Add/Edit Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">
                                {editingLocation ? 'Edit Location' : 'Add New Location'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter location name"
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
                                        placeholder="Enter location address"
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
                                        {formLoading ? 'Saving...' : (editingLocation ? 'Update' : 'Create')}
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