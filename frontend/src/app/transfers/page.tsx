'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowRightLeft, CheckCircle, Clock, Search } from 'lucide-react';

interface Transfer {
  id: string;
  transferNumber: string;
  fromLocation: { id: string; name: string };
  toLocation: { id: string; name: string };
  quantity: number;
  isApplied: boolean;
  createdAt: string;
  user: { name: string };
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    fromLocationId: '',
    toLocationId: '',
    productId: '',
    quantity: 0,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transfersRes, locationsRes, productsRes] = await Promise.all([
        fetch('/api/transfers'),
        fetch('/api/locations'),
        fetch('/api/products'),
      ]);
      const transfersData = await transfersRes.json();
      const locationsData = await locationsRes.json();
      const productsData = await productsRes.json();
      setTransfers(transfersData.transfers || []);
      setLocations(locationsData.locations || []);
      setProducts(productsData.products || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransfer),
      });
      if (response.ok) {
        setShowModal(false);
        setNewTransfer({
          fromLocationId: '',
          toLocationId: '',
          productId: '',
          quantity: 0,
          notes: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
    }
  };

  const handleApply = async (id: string) => {
    try {
      const response = await fetch(`/api/transfers/${id}/apply`, { method: 'POST' });
      if (response.ok) fetchData();
    } catch (error) {
      console.error('Error applying transfer:', error);
    }
  };

  const filtered = transfers.filter((t) =>
    t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-4xl font-bold gradient-text mb-2">Stock Transfers</h1>
        <p className="text-gray-600 mb-8">Move stock between locations</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transfers</p>
                <p className="text-3xl font-bold text-gray-900">{transfers.length}</p>
              </div>
              <ArrowRightLeft className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Applied</p>
                <p className="text-3xl font-bold text-green-600">
                  {transfers.filter((t) => t.isApplied).length}
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
                  {transfers.filter((t) => !t.isApplied).length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              New Transfer
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((transfer) => (
            <div key={transfer.id} className="glass rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{transfer.transferNumber}</h3>
                  <p className="text-sm text-gray-600">
                    {transfer.fromLocation.name} → {transfer.toLocation.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transfer.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-purple-600">{transfer.quantity} units</span>
                  {transfer.isApplied ? (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Applied
                    </span>
                  ) : (
                    <>
                      <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold">
                        Pending
                      </span>
                      <button
                        onClick={() => handleApply(transfer.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      >
                        Apply
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Create Transfer</h2>
            <div className="space-y-4">
              <select
                value={newTransfer.fromLocationId}
                onChange={(e) => setNewTransfer({ ...newTransfer, fromLocationId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">From Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select
                value={newTransfer.toLocationId}
                onChange={(e) => setNewTransfer({ ...newTransfer, toLocationId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">To Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select
                value={newTransfer.productId}
                onChange={(e) => setNewTransfer({ ...newTransfer, productId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newTransfer.quantity}
                onChange={(e) => setNewTransfer({ ...newTransfer, quantity: parseInt(e.target.value) })}
                placeholder="Quantity"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <textarea
                value={newTransfer.notes}
                onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                placeholder="Notes"
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
