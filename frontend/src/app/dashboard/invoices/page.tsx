'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Download, Eye, Edit, Trash2, DollarSign, Calendar, User } from 'lucide-react';

interface Invoice {
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    customerAddress: string | null;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    totalAmount: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    dueDate: string | null;
    paidDate: string | null;
    notes: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    items: InvoiceItem[];
}

interface InvoiceItem {
    id: string;
    productId: string;
    description: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
        id: string;
        name: string;
        sku: string;
        unit: string;
    };
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    unit: string;
}

interface InvoiceStats {
    total: number;
    byStatus: {
        draft: number;
        sent: number;
        paid: number;
        overdue: number;
    };
    revenue: {
        total: number;
        pending: number;
    };
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<InvoiceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        taxRate: 0,
        discount: 0,
        dueDate: '',
        notes: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0 }]
    });

    useEffect(() => {
        fetchAll();
    }, [filterStatus]);

    const fetchAll = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);

            const [invoicesRes, productsRes, statsRes] = await Promise.all([
                fetch(`/api/invoices?${params}`, { headers }),
                fetch('/api/products', { headers }),
                fetch('/api/invoices/stats', { headers })
            ]);

            const invoicesData = await invoicesRes.json();
            const productsData = await productsRes.json();
            const statsData = await statsRes.json();

            setInvoices(invoicesData.invoices || []);
            setProducts(productsData.products || []);
            setStats(statsData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create invoice');
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
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customerAddress: '',
            taxRate: 0,
            discount: 0,
            dueDate: '',
            notes: '',
            items: [{ productId: '', quantity: 1, unitPrice: 0 }]
        });
        setError('');
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0 }]
        });
    };

    const removeItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                newItems[index].unitPrice = product.price;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const downloadPDF = async (id: string, invoiceNumber: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/invoices/${id}/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/invoices', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, status, ...(status === 'PAID' ? { paidDate: new Date().toISOString() } : {}) })
            });
            await fetchAll();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteInvoice = async (id: string) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/invoices?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await fetchAll();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700';
            case 'SENT': return 'bg-blue-100 text-blue-700';
            case 'OVERDUE': return 'bg-red-100 text-red-700';
            case 'CANCELLED': return 'bg-gray-100 text-gray-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            const price = item.unitPrice || product?.price || 0;
            return sum + (price * item.quantity);
        }, 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const tax = (subtotal * formData.taxRate) / 100;
        return subtotal + tax - formData.discount;
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
                        <h1 className="text-4xl font-bold gradient-text mb-2">Invoices</h1>
                        <p className="text-gray-600">Create and manage customer invoices</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Invoice
                    </button>
                </div>

                {error && (
                    <div className="glass rounded-xl p-4 mb-6 bg-red-50 border border-red-200">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-6 h-6 text-blue-600" />
                                <span className="text-sm text-gray-600">Total</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <span className="text-sm text-gray-600">Draft</span>
                            <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.draft}</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <span className="text-sm text-gray-600">Sent</span>
                            <p className="text-2xl font-bold text-blue-600">{stats.byStatus.sent}</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <span className="text-sm text-gray-600">Paid</span>
                            <p className="text-2xl font-bold text-green-600">{stats.byStatus.paid}</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <span className="text-sm text-gray-600">Total Revenue</span>
                            <p className="text-2xl font-bold text-green-600">${stats.revenue.total.toFixed(2)}</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <span className="text-sm text-gray-600">Pending</span>
                            <p className="text-2xl font-bold text-orange-600">${stats.revenue.pending.toFixed(2)}</p>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 glass"
                    >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="PAID">Paid</option>
                        <option value="OVERDUE">Overdue</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="glass rounded-2xl p-8 max-w-4xl w-full my-8">
                            <h2 className="text-2xl font-bold mb-6">Create New Invoice</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Customer Name *</label>
                                        <input
                                            type="text"
                                            value={formData.customerName}
                                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={formData.customerEmail}
                                            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.customerPhone}
                                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Address</label>
                                    <textarea
                                        value={formData.customerAddress}
                                        onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-medium">Invoice Items *</label>
                                        <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                            + Add Item
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.items.map((item, index) => (
                                            <div key={index} className="grid grid-cols-12 gap-2">
                                                <select
                                                    value={item.productId}
                                                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                                    className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    min="1"
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                                                    className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    step="0.01"
                                                    required
                                                />
                                                <span className="col-span-1 flex items-center text-sm text-gray-600">
                                                    ${(item.quantity * item.unitPrice).toFixed(2)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="col-span-1 text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                                        <input
                                            type="number"
                                            value={formData.taxRate}
                                            onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Discount ($)</label>
                                        <input
                                            type="number"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <div className="glass rounded-lg p-4 w-full">
                                            <span className="text-sm text-gray-600">Total Amount</span>
                                            <p className="text-2xl font-bold text-green-600">${calculateTotal().toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {formLoading ? 'Creating...' : 'Create Invoice'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); resetForm(); }}
                                        className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {invoices.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No invoices yet</p>
                        </div>
                    ) : (
                        invoices.map((invoice) => (
                            <div key={invoice.id} className="glass rounded-2xl p-6 card-hover">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{invoice.customerName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-gray-400" />
                                                <span className="text-lg font-bold text-green-600">${invoice.totalAmount.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            {invoice.items.length} item(s) • Created by {invoice.user.name}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => downloadPDF(invoice.id, invoice.invoiceNumber)}
                                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                                            title="Download PDF"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                        {invoice.status === 'DRAFT' && (
                                            <button
                                                onClick={() => updateStatus(invoice.id, 'SENT')}
                                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all"
                                                title="Mark as Sent"
                                            >
                                                Send
                                            </button>
                                        )}
                                        {invoice.status === 'SENT' && (
                                            <button
                                                onClick={() => updateStatus(invoice.id, 'PAID')}
                                                className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all"
                                                title="Mark as Paid"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteInvoice(invoice.id)}
                                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                                            title="Delete"
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
