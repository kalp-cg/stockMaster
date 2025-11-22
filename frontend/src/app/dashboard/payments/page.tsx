'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, CreditCard, TrendingUp, AlertCircle, Plus, Trash2, Calendar, User, FileText } from 'lucide-react';

interface Payment {
    id: string;
    paymentNumber: string;
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    transactionId?: string;
    notes?: string;
    createdAt: string;
    invoice: {
        id: string;
        invoiceNumber: string;
        customerName: string;
        totalAmount: number;
        paidAmount: number;
        balanceAmount: number;
        status: string;
    };
    user: {
        id: string;
        name: string;
        email: string;
    };
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
}

interface PaymentStats {
    totalPayments: number;
    totalAmount: number;
    paymentsByMethod: Array<{
        method: string;
        count: number;
        amount: number;
    }>;
    outstanding: {
        invoices: number;
        amount: number;
    };
}

export default function PaymentsPage() {
    const { token } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: 'CASH',
        transactionId: '',
        notes: ''
    });

    useEffect(() => {
        fetchPayments();
        fetchStats();
        fetchUnpaidInvoices();
    }, []);

    const fetchPayments = async () => {
        try {
            const response = await fetch('/api/payments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setPayments(data.payments);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/payments/stats', {
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

    const fetchUnpaidInvoices = async () => {
        try {
            const response = await fetch('/api/invoices?status=SENT,PARTIAL,OVERDUE', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setUnpaidInvoices(data.invoices || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching unpaid invoices:', error);
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    invoiceId: selectedInvoice.id,
                    amount: parseFloat(formData.amount),
                    paymentMethod: formData.paymentMethod,
                    transactionId: formData.transactionId || undefined,
                    notes: formData.notes || undefined
                })
            });

            if (response.ok) {
                alert('Payment recorded successfully');
                setShowPaymentModal(false);
                setSelectedInvoice(null);
                setFormData({ amount: '', paymentMethod: 'CASH', transactionId: '', notes: '' });
                fetchPayments();
                fetchStats();
                fetchUnpaidInvoices();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment');
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm('Are you sure you want to delete this payment? This will reverse the payment and update the invoice balance.')) return;

        try {
            const response = await fetch(`/api/payments/${paymentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Payment deleted successfully');
                fetchPayments();
                fetchStats();
                fetchUnpaidInvoices();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Failed to delete payment');
        }
    };

    const openPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setFormData({ 
            amount: invoice.balanceAmount.toString(), 
            paymentMethod: 'CASH', 
            transactionId: '', 
            notes: '' 
        });
        setShowPaymentModal(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
            case 'OVERDUE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        if (method.includes('CARD')) return <CreditCard className="w-4 h-4" />;
        return <DollarSign className="w-4 h-4" />;
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
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Payment Tracking</h1>
                <p className="text-gray-600 mt-1">Manage payments and track outstanding balances</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Payments</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Collected</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Outstanding Invoices</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.outstanding.invoices}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <FileText className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Outstanding Amount</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.outstanding.amount)}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unpaid Invoices */}
            {unpaidInvoices.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Unpaid Invoices</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Invoice #</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Customer</th>
                                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Total</th>
                                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Paid</th>
                                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Balance</th>
                                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unpaidInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-sm">{invoice.invoiceNumber}</td>
                                        <td className="p-3 text-sm">{invoice.customerName}</td>
                                        <td className="p-3 text-sm text-right">{formatCurrency(invoice.totalAmount)}</td>
                                        <td className="p-3 text-sm text-right">{formatCurrency(invoice.paidAmount)}</td>
                                        <td className="p-3 text-sm text-right font-semibold">{formatCurrency(invoice.balanceAmount)}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => openPaymentModal(invoice)}
                                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm flex items-center gap-1 mx-auto"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Record Payment
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left p-3 text-sm font-semibold text-gray-600">Payment #</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-600">Invoice #</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-600">Customer</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-600">Amount</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-600">Method</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-600">Date</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-600">Recorded By</th>
                                <th className="text-center p-3 text-sm font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 text-sm font-medium">{payment.paymentNumber}</td>
                                    <td className="p-3 text-sm">{payment.invoice.invoiceNumber}</td>
                                    <td className="p-3 text-sm">{payment.invoice.customerName}</td>
                                    <td className="p-3 text-sm text-right font-semibold">{formatCurrency(payment.amount)}</td>
                                    <td className="p-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            {getPaymentMethodIcon(payment.paymentMethod)}
                                            {payment.paymentMethod.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm">
                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                    </td>
                                    <td className="p-3 text-sm">{payment.user.name}</td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => handleDeletePayment(payment.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Record Payment</h2>
                        
                        <div className="mb-4 p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600">Invoice: <span className="font-semibold">{selectedInvoice.invoiceNumber}</span></p>
                            <p className="text-sm text-gray-600">Customer: <span className="font-semibold">{selectedInvoice.customerName}</span></p>
                            <p className="text-sm text-gray-600">Total Amount: <span className="font-semibold">{formatCurrency(selectedInvoice.totalAmount)}</span></p>
                            <p className="text-sm text-gray-600">Paid Amount: <span className="font-semibold">{formatCurrency(selectedInvoice.paidAmount)}</span></p>
                            <p className="text-sm text-gray-600">Outstanding Balance: <span className="font-semibold text-red-600">{formatCurrency(selectedInvoice.balanceAmount)}</span></p>
                        </div>

                        <form onSubmit={handleRecordPayment}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    max={selectedInvoice.balanceAmount}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method *
                                </label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CREDIT_CARD">Credit Card</option>
                                    <option value="DEBIT_CARD">Debit Card</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CHECK">Check</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Transaction ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.transactionId}
                                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Record Payment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setSelectedInvoice(null);
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
