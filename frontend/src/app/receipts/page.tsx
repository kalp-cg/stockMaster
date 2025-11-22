'use client';

import { useState, useEffect } from 'react';
import { Plus, Package, CheckCircle, Clock, Search, Filter } from 'lucide-react';

interface Receipt {
  id: string;
  receiptNumber: string;
  vendor: {
    id: string;
    name: string;
  };
  location: {
    id: string;
    name: string;
  };
  totalItems: number;
  isValidated: boolean;
  createdAt: string;
  items: {
    id: string;
    product: {
      name: string;
      sku: string;
    };
    quantityReceived: number;
  }[];
}

interface Vendor {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReceipt, setNewReceipt] = useState({
    vendorId: '',
    locationId: '',
    notes: '',
    items: [{ productId: '', quantity: 0 }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [receiptsRes, vendorsRes, locationsRes, productsRes] = await Promise.all([
        fetch('/api/receipts'),
        fetch('/api/vendors'),
        fetch('/api/locations'),
        fetch('/api/products'),
      ]);

      const receiptsData = await receiptsRes.json();
      const vendorsData = await vendorsRes.json();
      const locationsData = await locationsRes.json();
      const productsData = await productsRes.json();

      setReceipts(receiptsData.receipts || []);
      setVendors(vendorsData.vendors || []);
      setLocations(locationsData.locations || []);
      setProducts(productsData.products || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceipt = async () => {
    try {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReceipt),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewReceipt({
          vendorId: '',
          locationId: '',
          notes: '',
          items: [{ productId: '', quantity: 0 }],
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
    }
  };

  const handleValidateReceipt = async (receiptId: string) => {
    try {
      const response = await fetch(`/api/receipts/${receiptId}/validate`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error validating receipt:', error);
    }
  };

  const addItem = () => {
    setNewReceipt({
      ...newReceipt,
      items: [...newReceipt.items, { productId: '', quantity: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setNewReceipt({
      ...newReceipt,
      items: newReceipt.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newReceipt.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewReceipt({ ...newReceipt, items: updatedItems });
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'validated' && receipt.isValidated) ||
      (statusFilter === 'pending' && !receipt.isValidated);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Stock Receipts</h1>
          <p className="text-gray-600">Receive and track incoming stock from vendors</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Receipts</p>
                <p className="text-3xl font-bold text-gray-900">{receipts.length}</p>
              </div>
              <Package className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Validated</p>
                <p className="text-3xl font-bold text-green-600">
                  {receipts.filter((r) => r.isValidated).length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-600">
                  {receipts.filter((r) => !r.isValidated).length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="validated">Validated</option>
                <option value="pending">Pending</option>
              </select>

              <button
                onClick={() => setShowCreateModal(true)}
                className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                New Receipt
              </button>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        <div className="space-y-4">
          {filteredReceipts.map((receipt) => (
            <div key={receipt.id} className="glass rounded-2xl p-6 card-hover">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {receipt.receiptNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    From: <span className="font-semibold">{receipt.vendor.name}</span> →{' '}
                    <span className="font-semibold">{receipt.location.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(receipt.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  {receipt.isValidated ? (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Validated
                    </span>
                  ) : (
                    <>
                      <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                      <button
                        onClick={() => handleValidateReceipt(receipt.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Validate
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Items Received:</p>
                <div className="space-y-2">
                  {receipt.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white rounded-lg p-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{item.product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">
                          {item.quantityReceived} units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReceipts.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No receipts found</p>
          </div>
        )}
      </div>

      {/* Create Receipt Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Create New Receipt</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vendor
                </label>
                <select
                  value={newReceipt.vendorId}
                  onChange={(e) => setNewReceipt({ ...newReceipt, vendorId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destination Location
                </label>
                <select
                  value={newReceipt.locationId}
                  onChange={(e) =>
                    setNewReceipt({ ...newReceipt, locationId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newReceipt.notes}
                  onChange={(e) => setNewReceipt({ ...newReceipt, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Items</label>
                  <button
                    onClick={addItem}
                    className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    + Add Item
                  </button>
                </div>

                {newReceipt.items.map((item, index) => (
                  <div key={index} className="flex gap-3 mb-3">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      placeholder="Quantity"
                      className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />

                    {newReceipt.items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReceipt}
                className="flex-1 gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Create Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
