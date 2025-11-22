'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Package, MapPin, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface Adjustment {
    id: string;
    adjustmentNumber: string;
    locationId: string;
    productId: string;
    quantityChange: number;
    reason: string;
    notes?: string;
    createdAt: string;
    location: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        name: string;
        email: string;
    };
}

interface Product {
    id: string;
    name: string;
    sku: string;
}

interface Location {
    id: string;
    name: string;
}

interface Stock {
    quantity: number;
}

export default function AdjustmentsPage() {
    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentStock, setCurrentStock] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        locationId: '',
        productId: '',
        quantityChange: 0,
        reason: '',
        notes: ''
    });

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (formData.productId && formData.locationId) {
            fetchCurrentStock();
        } else {
            setCurrentStock(null);
        }
    }, [formData.productId, formData.locationId]);

    const fetchAll = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [adjRes, prodRes, locRes] = await Promise.all([
                fetch('/api/adjustments', { headers }),
                fetch('/api/products', { headers }),
                fetch('/api/locations', { headers })
            ]);

            const adjData = await adjRes.json();
            const prodData = await prodRes.json();
            const locData = await locRes.json();

            setAdjustments(adjData.adjustments || []);
            setProducts(prodData.products || []);
            setLocations(locData.locations || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentStock = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `/api/stock?productId=${formData.productId}&locationId=${formData.locationId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            setCurrentStock(data.stock?.quantity || 0);
        } catch (err) {
            setCurrentStock(0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/adjustments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    quantityChange: parseInt(formData.quantityChange.toString())
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create adjustment');
            }

            await fetchAll();
            resetForm();
            setShowForm(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            locationId: '',
            productId: '',
            quantityChange: 0,
            reason: '',
            notes: ''
        });
        setCurrentStock(null);
        setError('');
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
                        <h1 className="text-4xl font-bold gradient-text mb-2">Stock Adjustments</h1>
                        <p className="text-gray-600">Correct inventory discrepancies and physical counts</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Adjustment
                    </button>
                </div>

                {error && (
                    <div className="glass rounded-xl p-4 mb-6 bg-red-50 border border-red-200">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6">Create Stock Adjustment</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Location *</label>
                                    <select
                                        value={formData.locationId}
                                        onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Product *</label>
                                    <select
                                        value={formData.productId}
                                        onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(prod => (
                                            <option key={prod.id} value={prod.id}>{prod.name} ({prod.sku})</option>
                                        ))}
                                    </select>
                                </div>

                                {currentStock !== null && (
                                    <div className="glass rounded-lg p-4 bg-blue-50">
                                        <p className="text-sm text-gray-600">Current Stock: <span className="font-bold text-blue-600">{currentStock} units</span></p>
                                        {formData.quantityChange !== 0 && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                New Stock: <span className="font-bold text-green-600">{currentStock + parseInt(formData.quantityChange.toString())} units</span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-2">Quantity Change *</label>
                                    <input
                                        type="number"
                                        value={formData.quantityChange}
                                        onChange={(e) => setFormData({ ...formData, quantityChange: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter positive or negative number"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Positive to increase, negative to decrease</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Reason *</label>
                                    <select
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Reason</option>
                                        <option value="Physical count discrepancy">Physical count discrepancy</option>
                                        <option value="Damaged goods">Damaged goods</option>
                                        <option value="Expired items">Expired items</option>
                                        <option value="Found missing stock">Found missing stock</option>
                                        <option value="System error correction">System error correction</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Additional notes..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {formLoading ? 'Creating...' : 'Create Adjustment'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); resetForm(); }}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid gap-6">
                    {adjustments.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No stock adjustments yet</p>
                        </div>
                    ) : (
                        adjustments.map((adj) => (
                            <div key={adj.id} className="glass rounded-2xl p-6 card-hover">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-lg ${adj.quantityChange > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {adj.quantityChange > 0 ? (
                                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                                ) : (
                                                    <TrendingDown className="w-6 h-6 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{adj.adjustmentNumber}</h3>
                                                <p className="text-sm text-gray-500">{adj.reason}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">{adj.location.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">{new Date(adj.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {adj.notes && (
                                            <p className="text-sm text-gray-600 mt-3 italic">{adj.notes}</p>
                                        )}

                                        <div className="mt-3 text-xs text-gray-500">
                                            Adjusted by: {adj.user.name}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className={`text-3xl font-bold ${adj.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange}
                                        </span>
                                        <p className="text-xs text-gray-500">units</p>
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
