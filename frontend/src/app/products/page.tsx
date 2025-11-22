'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface Product {
    id: string;
    name: string;
    description: string | null;
    sku: string;
    unit: string;
    minStock: number;
    totalStock: number;
    isLowStock: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        receiptItems: number;
        deliveryItems: number;
    };
    stocks: Array<{
        locationId: string;
        locationName: string;
        quantity: number;
    }>;
}

interface ProductFormData {
    name: string;
    description: string;
    sku: string;
    unit: string;
    minStock: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        sku: '',
        unit: '',
        minStock: 0
    });
    const [formLoading, setFormLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const { user } = useAuth();

    useEffect(() => {
        fetchProducts();
    }, [search, pagination.page]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/products?page=${pagination.page}&limit=${pagination.limit}&search=${search}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data.products);
            setPagination(data.pagination);
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
            const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
            const method = editingProduct ? 'PUT' : 'POST';

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

            await fetchProducts();
            resetForm();
            setShowForm(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            sku: product.sku,
            unit: product.unit,
            minStock: product.minStock
        });
        setShowForm(true);
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Delete failed');
            }

            await fetchProducts();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            sku: '',
            unit: '',
            minStock: 0
        });
        setEditingProduct(null);
    };

    const canCreateProducts = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';
    const canEditProducts = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';
    const canDeleteProducts = user?.role === 'ADMIN';

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-3 text-gray-600">Loading products...</span>
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
                        Products Management
                    </h1>
                    <p className="text-gray-600 mt-2">Manage your inventory products and stock levels</p>
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
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        {canCreateProducts && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                            >
                                + Add Product
                            </button>
                        )}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                </div>
                                {product.isLowStock && (
                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        Low Stock
                                    </span>
                                )}
                            </div>

                            {product.description && (
                                <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                            )}

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Stock:</span>
                                    <span className={`font-medium ${product.isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                                        {product.totalStock} {product.unit}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Min Stock:</span>
                                    <span className="text-gray-900">{product.minStock} {product.unit}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Transactions:</span>
                                    <span className="text-gray-900">
                                        {product._count.receiptItems + product._count.deliveryItems}
                                    </span>
                                </div>
                            </div>

                            {/* Stock by Location */}
                            {product.stocks && product.stocks.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Stock by Location:</p>
                                    <div className="space-y-1">
                                        {product.stocks.map((stock) => (
                                            <div key={stock.locationId} className="flex justify-between text-xs">
                                                <span className="text-gray-600">{stock.locationName}:</span>
                                                <span className="text-gray-900">{stock.quantity} {product.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                                {canEditProducts && (
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                    >
                                        Edit
                                    </button>
                                )}
                                {canDeleteProducts && (
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center items-center gap-2 mb-8">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-600">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                            disabled={pagination.page === pagination.pages}
                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Add/Edit Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter product name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        SKU *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter SKU"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., pieces, kg, liters"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Minimum Stock Level
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.minStock}
                                        onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Enter product description"
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
                                        {formLoading ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
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