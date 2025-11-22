'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth, Permission } from '@/hooks/useAuth';
import { 
    ShoppingCart, 
    Plus, 
    Check, 
    Package, 
    Eye, 
    X, 
    Search,
    Trash2,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight,
    ArrowLeft,
    Save,
    Send,
    Edit2,
    Home,
    Download,
    FileText,
    Printer,
    MoreVertical
} from 'lucide-react';

interface Receipt {
    id: string;
    receiptNumber: string;
    vendor?: { id: string; name: string };
    location?: { id: string; name: string };
    status: string;
    createdAt: string;
    createdBy?: { name: string };
    validatedAt?: string;
    validatedBy?: { name: string };
    reference?: string;
    notes?: string;
    items: ReceiptItem[];
}

interface ReceiptItem {
    id?: string;
    product: { id: string; name: string; sku: string };
    orderedQuantity: number;
    receivedQuantity: number;
    notes?: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
}

/**
 * Receipt Status Workflow:
 * 
 * DRAFT → WAITING → DONE (or CANCELED)
 * 
 * 1. DRAFT: Staff creates receipt, can edit/save as draft
 * 2. WAITING: Staff submits for validation, Manager reviews
 * 3. DONE: Manager validates receipt, stock quantities updated
 * 4. CANCELED: Receipt rejected/canceled at any stage
 * 
 * Download Rules:
 * - Only DONE receipts can be downloaded
 * - Only Inventory Manager and Admin can download
 * - Staff cannot download receipts
 */
export default function ReceiptsPage() {
    const { user, hasPermission } = useAuth();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'view'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [productSearch, setProductSearch] = useState('');
    
    const [formData, setFormData] = useState({
        vendorId: '',
        locationId: '',
        reference: '',
        notes: '',
        items: [] as Array<{
            productId: string;
            product?: Product;
            orderedQuantity: number;
            receivedQuantity: number;
            notes: string;
        }>,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [receiptsData, productsData, vendorsData, locationsData] = await Promise.all([
                api.getReceipts(),
                api.getProducts(),
                api.getVendors(),
                api.getLocations(),
            ]);
            setReceipts(receiptsData.receipts || []);
            setProducts(productsData.products || []);
            setVendors(vendorsData.vendors || []);
            setLocations(locationsData.locations || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: 'Draft' },
            WAITING: { bg: 'bg-status-warning/10', text: 'text-status-warning', icon: AlertCircle, label: 'Waiting' },
            PENDING: { bg: 'bg-status-warning/10', text: 'text-status-warning', icon: AlertCircle, label: 'Waiting' },
            DONE: { bg: 'bg-status-success/10', text: 'text-status-success', icon: CheckCircle, label: 'Done' },
            VALIDATED: { bg: 'bg-status-success/10', text: 'text-status-success', icon: CheckCircle, label: 'Done' },
            CANCELED: { bg: 'bg-status-error/10', text: 'text-status-error', icon: XCircle, label: 'Canceled' },
        };
        const badge = badges[status as keyof typeof badges] || badges.DRAFT;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                <Icon className="w-3.5 h-3.5" />
                {badge.label}
            </span>
        );
    };

    const addProduct = (product: Product) => {
        if (formData.items.some(item => item.productId === product.id)) {
            alert('Product already added');
            return;
        }
        setFormData({
            ...formData,
            items: [...formData.items, {
                productId: product.id,
                product: product,
                orderedQuantity: 0,
                receivedQuantity: 0,
                notes: ''
            }]
        });
        setProductSearch('');
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const handleSaveDraft = async () => {
        if (!formData.vendorId || !formData.locationId || formData.items.length === 0) {
            alert('Please fill in vendor, location, and add at least one item');
            return;
        }
        try {
            // Transform data to match backend API format
            const payload = {
                vendorId: formData.vendorId,
                locationId: formData.locationId,
                notes: formData.notes,
                items: formData.items.map(item => ({
                    productId: item.productId,
                    quantityReceived: item.receivedQuantity || 0
                }))
            };
            await api.createReceipt(payload);
            alert('Receipt saved as draft');
            setViewMode('list');
            resetForm();
            loadData();
        } catch (error: any) {
            alert(error.message || 'Failed to save draft');
        }
    };

    const handleSubmitForValidation = async () => {
        if (!formData.vendorId || !formData.locationId || formData.items.length === 0) {
            alert('Please fill in all required fields');
            return;
        }
        if (formData.items.some(item => item.receivedQuantity === 0)) {
            if (!confirm('Some items have 0 received quantity. Continue?')) return;
        }
        try {
            // Transform data to match backend API format
            const payload = {
                vendorId: formData.vendorId,
                locationId: formData.locationId,
                notes: formData.notes,
                items: formData.items.map(item => ({
                    productId: item.productId,
                    quantityReceived: item.receivedQuantity || 0
                }))
            };
            await api.createReceipt(payload);
            alert('Receipt submitted for validation');
            setViewMode('list');
            resetForm();
            loadData();
        } catch (error: any) {
            alert(error.message || 'Failed to submit receipt');
        }
    };

    const handleValidate = async (receiptId: string) => {
        if (!confirm('Validate this receipt? This will update stock quantities.')) return;
        try {
            await api.validateReceipt(receiptId);
            alert('Receipt validated successfully');
            loadData();
            if (selectedReceipt) {
                const updated = receipts.find(r => r.id === receiptId);
                if (updated) setSelectedReceipt({ ...updated, status: 'DONE' });
            }
        } catch (error: any) {
            alert(error.message || 'Failed to validate receipt');
        }
    };

    const resetForm = () => {
        setFormData({
            vendorId: '',
            locationId: '',
            reference: '',
            notes: '',
            items: []
        });
    };

    // Check if user can download receipt
    const canDownloadReceipt = (receipt: Receipt) => {
        // Only DONE/VALIDATED receipts can be downloaded
        if (receipt.status !== 'DONE' && receipt.status !== 'VALIDATED') return false;
        
        // Admin can download any validated receipt
        if (user?.role === 'ADMIN') return true;
        
        // Inventory Manager can download validated receipts
        if (hasPermission(Permission.VALIDATE_RECEIPTS)) return true;
        
        // Staff cannot download
        return false;
    };

    // Generate PDF content for receipt
    const generateReceiptPDF = (receipt: Receipt) => {
        const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt ${receipt.receiptNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #2A2A2A; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #714B67; padding-bottom: 20px; }
        .company-name { font-size: 28px; font-weight: bold; color: #714B67; margin-bottom: 5px; }
        .document-title { font-size: 20px; color: #4C4C4C; margin-top: 10px; }
        .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .info-box { padding: 15px; background: #F8F8F8; border-left: 4px solid #714B67; }
        .info-label { font-size: 11px; color: #8A8A8A; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 14px; font-weight: bold; color: #2A2A2A; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #21B799; color: white; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { background: #714B67; color: white; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
        td { padding: 10px 12px; border-bottom: 1px solid #E3E3E3; font-size: 13px; }
        tr:hover { background: #F8F8F8; }
        .difference-warning { color: #F5A623; font-weight: bold; }
        .difference-ok { color: #21B799; font-weight: bold; }
        .notes-section { margin-top: 30px; padding: 15px; background: #F8F8F8; border-radius: 5px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #E3E3E3; text-align: center; color: #8A8A8A; font-size: 11px; }
        .signature-space { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .signature-line { border-top: 2px solid #2A2A2A; padding-top: 10px; text-align: center; font-size: 12px; color: #4C4C4C; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">STOCKMASTER</div>
        <div class="document-title">Receipt Document</div>
    </div>

    <div style="text-align: center; margin: 20px 0;">
        <span class="status-badge">DONE</span>
    </div>

    <div class="info-section">
        <div class="info-box">
            <div class="info-label">Receipt Number</div>
            <div class="info-value">${receipt.receiptNumber}</div>
        </div>
        <div class="info-box">
            <div class="info-label">Vendor</div>
            <div class="info-value">${receipt.vendor?.name || 'N/A'}</div>
        </div>
        <div class="info-box">
            <div class="info-label">Warehouse Location</div>
            <div class="info-value">${receipt.location?.name || 'N/A'}</div>
        </div>
        <div class="info-box">
            <div class="info-label">Reference</div>
            <div class="info-value">${receipt.reference || 'N/A'}</div>
        </div>
        <div class="info-box">
            <div class="info-label">Created Date</div>
            <div class="info-value">${new Date(receipt.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="info-box">
            <div class="info-label">Created By</div>
            <div class="info-value">${receipt.createdBy?.name || 'N/A'}</div>
        </div>
        <div class="info-box">
            <div class="info-label">Validated Date</div>
            <div class="info-value">${receipt.validatedAt ? new Date(receipt.validatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
        </div>
        <div class="info-box">
            <div class="info-label">Validated By</div>
            <div class="info-value">${receipt.validatedBy?.name || 'N/A'}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Product</th>
                <th>SKU</th>
                <th style="text-align: center;">Quantity Ordered</th>
                <th style="text-align: center;">Quantity Received</th>
                <th style="text-align: center;">Difference</th>
                <th>UOM</th>
            </tr>
        </thead>
        <tbody>
            ${receipt.items.map(item => {
                const diff = item.receivedQuantity - item.orderedQuantity;
                return `
                <tr>
                    <td><strong>${item.product.name}</strong></td>
                    <td style="color: #8A8A8A; font-family: monospace;">${item.product.sku}</td>
                    <td style="text-align: center;">${item.orderedQuantity}</td>
                    <td style="text-align: center;"><strong>${item.receivedQuantity}</strong></td>
                    <td style="text-align: center;" class="${diff === 0 ? 'difference-ok' : 'difference-warning'}">
                        ${diff === 0 ? '✓' : (diff > 0 ? `+${diff}` : diff)}
                    </td>
                    <td>Units</td>
                </tr>
                `;
            }).join('')}
        </tbody>
    </table>

    ${receipt.notes ? `
    <div class="notes-section">
        <div class="info-label">Notes / Mismatch Reason</div>
        <div style="margin-top: 10px; color: #2A2A2A;">${receipt.notes}</div>
    </div>
    ` : ''}

    <div class="signature-space">
        <div class="signature-line">
            <div>Warehouse Staff Signature</div>
        </div>
        <div class="signature-line">
            <div>Manager Approval Signature</div>
        </div>
    </div>

    <div class="footer">
        <div>This is an official warehouse document generated by StockMaster ERP System</div>
        <div style="margin-top: 5px;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
    </div>
</body>
</html>
        `;
        return content;
    };

    const handlePrintReceipt = (receipt: Receipt) => {
        if (!canDownloadReceipt(receipt)) {
            alert('You do not have permission to print this receipt.');
            return;
        }

        const content = generateReceiptPDF(receipt);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(content);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                }, 250);
            };
        }
    };

    const handleDownloadPDF = (receipt: Receipt) => {
        if (!canDownloadReceipt(receipt)) {
            alert('You do not have permission to download this receipt.');
            return;
        }

        const content = generateReceiptPDF(receipt);
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receipt_${receipt.receiptNumber}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const handleDownloadCSV = (receipt: Receipt) => {
        if (!canDownloadReceipt(receipt)) {
            alert('You do not have permission to download this receipt.');
            return;
        }

        const headers = ['Product', 'SKU', 'Quantity Ordered', 'Quantity Received', 'Difference', 'UOM'];
        const rows = receipt.items.map(item => [
            item.product.name,
            item.product.sku,
            item.orderedQuantity.toString(),
            item.receivedQuantity.toString(),
            (item.receivedQuantity - item.orderedQuantity).toString(),
            'Units'
        ]);

        const csvContent = [
            `Receipt Number,${receipt.receiptNumber}`,
            `Vendor,${receipt.vendor?.name || 'N/A'}`,
            `Warehouse,${receipt.location?.name || 'N/A'}`,
            `Created Date,${new Date(receipt.createdAt).toLocaleDateString()}`,
            `Created By,${receipt.createdBy?.name || 'N/A'}`,
            `Status,${receipt.status}`,
            '',
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receipt_${receipt.receiptNumber}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredProducts = products.filter(p => 
        productSearch === '' || 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );

    const filteredReceipts = receipts.filter(r =>
        searchTerm === '' ||
        r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.vendor?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTotalItems = () => formData.items.length;
    const getTotalReceived = () => formData.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
    const getTotalDifferences = () => formData.items.filter(item => item.orderedQuantity !== item.receivedQuantity).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odoo-purple"></div>
            </div>
        );
    }

    // LIST VIEW
    if (viewMode === 'list') {
        return (
            <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-text-muted">
                    <Link href="/dashboard" className="hover:text-odoo-purple">Dashboard</Link>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <span className="text-text-primary font-medium">Receipts</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Receipts</h1>
                        <p className="text-text-secondary mt-1">Manage incoming stock from vendors</p>
                    </div>
                    {hasPermission(Permission.CREATE_RECEIPTS) && (
                        <button
                            onClick={() => setViewMode('create')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-odoo-purple text-white rounded-lg hover:bg-odoo-purple-soft transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            New Receipt
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-lg border border-border-light shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by receipt number or vendor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-border-light rounded-lg focus:ring-2 focus:ring-odoo-purple focus:border-transparent text-text-primary"
                        />
                    </div>
                </div>

                {/* Receipts Table */}
                <div className="bg-white rounded-lg border border-border-light shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-border-light">
                        <thead className="bg-table-header">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                                    Receipt #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                                    Vendor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-text-primary uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border-light">
                            {filteredReceipts.map((receipt) => (
                                <tr key={receipt.id} className="hover:bg-hover-gray transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-mono font-semibold text-odoo-purple">
                                            {receipt.receiptNumber}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                        {receipt.vendor?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                        {receipt.location?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                        {receipt.items.length} items
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(receipt.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                                        {new Date(receipt.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedReceipt(receipt);
                                                setViewMode('view');
                                            }}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-odoo-purple hover:bg-hover-gray rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                        {(receipt.status === 'DONE' || receipt.status === 'VALIDATED') && canDownloadReceipt(receipt) && (
                                            <button
                                                onClick={() => handleDownloadPDF(receipt)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-odoo-purple hover:bg-hover-gray rounded-lg transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download className="w-4 h-4" />
                                                PDF
                                            </button>
                                        )}
                                        {(receipt.status === 'WAITING' || receipt.status === 'PENDING') && hasPermission(Permission.VALIDATE_RECEIPTS) && (
                                            <button
                                                onClick={() => handleValidate(receipt.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-status-success text-white rounded-lg hover:bg-status-success/90 transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                                Validate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredReceipts.length === 0 && (
                        <div className="text-center py-16">
                            <ShoppingCart className="mx-auto w-16 h-16 text-text-disabled" />
                            <h3 className="mt-4 text-lg font-medium text-text-primary">No receipts found</h3>
                            <p className="mt-2 text-sm text-text-muted">
                                {searchTerm ? 'Try adjusting your search' : 'Create your first receipt to start tracking incoming stock'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // CREATE VIEW
    if (viewMode === 'create') {
        const getStatusText = () => {
            return 'Draft';
        };

        return (
            <div className="space-y-5 max-w-7xl">
                {/* Breadcrumb - Operations > Receipts > New */}
                <div className="bg-white border border-border-light rounded-lg px-5 py-3">
                    <div className="flex items-center text-sm text-text-muted">
                        <Home className="w-4 h-4 mr-2" />
                        <Link href="/dashboard" className="hover:text-odoo-purple">Operations</Link>
                        <ChevronRight className="w-3.5 h-3.5 mx-2" />
                        <button onClick={() => setViewMode('list')} className="hover:text-odoo-purple">Receipts</button>
                        <ChevronRight className="w-3.5 h-3.5 mx-2" />
                        <span className="text-text-primary font-medium">New</span>
                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────── */}
                {/* Header Section */}
                {/* ─────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-lg border border-border-light shadow-sm">
                    <div className="px-6 py-4 border-b border-border-light bg-table-header">
                        <h2 className="text-base font-semibold text-text-primary">Header Section</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                        Receipt # <span className="text-text-muted text-xs">(Auto-generated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value="RCP-NEW"
                                        disabled
                                        className="w-full px-3 py-2 border border-border-light rounded-md bg-hover-gray text-text-muted font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                        Vendor <span className="text-status-error">*</span>
                                    </label>
                                    <select
                                        value={formData.vendorId}
                                        onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-odoo-purple focus:border-transparent text-text-primary text-sm"
                                    >
                                        <option value="">Select vendor</option>
                                        {vendors.map((v) => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                        Warehouse <span className="text-status-error">*</span>
                                    </label>
                                    <select
                                        value={formData.locationId}
                                        onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-odoo-purple focus:border-transparent text-text-primary text-sm"
                                    >
                                        <option value="">Select location</option>
                                        {locations.map((l) => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                        Reference
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-odoo-purple focus:border-transparent text-text-primary text-sm"
                                        placeholder="Optional purchase order / note"
                                    />
                                </div>
                            </div>
                            
                            {/* Right Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                        Status
                                    </label>
                                    <div className="w-full px-3 py-2 border border-border-light rounded-md bg-hover-gray">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Draft
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                        Date Created
                                    </label>
                                    <input
                                        type="text"
                                        value={new Date().toLocaleDateString()}
                                        disabled
                                        className="w-full px-3 py-2 border border-border-light rounded-md bg-hover-gray text-text-muted text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                        Created By
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.name || ''}
                                        disabled
                                        className="w-full px-3 py-2 border border-border-light rounded-md bg-hover-gray text-text-muted text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────── */}
                {/* Product Entry Section */}
                {/* ─────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-lg border border-border-light shadow-sm">
                    <div className="px-6 py-4 border-b border-border-light bg-table-header">
                        <h2 className="text-base font-semibold text-text-primary">Product Entry Section</h2>
                    </div>
                    <div className="p-6">
                        {/* Product Search */}
                        <div className="mb-5 relative">
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Product Search Input <span className="text-text-muted text-xs">(Search by name or SKU)</span>
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Type to search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-border-light rounded-md focus:ring-2 focus:ring-odoo-purple focus:border-transparent text-text-primary text-sm"
                                />
                            </div>
                            {productSearch && filteredProducts.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white border-2 border-odoo-purple rounded-md shadow-xl max-h-64 overflow-y-auto">
                                    <div className="px-3 py-2 bg-hover-gray border-b border-border-light">
                                        <span className="text-xs font-semibold text-text-secondary uppercase">Add Item Dropdown</span>
                                    </div>
                                    {filteredProducts.slice(0, 10).map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addProduct(product)}
                                            className="w-full px-4 py-2.5 hover:bg-hover-gray transition-colors text-left flex justify-between items-center border-b border-border-light last:border-b-0"
                                        >
                                            <div>
                                                <div className="font-medium text-text-primary text-sm">{product.name}</div>
                                                <div className="text-xs text-text-muted">SKU: {product.sku}</div>
                                            </div>
                                            <div className="text-xs text-text-secondary bg-hover-gray px-2 py-1 rounded">
                                                Stock: {product.currentStock}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        {formData.items.length > 0 ? (
                            <div className="border-2 border-border-light rounded-md overflow-hidden">
                                <table className="min-w-full divide-y divide-border-light">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary">Product</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary">SKU</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-primary">Ordered Qty</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-primary">Received Qty</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-primary">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-border-light">
                                        {formData.items.map((item, index) => {
                                            const hasDifference = item.orderedQuantity !== item.receivedQuantity;
                                            return (
                                                <tr key={index} className="hover:bg-hover-gray">
                                                    <td className="px-4 py-3 text-sm text-text-primary font-medium">
                                                        {item.product?.name || 'Unknown Product'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-text-muted font-mono">
                                                        {item.product?.sku || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.orderedQuantity}
                                                            onChange={(e) => updateItem(index, 'orderedQuantity', parseInt(e.target.value) || 0)}
                                                            className="w-20 px-2 py-1.5 border border-border-light rounded text-center focus:ring-2 focus:ring-odoo-purple text-text-primary text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.receivedQuantity}
                                                            onChange={(e) => updateItem(index, 'receivedQuantity', parseInt(e.target.value) || 0)}
                                                            className={`w-20 px-2 py-1.5 border rounded text-center focus:ring-2 focus:ring-odoo-purple text-text-primary font-semibold text-sm ${
                                                                hasDifference
                                                                    ? 'border-status-warning bg-yellow-50 border-2'
                                                                    : 'border-border-light'
                                                            }`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-status-error hover:bg-red-50 rounded transition-colors font-medium"
                                                            title="Remove item"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed border-border-light rounded-md bg-hover-gray">
                                <Package className="mx-auto w-14 h-14 text-text-disabled mb-3" />
                                <p className="text-sm font-medium text-text-secondary">No products added yet</p>
                                <p className="text-xs text-text-muted mt-1">Use the search above to add products</p>
                            </div>
                        )}

                        {/* Add Product Button */}
                        {formData.items.length > 0 && (
                            <button
                                onClick={() => {
                                    const input = document.querySelector('input[placeholder="Type to search products..."]') as HTMLInputElement;
                                    if (input) input.focus();
                                }}
                                className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-odoo-purple hover:bg-hover-gray border border-border-light rounded-md transition-colors font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add Product
                            </button>
                        )}
                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────── */}
                {/* Summary / Ledger Info */}
                {/* ─────────────────────────────────────────────────────── */}
                {formData.items.length > 0 && (
                    <div className="bg-white rounded-lg border border-border-light shadow-sm">
                        <div className="px-6 py-4 border-b border-border-light bg-table-header">
                            <h2 className="text-base font-semibold text-text-primary">Summary / Ledger Info</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-3 gap-6 mb-4">
                                <div className="bg-hover-gray rounded-md p-4 border border-border-light">
                                    <div className="text-xs text-text-muted mb-1">Total Items</div>
                                    <div className="text-2xl font-bold text-text-primary">{getTotalItems()}</div>
                                </div>
                                <div className="bg-hover-gray rounded-md p-4 border border-border-light">
                                    <div className="text-xs text-text-muted mb-1">Total Received</div>
                                    <div className="text-2xl font-bold text-text-primary">{getTotalReceived()}</div>
                                </div>
                                <div className="bg-hover-gray rounded-md p-4 border border-border-light">
                                    <div className="text-xs text-text-muted mb-1">Pending Differences</div>
                                    <div className={`text-2xl font-bold ${getTotalDifferences() > 0 ? 'text-status-warning' : 'text-status-success'}`}>
                                        {getTotalDifferences()}
                                        {getTotalDifferences() > 0 && (
                                            <span className="text-xs font-normal text-text-muted ml-2">
                                                ({formData.items.filter(i => i.orderedQuantity !== i.receivedQuantity)
                                                    .map(i => `${Math.abs(i.receivedQuantity - i.orderedQuantity)} units from ${i.product?.name}`)
                                                    .slice(0, 1).join(', ')})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {getTotalDifferences() > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Reason Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-odoo-purple text-text-primary text-sm"
                                        placeholder="Explain quantity differences (e.g., 2 units missing from Steel Rods due to damage during transport)"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────── */}
                {/* Action Buttons */}
                {/* ─────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-lg border border-border-light shadow-sm">
                    <div className="px-6 py-4 border-b border-border-light bg-table-header">
                        <h2 className="text-base font-semibold text-text-primary">Action Buttons</h2>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <button
                            onClick={() => {
                                if (confirm('Discard changes and return to list?')) {
                                    setViewMode('list');
                                    resetForm();
                                }
                            }}
                            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveDraft}
                                disabled={!formData.vendorId || !formData.locationId || formData.items.length === 0}
                                className="flex items-center gap-2 px-6 py-2.5 border-2 border-gray-400 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                            >
                                <Save className="w-4 h-4" />
                                Save as Draft
                            </button>
                            <button
                                onClick={handleSubmitForValidation}
                                disabled={!formData.vendorId || !formData.locationId || formData.items.length === 0}
                                className="flex items-center gap-2 px-6 py-2.5 bg-odoo-purple text-white rounded-md hover:bg-odoo-purple-dark transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed text-sm shadow-sm"
                            >
                                <Send className="w-4 h-4" />
                                Submit for Validation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // VIEW MODE
    if (viewMode === 'view' && selectedReceipt) {
        return (
            <div className="space-y-6 max-w-6xl">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-text-muted">
                    <button onClick={() => setViewMode('list')} className="hover:text-odoo-purple">Receipts</button>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <span className="text-text-primary font-medium">{selectedReceipt.receiptNumber}</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode('list')}
                            className="p-2 hover:bg-hover-gray rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-text-secondary" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">{selectedReceipt.receiptNumber}</h1>
                            <p className="text-text-secondary mt-1">Receipt Details</p>
                        </div>
                    </div>
                    <div>
                        {getStatusBadge(selectedReceipt.status)}
                    </div>
                </div>

                {/* Receipt Details */}
                <div className="bg-white rounded-lg border border-border-light shadow-sm p-6 space-y-6">
                    {/* Header Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-border-light">
                        <div>
                            <div className="text-sm text-text-muted mb-1">Vendor</div>
                            <div className="font-semibold text-text-primary">{selectedReceipt.vendor?.name || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-text-muted mb-1">Warehouse</div>
                            <div className="font-semibold text-text-primary">{selectedReceipt.location?.name || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-text-muted mb-1">Created By</div>
                            <div className="font-semibold text-text-primary">{selectedReceipt.createdBy?.name || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-text-muted mb-1">Date Created</div>
                            <div className="font-semibold text-text-primary">
                                {new Date(selectedReceipt.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        {selectedReceipt.reference && (
                            <div>
                                <div className="text-sm text-text-muted mb-1">Reference</div>
                                <div className="font-semibold text-text-primary">{selectedReceipt.reference}</div>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div>
                        <h3 className="font-semibold text-text-primary mb-4">Products</h3>
                        <div className="border border-border-light rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-border-light">
                                <thead className="bg-table-header">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-text-primary uppercase">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-text-primary uppercase">SKU</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-text-primary uppercase">Ordered</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-text-primary uppercase">Received</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-text-primary uppercase">Difference</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-border-light">
                                    {selectedReceipt.items.map((item, index) => {
                                        const diff = item.receivedQuantity - item.orderedQuantity;
                                        return (
                                            <tr key={index} className="hover:bg-hover-gray">
                                                <td className="px-6 py-4 text-sm font-medium text-text-primary">
                                                    {item.product.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text-muted font-mono">
                                                    {item.product.sku}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-text-primary">
                                                    {item.orderedQuantity}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                                                    {item.receivedQuantity}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm">
                                                    <span className={`font-semibold ${
                                                        diff === 0 ? 'text-status-success' :
                                                        diff < 0 ? 'text-status-error' : 'text-status-info'
                                                    }`}>
                                                        {diff === 0 ? '✓' : (diff > 0 ? `+${diff}` : diff)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    {selectedReceipt.notes && (
                        <div className="bg-hover-gray border border-border-light rounded-lg p-4">
                            <h4 className="font-semibold text-text-primary mb-2">Notes</h4>
                            <p className="text-sm text-text-secondary">{selectedReceipt.notes}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-4 border-t border-border-light">
                        {/* Download Actions - Only for Validated Receipts */}
                        {(selectedReceipt.status === 'DONE' || selectedReceipt.status === 'VALIDATED') && canDownloadReceipt(selectedReceipt) && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePrintReceipt(selectedReceipt)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-odoo-purple text-white rounded-lg hover:bg-odoo-purple-dark transition-colors font-medium text-sm shadow-sm"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print
                                </button>
                                <button
                                    onClick={() => handleDownloadPDF(selectedReceipt)}
                                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-odoo-purple text-odoo-purple rounded-lg hover:bg-hover-gray transition-colors font-medium text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => handleDownloadCSV(selectedReceipt)}
                                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-border-light text-text-secondary rounded-lg hover:bg-hover-gray transition-colors font-medium text-sm"
                                >
                                    <FileText className="w-4 h-4" />
                                    Export CSV
                                </button>
                            </div>
                        )}
                        
                        {/* No download options shown if not validated or no permission */}
                        {(!canDownloadReceipt(selectedReceipt) || (selectedReceipt.status !== 'DONE' && selectedReceipt.status !== 'VALIDATED')) && (
                            <div className="flex items-center gap-2 text-sm text-text-muted">
                                {(selectedReceipt.status !== 'DONE' && selectedReceipt.status !== 'VALIDATED') && (
                                    <div className="flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Download available after validation</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Validation Button */}
                        {(selectedReceipt.status === 'WAITING' || selectedReceipt.status === 'PENDING') && hasPermission(Permission.VALIDATE_RECEIPTS) && (
                            <button
                                onClick={() => handleValidate(selectedReceipt.id)}
                                className="flex items-center gap-2 px-6 py-3 bg-status-success text-white rounded-lg hover:bg-status-success/90 transition-colors font-medium shadow-sm"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Validate Receipt
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
