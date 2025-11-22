'use client';

import { useState, useEffect } from 'react';
import { History, TrendingUp, TrendingDown, Package, Search, Filter } from 'lucide-react';

interface MoveHistoryItem {
  id: string;
  moveType: string;
  product: { name: string; sku: string };
  location: { name: string };
  user: { name: string };
  quantityBefore: number;
  quantityAfter: number;
  quantityChanged: number;
  notes: string | null;
  createdAt: string;
}

export default function MoveHistoryPage() {
  const [history, setHistory] = useState<MoveHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, [page, typeFilter]);

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });
      const response = await fetch(`/api/move-history?${params}`);
      const data = await response.json();
      setHistory(data.history || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      RECEIPT: 'Receipt',
      DELIVERY: 'Delivery',
      TRANSFER_IN: 'Transfer In',
      TRANSFER_OUT: 'Transfer Out',
      ADJUSTMENT_INCREASE: 'Adjustment +',
      ADJUSTMENT_DECREASE: 'Adjustment -',
    };
    return labels[type] || type;
  };

  const getMoveTypeColor = (type: string) => {
    if (type.includes('RECEIPT') || type.includes('TRANSFER_IN') || type.includes('INCREASE')) {
      return 'text-green-600 bg-green-100';
    }
    return 'text-red-600 bg-red-100';
  };

  const filteredHistory = history.filter(
    (item) =>
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-4xl font-bold gradient-text mb-2">Move History</h1>
        <p className="text-gray-600 mb-8">Complete audit trail of all stock movements</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Movements</p>
                <p className="text-3xl font-bold text-gray-900">{total}</p>
              </div>
              <History className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Receipts</p>
                <p className="text-3xl font-bold text-green-600">
                  {history.filter((h) => h.moveType === 'RECEIPT').length}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </div>
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Deliveries</p>
                <p className="text-3xl font-bold text-red-600">
                  {history.filter((h) => h.moveType === 'DELIVERY').length}
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-600 opacity-50" />
            </div>
          </div>
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transfers</p>
                <p className="text-3xl font-bold text-purple-600">
                  {history.filter((h) => h.moveType.includes('TRANSFER')).length}
                </p>
              </div>
              <Package className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by product, SKU, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="RECEIPT">Receipts</option>
              <option value="DELIVERY">Deliveries</option>
              <option value="TRANSFER">Transfers</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div key={item.id} className="glass rounded-xl p-4 card-hover">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-semibold ${getMoveTypeColor(
                        item.moveType
                      )}`}
                    >
                      {getMoveTypeLabel(item.moveType)}
                    </span>
                    <span className="font-bold text-gray-900">{item.product.name}</span>
                    <span className="text-sm text-gray-500">SKU: {item.product.sku}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📍 {item.location.name}</span>
                    <span>👤 {item.user.name}</span>
                    <span>🕐 {new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-2 italic">{item.notes}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Before</p>
                      <p className="font-bold text-gray-700">{item.quantityBefore}</p>
                    </div>
                    <div className="text-2xl text-gray-400">→</div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">After</p>
                      <p className="font-bold text-gray-900">{item.quantityAfter}</p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold mt-1 ${
                      item.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.quantityChanged > 0 ? '+' : ''}
                    {item.quantityChanged}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredHistory.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No movement history found</p>
          </div>
        )}

        {filteredHistory.length > 0 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={history.length < 20}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
